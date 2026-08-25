import { cn } from "@/lib/utils";

/** The paths are drawn in this box and stretched across whatever width they land in. */
const VIEW_W = 1000;
const VIEW_H = 60;

/** Deterministic jitter, so the server and client render identical markup. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A hard rip: straight runs of paper broken by sharp, uneven steps, the way a sheet tears
 * when it is pulled rather than cut.
 */
function ripPath(seed: number) {
  const random = mulberry32(seed);
  const points: string[] = [];
  let x = 0;
  let y = 16 + random() * 26;
  points.push(`${x},${y.toFixed(1)}`);

  while (x < VIEW_W) {
    x = Math.min(VIEW_W, x + 16 + random() * 52);
    // Most steps stay near the current height; every so often one tears much deeper.
    const jump = random() < 0.22 ? (random() - 0.5) * 34 : (random() - 0.5) * 12;
    y = Math.min(48, Math.max(8, y + jump));
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `M${points.join(" L")} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;
}

/**
 * A deckle edge: the soft, rounded tear of handmade paper. Same idea as the rip, drawn in
 * curves instead of corners so the two joins in one page never read as the same cut.
 */
function decklePath(seed: number) {
  const random = mulberry32(seed);
  let x = 0;
  let y = 28 + (random() - 0.5) * 12;
  let d = `M0,${y.toFixed(1)}`;

  while (x < VIEW_W) {
    const nx = Math.min(VIEW_W, x + 44 + random() * 40);
    const ny = 14 + random() * 28;
    const cx = (x + nx) / 2;
    // The control point swings well past both ends, which is what rounds the scallop.
    const cy = y + (random() - 0.5) * 46;
    d += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${nx.toFixed(1)},${ny.toFixed(1)}`;
    x = nx;
    y = ny;
  }

  return `${d} L${VIEW_W},${VIEW_H} L0,${VIEW_H} Z`;
}

const PATHS = {
  rip: ripPath(20260825),
  deckle: decklePath(76301142),
} as const;

interface TornEdgeProps {
  /** Fill for the paper below the tear — normally the ground it is tearing into. */
  color: string;
  variant: keyof typeof PATHS;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The torn strip where one band of the page ends and the next begins.
 *
 * Only the part *below* the tear is painted, so this is laid over the foot of the outgoing
 * band with its own bottom flush against the incoming one: the fill and the section under
 * it are the same colour, and the join disappears.
 */
export function TornEdge({ color, variant, className, style }: TornEdgeProps) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("block w-full", className)}
      style={style}
    >
      <path d={PATHS[variant]} fill={color} />
    </svg>
  );
}
