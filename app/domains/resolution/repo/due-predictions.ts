import { and, eq, lte, or } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { artists, tracks } from "@/app/domains/soundcloud/repo/schema";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function subtractDays(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_IN_MS);
}

export interface DuePrediction {
  id: string;
  tastemakerId: string;
  artistId: string;
  snapshotId: string;
  trackSnapshotId: string | null;
  streamThreshold: bigint;
  predictedOutcome: string;
  permalinkUrl: string | null;
  trackPermalinkUrl: string | null;
  trackSoundcloudId: bigint | null;
}

/** All pending predictions regardless of horizon — for demo/force resolution */
export async function listAllPendingPredictions(): Promise<DuePrediction[]> {
  return db
    .select({
      id: predictions.id,
      tastemakerId: predictions.tastemakerId,
      artistId: predictions.artistId,
      snapshotId: predictions.snapshotId,
      trackSnapshotId: predictions.trackSnapshotId,
      streamThreshold: predictions.streamThreshold,
      predictedOutcome: predictions.predictedOutcome,
      permalinkUrl: artists.permalinkUrl,
      trackPermalinkUrl: tracks.permalinkUrl,
      trackSoundcloudId: tracks.soundcloudId,
    })
    .from(predictions)
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .leftJoin(tracks, eq(predictions.trackId, tracks.id))
    .where(eq(predictions.outcome, "pending"));
}

export async function listDuePendingPredictions(now: Date): Promise<DuePrediction[]> {
  return db
    .select({
      id: predictions.id,
      tastemakerId: predictions.tastemakerId,
      artistId: predictions.artistId,
      snapshotId: predictions.snapshotId,
      trackSnapshotId: predictions.trackSnapshotId,
      streamThreshold: predictions.streamThreshold,
      predictedOutcome: predictions.predictedOutcome,
      permalinkUrl: artists.permalinkUrl,
      trackPermalinkUrl: tracks.permalinkUrl,
      trackSoundcloudId: tracks.soundcloudId,
    })
    .from(predictions)
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .leftJoin(tracks, eq(predictions.trackId, tracks.id))
    .where(
      and(
        eq(predictions.outcome, "pending"),
        or(
          and(eq(predictions.horizon, "1w"), lte(predictions.createdAt, subtractDays(now, 7))),
          and(eq(predictions.horizon, "2w"), lte(predictions.createdAt, subtractDays(now, 14))),
          and(eq(predictions.horizon, "4w"), lte(predictions.createdAt, subtractDays(now, 28))),
          and(eq(predictions.horizon, "8w"), lte(predictions.createdAt, subtractDays(now, 56)))
        )
      )
    );
}
