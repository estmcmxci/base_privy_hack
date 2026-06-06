import { getFeedItems } from "@/app/domains/feed/service/feed-service";
import type { FeedFilters, FeedFilter } from "@/app/domains/feed/types/feed-item";

const VALID_FILTERS: FeedFilter[] = ["pending", "resolved", "all"];

export async function feedCommand(outcomeArg?: string): Promise<void> {
  const outcome = (outcomeArg ?? "all") as FeedFilter;

  if (!VALID_FILTERS.includes(outcome)) {
    console.error(`Invalid filter: "${outcome}". Must be one of: ${VALID_FILTERS.join(", ")}`);
    process.exit(1);
  }

  const filters: FeedFilters = { outcome };
  const items = await getFeedItems(filters);

  if (items.length === 0) {
    console.log(`No predictions found (filter: ${outcome})`);
    return;
  }

  console.log(`Feed — ${items.length} prediction(s) [filter: ${outcome}]\n`);

  for (const item of items) {
    const threshold = item.streamThreshold.toLocaleString();
    const created = item.createdAt?.toISOString().slice(0, 10) ?? "unknown";
    const plays = item.snapshotPlays !== null ? item.snapshotPlays.toLocaleString() : "—";

    const label = item.trackName
      ? `"${item.trackName}" by ${item.artistName}`
      : item.artistName;

    console.log(
      [
        `[${item.outcome.toUpperCase()}] ${label} — ${item.predictedOutcome.toUpperCase()} ${threshold} streams in ${item.horizon}`,
        `  tastemaker: ${item.tastemakerEnsName ?? item.tastemakerName ?? item.tastemakerId} (rep: ${item.reputationScore.toFixed(3)})`,
        `  plays at creation: ${plays}  created: ${created}`,
        `  id: ${item.predictionId}`,
      ].join("\n")
    );
    console.log();
  }
}
