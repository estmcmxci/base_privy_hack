import { eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { artists, catalogSnapshots } from "./schema";
import type { SnapshotResult, ArtistData } from "../types/snapshot";

export async function upsertArtist(snapshot: { artist: ArtistData }): Promise<string> {
  const existing = await db
    .select({ id: artists.id })
    .from(artists)
    .where(eq(artists.soundcloudId, BigInt(snapshot.artist.soundcloudId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(artists)
      .set({
        username: snapshot.artist.username,
        permalinkUrl: snapshot.artist.permalinkUrl,
        avatarUrl: snapshot.artist.avatarUrl,
        city: snapshot.artist.city,
        countryCode: snapshot.artist.countryCode,
      })
      .where(eq(artists.id, existing[0].id));
    return existing[0].id;
  }

  const [inserted] = await db
    .insert(artists)
    .values({
      soundcloudId: BigInt(snapshot.artist.soundcloudId),
      username: snapshot.artist.username,
      permalinkUrl: snapshot.artist.permalinkUrl,
      avatarUrl: snapshot.artist.avatarUrl,
      city: snapshot.artist.city,
      countryCode: snapshot.artist.countryCode,
    })
    .returning({ id: artists.id });

  return inserted.id;
}

export async function insertSnapshot(
  artistId: string,
  snapshot: SnapshotResult
): Promise<string> {
  const [inserted] = await db
    .insert(catalogSnapshots)
    .values({
      artistId,
      totalPlays: BigInt(snapshot.totals.plays),
      totalLikes: BigInt(snapshot.totals.likes),
      totalReposts: BigInt(snapshot.totals.reposts),
      totalComments: BigInt(snapshot.totals.comments),
      followersCount: BigInt(snapshot.artist.followersCount),
      trackCount: BigInt(snapshot.artist.trackCount),
      tracksFetched: BigInt(snapshot.totals.tracksFetched),
      takenAt: snapshot.takenAt,
    })
    .returning({ id: catalogSnapshots.id });

  return inserted.id;
}
