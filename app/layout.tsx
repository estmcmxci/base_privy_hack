import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Tastemaker — spike',
  description: 'Privy + Base Account seam-validation spike',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
