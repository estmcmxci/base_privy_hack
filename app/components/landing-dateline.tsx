type Props = {
  attestedCount: number;
  pendingCount: number;
};

export function LandingDateline({ attestedCount, pendingCount }: Props) {
  return (
    <div className="mb-10 sm:mb-14">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-fg-faint">
        <span>Est. 2026</span>
        <span aria-hidden>·</span>
        <span>
          <span className="tabular-nums text-fg-muted">{attestedCount}</span>{" "}
          attested
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="tabular-nums text-fg-muted">{pendingCount}</span>{" "}
          open calls
        </span>
      </p>
      <hr className="mt-3 h-px w-16 border-0 bg-accent" aria-hidden />
    </div>
  );
}
