import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCronSecret, getEnv } from "@/app/config/env";
import { listPendingArtists } from "@/app/domains/resolution/repo/pending-artists";
import { listPendingTracks } from "@/app/domains/resolution/repo/pending-tracks";
import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { takeTrackSnapshot } from "@/app/domains/soundcloud/service/track-snapshot";
import {
  upsertArtist,
  insertSnapshot,
} from "@/app/domains/soundcloud/repo/snapshot-repo";
import { upsertTrack, insertTrackSnapshot } from "@/app/domains/soundcloud/repo/track-repo";

const cronHeadersSchema = z.object({
  authorization: z.string().regex(/^Bearer\s+\S+$/).optional(),
  "x-cron-secret": z.string().min(1).optional(),
  "cron-secret": z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
});

function getProvidedSecret(request: NextRequest): string | null {
  const parsedHeaders = cronHeadersSchema.safeParse({
    authorization: request.headers.get("authorization") ?? undefined,
    "x-cron-secret": request.headers.get("x-cron-secret") ?? undefined,
    "cron-secret": request.headers.get("cron-secret") ?? undefined,
    CRON_SECRET: request.headers.get("CRON_SECRET") ?? undefined,
  });

  if (!parsedHeaders.success) {
    return null;
  }

  const bearerSecret = parsedHeaders.data.authorization?.replace(
    /^Bearer\s+/,
    ""
  );
  return (
    parsedHeaders.data.CRON_SECRET ??
    parsedHeaders.data["cron-secret"] ??
    parsedHeaders.data["x-cron-secret"] ??
    bearerSecret ??
    null
  );
}

function isAuthorized(request: NextRequest): boolean {
  const providedSecret = getProvidedSecret(request);
  return providedSecret !== null && providedSecret === getCronSecret();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getEnv();
  const pendingArtists = await listPendingArtists();
  const pendingTracks = await listPendingTracks();

  let artistsSnapshotted = 0;
  let tracksSnapshotted = 0;
  let errors = 0;

  for (const { permalinkUrl } of pendingArtists) {
    try {
      const result = await takeSnapshot(
        permalinkUrl,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );

      const artistId = await upsertArtist(result);
      await insertSnapshot(artistId, result);
      artistsSnapshotted++;
    } catch (err) {
      errors++;
      console.error(`Snapshot failed for ${permalinkUrl}:`, err);
    }
  }

  for (const { trackPermalinkUrl } of pendingTracks) {
    try {
      const result = await takeTrackSnapshot(
        trackPermalinkUrl,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );

      const artistId = await upsertArtist({ artist: result.artist });
      const trackId = await upsertTrack(result, artistId);
      await insertTrackSnapshot(trackId, result);
      tracksSnapshotted++;
    } catch (err) {
      errors++;
      console.error(`Track snapshot failed for ${trackPermalinkUrl}:`, err);
    }
  }

  console.log(
    `Snapshot cron complete: ${artistsSnapshotted} artists, ${tracksSnapshotted} tracks, ${errors} errors`
  );

  return NextResponse.json({ artistsSnapshotted, tracksSnapshotted, errors }, { status: 200 });
}
