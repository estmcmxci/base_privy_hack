import { createScClient } from "./sc-client";
import type { SnapshotResult } from "../types/snapshot";

export async function takeSnapshot(
  url: string,
  clientId: string,
  clientSecret: string
): Promise<SnapshotResult> {
  const sc = createScClient(clientId, clientSecret);

  const user = await sc.resolve(url);
  const tracks = await sc.getUserTracks(user.id);

  const totals = tracks.reduce(
    (acc, t) => ({
      plays: acc.plays + (t.playback_count ?? 0),
      likes: acc.likes + (t.likes_count ?? 0),
      reposts: acc.reposts + (t.reposts_count ?? 0),
      comments: acc.comments + (t.comment_count ?? 0),
    }),
    { plays: 0, likes: 0, reposts: 0, comments: 0 }
  );

  return {
    artist: {
      soundcloudId: user.id,
      username: user.username,
      permalinkUrl: user.permalink_url,
      avatarUrl: user.avatar_url ?? null,
      city: user.city ?? null,
      countryCode: user.country_code ?? null,
      followersCount: user.followers_count,
      trackCount: user.track_count,
    },
    totals: {
      ...totals,
      tracksFetched: tracks.length,
    },
    takenAt: new Date(),
  };
}
