const STEPS: ReadonlyArray<{ n: string; title: string; body: string }> = [
  {
    n: "01",
    title: "Real data in",
    body:
      "Every prediction anchors to a live SoundCloud track. Play counts are snapshotted at prediction time and refreshed by a weekly cron. No synthetic metrics.",
  },
  {
    n: "02",
    title: "Proper scoring rule",
    body:
      "Reputation is an exponential moving average of Brier score across every resolved prediction. Accurate calls compound; wrong ones decay. No AI, no opaque model.",
  },
  {
    n: "03",
    title: "Portable onchain",
    body:
      "Every resolved prediction writes an EAS attestation on Base Sepolia. The reputation graph lives onchain — fork it, weight your own feed, build discovery tools on top.",
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
        Part I — How it works
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

      <aside className="mt-14 sm:mt-20 text-center">
        <p className="mx-auto max-w-[32ch] font-serif text-lg italic leading-snug text-fg-muted sm:text-xl">
          The reputation graph is portable. <br className="hidden sm:inline" />
          That&rsquo;s the point.
        </p>
      </aside>
    </section>
  );
}
