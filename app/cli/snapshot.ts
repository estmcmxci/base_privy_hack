import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { upsertArtist, insertSnapshot } from "@/app/domains/soundcloud/repo/snapshot-repo";
import { getEnv } from "@/app/config/env";

export async function snapshotCommand(url: string) {
  const env = getEnv();

  console.log(`Taking snapshot for: ${url}`);

  const result = await takeSnapshot(
    url,
    env.SOUNDCLOUD_CLIENT_ID,
    env.SOUNDCLOUD_CLIENT_SECRET
  );

  console.log(`Artist: ${result.artist.username} (SC ID: ${result.artist.soundcloudId})`);
  console.log(`Followers: ${result.artist.followersCount}`);
  console.log(`Tracks: ${result.artist.trackCount}`);
  console.log(`Total plays: ${result.totals.plays}`);
  console.log(`Total likes: ${result.totals.likes}`);
  console.log(`Total reposts: ${result.totals.reposts}`);
  console.log(`Total comments: ${result.totals.comments}`);
  console.log(`Tracks fetched: ${result.totals.tracksFetched}`);

  const artistId = await upsertArtist(result);
  console.log(`Artist ID: ${artistId}`);

  const snapshotId = await insertSnapshot(artistId, result);
  console.log(`Snapshot ID: ${snapshotId}`);

  console.log("Done.");
  process.exit(0);
}
