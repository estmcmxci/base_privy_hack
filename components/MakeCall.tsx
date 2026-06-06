'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * PRD §6 step 3 (timestamp predictions) — STUB.
 *
 * Deliberately NOT scored, NOT persisted, NOT a real prediction primitive — those
 * are open product questions (PRD §7, §11). This only proves the embedded wallet
 * can sign a timestamped message, which is the shared substrate every candidate
 * primitive (binary / ranked / threshold) will route through.
 */
export function MakeCall() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [sig, setSig] = useState<string | null>(null);

  const embedded = wallets.find((w) => w.walletClientType === 'privy');

  const handleCall = async () => {
    if (!embedded) return;
    // Note: client clock — a real call must be server-timestamped (§7 timing axis).
    const payload = {
      kind: 'tastemaker-call.v0',
      artist: 'STUB_ARTIST',
      at: new Date().toISOString(),
    };
    const provider = await embedded.getEthereumProvider();
    const signature = (await provider.request({
      method: 'personal_sign',
      params: [JSON.stringify(payload), embedded.address],
    })) as string;
    setSig(signature);
  };

  if (!authenticated) return null;

  return (
    <div>
      <button onClick={handleCall} disabled={!embedded}>
        Make a call (sign timestamp — stub)
      </button>
      {sig && (
        <p style={{ wordBreak: 'break-all' }}>
          Signed: <code>{sig.slice(0, 24)}…</code>
        </p>
      )}
    </div>
  );
}
