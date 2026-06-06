import { and, eq, or, isNull } from "drizzle-orm";
import { db } from "@/app/db/client";
import { attestPredictionOutcome } from "@/app/domains/resolution/service/eas-service";
import { catalogSnapshots, trackSnapshots } from "@/app/domains/soundcloud/repo/schema";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";

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

export async function retryUnattested(): Promise<{ retried: number; succeeded: number; failed: number }> {
  const unattested = await db
    .select({
      id: predictions.id,
      predictedOutcome: predictions.predictedOutcome,
      outcome: predictions.outcome,
      streamThreshold: predictions.streamThreshold,
      snapshotId: predictions.snapshotId,
      trackSnapshotId: predictions.trackSnapshotId,
      resolutionSnapshotId: predictions.resolutionSnapshotId,
      resolutionTrackSnapshotId: predictions.resolutionTrackSnapshotId,
      tastemakerId: predictions.tastemakerId,
    })
    .from(predictions)
    .where(
      and(
        or(eq(predictions.outcome, "yes"), eq(predictions.outcome, "no")),
        isNull(predictions.easAttestationUid)
      )
    );

  const result = { retried: unattested.length, succeeded: 0, failed: 0 };

  for (const pred of unattested) {
    const info = await getTastemakerInfo(pred.tastemakerId);
    if (!info.walletAddress) {
      result.failed++;
      continue;
    }

    let delta = 0;
    if (pred.trackSnapshotId && pred.resolutionTrackSnapshotId) {
      const creationPlays = await getCreationTrackPlays(pred.trackSnapshotId);
      const resRows = await db
        .select({ playbackCount: trackSnapshots.playbackCount })
        .from(trackSnapshots)
        .where(eq(trackSnapshots.id, pred.resolutionTrackSnapshotId))
        .limit(1);
      const resPlays = resRows[0]?.playbackCount ?? BigInt(0);
      if (creationPlays !== null) {
        delta = Math.max(0, Number(resPlays) - Number(creationPlays));
      }
    } else if (pred.resolutionSnapshotId) {
      const creationPlays = await getCreationPlays(pred.snapshotId);
      if (creationPlays !== null) {
        const resRows = await db
          .select({ totalPlays: catalogSnapshots.totalPlays })
          .from(catalogSnapshots)
          .where(eq(catalogSnapshots.id, pred.resolutionSnapshotId))
          .limit(1);
        const resPlays = resRows[0]?.totalPlays ?? BigInt(0);
        delta = Math.max(0, Number(resPlays) - Number(creationPlays));
      }
    }

    try {
      const uid = await attestPredictionOutcome({
        predictionId: pred.id,
        tastemakerAddress: info.walletAddress,
        predictedYes: pred.predictedOutcome === "yes",
        outcomeYes: pred.outcome === "yes",
        streamThreshold: pred.streamThreshold,
        scDelta: BigInt(delta),
      });

      await db
        .update(predictions)
        .set({ easAttestationUid: uid })
        .where(eq(predictions.id, pred.id));

      result.succeeded++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
