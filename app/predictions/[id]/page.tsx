import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPredictionDetail } from "@/app/domains/predictions/service/prediction-service";
import { getAttestationUrl } from "@/app/config/eas";
import { resolveEnsName } from "@/app/shared/ens";
import { formatAddress } from "@/app/shared/format-address";
import { ScAttribution } from "@/app/shared/components/sc-attribution";

const getCachedDetail = cache((id: string) => getPredictionDetail(id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const detail = await getCachedDetail(id);
  if (!detail) return { title: "Prediction Not Found" };

  const { prediction, artist } = detail;
  const trackName = detail.track?.title;
  const label = trackName
    ? `${trackName} by ${artist.username}`
    : artist.username;
  const threshold = Number(prediction.streamThreshold).toLocaleString();
  const verb = prediction.predictedOutcome === "yes" ? "will" : "will not";
  const description = `Prediction: ${verb} hit ${threshold} streams in ${prediction.horizon}`;

  return {
    title: `${label} | ${threshold} streams`,
    description,
    openGraph: {
      title: `${label} | Scenius`,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${label} | Scenius`,
      description,
    },
  };
}

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
  params: Promise<{ id: string }>;
};

export default async function PredictionPage({ params }: Props) {
  const { id } = await params;
  const detail = await getCachedDetail(id);

  if (!detail) {
    notFound();
  }

  const { prediction, artist, snapshot, tastemaker, track, trackSnapshot } = detail;
  const outcome = prediction.outcome ?? "pending";
  const outcomeStyle = OUTCOME_STYLES[outcome] ?? OUTCOME_STYLES.pending;
  const horizonLabel = HORIZON_LABELS[prediction.horizon] ?? prediction.horizon;
  const ensName = tastemaker.walletAddress
    ? await resolveEnsName(tastemaker.walletAddress)
    : null;
  const displayName = ensName ?? tastemaker.displayName ?? "Anonymous";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Back link */}
      <Link href="/" className="text-sm text-fg-faint hover:text-fg-muted transition-colors">
        &larr; Back to feed
      </Link>

      {/* Prediction header */}
      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          {(track?.artworkUrl ?? artist.avatarUrl) && (
            <img
              src={(track?.artworkUrl ?? artist.avatarUrl)!}
              alt=""
              className={`h-14 w-14 object-cover ${track ? "rounded" : "rounded-full"}`}
            />
          )}
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-fg break-words">
              {track ? track.title : artist.username}
            </h1>
            {track ? (
              <p className="text-sm text-fg-muted">{artist.username}</p>
            ) : (
              artist.city && (
                <p className="text-sm text-fg-muted">{artist.city}</p>
              )
            )}
          </div>
        </div>

        <p className="text-lg text-fg-muted leading-relaxed">
          <span className="font-medium text-fg">{displayName}</span>
          {" predicts "}
          <span className="font-semibold text-fg">
            {prediction.predictedOutcome === "yes" ? "will" : "will not"}
          </span>
          {" hit "}
          <span className="font-bold text-accent">
            {Number(prediction.streamThreshold).toLocaleString()}
          </span>
          {" streams in "}
          {horizonLabel}
        </p>

        <span
          className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium capitalize ${outcomeStyle}`}
        >
          {OUTCOME_LABELS[outcome] ?? outcome}
        </span>
      </div>

      {/* Snapshot at prediction time */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-fg-faint uppercase tracking-widest mb-3">
          {trackSnapshot ? "Track at prediction time" : "Catalog at prediction time"}
        </h2>
        {trackSnapshot ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-lg border border-border bg-bg-raised p-3 sm:p-4">
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(trackSnapshot.playbackCount ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">plays</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(trackSnapshot.likesCount ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">likes</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(trackSnapshot.repostsCount ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">reposts</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 rounded-lg border border-border bg-bg-raised p-3 sm:p-4">
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(snapshot.totalPlays ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">plays</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(snapshot.followersCount ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">followers</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(snapshot.totalLikes ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">likes</p>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-fg">
                {Number(snapshot.totalReposts ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-fg-faint">reposts</p>
            </div>
          </div>
        )}
        <p className="mt-2">
          <ScAttribution
            permalinkUrl={track?.permalinkUrl ?? artist.permalinkUrl}
            suffix={` \u00b7 snapshotted ${(trackSnapshot?.takenAt ?? snapshot.takenAt).toLocaleDateString()}`}
          />
        </p>
      </section>

      {/* Tastemaker */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold text-fg-faint uppercase tracking-widest mb-3">
          Tastemaker
        </h2>
        <Link
          href={`/tastemakers/${tastemaker.id}`}
          className="flex items-center gap-3 rounded-lg border border-border bg-bg-raised p-4 transition-all hover:border-border-hover hover:bg-bg-elevated"
        >
          <div>
            <p className="font-medium text-fg">{displayName}</p>
            {tastemaker.walletAddress && (
              <p className="text-xs text-fg-faint font-mono">
                {formatAddress(tastemaker.walletAddress)}
              </p>
            )}
            <p className="text-sm text-fg-muted">
              Reputation: {tastemaker.reputationScore?.toFixed(3) ?? "\u2014"}
            </p>
          </div>
        </Link>
      </section>

      {/* Metadata */}
      <section className="text-xs text-fg-faint">
        {prediction.createdAt && (
          <p>Created: {new Date(prediction.createdAt).toLocaleDateString()}</p>
        )}
        {prediction.resolvedAt && (
          <p>Resolved: {new Date(prediction.resolvedAt).toLocaleDateString()}</p>
        )}
        {prediction.easAttestationUid && (
          <p>
            Attestation:{" "}
            <a
              href={getAttestationUrl(prediction.easAttestationUid)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-muted underline"
            >
              View on EAS
            </a>
          </p>
        )}
        <p className="mt-1 font-mono">{prediction.id}</p>
      </section>
    </main>
  );
}
