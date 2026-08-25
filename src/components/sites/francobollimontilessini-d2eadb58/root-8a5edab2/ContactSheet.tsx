"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { StampCard } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampCard";
import {
  POSTERS,
  type Poster,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/** Ground for the sheet. The carousel's colour belongs to whichever stamp is centred;
 *  with all of them out at once there is no such stamp, so it settles on the lawn. */
const SHEET_GROUND = "#3FA86F";

/**
 * The sheet is a grid wider and taller than the screen: about four stamps read across the
 * middle at rest, with the rows above and below showing only their corners until you drag.
 *
 * Fifteen cells for ten posters, so some designs come round twice. That is how a real
 * sheet of stamps looks, and it is what the reference does too — the alternative is a
 * short last row and a bare patch of ground where the sheet should keep going. Each row
 * starts further along the collection than a straight wrap would, so no design sits
 * directly above its own repeat.
 */
const COLUMNS = 5;
const ROWS_DOWN = 3;

const ROWS: Poster[][] = Array.from({ length: ROWS_DOWN }, (_, r) =>
  Array.from({ length: COLUMNS }, (_, c) => POSTERS[(r * (COLUMNS + 2) + c) % POSTERS.length]),
);

/** Velocity retained per frame after release, and the speed below which the glide stops. */
const DECAY = 0.94;
const REST = 0.02;

/**
 * Pointer travel, in px, before a press counts as a drag.
 *
 * Capture is withheld until this is crossed: a captured pointer retargets the `pointerup`
 * that follows at the capturing element, taking it away from the stamp under the finger,
 * so capturing on press would make the stamps untappable.
 */
const DRAG_SLOP = 10;

export interface ContactSheetProps {
  open: boolean;
  onOpenPoster: (poster: Poster, from: DOMRect) => void;
}

/**
 * "All": the whole collection dealt out on one sheet, larger than the screen and dragged
 * around — the same gesture the index canvas uses, in two axes instead of one.
 *
 * The pan offset lives in a ref and is written straight to the plane's transform, so a
 * drag costs no React renders. Once visited the sheet stays mounted, which keeps both its
 * position and the carousel's; before the first visit it holds no cards at all, since
 * decoding every poster behind an invisible layer is a real cost to visitors who never
 * open it.
 */
export function ContactSheet({ open, onOpenPoster }: ContactSheetProps) {
  // Adjusted during render rather than in an effect: the cards have to be in the very
  // first committed frame of the sheet being opened, not one paint later.
  const [visited, setVisited] = useState(false);
  if (open && !visited) setVisited(true);

  const viewRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  /** Pan offset from centred, in px. Deliberately outside React. */
  const pos = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  /** Clamps the offset so the plane can never be pulled off its own edges, then paints. */
  const paint = useCallback(() => {
    const plane = planeRef.current;
    const view = viewRef.current;
    if (!plane || !view) return;
    const maxX = Math.max(0, (plane.offsetWidth - view.clientWidth) / 2);
    const maxY = Math.max(0, (plane.offsetHeight - view.clientHeight) / 2);
    pos.current.x = Math.min(maxX, Math.max(-maxX, pos.current.x));
    pos.current.y = Math.min(maxY, Math.max(-maxY, pos.current.y));
    plane.style.transform = `translate(-50%, -50%) translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
  }, []);

  useLayoutEffect(paint, [paint, visited]);

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
    vx: number;
    vy: number;
    captured: boolean;
  } | null>(null);
  const glide = useRef(0);

  useEffect(() => () => cancelAnimationFrame(glide.current), []);

  const fling = useCallback(
    (vx: number, vy: number) => {
      let dx = vx;
      let dy = vy;
      const step = () => {
        dx *= DECAY;
        dy *= DECAY;
        if (Math.hypot(dx, dy) < REST) return;
        const before = { ...pos.current };
        pos.current.x += dx * 16;
        pos.current.y += dy * 16;
        paint();
        // Once an axis has been clamped there is nothing left to coast into.
        if (pos.current.x === before.x) dx = 0;
        if (pos.current.y === before.y) dy = 0;
        glide.current = requestAnimationFrame(step);
      };
      glide.current = requestAnimationFrame(step);
    },
    [paint],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    if (!open || event.button !== 0) return;
    cancelAnimationFrame(glide.current);
    gesture.current = {
      x: event.clientX,
      y: event.clientY,
      x0: event.clientX,
      y0: event.clientY,
      t: performance.now(),
      vx: 0,
      vy: 0,
      captured: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (!g.captured) {
      if (Math.hypot(event.clientX - g.x0, event.clientY - g.y0) <= DRAG_SLOP) return;
      g.captured = true;
      setDragging(true);
      // Capture only keeps the drag alive past the window edge; a pointer that has
      // already gone stale throws here, and losing that is no reason to lose the pan.
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    }
    const now = performance.now();
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    const dt = Math.max(1, now - g.t);
    g.vx = dx / dt;
    g.vy = dy / dt;
    g.x = event.clientX;
    g.y = event.clientY;
    g.t = now;
    pos.current.x += dx;
    pos.current.y += dy;
    paint();
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
    fling(g.vx, g.vy);
  };

  // The sheet is a fixed layer over a page that does not scroll, so the wheel is free to
  // mean "pan" here without having to fight a native scroll for it.
  const onWheel = (event: React.WheelEvent) => {
    if (!open) return;
    cancelAnimationFrame(glide.current);
    pos.current.x -= event.deltaX;
    pos.current.y -= event.deltaY;
    paint();
  };

  return (
    <section
      ref={viewRef}
      aria-label="All stamps"
      aria-hidden={!open}
      inert={!open ? true : undefined}
      className={cn(
        "fixed inset-0 z-30 touch-none overflow-hidden overscroll-none transition-opacity duration-500 ease-out",
        open ? "opacity-100" : "pointer-events-none opacity-0",
        open && (dragging ? "cursor-grabbing" : "cursor-grab"),
      )}
      style={{ backgroundColor: SHEET_GROUND }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onWheel={onWheel}
    >
      <div
        ref={planeRef}
        className="absolute top-1/2 left-1/2 flex flex-col items-center gap-[var(--ml-gap)] will-change-transform [--ml-cell:clamp(150px,22vw,380px)] [--ml-gap:clamp(24px,3.5vw,60px)]"
      >
        {(visited ? ROWS : []).map((row, r) => (
          <div
            key={r}
            className="flex gap-[var(--ml-gap)]"
            // Alternate rows shift half a stamp, so the sheet breaks up into a brick
            // course instead of ruling four hard columns down the screen.
            style={{
              marginLeft: r % 2 ? "calc(var(--ml-cell) / 2 + var(--ml-gap) / 2)" : undefined,
              marginRight: r % 2 ? "calc(var(--ml-cell) / -2 - var(--ml-gap) / 2)" : undefined,
            }}
          >
            {row.map((poster, c) => (
              <div
                key={`${r}-${c}`}
                className="w-[var(--ml-cell)] opacity-0"
                style={{
                  animation: open
                    ? `ml-sheet-in 520ms cubic-bezier(0.16,1,0.3,1) ${(r * COLUMNS + c) * 40}ms both`
                    : undefined,
                }}
              >
                <StampCard poster={poster} onOpen={(from) => onOpenPoster(poster, from)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
