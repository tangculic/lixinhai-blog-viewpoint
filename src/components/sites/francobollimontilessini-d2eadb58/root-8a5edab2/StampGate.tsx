"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { HeroCover } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/HeroCover";
import { PosterCarousel } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/PosterCarousel";
import type { Poster } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/** Total length of the shrink. Long enough to read as a camera pulling back. */
const OPEN_MS = 1100;
/** How much of that the canvas takes to fade up underneath the shrinking poster. */
const CANVAS_FADE = 0.55;
/** Matches GSAP's `power3.out` closely enough to read the same. */
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

type Phase = "cover" | "opening" | "canvas";

declare global {
  interface Window {
    /** Set by the inline listener in `layout.tsx` when the cover is tapped pre-hydration. */
    __mlPendingOpen?: 0 | 1;
  }
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Owns the one interaction this page is built around: the cover collapsing into the
 * stamp canvas.
 *
 * Both layers are mounted from the start — the canvas has to be laid out for its centred
 * stamp to be measurable — and the cover's poster is then flown from full bleed onto
 * that stamp. Geometry is animated rather than transformed: the poster is `object-cover`,
 * so shrinking its box is what makes the image re-frame instead of squashing, which is
 * the whole character of the move.
 */
export interface StampGateProps {
  /** Forwarded to the carousel: tapping the centred stamp opens it out full-screen. */
  onOpenPoster?: (poster: Poster, from: DOMRect) => void;
}

export function StampGate({ onOpenPoster }: StampGateProps) {
  const [phase, setPhase] = useState<Phase>("cover");
  const posterRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const attachTarget = useCallback((node: HTMLDivElement | null) => {
    targetRef.current = node;
  }, []);

  const open = useCallback(() => {
    if (phase !== "cover") return;
    const poster = posterRef.current;
    const target = targetRef.current;
    if (!poster || !target) {
      setPhase("canvas");
      return;
    }

    // Reduced motion rules out the flight, but a hard cut is harsher than it needs to
    // be — a plain cross-fade carries the same meaning without anything travelling.
    if (prefersReducedMotion()) {
      setPhase("opening");
      poster.style.transition = "opacity 400ms ease-out";
      poster.style.opacity = "0";
      window.setTimeout(() => setPhase("canvas"), 420);
      return;
    }

    const from = poster.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    if (!to.width || !to.height) {
      setPhase("canvas");
      return;
    }
    setPhase("opening");

    // Pin the poster in viewport space so it can be animated free of the cover's layout.
    Object.assign(poster.style, {
      position: "fixed",
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      zIndex: "30",
      willChange: "top, left, width, height",
    });

    const flight = poster.animate(
      [
        { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` },
        { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` },
      ],
      { duration: OPEN_MS, easing: EASE, fill: "forwards" },
    );

    // The cover is only dismissed once the flight reports in — and the whole page is
    // behind that, so it cannot be the only thing we wait on. A tab throttled into the
    // background can leave `finished` unsettled long past the duration, and the cover
    // would sit there disabled. Whichever arrives first wins.
    let settled = false;
    const land = () => {
      if (settled) return;
      settled = true;
      setPhase("canvas");
    };
    flight.finished.catch(() => undefined).finally(land);
    window.setTimeout(land, OPEN_MS + 300);
  }, [phase]);

  // A tap that landed on the cover before this component existed. The inline listener in
  // `layout.tsx` catches it; honouring it here is what turns "the first tap did nothing"
  // into the page opening the moment it is able to.
  useEffect(() => {
    if (!window.__mlPendingOpen) return;
    window.__mlPendingOpen = 0;
    // Next frame rather than straight away: the reel behind the cover has to have been
    // laid out for the stamp to have a box worth measuring, and without one `open()`
    // gives up on the flight and cuts.
    const handle = requestAnimationFrame(() => open());
    return () => cancelAnimationFrame(handle);
  }, [open]);

  const opening = phase === "opening";
  const showCover = phase !== "canvas";

  return (
    <>
      <PosterCarousel
        interactive={phase === "canvas"}
        centerImageRef={attachTarget}
        // Until the flying poster has landed, the stamp underneath shows only its frame
        // and lettering — the photo arriving is the cover finishing its trip.
        centerImageHidden={showCover}
        onOpenPoster={onOpenPoster}
        className={cn("z-0 ease-out", phase === "cover" && "opacity-0")}
        style={{ transition: `opacity ${Math.round(OPEN_MS * CANVAS_FADE)}ms ease-out` }}
      />

      {showCover ? (
        <HeroCover posterRef={posterRef} onOpen={open} exiting={opening} />
      ) : null}
    </>
  );
}
