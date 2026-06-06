"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider as PrivySDKProvider } from "@privy-io/react-auth";

const queryClient = new QueryClient();

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
// PrivyProvider throws on an invalid app ID, which crashes static prerender
// (e.g. /_not-found) when keys aren't set yet. Treat unset/placeholder as
// "not configured" so builds/previews succeed; a real key enables full auth.
const configured = Boolean(appId && !appId.includes("FILL_ME"));

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  if (!configured) {
    if (typeof window !== "undefined") {
      console.warn(
        "[privy] NEXT_PUBLIC_PRIVY_APP_ID not set — auth disabled. Set it in .env.local / Vercel."
      );
    }
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PrivySDKProvider
        appId={appId!}
        clientId={clientId}
        config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
        }}>
        {children}
      </PrivySDKProvider>
    </QueryClientProvider>
  );
}
