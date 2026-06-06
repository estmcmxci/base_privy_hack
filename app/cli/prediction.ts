import { getPredictionDetail } from "@/app/domains/predictions/service/prediction-service";
import { db } from "@/app/db/client";
import { eq } from "drizzle-orm";
import { tracks, trackSnapshots } from "@/app/domains/soundcloud/repo/schema";

export async function predictionCommand(id?: string): Promise<void> {
  if (!id) {
    console.error("Usage: pnpm cli prediction <prediction-id>");
    process.exit(1);
  }

  const detail = await getPredictionDetail(id);

  if (!detail) {
    console.error(`Prediction not found: ${id}`);
    process.exit(1);
  }

  const { prediction, artist, snapshot, tastemaker } = detail;
  const displayName = tastemaker.displayName ?? "Anonymous";
  const outcome = prediction.outcome ?? "pending";

  // Fetch track info if this is a per-track prediction
  let trackTitle: string | null = null;
  let trackPlays: number | null = null;

  if (prediction.trackId) {
    const [trackRow] = await db
      .select({ title: tracks.title })
      .from(tracks)
      .where(eq(tracks.id, prediction.trackId))
      .limit(1);
    trackTitle = trackRow?.title ?? null;
  }

  if (prediction.trackSnapshotId) {
    const [tsRow] = await db
      .select({ playbackCount: trackSnapshots.playbackCount })
      .from(trackSnapshots)
      .where(eq(trackSnapshots.id, prediction.trackSnapshotId))
      .limit(1);
    trackPlays = tsRow?.playbackCount != null ? Number(tsRow.playbackCount) : null;
  }

  const label = trackTitle
    ? `"${trackTitle}" by ${artist.username}`
    : artist.username;

  console.log(`${label} — ${prediction.predictedOutcome.toUpperCase()} ${Number(prediction.streamThreshold).toLocaleString()} streams in ${prediction.horizon}`);
  console.log(`  outcome: ${outcome.toUpperCase()}`);
  console.log(`  tastemaker: ${displayName} (rep: ${tastemaker.reputationScore?.toFixed(3) ?? "—"})`);

  if (trackPlays !== null) {
    console.log(`  track plays at creation: ${trackPlays.toLocaleString()}`);
  }

  console.log(`  catalog snapshot: ${Number(snapshot.totalPlays ?? 0).toLocaleString()} plays, ${Number(snapshot.followersCount ?? 0).toLocaleString()} followers`);
  console.log(`  created: ${prediction.createdAt ? new Date(prediction.createdAt).toISOString().slice(0, 10) : "unknown"}`);
  console.log(`  id: ${prediction.id}`);
}
