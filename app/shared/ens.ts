import { JsonRpcProvider } from "ethers";

const ENS_RPC_URL = process.env.ENS_RPC_URL ?? "https://eth.llamarpc.com";

const ENS_CACHE = new Map<string, string | null>();

let provider: JsonRpcProvider | null = null;

function getProvider(): JsonRpcProvider {
  if (!provider) {
    provider = new JsonRpcProvider(ENS_RPC_URL);
  }
  return provider;
}

/**
 * Resolve an Ethereum address to its ENS name.
 * Returns null if no ENS name is set or resolution fails.
 * Successful lookups are cached. Failures are not cached so they can be retried.
 */
export async function resolveEnsName(
  address: string
): Promise<string | null> {
  if (ENS_CACHE.has(address)) {
    return ENS_CACHE.get(address) ?? null;
  }

  try {
    const name = await getProvider().lookupAddress(address);
    ENS_CACHE.set(address, name);
    return name;
  } catch {
    // Don't cache failures — allow retry on next request
    return null;
  }
}
