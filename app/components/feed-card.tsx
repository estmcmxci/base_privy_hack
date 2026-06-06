import Link from "next/link";
import type { FeedItem } from "@/app/domains/feed/types/feed-item";
import { formatAddress } from "@/app/shared/format-address";
import { ScAttribution } from "@/app/shared/components/sc-attribution";

const OUTCOME_STYLES: Record<string, string> = {
  pending: "bg-outcome-pending-bg text-outcome-pending-fg",
  yes: "bg-outcome-yes-bg text-outcome-yes-fg",
  no: "bg-outcome-no-bg text-outcome-no-fg",
  void: "bg-outcome-void-bg text-outcome-void-fg",
};

const OUTCOME_LABELS: Record<string, string> = {
  pending: "pending",
  yes: "yes",
  no: "no",
  void: "unavailable",
};

const HORIZON_LABELS: Record<string, string> = {
  "1w": "1 week",
  "2w": "2 weeks",
  "4w": "4 weeks",
  "8w": "8 weeks",
};

type Props = {
  item: FeedItem;
};

export function FeedCard({ item }: Props) {
  const outcome = item.outcome;
  const outcomeStyle = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.pending;
  const horizonLabel = HORIZON_LABELS[item.horizon] ?? item.horizon;

  return (
    <Link
      href={`/predictions/${item.predictionId}`}
      className="group block rounded-lg border border-border bg-bg-raised p-4 sm:p-5 transition-all hover:border-border-hover hover:bg-bg-elevated"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {(item.trackArtworkUrl ?? item.artistAvatarUrl) && (
              <img
                src={(item.trackArtworkUrl ?? item.artistAvatarUrl)!}
                alt=""
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="font-serif text-base font-semibold text-fg truncate">
                {item.trackName ?? item.artistName}
              </p>
              {item.trackName && (
                <p className="text-xs text-fg-muted truncate">
                  {item.artistName}
                </p>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm text-fg-muted leading-relaxed">
            <span className="font-medium text-fg">
              {item.tastemakerEnsName
                ?? item.tastemakerName
                ?? (item.tastemakerWalletAddress
                  ? formatAddress(item.tastemakerWalletAddress)
                  : "Anonymous")}
            </span>
            {" predicts "}
            <span className="font-medium text-fg">
              {item.predictedOutcome === "yes" ? "will" : "will not"}
            </span>
            {" hit "}
            <span className="font-semibold text-accent">
              {item.streamThreshold.toLocaleString()}
            </span>
            {" streams in "}
            {horizonLabel}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-faint">
            {item.snapshotPlays !== null && (
              <span>
                {item.snapshotPlays.toLocaleString()} plays at prediction
                <span className="ml-1"><ScAttribution asSpan /></span>
              </span>
            )}
            <span>rep: {item.reputationScore.toFixed(2)}</span>
            {item.createdAt && (
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
            )}
            {item.easAttestationUid && (
              <span className="text-accent hover:text-accent-muted underline">
                Attested on EAS
              </span>
            )}
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${outcomeStyle}`}
        >
          {OUTCOME_LABELS[outcome] ?? outcome}
        </span>
      </div>
    </Link>
  );
}
