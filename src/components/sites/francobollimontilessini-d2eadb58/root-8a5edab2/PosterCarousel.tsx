"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { StampCard } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampCard";
import { StampTrail } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampTrail";
import {
  POSTERS,
  type Poster,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/**
 * The reel runs on a diagonal, not a horizontal line. Per step away from the centred
 * stamp, a slide moves by this multiple of the slide pitch and loses this much scale —
 * measured off the target site, whose per-index deltas are exactly linear:
 * at a 512px pitch they are (686.08px, 409.6px) and -0.1024 scale.
 *
 * Stamps up and to the left are nearer and larger; down and to the right they recede.
 */
const STEP_X = 1.34;
const STEP_Y = 0.8;
const STEP_SCALE = 0.1024;
/** Length of one step, in pitches — the unit a drag is measured against. */
const STEP_LEN = Math.hypot(STEP_X, STEP_Y);
/** Unit vector along the reel, pointing towards the receding (down-right) end. */
const AXIS_X = STEP_X / STEP_LEN;
const AXIS_Y = STEP_Y / STEP_LEN;

/** Only the immediate neighbours reach the screen; one spare each way covers mid-drag. */
const STAMP_RADIUS = 2;
/** Titles are a full viewport wide, so one neighbour each way is all that can show. */
const LINE_RADIUS = 1;

const COUNT = POSTERS.length;
const wrap = (n: number) => ((n % COUNT) + COUNT) % COUNT;
const posterAt = (slot: number) => POSTERS[wrap(slot)];

const range = (radius: number) => Array.from({ length: radius * 2 + 1 }, (_, i) => i - radius);
const STAMP_SLOTS = range(STAMP_RADIUS);
const LINE_SLOTS = range(LINE_RADIUS);

/** Release momentum: slides carried per px/ms of flick along the axis. */
const FLICK = 220;
const SETTLE_MS = 700;
/**
 * Pointer travel, in px, before a press counts as a drag.
 *
 * Capture is deliberately withheld until this is crossed. A captured pointer retargets
 * the `pointerup` and `click` that follow at the capturing element, which would take them
 * away from the stamp sitting under the finger — so capturing on press, before we know
 * whether this is a drag at all, silently breaks tapping a stamp open.
 */
const DRAG_SLOP = 10;
const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

export interface PosterCarouselProps {
  /** Drag and pointer tilt stay off until the cover has finished opening. */
  interactive?: boolean;
  /** Hides the centred stamp's photo so the cover's poster can land in its place. */
  centerImageHidden?: boolean;
  /** Receives the centred stamp's photo box — the opening transition's landing target. */
  centerImageRef?: React.RefCallback<HTMLDivElement | null>;
  onCenterChange?: (index: number) => void;
  /** Tapping the centred stamp opens it out. Its photo box is the flight's launch point. */
  onOpenPoster?: (poster: Poster, from: DOMRect) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The draggable stamp canvas.
 *
 * Stamps sit on a diagonal reel that recedes towards the bottom right, so dragging up
 * and to the left pulls the next stamp forward — it grows into the centre rather than
 * sliding across. Behind them run three text tracks, and those *are* horizontal: the
 * title's first word up top, the rest below it travelling the other way, and the
 * location line pinned to the bottom.
 *
 * Position is one continuous "slide index", `u`. Everything on screen derives from it,
 * and it is written straight to the DOM rather than held in state, so dragging costs no
 * renders; React only re-renders when `u` crosses into a new integer slot and the slots
 * have to be re-homed around it.
 */
export function PosterCarousel({
  interactive = false,
  centerImageHidden = false,
  centerImageRef,
  onCenterChange,
  onOpenPoster,
  className,
  style,
}: PosterCarouselProps) {
  const reelRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  /** Continuous position in slides. Deliberately outside React. */
  const u = useRef(0);
  const [origin, setOrigin] = useState(0);
  /** The origin React has actually committed — what the DOM slots currently show. */
  const painted = useRef(0);
  /** The origin we have already asked React for, to dedupe setState from the rAF loop. */
  const requested = useRef(0);
  const [dragging, setDragging] = useState(false);

  const paint = useCallback(() => {
    const pitch = measureRef.current?.offsetWidth ?? 0;
    if (!pitch) return;
    const delta = u.current - painted.current;

    const reel = reelRef.current;
    if (reel) {
      for (const node of Array.from(reel.children) as HTMLElement[]) {
        const d = Number(node.dataset.slot) - delta;
        node.style.transform =
          `translate(-50%, -50%) translate(${STEP_X * pitch * d}px, ${STEP_Y * pitch * d}px) scale(${1 - STEP_SCALE * d})`;
        // Nearer stamps overlap the ones receding behind them.
        node.style.zIndex = String(Math.round(100 - d * 10));
      }
    }

    const shift = delta * window.innerWidth;
    if (line1Ref.current) line1Ref.current.style.transform = `translate3d(${-shift}px,0,0)`;
    // The second word runs against the first — that opposing drift is the parallax.
    if (line2Ref.current) line2Ref.current.style.transform = `translate3d(${shift}px,0,0)`;
    if (line3Ref.current) line3Ref.current.style.transform = `translate3d(${-shift}px,0,0)`;
  }, []);

  const setU = useCallback(
    (next: number) => {
      u.current = next;
      const slot = Math.round(next);
      if (slot !== requested.current) {
        requested.current = slot;
        setOrigin(slot);
        onCenterChange?.(wrap(slot));
      }
      paint();
    },
    [onCenterChange, paint],
  );

  // Re-home only once React has committed the new slots, so the reel never renders a
  // frame where the transforms and the poster assignment disagree.
  useLayoutEffect(() => {
    painted.current = origin;
    paint();
  }, [origin, paint]);

  useEffect(() => {
    window.addEventListener("resize", paint);
    return () => window.removeEventListener("resize", paint);
  }, [paint]);

  // ---- drag ---------------------------------------------------------------
  const gesture = useRef<{
    x: number;
    y: number;
    /** Where the press landed, for the drag/tap decision. */
    x0: number;
    y0: number;
    t: number;
    v: number;
    from: number;
    captured: boolean;
  } | null>(null);
  const settle = useRef(0);
  /** The footpath drawn between the stamp being left and the one being arrived at. */
  const [trail, setTrail] = useState<{ key: number; back: boolean; color: string } | null>(null);
  const trailKey = useRef(0);

  useEffect(() => () => cancelAnimationFrame(settle.current), []);

  const glideTo = useCallback(
    (target: number) => {
      cancelAnimationFrame(settle.current);
      const from = u.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / SETTLE_MS);
        setU(from + (target - from) * easeOutQuint(t));
        if (t < 1) settle.current = requestAnimationFrame(step);
      };
      settle.current = requestAnimationFrame(step);
    },
    [setU],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (!interactive || event.button !== 0) return;
    cancelAnimationFrame(settle.current);
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      x0: event.clientX,
      y0: event.clientY,
      t: performance.now(),
      v: 0,
      from: Math.round(u.current),
      captured: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const g = gesture.current;
    const pitch = measureRef.current?.offsetWidth;
    if (!g || !pitch) return;
    if (!g.captured) {
      if (Math.hypot(event.clientX - g.x0, event.clientY - g.y0) <= DRAG_SLOP) return;
      g.captured = true;
      setDragging(true);
      // Capture only keeps the drag alive past the window edge; a pointer that has
      // already gone stale throws here, and losing that is no reason to lose the drag.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    }
    const now = performance.now();
    // Only motion along the reel counts; the cross-axis component is ignored.
    const along = (event.clientX - g.x) * AXIS_X + (event.clientY - g.y) * AXIS_Y;
    g.v = along / Math.max(1, now - g.t);
    g.x = event.clientX;
    g.y = event.clientY;
    g.t = now;
    // Dragging up-left is negative along the axis and pulls the next stamp forward.
    // One gesture is worth at most one stamp, so a long sweep cannot fling past it.
    const next = u.current - along / (STEP_LEN * pitch);
    setU(Math.min(g.from + 1, Math.max(g.from - 1, next)));
  };

  const endDrag = (event: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    if (!g.captured) return; // A tap. The stamp under it deals with the press itself.
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const pitch = measureRef.current?.offsetWidth ?? 1;
    const flung = Math.round(u.current - (g.v * FLICK) / (STEP_LEN * pitch));
    const target = Math.min(g.from + 1, Math.max(g.from - 1, flung));
    if (target !== g.from) {
      trailKey.current += 1;
      // The path is coloured by the stamp it leads to.
      setTrail({ key: trailKey.current, back: target < g.from, color: posterAt(target).trail });
    }
    glideTo(target);
  };

  return (
    <section
      aria-label="Stamp collection"
      className={cn(
        "fixed inset-0 overflow-hidden touch-none overscroll-none",
        interactive && (dragging ? "cursor-grabbing" : "cursor-grab"),
        className,
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Ground. Its colour belongs to the centred stamp and eases across on each
          switch, so the whole canvas takes on that poster's palette. */}
      <div
        className="absolute inset-0 transition-colors duration-500 ease-out"
        style={{ backgroundColor: posterAt(origin).ground }}
      />

      {/* The footpath to the next stamp. Keyed so each switch restarts the draw-on. */}
      {trail ? <StampTrail key={trail.key} back={trail.back} color={trail.color} /> : null}

      {/* Title tracks, behind the stamps. Padding is the source's pt-28/pb-14 (lg:
          pt-20/pb-8) resolved against its 11.6px root, since this app keeps a 16px one. */}
      <div className="pointer-events-none fixed inset-0 z-0 flex flex-col justify-between pt-[81.2px] pb-[40.6px] text-center lg:pt-[58px] lg:pb-[23.2px]">
        <TitleLine ref={line1Ref}>
          {LINE_SLOTS.map((k) => {
            const poster = posterAt(origin + k);
            return (
              <TitleWord key={k} word={poster.words[0]} offsetVw={k * 100} color={poster.title} />
            );
          })}
        </TitleLine>

        <div>
          <TitleLine ref={line2Ref}>
            {LINE_SLOTS.map((k) => {
              const poster = posterAt(origin + k);
              return (
                <TitleWord key={k} word={poster.words[1]} offsetVw={-k * 100} color={poster.title} />
              );
            })}
          </TitleLine>

          <div ref={line3Ref} className="relative h-4 will-change-transform">
            {LINE_SLOTS.map((k) => {
              const poster = posterAt(origin + k);
              return (
                <p
                  key={k}
                  className="absolute top-0 w-screen truncate px-4 font-neue-montreal text-[11.6px] font-bold uppercase text-dust"
                  style={{ left: `${k * 100}vw` }}
                >
                  {poster.place} - {poster.coords}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* The diagonal reel. Every slot is pinned to the centre of the screen and pushed
          out along the axis by `paint()`; the pitch lives in a custom property so the
          slot width and the drag maths read from one responsive source. */}
      <div
        ref={reelRef}
        className="absolute inset-0 z-1 [--ml-slide:53.333vw] lg:[--ml-slide:40vw]"
      >
        {STAMP_SLOTS.map((k) => {
          const slot = origin + k;
          const centered = k === 0;
          const openable = centered && interactive && onOpenPoster;
          return (
            <div
              key={k}
              data-slot={k}
              ref={centered ? measureRef : undefined}
              className="absolute top-1/2 left-1/2 will-change-transform lg:p-[81.2px] xl:p-[14vh]"
              style={{ width: "var(--ml-slide)" }}
            >
              <StampCard
                poster={posterAt(slot)}
                active={centered && interactive}
                priority={wrap(slot) === 0}
                imageRef={centered ? centerImageRef : undefined}
                imageHidden={centered && centerImageHidden}
                onOpen={openable ? (from) => onOpenPoster(posterAt(slot), from) : undefined}
                className={cn(!centered && "pointer-events-none")}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** A parallax text row. Sets the title font so the children's `em` height resolves. */
function TitleLine({ ref, children }: { ref: React.Ref<HTMLDivElement>; children: React.ReactNode }) {
  return (
    <div ref={ref} className="ml-title relative h-[0.8em] will-change-transform">
      {children}
    </div>
  );
}

function TitleWord({ word, offsetVw, color }: { word: string; offsetVw: number; color: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0 block w-screen whitespace-nowrap lg:scale-75"
      style={{ left: `${offsetVw}vw`, color }}
    >
      {word}
    </span>
  );
}
