import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/app/config/env";
import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { takeTrackSnapshot } from "@/app/domains/soundcloud/service/track-snapshot";
import { upsertArtist, insertSnapshot } from "@/app/domains/soundcloud/repo/snapshot-repo";
import { upsertTrack, insertTrackSnapshot } from "@/app/domains/soundcloud/repo/track-repo";
import { createScClient } from "@/app/domains/soundcloud/service/sc-client";

const ALLOWED_HOSTS = ["soundcloud.com", "www.soundcloud.com", "m.soundcloud.com"];

const SnapshotRequestSchema = z.object({
  url: z.string().url().refine(
    (u) => {
      try {
        return ALLOWED_HOSTS.includes(new URL(u).hostname);
      } catch {
        return false;
      }
    },
    { message: "URL must be a SoundCloud URL" }
  ),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = SnapshotRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const env = getEnv();

  try {
    const sc = createScClient(env.SOUNDCLOUD_CLIENT_ID, env.SOUNDCLOUD_CLIENT_SECRET);
    const resolved = await sc.resolveUrl(parsed.data.url);

    if (resolved.kind === "track") {
      const trackResult = await takeTrackSnapshot(
        parsed.data.url,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );

      const artistId = await upsertArtist(trackResult);
      const trackId = await upsertTrack(trackResult, artistId);
      const trackSnapshotId = await insertTrackSnapshot(trackId, trackResult);

      // Also take catalog snapshot
      const catalogResult = await takeSnapshot(
        trackResult.artist.permalinkUrl,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );
      const snapshotId = await insertSnapshot(artistId, catalogResult);

      return NextResponse.json({
        artistId,
        snapshotId,
        trackId,
        trackSnapshotId,
        artist: trackResult.artist,
        track: trackResult.track,
        trackSnapshot: trackResult.snapshot,
        totals: catalogResult.totals,
      });
    }

    // Artist URL — catalog snapshot only
    const result = await takeSnapshot(
      parsed.data.url,
      env.SOUNDCLOUD_CLIENT_ID,
      env.SOUNDCLOUD_CLIENT_SECRET
    );

    const artistId = await upsertArtist(result);
    const snapshotId = await insertSnapshot(artistId, result);

    return NextResponse.json({
      artistId,
      snapshotId,
      artist: result.artist,
      totals: result.totals,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SoundCloud API error";
    return NextResponse.json(
      { error: "Failed to fetch from SoundCloud", details: message },
      { status: 502 }
    );
  }
}
