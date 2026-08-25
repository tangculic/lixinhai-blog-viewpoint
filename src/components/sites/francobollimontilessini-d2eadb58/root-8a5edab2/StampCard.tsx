"use client";

import Image from "next/image";
import { useRef, type KeyboardEvent, type PointerEvent } from "react";

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
/**
 * Pointer travel, in px, past which a press counts as a drag rather than a tap. Loose
 * enough to survive the hand wobble of a real mouse click.
 */
const DRAG_SLOP = 10;

interface StampCardProps {
  poster: Poster;
  /** Marks the card the carousel has centred — the only one that reacts to the pointer. */
  active?: boolean;
  priority?: boolean;
  /**
   * Called with the poster image's clipping box. The opening transition measures this to
   * work out where the full-bleed cover has to land. A callback rather than a ref object,
   * because the card keeps its own handle on that node and only forwards it.
   */
  imageRef?: React.RefCallback<HTMLDivElement | null>;
  /** Hides just the photo, leaving frame and lettering — used while the cover flies in. */
  imageHidden?: boolean;
  /**
   * Makes the card openable. Receives the photo's current viewport box, which the detail
   * view flies out from — the stamp appears to unfold into the full poster.
   */
  onOpen?: (from: DOMRect) => void;
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
  onOpen,
  className,
}: StampCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  // The photo's box is both the opening transition's landing target and the detail
  // view's launch point, so it is tracked here as well as handed upwards.
  const imageBox = useRef<HTMLDivElement | null>(null);
  const attachImageBox = (node: HTMLDivElement | null) => {
    imageBox.current = node;
    imageRef?.(node);
  };

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

  const openPoster = () => {
    const box = imageBox.current?.getBoundingClientRect();
    if (box) onOpen?.(box);
  };

  // The card sits inside a drag surface, so a gesture that happens to start and end on it
  // would otherwise read as a tap. Anything past a few pixels was a drag.
  //
  // This runs off `pointerup` rather than `click` on purpose. The surface underneath takes
  // pointer capture as soon as a drag might be starting, and a captured pointer retargets
  // the click that follows at the capturing element — so the button cannot rely on ever
  // seeing one. Keyboard activation is handled separately, below.
  const press = useRef<{ x: number; y: number } | null>(null);
  const markPress = (event: PointerEvent<HTMLElement>) => {
    press.current = { x: event.clientX, y: event.clientY };
  };
  const openIfTapped = (event: PointerEvent<HTMLElement>) => {
    const start = press.current;
    press.current = null;
    if (!start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > DRAG_SLOP) return;
    openPoster();
  };
  const openOnKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPoster();
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
          ref={attachImageBox}
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
            style={{ objectPosition: poster.focus }}
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

        {onOpen ? (
          <button
            type="button"
            onPointerDown={markPress}
            onPointerUp={openIfTapped}
            onPointerCancel={() => (press.current = null)}
            onKeyDown={openOnKey}
            aria-label={`Open ${`${poster.words[0]} ${poster.words[1]}`.trim()}`}
            className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dust"
          />
        ) : null}
      </div>
    </article>
  );
}
