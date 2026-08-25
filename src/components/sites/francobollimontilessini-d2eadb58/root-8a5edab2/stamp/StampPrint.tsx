// Extracted from francobollimontilessini.com by scripts/extract-stamp-svgs.mjs.
// Generated file — re-run the script rather than editing the path data by hand.

/**
 * The stamp's printed layer: the fixed "ITALIA" wordmark and "B" badge, always dust,
 * plus the "Monti Lessini" caption, which inherits `currentColor` so each poster can
 * tint it — dust on most, a slate blue on the pale ones.
 *
 * The tint still reaches the caption through `<use>`: `currentColor` inside a referenced
 * subtree resolves against the colour inherited at the reference, which is this `<svg>`
 * and the `captionClass` on it.
 */
export function StampPrint({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 968.2 1292"
      aria-hidden="true"
      className={className}
    >
      <use href="#ml-stamp-print" />
    </svg>
  );
}
