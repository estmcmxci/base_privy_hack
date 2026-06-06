"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets, useX402Fetch } from "@privy-io/react-auth";
import { TrackPreview } from "@/app/components/track-preview";

const HORIZONS = ["1w", "2w", "4w", "8w"] as const;
type Horizon = (typeof HORIZONS)[number];

type FieldErrors = Record<string, string[]>;

export default function SubmitPage() {
  const router = useRouter();
  const { authenticated, login, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { wrapFetchWithPayment } = useX402Fetch();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const walletAddress = embeddedWallet?.address ?? null;

  const [url, setUrl] = useState("");
  const [debouncedUrl, setDebouncedUrl] = useState("");
  const [streamThreshold, setStreamThreshold] = useState("");
  const [predictedOutcome, setPredictedOutcome] = useState<"yes" | "no">("yes");
  const [horizon, setHorizon] = useState<Horizon>("2w");

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const handleUrlBlur = useCallback(() => {
    const trimmed = url.trim();
    if (trimmed && trimmed !== debouncedUrl) {
      setDebouncedUrl(trimmed);
    }
  }, [url, debouncedUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;
    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const token = await getAccessToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Stake-to-predict: /api/predictions is x402-gated. wrapFetchWithPayment
      // pays the flat USDC tax from the embedded wallet on the 402 challenge.
      // NOTE: must be an ABSOLUTE url — the x402 client does `new URL(input)`,
      // which throws on a relative path.
      const payFetch = wrapFetchWithPayment({ walletAddress, fetch });
      const res = await payFetch(`${window.location.origin}/api/predictions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: url.trim(),
          streamThreshold: Number(streamThreshold),
          predictedOutcome,
          horizon,
          walletAddress,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 400 && body?.details) {
          if (typeof body.details === "object") {
            setFieldErrors(body.details as FieldErrors);
          } else {
            setFormError(String(body.details));
          }
        } else {
          setFormError(body?.error ?? "Something went wrong. Try again.");
        }
        return;
      }

      const data = await res.json();
      router.push(`/predictions/${data.predictionId}`);
    } catch (err) {
      console.error("[submit] x402 stake failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(
        `Couldn't complete the stake (${msg}). If this mentions funds, top up Base Sepolia USDC at faucet.circle.com.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            Submit a Prediction
          </h1>
          <p className="mt-2 text-sm sm:text-base text-fg-muted leading-relaxed">
            Sign in to submit a prediction on an independent artist.
          </p>
        </header>
        <button
          onClick={() => login()}
          className="w-full sm:w-auto rounded-md bg-fg px-4 py-3 text-sm font-medium text-bg transition-colors hover:bg-fg-muted min-h-[44px]"
        >
          Sign In to Submit
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-fg">
          Submit a Prediction
        </h1>
        <p className="mt-2 text-sm sm:text-base text-fg-muted leading-relaxed">
          Predict whether an independent artist will hit a stream threshold
          within a given time horizon.
        </p>
      </header>

      {walletAddress && (
        <div className="mb-8 rounded-md border border-border bg-bg-raised px-4 py-3 text-sm text-fg-muted">
          <div>Predicting as:</div>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(walletAddress)}
            title="Click to copy"
            className="mt-1 block w-full select-all break-all text-left font-mono text-xs font-medium text-fg hover:text-accent sm:text-sm"
          >
            {walletAddress}
          </button>
          <p className="mt-1 text-xs text-fg-faint">
            Stake-to-predict is x402-gated — this wallet needs Base Sepolia USDC
            to cover the fee. (Click the address to copy; fund at
            faucet.circle.com.)
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SoundCloud URL */}
        <Field
          label="SoundCloud URL"
          error={fieldErrors.url}
          hint="Paste a link to a SoundCloud track"
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://soundcloud.com/artist-name/track-name"
            className={inputClass(fieldErrors.url)}
            required
          />
        </Field>

        {/* Artist Preview */}
        {debouncedUrl && (
          <div className="mt-2">
            <TrackPreview url={debouncedUrl} />
          </div>
        )}

        {/* Stream Threshold */}
        <Field
          label="Stream Threshold"
          error={fieldErrors.streamThreshold}
          hint="Plays this track must reach within the horizon"
        >
          <input
            type="number"
            min={1}
            value={streamThreshold}
            onChange={(e) => setStreamThreshold(e.target.value)}
            placeholder="e.g. 50000"
            className={inputClass(fieldErrors.streamThreshold)}
            required
          />
        </Field>

        {/* Predicted Outcome */}
        <Field
          label="Your Prediction"
          error={fieldErrors.predictedOutcome}
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => setPredictedOutcome("yes")}
              className={toggleClass(predictedOutcome === "yes")}
            >
              Yes &mdash; will hit threshold
            </button>
            <button
              type="button"
              onClick={() => setPredictedOutcome("no")}
              className={toggleClass(predictedOutcome === "no")}
            >
              No &mdash; won&apos;t hit threshold
            </button>
          </div>
        </Field>

        {/* Horizon */}
        <Field label="Time Horizon" error={fieldErrors.horizon}>
          <div className="flex flex-wrap gap-2">
            {HORIZONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={toggleClass(horizon === h)}
              >
                {h}
              </button>
            ))}
          </div>
        </Field>

        {/* Form-level error */}
        {formError && (
          <div className="rounded-lg border border-error-border bg-error-bg p-4 text-sm text-error-fg">
            {formError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-fg px-4 py-3 text-sm font-medium text-bg transition-colors hover:bg-fg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Submitting..." : "Submit Prediction"}
        </button>
        <p className="text-center text-xs text-fg-faint">
          Submitting stakes a small fee (testnet USDC via x402) — this is the
          anti-spam tax that keeps the leaderboard credible.
        </p>
      </form>
    </main>
  );
}

/* -- Helpers ------------------------------------------------- */

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-fg">
        {label}
      </label>
      {hint && (
        <p className="mt-1 text-xs text-fg-faint">{hint}</p>
      )}
      <div className="mt-2">{children}</div>
      {error &&
        error.map((msg) => (
          <p key={msg} className="mt-1 text-xs text-error-fg">
            {msg}
          </p>
        ))}
    </div>
  );
}

function inputClass(error?: string[]): string {
  const base =
    "w-full rounded-md border bg-bg-raised px-3 py-2 text-sm text-fg placeholder-fg-faint focus:outline-none focus:ring-2 focus:ring-accent";
  return error && error.length > 0
    ? `${base} border-error-border focus:ring-error-fg`
    : `${base} border-border`;
}

function toggleClass(active: boolean): string {
  const base =
    "rounded-md px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center justify-center";
  return active
    ? `${base} bg-fg text-bg`
    : `${base} bg-bg-elevated text-fg-muted hover:text-fg hover:bg-bg-raised`;
}
