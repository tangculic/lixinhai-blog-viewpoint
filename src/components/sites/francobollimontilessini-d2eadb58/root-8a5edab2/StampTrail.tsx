import { cn } from "@/lib/utils";

/**
 * The wandering footpath that links one stamp to the next: a run of little torn-paper
 * squares following a wave across the empty ground left of the centred stamp.
 *
 * The squares are laid out here rather than drawn as a dashed stroke. A dashed stroke
 * needs a displacement filter to stop looking plotted, and that filter re-rasterises the
 * whole band on every frame of the draw-on — expensive enough to stall the compositor.
 * Individually placed, jittered rects cost nothing to animate and land closer to the
 * reference anyway, where no two tiles are quite the same size or angle.
 */

type Cubic = readonly [number, number, number, number, number, number, number, number];

/** The wave, as absolute cubic segments over a 675x320 box. */
const SEGMENTS: readonly Cubic[] = [
  [-10, 105, 20, 210, 60, 265, 105, 245],
  [105, 245, 150, 225, 165, 90, 215, 62],
  [215, 62, 265, 34, 290, 140, 320, 195],
  [320, 195, 350, 250, 390, 245, 425, 200],
  [425, 200, 460, 155, 470, 55, 515, 48],
  [515, 48, 560, 41, 590, 150, 620, 215],
  [620, 215, 645, 268, 670, 255, 685, 240],
];

/** Distance between tile centres, and the nominal tile side. */
const SPACING = 40;
const TILE = 23;

const cubicAt = (c: Cubic, t: number) => {
  const u = 1 - t;
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return {
    x: a * x0 + b * x1 + d * x2 + e * x3,
    y: a * y0 + b * y1 + d * y2 + e * y3,
  };
};

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

interface Tile {
  x: number;
  y: number;
  size: number;
  angle: number;
}

/** Walks the curve at a fixed arc-length step, dropping a tile at each stop. */
const TILES: Tile[] = (() => {
  const random = mulberry32(20260824);
  const tiles: Tile[] = [];
  let carried = 0;
  let previous = cubicAt(SEGMENTS[0], 0);

  for (const segment of SEGMENTS) {
    const STEPS = 120;
    for (let i = 1; i <= STEPS; i++) {
      const point = cubicAt(segment, i / STEPS);
      const dx = point.x - previous.x;
      const dy = point.y - previous.y;
      carried += Math.hypot(dx, dy);
      if (carried >= SPACING) {
        carried = 0;
        tiles.push({
          x: point.x,
          y: point.y,
          size: TILE * (0.82 + random() * 0.36),
          // Tiles lean with the path, then wobble a little off it.
          angle: (Math.atan2(dy, dx) * 180) / Math.PI + (random() - 0.5) * 34,
        });
      }
      previous = point;
    }
  }
  return tiles;
})();

interface StampTrailProps {
  /** Draw from the stamp back out to the screen edge, rather than in towards it. */
  back?: boolean;
  /** The arriving poster's own `path` colour. */
  color: string;
  className?: string;
}

export function StampTrail({ back = false, color, className }: StampTrailProps) {
  return (
    <svg
      viewBox="0 0 675 320"
      fill="none"
      aria-hidden="true"
      style={{ color }}
      className={cn(
        "pointer-events-none absolute top-[46%] left-[2vw] w-[35vw] -translate-y-1/2",
        back ? "animate-ml-trail-back" : "animate-ml-trail-forward",
        className,
      )}
    >
      {TILES.map((tile, i) => (
        <rect
          key={i}
          x={-tile.size / 2}
          y={-tile.size / 2}
          width={tile.size}
          height={tile.size}
          rx={2}
          fill="currentColor"
          transform={`translate(${tile.x.toFixed(1)} ${tile.y.toFixed(1)}) rotate(${tile.angle.toFixed(1)})`}
        />
      ))}
    </svg>
  );
}
