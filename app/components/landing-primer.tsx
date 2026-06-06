const PROOF_TX =
  "0x895d09081131b9794c82d8601d26cbb66d83145a22a438002ab908063fbe7c92";

const STEPS: ReadonlyArray<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Stake a call",
    body:
      "A human picks an emerging SoundCloud track and predicts whether it clears a play threshold by a deadline. Making the call costs a small USDC stake, paid over x402 — skin in the game, and the spam tax that keeps the board honest.",
  },
  {
    n: "02",
    title: "Real data resolves it",
    body:
      "Play counts are snapshotted at call time and rechecked by a weekly cron. Right or wrong is settled against live SoundCloud numbers — not opinion, not an opaque model.",
  },
  {
    n: "03",
    title: "Reputation compounds",
    body:
      "Each resolved call updates an exponential moving average of Brier score. Good calls compound; luck decays. Every outcome is attested onchain via EAS on Base.",
  },
  {
    n: "04",
    title: "The signal is the asset",
    body:
      "Weight every open call by its caller's reputation and you get a credibility signal per artist — the read of the people who have actually been right before.",
  },
  {
    n: "05",
    title: "Agents pay to read it",
    body:
      "That signal is a metered API. Autonomous agents pay per query in USDC over x402 to pull the watchlist. Humans supply the taste; machines pay to consume it — and never make a call themselves.",
  },
];

export function LandingPrimer() {
  return (
    <section className="mb-14 sm:mb-20" aria-labelledby="primer-label">
      <h2
        id="primer-label"
        className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-faint"
      >
        <span className="h-px w-6 bg-accent" aria-hidden />
        Part I — The loop
      </h2>

      <ol className="mt-6 sm:mt-8 border-t border-border">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="flex gap-5 sm:gap-6 border-b border-border py-5 sm:py-6"
          >
            <span
              aria-hidden
              className="mt-0.5 shrink-0 font-serif text-3xl sm:text-4xl italic leading-none text-accent tabular-nums"
            >
              {step.n}
            </span>
            <div className="min-w-0">
              <h3 className="font-serif text-base sm:text-lg font-bold text-fg">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm sm:text-base leading-relaxed text-fg-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Live proof — the demand side, settled on-chain */}
      <aside className="mt-12 sm:mt-16 rounded-lg border border-border bg-bg-raised p-5 sm:p-6">
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-fg-faint">
          <span className="h-px w-6 bg-accent" aria-hidden />
          Live on Base Sepolia
        </p>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-fg-muted">
          A Pinata-hosted agent paid{" "}
          <span className="font-medium text-fg">0.05 USDC</span> over x402 to
          read this signal and return a watchlist — supply met demand, settled
          on-chain.
        </p>
        <a
          href={`https://sepolia.basescan.org/tx/${PROOF_TX}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block break-all font-mono text-xs text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
        >
          {PROOF_TX}
        </a>
      </aside>

      <aside className="mt-14 sm:mt-20 text-center">
        <p className="mx-auto max-w-[34ch] font-serif text-lg italic leading-snug text-fg-muted sm:text-xl">
          Humans supply the taste. <br className="hidden sm:inline" />
          Machines pay to read it.
        </p>
      </aside>
    </section>
  );
}
