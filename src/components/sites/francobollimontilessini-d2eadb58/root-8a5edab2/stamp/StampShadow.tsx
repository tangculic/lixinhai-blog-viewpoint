// Extracted from francobollimontilessini.com by scripts/extract-stamp-svgs.mjs.
// Generated file — re-run the script rather than editing the path data by hand.

/**
 * Soft blurred shadow cast behind a stamp.
 *
 * The blur is applied out here rather than inside the shared definition, so the filter
 * reference stays in ordinary document scope and never has to resolve out of a `<use>`
 * subtree. One filter serves every stamp — they are all the same blur.
 */
export function StampShadow({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 661"
      fill="#020202"
      aria-hidden="true"
      className={className}
    >
      <g opacity=".2" filter="url(#ml-stamp-blur)">
        <use href="#ml-stamp-shadow" />
      </g>
    </svg>
  );
}
