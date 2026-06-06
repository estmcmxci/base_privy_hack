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

/** Expected YES — high velocity tracks */
const YES_TRACKS = [
  "https://soundcloud.com/szrcsm/no-one-else-prodshushy",
  "https://soundcloud.com/boycali/she-go-by-denver",
  "https://soundcloud.com/anayakobe/ladylike-softgirlscrew",
  "https://soundcloud.com/kay-archon/she-goes-by-kayarchon-remix-2",
];

/** Expected NO — low velocity tracks */
const NO_TRACKS = [
  "https://soundcloud.com/boyfromvirgini4/say-aah-remix-boyfromvirgini4",
  "https://soundcloud.com/soosmusik/6-months",
  "https://soundcloud.com/yikes-34019285/speechless-1",
  "https://soundcloud.com/viraqto/yng-money",
];

const ALL_TRACKS = [...YES_TRACKS, ...NO_TRACKS];

const SEED_TASTEMAKERS = [
  { displayName: "DJ Booth Curator", walletAddress: "0x1111111111111111111111111111111111111111" },
  { displayName: "Pigeons & Planes", walletAddress: "0x2222222222222222222222222222222222222222" },
];

type PredictionSpec = {
  trackIndex: number;
  tastemakerIndex: number;
  streamThreshold: number;
  predictedOutcome: "yes" | "no";
  horizon: "1w" | "2w" | "4w" | "8w";
};

/**
 * All predictions created with createdAt = now.
 * Use `pnpm cli resolve --force` to resolve them immediately for the demo
 * (skips horizon check). This avoids the backdating problem where creation
 * snapshots taken today produce zero delta.
 */
const ALL_PREDICTIONS: PredictionSpec[] = [
  // Expected YES — high velocity, likely to already exceed 10K
  { trackIndex: 0, tastemakerIndex: 0, streamThreshold: 10000, predictedOutcome: "yes", horizon: "1w" },
  { trackIndex: 1, tastemakerIndex: 0, streamThreshold: 10000, predictedOutcome: "yes", horizon: "1w" },
  { trackIndex: 2, tastemakerIndex: 1, streamThreshold: 10000, predictedOutcome: "yes", horizon: "1w" },
  { trackIndex: 3, tastemakerIndex: 0, streamThreshold: 10000, predictedOutcome: "yes", horizon: "1w" },
  // Expected NO — low velocity, unlikely to exceed 10K
  { trackIndex: 4, tastemakerIndex: 1, streamThreshold: 10000, predictedOutcome: "yes", horizon: "1w" },
  { trackIndex: 5, tastemakerIndex: 1, streamThreshold: 10000, predictedOutcome: "no", horizon: "1w" },
  { trackIndex: 6, tastemakerIndex: 0, streamThreshold: 10000, predictedOutcome: "no", horizon: "1w" },
  { trackIndex: 7, tastemakerIndex: 0, streamThreshold: 10000, predictedOutcome: "no", horizon: "1w" },
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

type TrackData = {
  artistId: string;
  snapshotId: string;
  trackId: string;
  trackSnapshotId: string;
};

export async function seedDemoCommand(): Promise<void> {
  const env = getEnv();

  // 1. Snapshot all 8 tracks
  console.log("Snapshotting demo tracks...");
  const trackData: (TrackData | null)[] = [];

  for (const url of ALL_TRACKS) {
    console.log(`  ${url}`);
    try {
      const trackResult = await takeTrackSnapshot(url, env.SOUNDCLOUD_CLIENT_ID, env.SOUNDCLOUD_CLIENT_SECRET);

      const artistId = await upsertArtist(trackResult);
      const trackId = await upsertTrack(trackResult, artistId);
      const trackSnapshotId = await insertTrackSnapshot(trackId, trackResult);

      // Catalog snapshot for the required snapshotId NOT NULL column
      const catalogResult = await takeSnapshot(
        trackResult.artist.permalinkUrl,
        env.SOUNDCLOUD_CLIENT_ID,
        env.SOUNDCLOUD_CLIENT_SECRET
      );

      if (catalogResult.totals.tracksFetched === 0) {
        console.log(`    ${trackResult.artist.username} -> skipped (0 tracks returned)`);
        trackData.push(null);
        continue;
      }

      const snapshotId = await insertSnapshot(artistId, catalogResult);

      trackData.push({ artistId, snapshotId, trackId, trackSnapshotId });
      console.log(`    "${trackResult.track.title}" by ${trackResult.artist.username} -> ${trackResult.snapshot.playbackCount.toLocaleString()} plays`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`    FAILED: ${msg} -> skipping`);
      trackData.push(null);
    }
  }

  // 2. Create tastemakers
  console.log("Creating tastemakers...");
  const tastemakerIds: string[] = [];
  for (const tm of SEED_TASTEMAKERS) {
    const id = await upsertTastemaker(tm);
    tastemakerIds.push(id);
    console.log(`  ${tm.displayName} -> ${id}`);
  }

  // 3. Create predictions (idempotent: dedupe on tastemaker+track+threshold+horizon)
  console.log("Creating predictions...");
  const predictionIds: string[] = [];

  for (const p of ALL_PREDICTIONS) {
    const td = trackData[p.trackIndex];
    const tastemakerId = tastemakerIds[p.tastemakerIndex];

    if (!td || !tastemakerId) {
      console.log(`  skipped (missing track data or tastemaker for index ${p.trackIndex})`);
      continue;
    }

    const existing = await db
      .select({ id: predictions.id })
      .from(predictions)
      .where(
        and(
          eq(predictions.tastemakerId, tastemakerId),
          eq(predictions.trackId, td.trackId),
          eq(predictions.streamThreshold, BigInt(p.streamThreshold)),
          eq(predictions.horizon, p.horizon)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      predictionIds.push(existing[0].id);
      console.log(`  exists: ${p.predictedOutcome.toUpperCase()} ${p.streamThreshold.toLocaleString()} in ${p.horizon}`);
      continue;
    }

    const [inserted] = await db
      .insert(predictions)
      .values({
        tastemakerId,
        artistId: td.artistId,
        snapshotId: td.snapshotId,
        trackId: td.trackId,
        trackSnapshotId: td.trackSnapshotId,
        streamThreshold: BigInt(p.streamThreshold),
        predictedOutcome: p.predictedOutcome,
        horizon: p.horizon,
        outcome: "pending",
      })
      .returning({ id: predictions.id });

    predictionIds.push(inserted.id);
    console.log(`  ${p.predictedOutcome.toUpperCase()} ${p.streamThreshold.toLocaleString()} in ${p.horizon} -> ${inserted.id}`);
  }

  // 4. Create a post for the first prediction
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
        title: "ki — no one else is gaining serious momentum",
        body: "This synthclub remix has deep replay value. Calling 10K plays in 1 week.",
        published: true,
      });
      console.log("  created post for first prediction");
    } else {
      console.log("  post already exists, skipped");
    }
  }

  console.log("\nSeed-demo complete:");
  console.log(`  ${trackData.filter(Boolean).length} tracks`);
  console.log(`  ${tastemakerIds.length} tastemakers`);
  console.log(`  ${predictionIds.length} predictions (use 'pnpm cli resolve --force' to resolve for demo)`);
  console.log(`  1 post`);

  process.exit(0);
}
