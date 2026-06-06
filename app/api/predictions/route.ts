import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { PrivyClient } from "@privy-io/server-auth";
import { server, accepts } from "@/app/lib/x402-server";
import { createPredictionSchema } from "@/app/domains/predictions/types/create-prediction";
import { submitPrediction } from "@/app/domains/predictions/service/prediction-service";
import { findOrCreateByWallet } from "@/app/domains/tastemakers/repo/tastemaker-repo";

async function verifyPrivyToken(token: string): Promise<boolean> {
  try {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) return false;

    const privy = new PrivyClient(appId, appSecret);
    await privy.verifyAuthToken(token);
    return true;
  } catch {
    return false;
  }
}

// Stake-to-predict: making a call costs a flat x402 USDC tax (Base Sepolia). This
// is the sybil tax + the human-facing half of the x402 bounty. The frontend pays
// via Privy's useX402Fetch (see app/submit/page.tsx).
const handler = async (request: NextRequest): Promise<NextResponse> => {
  const body = await request.json().catch(() => null);
  const parsed = createPredictionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;

  let tastemakerId = data.tastemakerId;
  if (!tastemakerId && data.walletAddress) {
    // Verify the user is authenticated via Privy access token if provided.
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;
    if (token) {
      const valid = await verifyPrivyToken(token);
      if (!valid) {
        return NextResponse.json(
          { error: "Wallet verification failed" },
          { status: 401 }
        );
      }
    }

    const tastemaker = await findOrCreateByWallet(data.walletAddress);
    tastemakerId = tastemaker.id;
  }

  if (!tastemakerId) {
    return NextResponse.json(
      { error: "Could not resolve tastemaker identity" },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await submitPrediction({ ...data, tastemakerId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("SoundCloud") || message.includes("SC API") || message.includes("SC token")) {
      return NextResponse.json(
        { error: "Failed to fetch from SoundCloud", details: message },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    predictionId: result.predictionId,
    url: `/predictions/${result.predictionId}`,
    artist: result.artist,
    snapshot: result.totals,
  });
};

export const POST = withX402(
  handler,
  {
    accepts: accepts("$0.001"),
    description: "Stake to submit a tastemaker prediction",
    mimeType: "application/json",
  },
  server
);
