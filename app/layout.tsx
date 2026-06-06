import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/app/components/nav";
import { PrivyProvider } from "@/app/providers/privy-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Scenius",
    template: "%s | Scenius",
  },
  description: "Reputation-weighted prediction market for independent music",
  openGraph: {
    type: "website",
    siteName: "Scenius",
    title: "Scenius",
    description:
      "Reputation-weighted predictions on independent music. Attested onchain via EAS.",
  },
  twitter: {
    card: "summary",
    title: "Scenius",
    description:
      "Reputation-weighted predictions on independent music. Attested onchain via EAS.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased overflow-x-hidden">
        <PrivyProvider>
          <Nav />
          {children}
          <footer className="border-t border-border mt-12">
            <div className="mx-auto max-w-2xl px-4 py-4 flex justify-center">
              <Link
                href="/privacy"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </footer>
        </PrivyProvider>
      </body>
    </html>
  );
}
