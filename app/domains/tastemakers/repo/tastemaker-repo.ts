import { eq, desc } from "drizzle-orm";
import { db } from "@/app/db/client";
import { tastemakers } from "./schema";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { artists, tracks } from "@/app/domains/soundcloud/repo/schema";

export type TastemakerRow = typeof tastemakers.$inferSelect;
export type ArtistRow = typeof artists.$inferSelect;
export type PredictionRow = typeof predictions.$inferSelect;
export type TrackRow = typeof tracks.$inferSelect;

export type PredictionWithArtist = {
  prediction: PredictionRow;
  artist: ArtistRow;
  track: TrackRow | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getTastemakerById(
  id: string
): Promise<TastemakerRow | null> {
  if (!UUID_RE.test(id)) return null;

  const rows = await db
    .select()
    .from(tastemakers)
    .where(eq(tastemakers.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function findOrCreateByWallet(
  walletAddress: string
): Promise<TastemakerRow> {
  const normalized = walletAddress.toLowerCase();

  const existing = await db
    .select()
    .from(tastemakers)
    .where(eq(tastemakers.walletAddress, normalized))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(tastemakers)
    .values({
      walletAddress: normalized,
      reputationScore: 1.0,
      totalPredictions: 0,
    })
    .returning();

  return created;
}

export async function getPredictionsByTastemaker(
  tastemakerId: string
): Promise<PredictionWithArtist[]> {
  const rows = await db
    .select({
      prediction: predictions,
      artist: artists,
      track: tracks,
    })
    .from(predictions)
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .leftJoin(tracks, eq(predictions.trackId, tracks.id))
    .where(eq(predictions.tastemakerId, tastemakerId))
    .orderBy(desc(predictions.createdAt));

  return rows.map((row) => ({
    ...row,
    track: row.track ?? null,
  }));
}
