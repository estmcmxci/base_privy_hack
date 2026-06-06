import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/app/db/client";
import { tastemakers } from "@/app/db/schema";

// FREE endpoint — no x402 gate. Tastemaker reputation ranking.
export async function GET(): Promise<NextResponse> {
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

  return NextResponse.json({ leaderboard: rows });
}
