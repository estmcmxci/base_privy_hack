/**
 * Shared x402 resource-server config.
 *
 * A single x402ResourceServer singleton is constructed here and imported by
 * every paid route handler. Registering the EVM "exact" scheme for all
 * eip155 networks lets the route-level `accepts` config pick the concrete
 * network (Base Sepolia, eip155:84532) and price.
 */

// VERIFY: subpath imports confirmed against @x402/* v2.14.0 package "exports"
//   - @x402/core/server      -> x402ResourceServer, HTTPFacilitatorClient
//   - @x402/evm/exact/server -> ExactEvmScheme
// If a future bundler can't resolve these, fall back to the root exports
// ('@x402/core' / '@x402/evm').
import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

/** Base Sepolia (CAIP-2). */
export const X402_NETWORK = "eip155:84532" as const;

/**
 * Resource-server singleton. Talks to the public x402 facilitator and knows
 * how to verify/settle EVM "exact" payments on any eip155 chain.
 */
export const server = new x402ResourceServer(
  new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" })
);
server.register("eip155:*", new ExactEvmScheme());

/**
 * Build the `accepts` array for a paid route at the given price.
 * Reads the receiving address from X402_PAY_TO.
 */
export function accepts(price: string) {
  return [
    {
      scheme: "exact",
      price,
      network: X402_NETWORK,
      payTo: process.env.X402_PAY_TO!,
    },
  ];
}
