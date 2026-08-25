"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Pointer travel, in px, before a press counts as a drag rather than a click. */
const DRAG_SLOP = 8;

/**
 * The horizontal strip of photographs, dragged rather than scrolled.
 *
 * `overflow-x: auto` alone is not usable with a mouse: a wheel over it scrolls the page,
 * and there is no scrollbar worth grabbing — only a trackpad's sideways swipe moves it.
 * So the strip carries its own drag, and native scrolling still works underneath for
 * anyone who has a way to do it.
 *
 * The slides are left-aligned and free-scrolling, not centre-snapped. That is what lets
 * the first one travel all the way to the edge and off it as the strip fills up, and come
 * back when you pull the other way.
 */
export function GalleryStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; left: number; captured: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);

  // The browser's own image drag would otherwise take over the moment the pointer moves.
  useEffect(() => {
    const strip = ref.current;
    if (!strip) return;
    const block = (event: Event) => event.preventDefault();
    strip.addEventListener("dragstart", block);
    return () => strip.removeEventListener("dragstart", block);
  }, []);

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const strip = ref.current;
    if (!strip) return;
    gesture.current = { x: event.clientX, left: strip.scrollLeft, captured: false };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const g = gesture.current;
    const strip = ref.current;
    if (!g || !strip) return;
    const dx = event.clientX - g.x;
    if (!g.captured) {
      if (Math.abs(dx) <= DRAG_SLOP) return;
      g.captured = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {}
    }
    strip.scrollLeft = g.left - dx;
  };

  const endDrag = (event: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    if (!g.captured) return;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "flex overflow-x-auto overscroll-x-contain select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
    >
      {children}
    </div>
  );
}
