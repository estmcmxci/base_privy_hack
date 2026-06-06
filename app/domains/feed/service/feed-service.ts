import { getFeedRows } from "../repo/feed-repo";
import { resolveEnsName } from "@/app/shared/ens";
import type { FeedItem, FeedFilters, OutcomeStatus, PredictionHorizon, PredictedOutcome } from "../types/feed-item";

function toNumber(value: bigint | null): number | null {
  return value !== null ? Number(value) : null;
}

export async function getFeedItems(filters?: FeedFilters): Promise<FeedItem[]> {
  const rows = await getFeedRows(filters);

  const walletAddresses = rows
    .map((r) => r.tastemakerWalletAddress)
    .filter((a): a is string => a !== null);

  const uniqueAddresses = [...new Set(walletAddresses)];
  await Promise.all(uniqueAddresses.map((addr) => resolveEnsName(addr)));

  return Promise.all(
    rows.map(async (row) => {
      const ensName = row.tastemakerWalletAddress
        ? await resolveEnsName(row.tastemakerWalletAddress)
        : null;

      // Prefer track-level plays when available, fall back to catalog plays
      const snapshotPlays = row.trackSnapshotPlays !== null
        ? toNumber(row.trackSnapshotPlays)
        : toNumber(row.catalogSnapshotPlays);

      return {
        predictionId: row.predictionId,
        predictedOutcome: row.predictedOutcome as PredictedOutcome,
        streamThreshold: Number(row.streamThreshold),
        horizon: row.horizon as PredictionHorizon,
        outcome: (row.outcome ?? "pending") as OutcomeStatus,
        createdAt: row.createdAt,
        resolvedAt: row.resolvedAt,
        artistName: row.artistName,
        artistPermalinkUrl: row.artistPermalinkUrl,
        artistAvatarUrl: row.artistAvatarUrl,
        tastemakerId: row.tastemakerId,
        tastemakerName: row.tastemakerName,
        tastemakerWalletAddress: row.tastemakerWalletAddress,
        tastemakerEnsName: ensName,
        reputationScore: row.reputationScore ?? 1.0,
        trackName: row.trackName ?? null,
        trackArtworkUrl: row.trackArtworkUrl ?? null,
        trackPermalinkUrl: row.trackPermalinkUrl ?? null,
        snapshotPlays,
        snapshotLikes: toNumber(row.snapshotLikes),
        snapshotReposts: toNumber(row.snapshotReposts),
        snapshotFollowers: toNumber(row.snapshotFollowers),
        easAttestationUid: row.easAttestationUid,
      };
    })
  );
}
