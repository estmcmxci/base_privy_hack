import { getTastemakerProfile } from "@/app/domains/tastemakers/service/tastemaker-service";

export async function tastemakerCommand(id?: string): Promise<void> {
  if (!id) {
    console.error("Usage: pnpm cli tastemaker <tastemaker-id>");
    process.exit(1);
  }

  const profile = await getTastemakerProfile(id);

  if (!profile) {
    console.error(`Tastemaker not found: ${id}`);
    process.exit(1);
  }

  const { tastemaker, predictions, stats } = profile;
  const displayName = tastemaker.displayName ?? tastemaker.walletAddress ?? "Anonymous";
  const reputation = tastemaker.reputationScore?.toFixed(3) ?? "—";

  console.log(`${displayName} (rep: ${reputation})`);
  console.log(`  predictions: ${stats.totalPredictions}  resolved: ${stats.resolvedPredictions}  win rate: ${stats.winRate !== null ? `${stats.winRate}%` : "—"}`);
  console.log();

  if (predictions.length === 0) {
    console.log("No predictions yet.");
    return;
  }

  for (const { prediction, artist } of predictions) {
    const outcome = prediction.outcome ?? "pending";
    const threshold = Number(prediction.streamThreshold).toLocaleString();
    const created = prediction.createdAt ? new Date(prediction.createdAt).toISOString().slice(0, 10) : "unknown";

    console.log(`  [${outcome.toUpperCase()}] ${artist.username} — ${prediction.predictedOutcome.toUpperCase()} ${threshold} streams in ${prediction.horizon}  (${created})`);
  }
}
