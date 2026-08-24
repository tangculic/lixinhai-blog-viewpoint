"use client";

import Image from "next/image";
import { useRef, type MouseEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";
import { StampFrame } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampFrame";
import { StampPrint } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampPrint";
import { StampShadow } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampShadow";
import {
  posterSrc,
  type Poster,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/** How far the card leans into the pointer, in degrees. */
const TILT = 6;
/** Pointer travel, in px, past which a press counts as a drag rather than a click. */
const DRAG_SLOP = 6;

interface StampCardProps {
  poster: Poster;
  /** Marks the card the carousel has centred — the only one that reacts to the pointer. */
  active?: boolean;
  priority?: boolean;
  /**
   * Set on the poster image's clipping box. The opening transition measures this to
   * work out where the full-bleed cover has to land.
   */
  imageRef?: React.Ref<HTMLDivElement>;
  /** Hides just the photo, leaving frame and lettering — used while the cover flies in. */
  imageHidden?: boolean;
  className?: string;
}

/**
 * One stamp: die-cut border, poster photo, printed lettering, and a soft cast shadow,
 * over a 496:661 card that leans towards the pointer on fine-pointer devices.
 */
export function StampCard({
  poster,
  active = false,
  priority = false,
  imageRef,
  imageHidden = false,
  className,
}: StampCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const handleMove = (event: PointerEvent<HTMLElement>) => {
    const node = tiltRef.current;
    if (!node || !active || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    node.style.setProperty("--x-rotation", `${(-py * TILT * 2).toFixed(2)}deg`);
    node.style.setProperty("--y-rotation", `${(px * TILT * 2).toFixed(2)}deg`);
  };

  const resetTilt = () => {
    const node = tiltRef.current;
    if (!node) return;
    node.style.setProperty("--x-rotation", "0deg");
    node.style.setProperty("--y-rotation", "0deg");
  };

  // The card sits inside the drag surface, so a gesture that happens to start and end on
  // it would otherwise read as a click. Anything past a few pixels was a drag, not a tap.
  const press = useRef<{ x: number; y: number } | null>(null);
  const markPress = (event: PointerEvent<HTMLElement>) => {
    press.current = { x: event.clientX, y: event.clientY };
  };
  const cancelIfDragged = (event: MouseEvent<HTMLElement>) => {
    const start = press.current;
    press.current = null;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_SLOP) {
      event.preventDefault();
    }
  };

  return (
    <article
      className={cn("relative aspect-[496/661] [perspective:800px]", className)}
      onPointerMove={handleMove}
      onPointerLeave={resetTilt}
    >
      <div
        ref={tiltRef}
        className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform sm:[transform:rotateX(var(--x-rotation,0deg))_rotateY(var(--y-rotation,0deg))]"
      >
        <StampShadow className="absolute z-0 top-4 left-8 w-[110%]" />

        <div
          ref={imageRef}
          // No transition here on purpose: the cover's poster unmounts in the same commit
          // that reveals this one, so any fade would show a gap between the two.
          className={cn("absolute inset-0 z-5 overflow-hidden", imageHidden && "opacity-0")}
        >
          <Image
            src={posterSrc(poster)}
            alt={`${poster.words[0]} ${poster.words[1]}`.trim()}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 40vw, 66vw"
            className="object-cover"
          />
        </div>

        {poster.lettering === false ? null : (
          <StampPrint
            className={cn(
              "absolute inset-0 z-5",
              poster.caption === "slate" ? "text-slate-print" : "text-dust",
            )}
          />
        )}
        <StampFrame className="absolute top-[-12%] left-[-12%] z-1 w-[124%]" />

        {poster.href && active ? (
          <a
            href={poster.href}
            target="_blank"
            rel="noopener noreferrer"
            onPointerDown={markPress}
            onClick={cancelIfDragged}
            aria-label={`${poster.words[0]} ${poster.words[1]}`.trim()}
            className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dust"
          />
        ) : null}
      </div>
    </article>
  );
}
