import { and, eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { getEnv } from "@/app/config/env";
import { listDuePendingPredictions, listAllPendingPredictions } from "@/app/domains/resolution/repo/due-predictions";
import type { DuePrediction } from "@/app/domains/resolution/repo/due-predictions";
import { updateReputation } from "@/app/domains/resolution/service/reputation";
import {
  attestPredictionOutcome,
  attestReputationSnapshot,
} from "@/app/domains/resolution/service/eas-service";
import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { takeTrackSnapshot } from "@/app/domains/soundcloud/service/track-snapshot";
import { ScNotFoundError } from "@/app/domains/soundcloud/service/sc-client";
import { upsertArtist, insertSnapshot } from "@/app/domains/soundcloud/repo/snapshot-repo";
import { upsertTrack, insertTrackSnapshot } from "@/app/domains/soundcloud/repo/track-repo";
import { catalogSnapshots, trackSnapshots } from "@/app/domains/soundcloud/repo/schema";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";

type BinaryOutcome = "yes" | "no";

interface ResolutionResult {
  resolved: number;
  voided: number;
  skipped: number;
  errors: number;
  details: ResolutionDetail[];
}

interface ResolutionDetail {
  predictionId: string;
  outcome: BinaryOutcome;
  delta: number;
  newReputation: number;
}

async function getCreationPlays(snapshotId: string): Promise<bigint | null> {
  const rows = await db
    .select({ totalPlays: catalogSnapshots.totalPlays })
    .from(catalogSnapshots)
    .where(eq(catalogSnapshots.id, snapshotId))
    .limit(1);

  return rows[0]?.totalPlays ?? null;
}

async function getCreationTrackPlays(trackSnapshotId: string): Promise<bigint | null> {
  const rows = await db
    .select({ playbackCount: trackSnapshots.playbackCount })
    .from(trackSnapshots)
    .where(eq(trackSnapshots.id, trackSnapshotId))
    .limit(1);

  return rows[0]?.playbackCount ?? null;
}

interface TastemakerInfo {
  reputationScore: number;
  walletAddress: string | null;
  totalPredictions: number;
}

async function getTastemakerInfo(tastemakerId: string): Promise<TastemakerInfo> {
  const rows = await db
    .select({
      reputationScore: tastemakers.reputationScore,
      walletAddress: tastemakers.walletAddress,
      totalPredictions: tastemakers.totalPredictions,
    })
    .from(tastemakers)
    .where(eq(tastemakers.id, tastemakerId))
    .limit(1);

  return {
    reputationScore: rows[0]?.reputationScore ?? 1.0,
    walletAddress: rows[0]?.walletAddress ?? null,
    totalPredictions: rows[0]?.totalPredictions ?? 0,
  };
}

async function resolveSingle(
  pred: DuePrediction,
  clientId: string,
  clientSecret: string,
): Promise<ResolutionDetail> {
  if (!pred.permalinkUrl) {
    throw new Error(`Prediction ${pred.id}: artist has no permalinkUrl`);
  }

  let delta: number;
  let resolutionSnapshotId: string | null = null;
  let resolutionTrackSnapshotId: string | null = null;

  if (pred.trackSnapshotId) {
    // Track-level resolution — key off trackSnapshotId, not permalink truthiness
    if (!pred.trackPermalinkUrl?.trim()) {
      throw new Error(`Prediction ${pred.id}: track prediction has blank/missing permalink URL`);
    }
    const trackResult = await takeTrackSnapshot(pred.trackPermalinkUrl, clientId, clientSecret);
    const artistId = await upsertArtist({ artist: trackResult.artist });
    const trackId = await upsertTrack(trackResult, artistId);
    resolutionTrackSnapshotId = await insertTrackSnapshot(trackId, trackResult);

    const creationPlays = await getCreationTrackPlays(pred.trackSnapshotId);
    if (creationPlays === null) {
      throw new Error(`Prediction ${pred.id}: creation track snapshot ${pred.trackSnapshotId} not found`);
    }

    const currentPlays = trackResult.snapshot.playbackCount;
    delta = currentPlays - Number(creationPlays);
  } else {
    // Legacy catalog-level resolution
    const snapshot = await takeSnapshot(pred.permalinkUrl, clientId, clientSecret);
    const artistId = await upsertArtist(snapshot);
    resolutionSnapshotId = await insertSnapshot(artistId, snapshot);

    const creationPlays = await getCreationPlays(pred.snapshotId);
    if (creationPlays === null) {
      throw new Error(`Prediction ${pred.id}: creation snapshot ${pred.snapshotId} not found`);
    }

    const currentPlays = Number(snapshot.totals.plays);
    delta = currentPlays - Number(creationPlays);
  }

  const threshold = Number(pred.streamThreshold);
  const actualOutcome: BinaryOutcome = delta >= threshold ? "yes" : "no";
  const predictedOutcome = pred.predictedOutcome as BinaryOutcome;

  const info = await getTastemakerInfo(pred.tastemakerId);
  const newReputation = updateReputation(info.reputationScore, predictedOutcome, actualOutcome);

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(predictions)
      .set({
        outcome: actualOutcome,
        resolvedAt: new Date(),
        resolutionSnapshotId,
        resolutionTrackSnapshotId,
      })
      .where(and(eq(predictions.id, pred.id), eq(predictions.outcome, "pending")))
      .returning({ id: predictions.id });

    if (updated.length === 0) {
      throw new Error(`Prediction ${pred.id}: already resolved (concurrent run)`);
    }

    await tx
      .update(tastemakers)
      .set({
        reputationScore: newReputation,
        totalPredictions: info.totalPredictions + 1,
      })
      .where(eq(tastemakers.id, pred.tastemakerId));
  });

  // Write EAS attestations (best-effort — prediction is resolved either way)
  let attestationUid: string | null = null;
  if (info.walletAddress) {
    try {
      attestationUid = await attestPredictionOutcome({
        predictionId: pred.id,
        tastemakerAddress: info.walletAddress,
        predictedYes: predictedOutcome === "yes",
        outcomeYes: actualOutcome === "yes",
        streamThreshold: pred.streamThreshold,
        scDelta: BigInt(Math.max(0, delta)),
      });

      await db
        .update(predictions)
        .set({ easAttestationUid: attestationUid })
        .where(eq(predictions.id, pred.id));

      console.info(JSON.stringify({
        event: "cron.resolve.eas_prediction",
        predictionId: pred.id,
        attestationUid,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({
        event: "cron.resolve.eas_prediction_error",
        predictionId: pred.id,
        error: message,
      }));
    }

    try {
      const repUid = await attestReputationSnapshot({
        tastemakerAddress: info.walletAddress,
        reputationScore: newReputation,
        totalPredictions: info.totalPredictions + 1,
      });

      console.info(JSON.stringify({
        event: "cron.resolve.eas_reputation",
        tastemakerId: pred.tastemakerId,
        attestationUid: repUid,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({
        event: "cron.resolve.eas_reputation_error",
        tastemakerId: pred.tastemakerId,
        error: message,
      }));
    }
  } else {
    console.info(JSON.stringify({
      event: "cron.resolve.eas_skipped",
      predictionId: pred.id,
      reason: "no wallet address",
    }));
  }

  return { predictionId: pred.id, outcome: actualOutcome, delta, newReputation };
}

export async function runWeeklyResolution(now: Date, opts?: { force?: boolean }): Promise<ResolutionResult> {
  const duePredictions = opts?.force
    ? await listAllPendingPredictions()
    : await listDuePendingPredictions(now);

  console.info(JSON.stringify({
    event: "cron.resolve.start",
    duePredictionCount: duePredictions.length,
  }));

  const result: ResolutionResult = { resolved: 0, voided: 0, skipped: 0, errors: 0, details: [] };

  if (duePredictions.length === 0) {
    return result;
  }

  const env = getEnv();
  const clientId = env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = env.SOUNDCLOUD_CLIENT_SECRET;

  for (const pred of duePredictions) {
    try {
      const detail = await resolveSingle(pred, clientId, clientSecret);
      result.resolved++;
      result.details.push(detail);

      console.info(JSON.stringify({
        event: "cron.resolve.resolved",
        predictionId: pred.id,
        outcome: detail.outcome,
        delta: detail.delta,
        newReputation: detail.newReputation,
      }));
    } catch (err) {
      if (err instanceof ScNotFoundError) {
        await voidPrediction(pred.id, "sc_not_found");
        result.voided++;
        console.warn(JSON.stringify({
          event: "cron.resolve.voided",
          predictionId: pred.id,
          reason: "sc_not_found",
          detail: err.message,
        }));
        continue;
      }

      result.errors++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({
        event: "cron.resolve.error",
        predictionId: pred.id,
        error: message,
      }));
    }
  }

  console.info(JSON.stringify({
    event: "cron.resolve.complete",
    resolved: result.resolved,
    voided: result.voided,
    skipped: result.skipped,
    errors: result.errors,
  }));

  return result;
}

async function voidPrediction(predictionId: string, reason: string): Promise<void> {
  await db
    .update(predictions)
    .set({
      outcome: "void",
      voidReason: reason,
      resolvedAt: new Date(),
    })
    .where(and(eq(predictions.id, predictionId), eq(predictions.outcome, "pending")));
}

export async function runWeeklyResolutionDryRun(now: Date): Promise<DuePrediction[]> {
  const duePredictions = await listDuePendingPredictions(now);

  console.info(JSON.stringify({
    event: "cron.resolve.dry_run",
    duePredictionCount: duePredictions.length,
  }));

  return duePredictions;
}
