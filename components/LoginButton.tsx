'use client';

import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * PRD §6 step 1 (login) + the embedded wallet that will sign calls (step 3).
 */
export function LoginButton() {
  const { authenticated, logout } = usePrivy();
  const { login } = useLogin({
    onError: (error) => console.error('Login error:', error),
    onComplete: ({ user }) => console.log('Logged in:', user.id),
  });
  const { wallets } = useWallets();
  const embedded = wallets.find((w) => w.walletClientType === 'privy');

  if (authenticated) {
    return (
      <div>
        <p>
          Wallet:{' '}
          <code>{embedded?.address ?? '(provisioning…)'}</code>
        </p>
        <button onClick={logout}>Log out</button>
      </div>
    );
  }

  return <button onClick={login}>Log in with Privy</button>;
}
