import { desc, eq, or } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions } from "@/app/domains/predictions/repo/schema";
import {
  artists,
  catalogSnapshots,
  tracks,
  trackSnapshots,
} from "@/app/domains/soundcloud/repo/schema";
import { tastemakers } from "@/app/domains/tastemakers/repo/schema";
import type { FeedFilters } from "../types/feed-item";

export type FeedRow = {
  predictionId: string;
  predictedOutcome: string;
  streamThreshold: bigint;
  horizon: string;
  outcome: string | null;
  createdAt: Date | null;
  resolvedAt: Date | null;
  artistName: string;
  artistPermalinkUrl: string | null;
  artistAvatarUrl: string | null;
  tastemakerId: string;
  tastemakerName: string | null;
  tastemakerWalletAddress: string | null;
  reputationScore: number | null;
  trackName: string | null;
  trackArtworkUrl: string | null;
  trackPermalinkUrl: string | null;
  trackSnapshotPlays: bigint | null;
  catalogSnapshotPlays: bigint | null;
  snapshotLikes: bigint | null;
  snapshotReposts: bigint | null;
  snapshotFollowers: bigint | null;
  easAttestationUid: string | null;
};

export async function getFeedRows(filters?: FeedFilters): Promise<FeedRow[]> {
  const outcomeFilter = filters?.outcome ?? "all";

  const whereClause =
    outcomeFilter === "pending"
      ? eq(predictions.outcome, "pending")
      : outcomeFilter === "resolved"
        ? or(eq(predictions.outcome, "yes"), eq(predictions.outcome, "no"))
        : undefined;

  const query = db
    .select({
      predictionId: predictions.id,
      predictedOutcome: predictions.predictedOutcome,
      streamThreshold: predictions.streamThreshold,
      horizon: predictions.horizon,
      outcome: predictions.outcome,
      createdAt: predictions.createdAt,
      resolvedAt: predictions.resolvedAt,
      artistName: artists.username,
      artistPermalinkUrl: artists.permalinkUrl,
      artistAvatarUrl: artists.avatarUrl,
      tastemakerId: tastemakers.id,
      tastemakerName: tastemakers.displayName,
      tastemakerWalletAddress: tastemakers.walletAddress,
      reputationScore: tastemakers.reputationScore,
      trackName: tracks.title,
      trackArtworkUrl: tracks.artworkUrl,
      trackPermalinkUrl: tracks.permalinkUrl,
      trackSnapshotPlays: trackSnapshots.playbackCount,
      catalogSnapshotPlays: catalogSnapshots.totalPlays,
      snapshotLikes: catalogSnapshots.totalLikes,
      snapshotReposts: catalogSnapshots.totalReposts,
      snapshotFollowers: catalogSnapshots.followersCount,
      easAttestationUid: predictions.easAttestationUid,
    })
    .from(predictions)
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .innerJoin(tastemakers, eq(predictions.tastemakerId, tastemakers.id))
    .innerJoin(catalogSnapshots, eq(predictions.snapshotId, catalogSnapshots.id))
    .leftJoin(tracks, eq(predictions.trackId, tracks.id))
    .leftJoin(trackSnapshots, eq(predictions.trackSnapshotId, trackSnapshots.id))
    .orderBy(desc(predictions.createdAt));

  if (whereClause) {
    return query.where(whereClause);
  }

  return query;
}
