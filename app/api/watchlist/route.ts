import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions, tastemakers, artists } from "@/app/db/schema";
import { weightedConsensus } from "@/app/domains/resolution/service/reputation";
import { server, accepts } from "@/app/lib/x402-server";

type BinaryOutcome = "yes" | "no";

interface ArtistAccumulator {
  artistId: string;
  username: string;
  preds: { reputation_score: number; predicted_outcome: BinaryOutcome }[];
}

async function handler(_request: NextRequest): Promise<NextResponse> {
  const rows = await db
    .select({
      artistId: predictions.artistId,
      username: artists.username,
      reputationScore: tastemakers.reputationScore,
      predictedOutcome: predictions.predictedOutcome,
    })
    .from(predictions)
    .innerJoin(tastemakers, eq(predictions.tastemakerId, tastemakers.id))
    .innerJoin(artists, eq(predictions.artistId, artists.id));

  const byArtist = new Map<string, ArtistAccumulator>();
  for (const r of rows) {
    let acc = byArtist.get(r.artistId);
    if (!acc) {
      acc = { artistId: r.artistId, username: r.username, preds: [] };
      byArtist.set(r.artistId, acc);
    }
    acc.preds.push({
      reputation_score: r.reputationScore ?? 1.0,
      predicted_outcome: r.predictedOutcome as BinaryOutcome,
    });
  }

  const watchlist = Array.from(byArtist.values())
    .map((a) => ({
      artistId: a.artistId,
      username: a.username,
      consensus: weightedConsensus(a.preds),
      sampleSize: a.preds.length,
    }))
    .sort((a, b) => b.consensus - a.consensus)
    .slice(0, 20);

  return NextResponse.json({ watchlist });
}

export const GET = withX402(
  handler,
  {
    accepts: accepts("$0.05"),
    description:
      "Reputation-weighted watchlist: top 20 artists ranked by consensus signal.",
    mimeType: "application/json",
  },
  server
);
