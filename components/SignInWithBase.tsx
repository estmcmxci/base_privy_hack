'use client';

import { useState } from 'react';
import { useBaseAccountSdk } from '@privy-io/react-auth';
import { SignInWithBaseButton } from '@base-org/account-ui/react';

/**
 * THE SEAM THIS SPIKE EXISTS TO VALIDATE (PRD §13.A caveat).
 *
 * The Base↔Privy integration doc page is ~8 months old; this verifies that
 * `useBaseAccountSdk()` still exists in @privy-io/react-auth@3.29.2 and that the
 * SIWE-over-wallet_connect flow it documents still works.
 *
 * Backend verification (/api/auth/nonce, /api/auth/verify) is stubbed — the nonce
 * route returns a random value and verify echoes the address. Real SIWE signature
 * verification is a TODO before this is anything but a spike.
 */
const BASE_CHAIN_ID = '0x2105'; // Base mainnet (8453)

export function SignInWithBase() {
  const { baseAccountSdk } = useBaseAccountSdk();
  const [result, setResult] = useState<string | null>(null);

  const provider = baseAccountSdk?.getProvider();

  const handleSignIn = async () => {
    if (!provider) {
      setResult('Base Account SDK not available (check useBaseAccountSdk wiring).');
      return;
    }
    try {
      const { nonce } = await (await fetch('/api/auth/nonce')).json();

      const response = (await provider.request({
        method: 'wallet_connect',
        params: [
          {
            version: '1',
            capabilities: { signInWithEthereum: { nonce, chainId: BASE_CHAIN_ID } },
          },
        ],
      })) as {
        accounts: {
          address: string;
          capabilities: { signInWithEthereum: { signature: string; message: string } };
        }[];
      };

      const { address } = response.accounts[0];
      const { message, signature } = response.accounts[0].capabilities.signInWithEthereum;

      const verify = await (
        await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, message, signature }),
        })
      ).json();

      setResult(`✅ Signed in with Base: ${verify.address}`);
    } catch (error) {
      console.error('Sign in with Base failed:', error);
      setResult(`❌ ${(error as Error).message}`);
    }
  };

  return (
    <div>
      <SignInWithBaseButton onClick={handleSignIn} />
      {result && <p>{result}</p>}
    </div>
  );
}
