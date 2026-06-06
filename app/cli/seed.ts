import { and, eq } from "drizzle-orm";
import { getEnv } from "@/app/config/env";
import { takeSnapshot } from "@/app/domains/soundcloud/service/snapshot";
import { takeTrackSnapshot } from "@/app/domains/soundcloud/service/track-snapshot";
import { upsertArtist, insertSnapshot } from "@/app/domains/soundcloud/repo/snapshot-repo";
import { upsertTrack, insertTrackSnapshot } from "@/app/domains/soundcloud/repo/track-repo";
import { db } from "@/app/db/client";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";
import { predictions } from "@/app/domains/predictions/repo/schema";
import { posts } from "@/app/domains/feed/repo/schema";

const SEED_TRACKS = [
  "https://soundcloud.com/knxwledge/8-alright",
  "https://soundcloud.com/thankyouriz/hide-the-gun",
  "https://soundcloud.com/quietluke/dreamless",
];

const SEED_TASTEMAKERS = [
  { displayName: "DJ Booth Curator", walletAddress: "0x1111111111111111111111111111111111111111" },
  { displayName: "Pigeons & Planes", walletAddress: "0x2222222222222222222222222222222222222222" },
];

const SEED_PREDICTIONS: Array<{
  trackIndex: number;
  tastemakerIndex: number;
  streamThreshold: number;
  predictedOutcome: "yes" | "no";
  horizon: "1w" | "2w" | "4w" | "8w";
}> = [
  { trackIndex: 0, tastemakerIndex: 0, streamThreshold: 50000, predictedOutcome: "yes", horizon: "4w" },
  { trackIndex: 1, tastemakerIndex: 1, streamThreshold: 10000, predictedOutcome: "yes", horizon: "8w" },
  { trackIndex: 2, tastemakerIndex: 0, streamThreshold: 5000, predictedOutcome: "no", horizon: "2w" },
];

async function upsertTastemaker(data: { displayName: string; walletAddress: string }): Promise<string> {
  const existing = await db
    .select({ id: tastemakers.id })
    .from(tastemakers)
    .where(eq(tastemakers.walletAddress, data.walletAddress))
    .limit(1);

  if (existing.length > 0) return existing[0].id;

  const [inserted] = await db
    .insert(tastemakers)
    .values({
      displayName: data.displayName,
      walletAddress: data.walletAddress,
      reputationScore: 1.0,
      totalPredictions: 0,
    })
    .returning({ id: tastemakers.id });

  return inserted.id;
}

export async function seedCommand(): Promise<void> {
  const env = getEnv();

  // 1. Snapshot tracks and their artists
  console.log("Snapshotting tracks...");
  const artistIds: string[] = [];
  const snapshotIds: string[] = [];
  const trackIds: string[] = [];
  const trackSnapshotIds: string[] = [];

  for (const url of SEED_TRACKS) {
    console.log(`  ${url}`);
    const trackResult = await takeTrackSnapshot(url, env.SOUNDCLOUD_CLIENT_ID, env.SOUNDCLOUD_CLIENT_SECRET);

    const artistId = await upsertArtist(trackResult);
    const trackId = await upsertTrack(trackResult, artistId);
    const trackSnapshotId = await insertTrackSnapshot(trackId, trackResult);

    // Also take catalog snapshot for the required snapshotId column
    const catalogResult = await takeSnapshot(
      trackResult.artist.permalinkUrl,
      env.SOUNDCLOUD_CLIENT_ID,
      env.SOUNDCLOUD_CLIENT_SECRET
    );

    if (catalogResult.totals.tracksFetched === 0) {
      console.log(`    ${trackResult.artist.username} → skipped (0 tracks returned)`);
      artistIds.push("");
      snapshotIds.push("");
      trackIds.push("");
      trackSnapshotIds.push("");
      continue;
    }

    const snapshotId = await insertSnapshot(artistId, catalogResult);

    artistIds.push(artistId);
    snapshotIds.push(snapshotId);
    trackIds.push(trackId);
    trackSnapshotIds.push(trackSnapshotId);
    console.log(`    "${trackResult.track.title}" by ${trackResult.artist.username} → ${trackResult.snapshot.playbackCount.toLocaleString()} plays`);
  }

  // 2. Create tastemakers
  console.log("Creating tastemakers...");
  const tastemakerIds: string[] = [];
  for (const tm of SEED_TASTEMAKERS) {
    const id = await upsertTastemaker(tm);
    tastemakerIds.push(id);
    console.log(`  ${tm.displayName} → ${id}`);
  }

  // 3. Create predictions (idempotent — skip if same tastemaker/artist/threshold/horizon exists)
  console.log("Creating predictions...");
  const predictionIds: string[] = [];
  for (const p of SEED_PREDICTIONS) {
    const artistId = artistIds[p.trackIndex];
    const tastemakerId = tastemakerIds[p.tastemakerIndex];

    if (!artistId || !tastemakerId) {
      console.log(`  skipped (missing artist or tastemaker)`);
      continue;
    }

    const trackId = trackIds[p.trackIndex];
    const whereConditions = [
      eq(predictions.tastemakerId, tastemakerId),
      eq(predictions.artistId, artistId),
      eq(predictions.streamThreshold, BigInt(p.streamThreshold)),
      eq(predictions.horizon, p.horizon),
    ];
    if (trackId) {
      whereConditions.push(eq(predictions.trackId, trackId));
    }

    const existing = await db
      .select({ id: predictions.id })
      .from(predictions)
      .where(and(...whereConditions))
      .limit(1);

    if (existing.length > 0) {
      predictionIds.push(existing[0].id);
      console.log(`  exists: ${p.predictedOutcome.toUpperCase()} ${p.streamThreshold.toLocaleString()} streams in ${p.horizon}`);
      continue;
    }

    const [inserted] = await db
      .insert(predictions)
      .values({
        tastemakerId,
        artistId,
        snapshotId: snapshotIds[p.trackIndex],
        trackId: trackIds[p.trackIndex],
        trackSnapshotId: trackSnapshotIds[p.trackIndex],
        streamThreshold: BigInt(p.streamThreshold),
        predictedOutcome: p.predictedOutcome,
        horizon: p.horizon,
        outcome: "pending",
      })
      .returning({ id: predictions.id });

    predictionIds.push(inserted.id);
    console.log(`  ${p.predictedOutcome.toUpperCase()} ${p.streamThreshold.toLocaleString()} streams in ${p.horizon} → ${inserted.id}`);
  }

  // 4. Create a post (skip if one already exists for this prediction)
  console.log("Creating post...");
  if (predictionIds.length > 0) {
    const existingPost = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.predictionId, predictionIds[0]))
      .limit(1);

    if (existingPost.length === 0) {
      await db.insert(posts).values({
        predictionId: predictionIds[0],
        tastemakerId: tastemakerIds[0],
        title: "Knxwledge — 8 Alright is about to break out",
        body: "This track has deep replay value and the play count is climbing. Calling 50K in 4 weeks.",
        published: true,
      });
    } else {
      console.log("  post already exists, skipped");
    }
  }

  console.log("\nSeed complete:");
  console.log(`  ${trackIds.filter(Boolean).length} tracks`);
  console.log(`  ${artistIds.filter(Boolean).length} artists`);
  console.log(`  ${tastemakerIds.length} tastemakers`);
  console.log(`  ${predictionIds.length} predictions`);
  console.log(`  1 post`);

  process.exit(0);
}
