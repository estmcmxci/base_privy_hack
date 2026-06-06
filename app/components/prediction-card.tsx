import Link from "next/link";
import type { PredictionWithArtist } from "@/app/domains/tastemakers/repo/tastemaker-repo";

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
  item: PredictionWithArtist;
};

export function PredictionCard({ item }: Props) {
  const { prediction, artist, track } = item;
  const outcome = prediction.outcome ?? "pending";
  const outcomeStyle = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.pending;
  const horizonLabel =
    HORIZON_LABELS[prediction.horizon] ?? prediction.horizon;

  return (
    <Link
      href={`/predictions/${prediction.id}`}
      className="group block rounded-lg border border-border bg-bg-raised p-4 transition-all hover:border-border-hover hover:bg-bg-elevated"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-serif text-sm font-medium text-fg truncate">
            {track ? `${track.title} by ${artist.username}` : artist.username}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Predicts{" "}
            <span className="font-medium text-fg">
              {prediction.predictedOutcome === "yes" ? "will" : "will not"}
            </span>{" "}
            hit{" "}
            <span className="font-medium text-accent">
              {Number(prediction.streamThreshold).toLocaleString()}
            </span>{" "}
            streams in {horizonLabel}
          </p>
          {prediction.createdAt && (
            <p className="mt-1 text-xs text-fg-faint">
              {new Date(prediction.createdAt).toLocaleDateString()}
            </p>
          )}
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
