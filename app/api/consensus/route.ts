import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { eq } from "drizzle-orm";
import { db } from "@/app/db/client";
import { predictions, tastemakers, artists } from "@/app/db/schema";
import { weightedConsensus } from "@/app/domains/resolution/service/reputation";
import { server, accepts } from "@/app/lib/x402-server";

type BinaryOutcome = "yes" | "no";

async function handler(request: NextRequest): Promise<NextResponse> {
  const artistId = request.nextUrl.searchParams.get("artistId");
  if (!artistId) {
    return NextResponse.json(
      { error: "Missing required query param: artistId" },
      { status: 400 }
    );
  }

  const rows = await db
    .select({
      reputationScore: tastemakers.reputationScore,
      predictedOutcome: predictions.predictedOutcome,
      username: artists.username,
    })
    .from(predictions)
    .innerJoin(tastemakers, eq(predictions.tastemakerId, tastemakers.id))
    .innerJoin(artists, eq(predictions.artistId, artists.id))
    .where(eq(predictions.artistId, artistId));

  const preds = rows.map((r) => ({
    reputation_score: r.reputationScore ?? 1.0,
    predicted_outcome: r.predictedOutcome as BinaryOutcome,
  }));

  const consensus = weightedConsensus(preds);
  const username = rows[0]?.username ?? null;

  return NextResponse.json({
    artistId,
    consensus,
    sampleSize: preds.length,
    artist: { username },
  });
}

export const GET = withX402(
  handler,
  {
    accepts: accepts("$0.01"),
    description:
      "Reputation-weighted consensus signal for a single artist (0..1).",
    mimeType: "application/json",
  },
  server
);
