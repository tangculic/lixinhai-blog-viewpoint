"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { GalleryStrip } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/GalleryStrip";
import { PosterPlate } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/PosterPlate";
import { TornEdge } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/TornEdge";
import {
  POSTERS,
  galleryFor,
  nextPoster,
  posterHero,
  posterImage,
  posterSrc,
  type Poster,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/**
 * Leaflet reaches for `window` while it initialises, so the itinerary — four maps of it —
 * cannot be part of a statically pre-rendered page. Only one poster page wants it, so the
 * rest should not carry its weight either.
 */
const ItineraryPanel = dynamic(
  () =>
    import(
      "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/ItineraryPanel"
    ).then((m) => m.ItineraryPanel),
  { ssr: false },
);

/** Long enough to read as the stamp unfolding rather than a page swap. */
const FLIGHT_MS = 780;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The carousel lets its titles run off both edges — they sit behind a stamp and read as a
 * passing band. Here they are the page's masthead and have to fit, so each line is sized
 * from its own length and then capped, keeping a short word like "MAP" from swelling to
 * fill the screen.
 */
const titleSize = (word: string) =>
  `min(${(88 / Math.max(word.length, 1) / 0.62).toFixed(1)}vw, 17vh)`;

const titleClass = "ml-title whitespace-nowrap [text-shadow:0_2px_30px_rgba(0,0,0,0.22)]";
const labelClass = "font-neue-montreal text-[11.6px] font-bold text-dust uppercase";

/** The pill shared by the gallery's two links and the "next page" button. */
const pillClass =
  "cursor-pointer rounded-full border border-dust/70 px-8 py-3 font-neue-montreal text-[13.05px] font-bold text-dust uppercase transition-colors duration-200 hover:bg-dust hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dust";

/**
 * Height of every torn join. Deep enough that the tear still reads when the artwork
 * happens to end in the same colour family as the ground below it.
 */
const TEAR_H = "clamp(34px,6vw,78px)";

/**
 * One of the two buttons over the gallery.
 *
 * Drawn whether or not it has anywhere to go: without a destination it is a dimmed,
 * inert pill rather than a link that quietly does nothing when pressed.
 */
function GalleryLink({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={cn(pillClass, "cursor-default opacity-45 hover:bg-transparent hover:text-dust")}
      >
        {children}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={pillClass}>
      {children}
    </a>
  );
}

export interface PosterDetailProps {
  poster: Poster;
  /**
   * The stamp's photo box, which the artwork flies out of and back into. Null when the
   * page was reached from another poster's page rather than from a stamp — there is no
   * stamp on screen to fly from, so it simply arrives.
   */
  from: DOMRect | null;
  onClose: () => void;
  /** Follows "Scopri" through to the next poster's page. */
  onNavigate: (poster: Poster) => void;
}

/**
 * A stamp opened out into its own page: the artwork at full bleed under the title, and
 * then, as you scroll, the story, a gallery, and the next stamp waiting at the bottom.
 *
 * The opening move is the cover's played backwards. The artwork is pinned in viewport
 * space at the stamp's box and its geometry animated out to the whole screen, so the
 * `object-cover` frame re-crops as it grows rather than the image scaling up. On landing
 * the very same element switches from `fixed` to `absolute` and becomes the page's hero:
 * the animated geometry — 0, 0, full width, full height — already describes exactly the
 * box it needs to occupy inside a first screen that is itself full height, so nothing
 * moves at the swap and the page can then scroll away underneath it.
 */
export function PosterDetail({ poster, from, onClose, onNavigate }: PosterDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /** True once the artwork has finished growing and belongs to the page. */
  const [landed, setLanded] = useState(() => !from || prefersReducedMotion());
  /** Set when the return flight starts, so nothing can queue a second one. */
  const closing = useRef(false);

  const next = nextPoster(poster);
  const slides = galleryFor(poster);
  const label = `${poster.words[0]} ${poster.words[1]}`.trim();
  /** The one page that opens onto the trip itself rather than onto photographs. */
  const isItinerary = poster.panel === "map";

  /** A pin on the map jumping to the stamp for that place, where one exists. */
  const openBySlug = useCallback(
    (slug: string) => {
      const target = POSTERS.find((p) => p.slug === slug);
      if (target) onNavigate(target);
    },
    [onNavigate],
  );

  const geometry = useCallback(
    (rect: { left: number; top: number; width: number; height: number }) => ({
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }),
    [],
  );

  /**
   * Where the artwork ends up: the hero band, measured rather than computed. CSS sizes it
   * — see the `aspect-[15/16]` below — and this only has to agree with whatever CSS
   * decided, which it cannot do by repeating the formula.
   *
   * Read at the top of the page, so the band's viewport position is its offset position.
   */
  const full = useCallback(() => {
    const hero = heroRef.current;
    if (!hero) {
      const box = scrollRef.current;
      return {
        left: 0,
        top: 0,
        width: box?.clientWidth ?? window.innerWidth,
        height: box?.clientHeight ?? window.innerHeight,
      };
    }
    const rect = hero.getBoundingClientRect();
    return { left: 0, top: 0, width: rect.width, height: rect.height };
  }, []);

  // Fly out on mount.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !from || prefersReducedMotion()) return;
    const flight = frame.animate([geometry(from), geometry(full())], {
      duration: FLIGHT_MS,
      easing: EASE,
      fill: "forwards",
    });
    // The lettering arrives while the artwork is still growing, not after it lands.
    const settle = window.setTimeout(() => setLanded(true), FLIGHT_MS * 0.45);
    return () => {
      window.clearTimeout(settle);
      flight.cancel();
    };
  }, [from, full, geometry]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;

    const frame = frameRef.current;
    const scrolled = (scrollRef.current?.scrollTop ?? 0) > 4;
    // Folding back into the stamp only means anything from the top of the page, where the
    // artwork is still the thing on screen. Scrolled away, the page just closes.
    if (!frame || !from || scrolled || prefersReducedMotion()) {
      onClose();
      return;
    }

    setLanded(false);
    frame.style.position = "fixed";
    const flight = frame.animate([geometry(full()), geometry(from)], {
      duration: FLIGHT_MS,
      easing: EASE,
      fill: "forwards",
    });

    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      onClose();
    };
    flight.finished.catch(() => undefined).finally(done);
    // Never leave the unmount waiting only on an animation promise that a throttled tab
    // may not settle, or the page cannot be closed.
    window.setTimeout(done, FLIGHT_MS + 300);
  }, [from, full, geometry, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      ref={scrollRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto overscroll-contain"
      style={{ backgroundColor: poster.ground }}
    >
      {/* ---- the hero band: the artwork, full bleed, under the title ----
          The band is 15:16 — a 3:4 poster with a fifth of its height taken off — so about
          four fifths of the picture survives the crop, rather than the two fifths a
          screen-shaped band would leave.
          A portrait poster run to the full width of a wide window is close to two screens
          tall, so the cap keeps the band from swallowing the whole page; past that point
          the crop tightens again, and holding both full bleed and the full four fifths at
          once is not possible on a landscape screen. */}
      <section ref={heroRef} className="relative aspect-[15/16] max-h-[168svh] w-full">
        <div
          ref={frameRef}
          className={cn("overflow-hidden", landed ? "absolute" : "fixed")}
          style={
            from && !landed
              ? { left: from.left, top: from.top, width: from.width, height: from.height }
              : { inset: 0 }
          }
        >
          <Image
            // The hero copy where the poster has one. Same artwork and same crop as the
            // stamp this flew out of, so swapping in the larger file changes nothing about
            // where the flight lands.
            src={posterHero(poster)}
            alt={label}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: poster.focusWide ?? poster.focus }}
          />
        </div>

        {/* Both title words stacked into one block: with nothing but poster behind them
            there is no stamp left for them to run past, and the pair reads as a masthead. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-1 flex flex-col items-center overflow-hidden px-4 pt-[13vh] text-center transition-opacity duration-500 ease-out",
            landed ? "opacity-100" : "opacity-0",
          )}
        >
          {poster.words.map((word, i) =>
            word ? (
              <div
                key={i}
                className={titleClass}
                style={{ color: poster.title, fontSize: titleSize(word) }}
              >
                {word}
              </div>
            ) : null,
          )}
          <p
            className={cn(
              labelClass,
              "mt-6 max-w-full truncate [text-shadow:0_1px_8px_rgba(0,0,0,0.4)]",
            )}
          >
            {poster.place} - {poster.coords}
          </p>
        </div>

        {/* The ground tears up into the foot of the artwork. Sits a pixel low so no
            hairline of image survives between the tear and the page below it. */}
        <TornEdge
          color={poster.ground}
          variant="rip"
          className="absolute -bottom-px left-0 z-2"
          style={{ height: TEAR_H }}
        />
      </section>

      {/* ---- the story ----
          Flow layout, no fixed height: a longer story just pushes the gallery and the
          next-stamp teaser further down the page rather than crowding them. */}
      <section className="mx-auto max-w-[900px] px-6 pt-16 pb-4 md:px-10 md:pt-24">
        <p className={labelClass}>{poster.coords}</p>
        <div
          className={cn(
            "mt-8 font-neue-montreal font-bold text-dust",
            // The other pages carry two or three sentences of prose, and the display size
            // is the point of them. This one carries a timetable — four dated lines of
            // place names and arrows — which at that size wraps mid-route and stops
            // reading as a list at all.
            isItinerary
              ? "space-y-3 text-[clamp(15px,3.4vw,22px)] leading-[1.5]"
              : "space-y-4 text-[clamp(21px,4.6vw,36px)] leading-[1.16] uppercase",
          )}
          style={{ textWrap: "pretty" }}
        >
          {poster.story.split("\n\n").map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* ---- the gallery ---- */}
      <section
        aria-label={isItinerary ? "槟城行程" : `${label} photographs`}
        className="pt-12 md:pt-16"
      >
        {/* The two outward links belong to a place you might go and look up. The itinerary
            page is about all of them at once and has no single listing to point at; its own
            address, `#/attraction-map`, is in the address bar for the sharing. */}
        {isItinerary ? null : (
          <div className="mb-12 flex flex-wrap items-center justify-center gap-4 px-6 md:mb-16">
            <GalleryLink href={poster.links?.ctrip}>携程</GalleryLink>
            <GalleryLink href={poster.links?.map}>地图</GalleryLink>
          </div>
        )}

        {isItinerary ? (
          <ItineraryPanel onOpenPoster={openBySlug} />
        ) : (
          /* The gap has to clear two die-cut borders, each overhanging its card by 12%, or
             neighbouring perforations interlock.
             The card is sized well under the viewport on purpose: on a narrow phone a
             card that filled the screen would leave nothing on screen to hint that the
             strip drags sideways at all.
             `pt` clears that same 12% overhang at the *top* of each card. Setting
             `overflow-x-auto` and leaving `overflow-y` alone doesn't leave it visible —
             the CSS spec computes an unset `overflow-y` to `auto` as soon as its partner
             axis scrolls, so the strip clips vertically too, and with no top padding that
             clip line lands right through the die-cut border. */
          <GalleryStrip className="gap-[clamp(76px,19vw,112px)] px-[clamp(1.5rem,7vw,5rem)] pt-[clamp(36px,9vw,58px)] pb-4">
            {slides.map((basename, i) => (
              <div key={`${basename}-${i}`} className="w-[min(55vw,340px)] shrink-0">
                <PosterPlate
                  src={posterImage(basename)}
                  alt={i === 0 ? label : `${label} — ${i + 1}`}
                  // The first three. Slide 0 is the poster artwork, already in cache from
                  // the hero above it; 1 and 2 are the two the first drags land on, and
                  // waiting until they are in view is what made a swipe feel slow.
                  eager={i < 3}
                  lettering={i === 0 && poster.lettering !== false}
                  captionClass={poster.caption === "slate" ? "text-slate-print" : "text-dust"}
                  objectPosition={i === 0 ? poster.focus : undefined}
                />
              </div>
            ))}
          </GalleryStrip>
        )}

        {/* The second join. A deckle rather than a rip, so the page does not tear the same
            way twice — and in the next stamp's colour, which is what starts its panel. */}
        <div className="relative mt-16 md:mt-20">
          <TornEdge color={next.ground} variant="deckle" style={{ height: TEAR_H }} />
        </div>
      </section>

      {/* ---- the next stamp, on its own ground ---- */}
      <section
        className="relative overflow-hidden pt-8 text-center md:pt-12"
        style={{ backgroundColor: next.ground }}
      >
        <div className="px-6">
          {next.words.map((word, i) =>
            word ? (
              <div
                key={i}
                className={titleClass}
                style={{ color: next.title, fontSize: titleSize(word) }}
              >
                {word}
              </div>
            ) : null,
          )}
          <p className={cn(labelClass, "mt-6")}>
            {next.place} - {next.coords}
          </p>

          <button type="button" onClick={() => onNavigate(next)} className={cn(pillClass, "mt-10")}>
            下一页
          </button>
        </div>

        {/* The teaser: the whole next stamp, turned anticlockwise and standing on the foot
            of the page, with only its top showing. The stamp itself is untouched — the
            wrapper is simply shorter than it is, and the page ends there.
            The headroom matters. Turning about the top edge swings the far corner *up*,
            and the die-cut border already overhangs the artwork by 12%, so without it the
            wrapper's own top edge shears off the corner and the cast shadow with it. */}
        <button
          type="button"
          onClick={() => onNavigate(next)}
          aria-label={`Open ${`${next.words[0]} ${next.words[1]}`.trim()}`}
          className="mt-6 block w-full cursor-pointer overflow-hidden [--ml-lift:calc(var(--plate)*0.26)] [--plate:min(62vw,300px)]"
          // 1.333 is the stamp's height as a multiple of its width; 0.7 of that is what the
          // page shows, and the lift is the room the rotated corner needs above it.
          style={{
            height: "calc(var(--plate) * 1.333 * 0.7 + var(--ml-lift))",
            paddingTop: "var(--ml-lift)",
          }}
        >
          <div className="mx-auto w-[var(--plate)] origin-top -rotate-[9deg]">
            <PosterPlate
              src={posterSrc(next)}
              alt=""
              lettering={next.lettering !== false}
              captionClass={next.caption === "slate" ? "text-slate-print" : "text-dust"}
              objectPosition={next.focus}
            />
          </div>
        </button>
      </section>

      <button
        type="button"
        onClick={close}
        className={cn(
          // Fixed to the viewport, bottom right — clear of the nav, which sits above this
          // page and owns the top corners.
          "fixed right-4 bottom-4 z-3 cursor-pointer rounded-full px-4 py-2 font-neue-montreal text-[13.05px] font-bold text-dust uppercase transition-opacity duration-300 lg:right-6 lg:bottom-6",
          landed ? "opacity-100" : "opacity-0",
        )}
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      >
        Close
      </button>
    </div>
  );
}
