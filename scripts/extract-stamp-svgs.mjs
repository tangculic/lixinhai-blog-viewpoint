/**
 * Regenerates the stamp SVG components from the live target site.
 *
 *   node scripts/extract-stamp-svgs.mjs
 *
 * The three stamp layers (perforated frame, printed lettering, cast shadow) are inline
 * SVG in francobollimontilessini.com's server-rendered homepage, not standalone assets.
 * This fetches that HTML, lifts one instance of each, and rewrites them as React
 * components — keeping ~39KB of path data out of any editor or agent context.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = "https://www.francobollimontilessini.com/";
const OUT = path.join(
  ROOT,
  "src/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp",
);

const LAYERS = [
  { name: "frame", marker: "gsap:frame/source" },
  { name: "stamp", marker: "gsap:stamp/source" },
  { name: "shadow", marker: "gsap:shadow/source" },
];

/** HTML attribute names that JSX spells differently. */
const ATTR_MAP = {
  class: "className",
  "xml:space": "xmlSpace",
  "color-interpolation-filters": "colorInterpolationFilters",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
};

/** The full `<svg>…</svg>` whose opening tag carries `marker`. */
function extract(html, marker) {
  const at = html.indexOf(marker);
  if (at === -1) throw new Error(`marker not found: ${marker}`);
  const start = html.lastIndexOf("<svg", at);
  if (start === -1) throw new Error(`no <svg> before ${marker}`);

  let depth = 0;
  let i = start;
  for (;;) {
    const open = html.indexOf("<svg", i);
    const close = html.indexOf("</svg>", i);
    if (close === -1) throw new Error(`unterminated svg for ${marker}`);
    if (open !== -1 && open < close) {
      depth++;
      i = open + 4;
    } else {
      depth--;
      i = close + 6;
      if (depth === 0) return html.slice(start, i);
    }
  }
}

const inner = (svg) => svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

function toJsx(markup) {
  let out = markup;
  for (const [from, to] of Object.entries(ATTR_MAP)) {
    out = out.replaceAll(new RegExp(`(\\s)${from}=`, "g"), `$1${to}=`);
  }
  // The target's Flip bookkeeping; our transition measures its own geometry.
  return out.replace(/\sdata-flip-id="[^"]*"/g, "");
}

const BANNER = `// Extracted from francobollimontilessini.com by scripts/extract-stamp-svgs.mjs.
// Generated file — re-run the script rather than editing the path data by hand.`;

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
const html = await response.text();

const svg = Object.fromEntries(
  LAYERS.map(({ name, marker }) => [name, toJsx(inner(extract(html, marker)))]),
);

fs.mkdirSync(OUT, { recursive: true });

fs.writeFileSync(
  path.join(OUT, "StampFrame.tsx"),
  `${BANNER}

/** The cream die-cut stamp border. Extends past the card, so size it at 124% and inset -12%. */
export function StampFrame({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 1600"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      ${svg.frame}
    </svg>
  );
}
`,
);

const groups = svg.stamp.match(/<g>[\s\S]*?<\/g>/g);
if (!groups || groups.length !== 2) {
  throw new Error(`expected 2 groups in the print layer, got ${groups?.length ?? 0}`);
}

fs.writeFileSync(
  path.join(OUT, "StampPrint.tsx"),
  `${BANNER}

/**
 * The stamp's printed layer: the fixed "ITALIA" wordmark and "B" badge, always dust,
 * plus the "Monti Lessini" caption, which inherits \`currentColor\` so each poster can
 * tint it — dust on most, a slate blue on the pale ones.
 */
export function StampPrint({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 968.2 1292"
      aria-hidden="true"
      className={className}
    >
      ${groups[0]}
      ${groups[1]}
    </svg>
  );
}
`,
);

const shadowBody = svg.shadow
  .replace(/id="blur"/, "id={blurId}")
  .replace(/filter="url\(#blur\)"/, "filter={`url(#${blurId})`}");

fs.writeFileSync(
  path.join(OUT, "StampShadow.tsx"),
  `${BANNER}
"use client";

import { useId } from "react";

/** Soft blurred shadow cast behind a stamp. The blur filter id is per-instance. */
export function StampShadow({ className }: { className?: string }) {
  const blurId = \`stamp-blur-\${useId().replace(/:/g, "")}\`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 661"
      fill="#020202"
      aria-hidden="true"
      className={className}
    >
      ${shadowBody}
    </svg>
  );
}
`,
);

for (const file of fs.readdirSync(OUT)) {
  console.log(`${file}: ${fs.statSync(path.join(OUT, file)).size}B`);
}
