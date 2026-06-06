import type { Metadata } from "next";
import { getFeedItems } from "@/app/domains/feed/service/feed-service";
import { FeedCard } from "@/app/components/feed-card";
import { LandingDateline } from "@/app/components/landing-dateline";
import { LandingHero } from "@/app/components/landing-hero";
import { LandingPrimer } from "@/app/components/landing-primer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scenius — Reputation-weighted predictions on independent music",
  description:
    "Tastemakers predict breakout events on SoundCloud tracks. Accurate predictors compound reputation. Attested onchain via EAS.",
  openGraph: {
    title: "Scenius — Reputation-weighted predictions on independent music",
    description:
      "Tastemakers predict breakout events on SoundCloud tracks. Accurate predictors compound reputation. Attested onchain via EAS.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Scenius — Reputation-weighted predictions on independent music",
    description:
      "Tastemakers predict breakout events on SoundCloud tracks. Accurate predictors compound reputation. Attested onchain via EAS.",
  },
};

export default async function Home() {
  const items = await getFeedItems({ outcome: "all" });
  // "Attested" must reflect actual onchain state. Filtering on outcome alone
  // over-reports when a resolution succeeded but the EAS write transiently
  // failed (see the retryUnattested flow in the resolution service).
  const attestedCount = items.filter(
    (i) => i.easAttestationUid !== null
  ).length;
  const pendingCount = items.filter((i) => i.outcome === "pending").length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Scenius
        </h1>
        <p className="mt-2 text-base leading-relaxed text-fg-muted">
          Reputation-weighted predictions on independent music
        </p>
      </header>

      <LandingDateline
        attestedCount={attestedCount}
        pendingCount={pendingCount}
      />
      <LandingHero />
      <LandingPrimer />

      <section aria-labelledby="feed-label">
        <h2
          id="feed-label"
          className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-faint"
        >
          <span className="h-px w-6 bg-accent" aria-hidden />
          Part II — The feed
          <span className="ml-auto tabular-nums text-fg-muted">
            {items.length} {items.length === 1 ? "entry" : "entries"}
          </span>
        </h2>

        <div className="mt-6 sm:mt-8">
          {items.length === 0 ? (
            <p className="text-sm text-fg-faint">
              No predictions yet. Seed the database with{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 text-xs text-fg-muted">
                pnpm cli seed
              </code>
            </p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.predictionId}>
                  <FeedCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
