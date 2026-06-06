export type OutcomeStatus = "pending" | "yes" | "no";
export type PredictionHorizon = "1w" | "2w" | "4w" | "8w";
export type PredictedOutcome = "yes" | "no";

export type FeedItem = {
  predictionId: string;
  /** "yes" or "no" — what the tastemaker predicted */
  predictedOutcome: PredictedOutcome;
  /** play-count threshold the prediction is betting on */
  streamThreshold: number;
  /** time horizon for the prediction */
  horizon: PredictionHorizon;
  /** current resolution status */
  outcome: OutcomeStatus;
  createdAt: Date | null;
  resolvedAt: Date | null;

  // artist context
  artistName: string;
  artistPermalinkUrl: string | null;
  artistAvatarUrl: string | null;

  // tastemaker context
  tastemakerId: string;
  tastemakerName: string | null;
  tastemakerWalletAddress: string | null;
  tastemakerEnsName: string | null;
  reputationScore: number;

  // track context (null for legacy catalog-only predictions)
  trackName: string | null;
  trackArtworkUrl: string | null;
  trackPermalinkUrl: string | null;

  // snapshot at prediction creation time (track-level if available, else catalog)
  snapshotPlays: number | null;
  snapshotLikes: number | null;
  snapshotReposts: number | null;
  snapshotFollowers: number | null;

  // EAS attestation
  easAttestationUid: string | null;
};

export type FeedFilter = "pending" | "resolved" | "all";

export type FeedFilters = {
  outcome?: FeedFilter;
};
