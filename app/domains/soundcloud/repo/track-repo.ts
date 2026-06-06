import { eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { tracks, trackSnapshots } from "./schema";
import type { TrackSnapshotResult } from "../types/snapshot";

export async function upsertTrack(
  data: TrackSnapshotResult,
  artistId: string
): Promise<string> {
  const existing = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(eq(tracks.soundcloudId, BigInt(data.track.soundcloudId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(tracks)
      .set({
        title: data.track.title,
        permalinkUrl: data.track.permalinkUrl,
        artworkUrl: data.track.artworkUrl,
        artistId,
      })
      .where(eq(tracks.id, existing[0].id));
    return existing[0].id;
  }

  const [inserted] = await db
    .insert(tracks)
    .values({
      soundcloudId: BigInt(data.track.soundcloudId),
      title: data.track.title,
      permalinkUrl: data.track.permalinkUrl,
      artworkUrl: data.track.artworkUrl,
      artistId,
    })
    .returning({ id: tracks.id });

  return inserted.id;
}

export async function insertTrackSnapshot(
  trackId: string,
  data: TrackSnapshotResult
): Promise<string> {
  const [inserted] = await db
    .insert(trackSnapshots)
    .values({
      trackId,
      playbackCount: BigInt(data.snapshot.playbackCount),
      likesCount: BigInt(data.snapshot.likesCount),
      repostsCount: BigInt(data.snapshot.repostsCount),
      commentCount: BigInt(data.snapshot.commentCount),
      takenAt: data.takenAt,
    })
    .returning({ id: trackSnapshots.id });

  return inserted.id;
}
