import { eq } from "drizzle-orm";
import { getEnv } from "@/app/config/env";
import { listPendingArtists } from "@/app/domains/resolution/repo/pending-artists";
import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { takeTrackSnapshot } from "@/app/domains/soundcloud/service/track-snapshot";
import {
  upsertArtist,
  insertSnapshot,
} from "@/app/domains/soundcloud/repo/snapshot-repo";
import {
  upsertTrack,
  insertTrackSnapshot,
} from "@/app/domains/soundcloud/repo/track-repo";
import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { tracks } from "@/app/domains/soundcloud/repo/schema";

async function listPendingTracks(): Promise<
  Array<{ trackId: string; permalinkUrl: string }>
> {
  const rows = await db
    .selectDistinct({
      trackId: predictions.trackId,
      permalinkUrl: tracks.permalinkUrl,
    })
    .from(predictions)
    .innerJoin(tracks, eq(predictions.trackId, tracks.id))
    .where(eq(predictions.outcome, "pending"));

  return rows.filter(
    (r): r is { trackId: string; permalinkUrl: string } =>
      r.trackId !== null && r.permalinkUrl !== null
  );
}

export async function snapshotAllCommand() {
  const env = getEnv();

  // 1. Snapshot tracks with pending predictions
  const pendingTracks = await listPendingTracks();
  console.log(`Found ${pendingTracks.length} tracks with pending predictions`);

  let trackSnapshotted = 0;
  let trackErrors = 0;

  for (const { trackId, permalinkUrl } of pendingTracks) {
    try {
      console.log(`Snapshotting track ${permalinkUrl}...`);
      const result = await takeTrackSnapshot(
        permalinkUrl,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );

      const artistId = await upsertArtist(result);
      const upsertedTrackId = await upsertTrack(result, artistId);
      await insertTrackSnapshot(upsertedTrackId, result);

      console.log(
        `  "${result.track.title}" by ${result.artist.username}: ${result.snapshot.playbackCount} plays`
      );
      trackSnapshotted++;
    } catch (err) {
      trackErrors++;
      console.error(`  Failed to snapshot track ${trackId}: ${err}`);
    }
  }

  // 2. Snapshot artists with pending predictions (catalog-level)
  const pendingArtists = await listPendingArtists();
  console.log(`Found ${pendingArtists.length} artists with pending predictions`);

  let artistSnapshotted = 0;
  let artistErrors = 0;

  for (const { artistId, permalinkUrl } of pendingArtists) {
    try {
      console.log(`Snapshotting ${permalinkUrl}...`);
      const result = await takeSnapshot(
        permalinkUrl,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );

      const upsertedId = await upsertArtist(result);
      await insertSnapshot(upsertedId, result);

      console.log(
        `  ${result.artist.username}: ${result.totals.plays} plays, ${result.artist.followersCount} followers`
      );
      artistSnapshotted++;
    } catch (err) {
      artistErrors++;
      console.error(`  Failed to snapshot artist ${artistId}: ${err}`);
    }
  }

  console.log(
    `Done. Tracks: ${trackSnapshotted} ok / ${trackErrors} errors. Artists: ${artistSnapshotted} ok / ${artistErrors} errors`
  );
  process.exit(0);
}
