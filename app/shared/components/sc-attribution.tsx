/**
 * Shared SoundCloud attribution component.
 *
 * SoundCloud ToS requires attribution on every surface displaying SC data.
 * Use this component instead of hand-rolling attribution text.
 *
 * Renders either an <a> tag (default) or a <span> (when nested inside
 * another link, e.g. feed cards) to avoid invalid nested anchors.
 */

type Props = {
  /** SoundCloud permalink URL for the track or artist. */
  permalinkUrl?: string | null;
  /** Display label — defaults to "SoundCloud". */
  label?: string;
  /**
   * When true, renders a <span> instead of an <a> to avoid nested
   * anchor elements (e.g. inside a card wrapped in <Link>).
   */
  asSpan?: boolean;
  /** Optional extra text appended after the attribution. */
  suffix?: string;
};

export function ScAttribution({
  permalinkUrl,
  label = "SoundCloud",
  asSpan = false,
  suffix,
}: Props) {
  const linkClasses = "underline decoration-fg-faint/40 hover:text-fg-muted transition-colors";

  return (
    <span className="text-xs text-fg-faint">
      {"via "}
      {asSpan || !permalinkUrl ? (
        <span className={asSpan ? "" : ""}>{label}</span>
      ) : (
        <a
          href={permalinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
        >
          {label}
        </a>
      )}
      {suffix && <>{suffix}</>}
    </span>
  );
}
