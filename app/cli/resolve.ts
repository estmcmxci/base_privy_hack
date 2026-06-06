import {
  runWeeklyResolution,
  runWeeklyResolutionDryRun,
} from "@/app/domains/resolution/service/weekly-resolution";

export async function resolveCommand() {
  const isDryRun = process.argv.includes("--dry-run");
  const isForce = process.argv.includes("--force");

  if (isDryRun) {
    const duePredictions = await runWeeklyResolutionDryRun(new Date());

    if (duePredictions.length === 0) {
      console.log("No predictions due for resolution.");
      process.exit(0);
    }

    console.log(`[dry-run] ${duePredictions.length} prediction(s) would resolve:\n`);

    for (const pred of duePredictions) {
      console.log(`  id:         ${pred.id}`);
      console.log(`  artist:     ${pred.permalinkUrl ?? "(no URL)"}`);
      if (pred.trackPermalinkUrl) {
        console.log(`  track:      ${pred.trackPermalinkUrl}`);
        console.log(`  type:       track-level`);
      } else {
        console.log(`  type:       catalog-level`);
      }
      console.log(`  threshold:  ${pred.streamThreshold}`);
      console.log(`  predicted:  ${pred.predictedOutcome}`);
      console.log(`  tastemaker: ${pred.tastemakerId}`);
      console.log("");
    }

    process.exit(0);
  }

  if (isForce) {
    console.log("⚠ Force mode: resolving ALL pending predictions regardless of horizon\n");
  }

  const result = await runWeeklyResolution(new Date(), { force: isForce });

  console.log(`Resolved: ${result.resolved}`);
  console.log(`Voided:   ${result.voided}`);
  console.log(`Errors:   ${result.errors}`);

  for (const detail of result.details) {
    console.log(
      `  ${detail.predictionId}: outcome=${detail.outcome} delta=${detail.delta} reputation=${detail.newReputation.toFixed(4)}`
    );
  }

  process.exit(0);
}
