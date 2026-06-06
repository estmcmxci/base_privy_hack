"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider as PrivySDKProvider } from "@privy-io/react-auth";
import { getPrivyAppId, getPrivyClientId } from "@/app/config/privy";

const queryClient = new QueryClient();

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivySDKProvider
        appId={getPrivyAppId()}
        clientId={getPrivyClientId()}
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
