import { createScClient } from "./sc-client";
import type { TrackSnapshotResult } from "../types/snapshot";

export async function takeTrackSnapshot(
  trackUrl: string,
  clientId: string,
  clientSecret: string
): Promise<TrackSnapshotResult> {
  const sc = createScClient(clientId, clientSecret);

  const resolved = await sc.resolveUrl(trackUrl);

  if (resolved.kind !== "track" || !resolved.track) {
    throw new Error(
      `URL did not resolve to a track: ${trackUrl}. Use takeSnapshot() for artist URLs.`
    );
  }

  const { user, track } = resolved;

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
    track: {
      soundcloudId: track.id,
      title: track.title,
      permalinkUrl: track.permalink_url ?? "",
      artworkUrl: track.artwork_url ?? null,
    },
    snapshot: {
      playbackCount: track.playback_count ?? 0,
      likesCount: track.likes_count ?? 0,
      repostsCount: track.reposts_count ?? 0,
      commentCount: track.comment_count ?? 0,
    },
    takenAt: new Date(),
  };
}
