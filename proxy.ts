import { paymentMiddleware } from "x402-next";

/**
 * Human-facing x402 gate (stake-to-predict).
 *
 * Next 16 `proxy` convention (replaces `middleware`): runs on the Node runtime,
 * so the heavy x402-next/viem/solana deps aren't subject to the 1 MB Edge limit.
 *
 * Privy's browser `useX402Fetch` speaks canonical x402 v0.7 (reads `accepts`
 * from the body, expects `maxAmountRequired`). The agent routes use @x402/next
 * v2, which the agent CLI tolerates but the browser does not — so we gate the
 * one human route, POST /api/predictions, with the version-matched v0.7
 * paymentMiddleware. Default facilitator (x402.org/facilitator) settles on
 * Base Sepolia.
 */
export const proxy = paymentMiddleware(
  process.env.X402_PAY_TO as `0x${string}`,
  {
    "/api/predictions": {
      price: "$0.001",
      network: "base-sepolia",
      config: { description: "Stake to submit a tastemaker prediction" },
    },
  },
);

export const config = {
  matcher: ["/api/predictions"],
};
