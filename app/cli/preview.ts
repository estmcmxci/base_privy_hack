import { createScClient } from "@/app/domains/soundcloud/service/sc-client";
import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { takeTrackSnapshot } from "@/app/domains/soundcloud/service/track-snapshot";
import { getEnv } from "@/app/config/env";

export async function previewCommand(url: string) {
  const env = getEnv();
  const sc = createScClient(env.SOUNDCLOUD_CLIENT_ID, env.SOUNDCLOUD_CLIENT_SECRET);

  // Use SC API resolve to determine if URL is a track or user
  const resolved = await sc.resolveUrl(url);

  if (resolved.kind === "track" && resolved.track) {
    console.log(`Resolving track: ${url}\n`);

    const result = await takeTrackSnapshot(
      url,
      env.SOUNDCLOUD_CLIENT_ID,
      env.SOUNDCLOUD_CLIENT_SECRET
    );

    const { artist, track, snapshot } = result;

    console.log(`  ${track.title}`);
    console.log(`  by ${artist.username}`);
    console.log();
    console.log(`  Plays:      ${snapshot.playbackCount.toLocaleString()}`);
    console.log(`  Likes:      ${snapshot.likesCount.toLocaleString()}`);
    console.log(`  Reposts:    ${snapshot.repostsCount.toLocaleString()}`);
    console.log(`  Comments:   ${snapshot.commentCount.toLocaleString()}`);
    console.log();
    console.log(`  Artist:     ${artist.permalinkUrl}`);
    console.log(`  Track:      ${track.permalinkUrl}`);
  } else {
    console.log(`Resolving artist: ${url}\n`);

    const result = await takeSnapshot(
      url,
      env.SOUNDCLOUD_CLIENT_ID,
      env.SOUNDCLOUD_CLIENT_SECRET
    );

    const { artist, totals } = result;

    console.log(`  ${artist.username}`);
    if (artist.city) console.log(`  ${artist.city}`);
    console.log();
    console.log(`  Followers:  ${artist.followersCount.toLocaleString()}`);
    console.log(`  Tracks:     ${artist.trackCount.toLocaleString()}`);
    console.log(`  Plays:      ${totals.plays.toLocaleString()}`);
    console.log(`  Likes:      ${totals.likes.toLocaleString()}`);
    console.log(`  Reposts:    ${totals.reposts.toLocaleString()}`);
    console.log(`  Comments:   ${totals.comments.toLocaleString()}`);
    console.log();
    console.log(`  SoundCloud: ${artist.permalinkUrl}`);
  }
}
