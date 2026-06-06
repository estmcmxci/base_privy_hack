import { createPredictionSchema } from "@/app/domains/predictions/types/create-prediction";
import { submitPrediction } from "@/app/domains/predictions/service/prediction-service";

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") && i + 1 < args.length) {
      const key = arg.slice(2);
      result[key] = args[i + 1];
      i++;
    }
  }
  return result;
}

export async function predictCommand(url: string, rawArgs: string[]) {
  const flags = parseArgs(rawArgs);

  if (!flags.threshold || !flags.horizon || !flags.outcome || !flags.tastemaker) {
    console.error(
      "Usage: pnpm cli predict <url> --threshold <number> --horizon <1w|2w|4w|8w> --outcome <yes|no> --tastemaker <uuid>"
    );
    process.exit(1);
  }

  const parsed = createPredictionSchema.safeParse({
    url,
    streamThreshold: Number(flags.threshold),
    predictedOutcome: flags.outcome,
    horizon: flags.horizon,
    tastemakerId: flags.tastemaker,
  });

  if (!parsed.success) {
    console.error("Validation errors:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`Creating prediction for: ${url}`);
  console.log(`  Threshold: ${parsed.data.streamThreshold} streams`);
  console.log(`  Horizon: ${parsed.data.horizon}`);
  console.log(`  Outcome: ${parsed.data.predictedOutcome}`);
  console.log(`  Tastemaker: ${parsed.data.tastemakerId}`);

  const tastemakerId = parsed.data.tastemakerId;
  if (!tastemakerId) {
    console.error("tastemakerId is required for CLI usage");
    process.exit(1);
  }

  const result = await submitPrediction({ ...parsed.data, tastemakerId });

  console.log(`\nPrediction created!`);
  console.log(`  Prediction ID: ${result.predictionId}`);
  console.log(`  Artist: ${result.artist.username} (SC ID: ${result.artist.soundcloudId})`);
  console.log(`  Snapshot ID: ${result.snapshotId}`);
  if (result.trackId) {
    console.log(`  Track ID: ${result.trackId}`);
    console.log(`  Track snapshot ID: ${result.trackSnapshotId}`);
  }
  if (result.trackSnapshot) {
    console.log(`  Track plays: ${result.trackSnapshot.playbackCount}`);
  } else if (result.totals) {
    console.log(`  Catalog plays: ${result.totals.plays}`);
  }
  console.log(`  Followers: ${result.artist.followersCount}`);

  process.exit(0);
}
