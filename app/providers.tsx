'use client';

import { PrivyProvider } from '@privy-io/react-auth';

/**
 * Privy is the auth + embedded-wallet layer (PRD §10). createOnLogin provisions an
 * embedded Ethereum wallet for players who don't already have one, so a "call" can
 * be signed without the user holding a pre-existing wallet.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID as string}
      config={{
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
