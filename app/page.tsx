import { LoginButton } from '@/components/LoginButton';
import { SignInWithBase } from '@/components/SignInWithBase';
import { MakeCall } from '@/components/MakeCall';

export default function Home() {
  return (
    <main style={{ maxWidth: 560, margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Tastemaker — seam spike</h1>
      <p style={{ color: '#666' }}>
        Validates the Privy auth + Base Account onchain seam (PRD §10 / §13.A). No
        scoring, no DB — the product layer is still open.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2>1. Login (Privy)</h2>
        <LoginButton />
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>2. Sign in with Base</h2>
        <SignInWithBase />
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>3. Make a call (stub)</h2>
        <MakeCall />
      </section>
    </main>
  );
}
