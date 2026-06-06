import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/app/db/client";
import { tastemakers } from "@/app/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard — Scenius",
  description: "Tastemakers ranked by reputation.",
};

function truncate(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default async function LeaderboardPage() {
  const rows = await db
    .select({
      id: tastemakers.id,
      displayName: tastemakers.displayName,
      walletAddress: tastemakers.walletAddress,
      reputationScore: tastemakers.reputationScore,
      totalPredictions: tastemakers.totalPredictions,
    })
    .from(tastemakers)
    .orderBy(desc(tastemakers.reputationScore))
    .limit(50);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <header className="mb-6 sm:mb-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mt-2 text-base leading-relaxed text-fg-muted">
          Tastemakers ranked by reputation
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-sm text-fg-faint">No tastemakers yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-faint">
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Tastemaker</th>
                <th className="px-4 py-3 text-right font-semibold">Reputation</th>
                <th className="px-4 py-3 text-right font-semibold">Predictions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const name =
                  row.displayName ??
                  (row.walletAddress ? truncate(row.walletAddress) : "Anonymous");
                return (
                  <tr
                    key={row.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-4 py-3 tabular-nums text-fg-muted">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 text-fg">{name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg">
                      {(row.reputationScore ?? 0).toFixed(3)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg-muted">
                      {row.totalPredictions ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
