"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function AuthButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  if (!authenticated) {
    return (
      <button
        onClick={() => login()}
        disabled={!ready}
        className="rounded-md bg-fg px-3.5 py-2.5 sm:py-1.5 text-sm font-medium text-bg transition-colors hover:bg-fg-muted min-h-[44px] inline-flex items-center disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sign In
      </button>
    );
  }

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
  const displayAddress = embeddedWallet?.address
    ? truncateAddress(embeddedWallet.address)
    : "Connected";

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <span className="hidden sm:inline text-sm font-mono text-fg-muted">{displayAddress}</span>
      <button
        onClick={() => logout()}
        className="rounded-md border border-border px-3 py-2.5 sm:py-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-border-hover hover:text-fg min-h-[44px] inline-flex items-center"
      >
        Sign Out
      </button>
    </div>
  );
}
