/**
 * Format a wallet address for display.
 * Returns ENS name if available, otherwise a truncated address
 * (e.g. "0xeb0A...5022").
 */
export function formatAddress(
  address: string,
  ensName?: string | null
): string {
  if (ensName) {
    return ensName;
  }

  if (address.length <= 10) {
    return address;
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
