import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Scenius",
  description: "How Scenius collects, stores, and uses your data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: April 8, 2026</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            What Scenius Is
          </h2>
          <p className="mt-2">
            Scenius is a reputation-weighted prediction market for independent
            music. Tastemakers predict binary breakout events on real SoundCloud
            data. Accurate predictors compound reputation via a proper scoring
            rule. Resolved predictions are attested onchain via the Ethereum
            Attestation Service (EAS).
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Data We Collect
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Wallet address</strong> — created and managed through Privy
              authentication.
            </li>
            <li>
              <strong>Prediction history</strong> — the predictions you make,
              their outcomes, and your resulting reputation score.
            </li>
            <li>
              <strong>SoundCloud track metrics</strong> — publicly available data
              (play counts, followers, reposts) sourced from the SoundCloud API
              and attributed to SoundCloud and the respective artist.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            How Data Is Stored
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase (Postgres)</strong> — application data including
              predictions, snapshots, and tastemaker profiles.
            </li>
            <li>
              <strong>Ethereum Attestation Service (EAS) on Base</strong> —
              resolved prediction attestations are written onchain. These
              attestations are public and permanent by design.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Third-Party Services
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>SoundCloud API</strong> — market data for tracks and
              artists.
            </li>
            <li>
              <strong>Privy</strong> — authentication and wallet infrastructure.
            </li>
            <li>
              <strong>EAS / Base network</strong> — onchain attestations for
              resolved predictions.
            </li>
            <li>
              <strong>Vercel</strong> — hosting and deployment.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Data Retention
          </h2>
          <p className="mt-2">
            Prediction data and attestations are permanent by design. Onchain
            attestations written to EAS are immutable and cannot be deleted.
            Off-chain application data in Supabase is retained for the lifetime
            of the service.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">Your Rights</h2>
          <p className="mt-2">
            You may request information about the data we hold on you or ask
            questions about this policy at any time. Note that onchain
            attestations cannot be modified or removed once written to the Base
            network.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900">Contact</h2>
          <p className="mt-2">
            For questions or concerns about this privacy policy, reach out to{" "}
            <a
              href="mailto:m@oakgroup.co"
              className="text-gray-900 underline hover:text-gray-600"
            >
              m@oakgroup.co
            </a>
            .
          </p>
        </div>
      </section>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Back to feed
        </Link>
      </div>
    </main>
  );
}
