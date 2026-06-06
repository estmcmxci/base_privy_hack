import { eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions } from "./schema";
import {
  artists,
  catalogSnapshots,
  tracks,
  trackSnapshots,
} from "@/app/domains/soundcloud/repo/schema";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";

export type PredictionDetail = {
  prediction: typeof predictions.$inferSelect;
  artist: typeof artists.$inferSelect;
  snapshot: typeof catalogSnapshots.$inferSelect;
  tastemaker: typeof tastemakers.$inferSelect;
  track: typeof tracks.$inferSelect | null;
  trackSnapshot: typeof trackSnapshots.$inferSelect | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPredictionById(id: string): Promise<PredictionDetail | null> {
  if (!UUID_RE.test(id)) return null;

  const rows = await db
    .select({
      prediction: predictions,
      artist: artists,
      snapshot: catalogSnapshots,
      tastemaker: tastemakers,
      track: tracks,
      trackSnapshot: trackSnapshots,
    })
    .from(predictions)
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .innerJoin(catalogSnapshots, eq(predictions.snapshotId, catalogSnapshots.id))
    .innerJoin(tastemakers, eq(predictions.tastemakerId, tastemakers.id))
    .leftJoin(tracks, eq(predictions.trackId, tracks.id))
    .leftJoin(trackSnapshots, eq(predictions.trackSnapshotId, trackSnapshots.id))
    .where(eq(predictions.id, id))
    .limit(1);

  if (!rows[0]) return null;

  return {
    ...rows[0],
    track: rows[0].track ?? null,
    trackSnapshot: rows[0].trackSnapshot ?? null,
  };
}

export async function createPrediction(params: {
  tastemakerId: string;
  artistId: string;
  snapshotId: string;
  streamThreshold: bigint;
  predictedOutcome: string;
  horizon: string;
  trackId?: string;
  trackSnapshotId?: string;
}): Promise<string> {
  const [inserted] = await db
    .insert(predictions)
    .values({
      tastemakerId: params.tastemakerId,
      artistId: params.artistId,
      snapshotId: params.snapshotId,
      streamThreshold: params.streamThreshold,
      predictedOutcome: params.predictedOutcome,
      horizon: params.horizon,
      trackId: params.trackId ?? null,
      trackSnapshotId: params.trackSnapshotId ?? null,
    })
    .returning({ id: predictions.id });

  return inserted.id;
}
