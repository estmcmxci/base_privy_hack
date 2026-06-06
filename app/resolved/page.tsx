import { getFeedItems } from "@/app/domains/feed/service/feed-service";
import { FeedCard } from "@/app/components/feed-card";

export const dynamic = "force-dynamic";

export default async function ResolvedPage() {
  const items = await getFeedItems({ outcome: "resolved" });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-fg">
          Resolved
        </h1>
        <p className="mt-2 text-base text-fg-muted leading-relaxed">
          Predictions that have been resolved against real SoundCloud data
        </p>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-fg-faint">
          No resolved predictions yet. Predictions resolve automatically when
          their time horizon expires.
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
    </main>
  );
}
