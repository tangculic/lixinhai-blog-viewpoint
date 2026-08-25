"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import {
  COVER_POSTER,
  COVER_SRC,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";
import { MountainPeaksIcon } from "@/components/sites/francobollimontilessini-d2eadb58/shared/icons";

const HEADING_LINES = ["TRAVEL", "TOGETHER"] as const;

// Precompute a global stagger index per letter (flattened across both lines) so the
// entrance animation delay can be derived without mutating state during render.
const HEADING_LETTERS = HEADING_LINES.reduce<string[][]>((lines, line) => {
  lines.push(line.split(""));
  return lines;
}, []);
const LINE_START_INDEX = HEADING_LETTERS.reduce<number[]>((starts, letters, i) => {
  starts.push(i === 0 ? 0 : starts[i - 1] + HEADING_LETTERS[i - 1].length);
  return starts;
}, []);

interface HeroCoverProps {
  /**
   * The poster's clipping box. The opening transition drives this element's geometry
   * directly, shrinking the full-bleed poster down onto the centred stamp.
   */
  posterRef?: React.Ref<HTMLDivElement>;
  /** Fired when the visitor asks to open the collection. */
  onOpen?: () => void;
  /** True once the cover is on its way out: the lettering clears off ahead of the poster. */
  exiting?: boolean;
}

/**
 * Full-viewport "cover" hero: poster image, entrance backdrop fade, mountain icon,
 * eyebrow row, giant per-letter heading, spread subtitle, and description.
 */
export function HeroCover({ posterRef, onOpen, exiting = false }: HeroCoverProps) {
  return (
    <section className="fixed inset-0 z-10 overflow-hidden">
      {/* Ground, so nothing shows through before the poster paints. It has to clear out
          with the lettering: while it is opaque it hides the canvas underneath, and the
          poster then appears to shrink over nothing instead of into the collection. */}
      <div
        className={cn(
          "absolute inset-0 bg-lawn transition-opacity duration-300 ease-out",
          exiting && "opacity-0",
        )}
      />

      {/* Poster layer */}
      <div ref={posterRef} className="absolute inset-0">
        <Image
          src={COVER_SRC}
          alt="Illustrated poster of a Malaysian beach at dusk — a pale sun over golden sand and a boat on calm water"
          fill
          priority
          className="object-cover"
          // The same crop anchor the stamp uses. The flight animates one element's box
          // from the cover's shape to the stamp's; if the two framed the photo
          // differently, the moment of arrival would be a jump rather than a landing.
          style={{ objectPosition: COVER_POSTER.focus }}
          sizes="100vw"
        />
      </div>

      {/* Entrance backdrop — fades from black to transparent on mount, then stays invisible */}
      <div
        className="absolute inset-0 z-[5] bg-black mix-blend-multiply pointer-events-none opacity-0"
        style={{ animation: "ml-backdrop-fade 900ms ease-out both" }}
      />

      {/* Everything above the poster clears out first, so the poster shrinks into a
          canvas that is already legible behind it. */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-300 ease-out",
          exiting && "pointer-events-none opacity-0",
        )}
      >
        {/* Title block
            Below `lg`, the eyebrow row and subtitle are pinned to the heading by the same
            offsets as desktop, but mobile's smaller icon and type leave far less pixel
            room to absorb them — the rows end up reading into the icon and into each
            other. `mb-11`/`-top-8`/`-bottom-14` (all `lg:`-restored below) just give the
            mobile stack more air; desktop is untouched.

            The mobile `pb` rides on that same `justify-center`: padding shrinks the box
            the stack is centred in, so the whole title lifts by half of it. It is in `vh`
            rather than a fixed step because what it is clearing is a share of the screen
            — the poster's horizon, which sits at a fixed fraction of the artwork — and a
            pixel value would land differently on a short phone than on a tall one. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-[12vh] md:pb-40 text-center px-4">
          <MountainPeaksIcon className="w-[140px] h-[46px] lg:w-[223px] lg:h-[74px] max-lg:h-12 text-dust mb-11 lg:mb-2" />

          <div className="relative w-full max-w-3xl">
            {/* Eyebrow row */}
            <div className="absolute left-0 right-0 -top-8 lg:-top-16 flex justify-between overflow-hidden px-4 lg:px-2">
              <div
                className="font-neue-montreal font-bold text-[13px] lg:text-[23.2px] uppercase text-dust"
                style={
                  {
                    "--ml-row-from": "-100%",
                    animation: "ml-row-in 600ms cubic-bezier(0.16,1,0.3,1) 100ms both",
                  } as React.CSSProperties
                }
              >
                MALAYSIA
              </div>
              <div
                className="font-neue-montreal font-bold text-[13px] lg:text-[23.2px] uppercase text-dust"
                style={
                  {
                    "--ml-row-from": "-100%",
                    animation: "ml-row-in 600ms cubic-bezier(0.16,1,0.3,1) 100ms both",
                  } as React.CSSProperties
                }
              >
                2026
              </div>
            </div>

            {/* Heading */}
            {/* "TOGETHER" is a letter longer than the source's widest line, so the type
                scale steps down a notch to keep both lines inside the viewport.
                Leading opens up below `lg`. 0.8 is set for the desktop line, where the
                type is large enough that two lines nearly touching still read as one
                block; at phone size the same ratio closes the gap to a few pixels and
                the two words start to read as one solid slab. */}
            <h1 className="font-cenzo-flare font-black uppercase leading-[0.92] lg:leading-[0.8] tracking-wider text-center text-[15vw] lg:text-[11.5vw] text-dust">
              {HEADING_LETTERS.map((letters, lineIndex) => (
                <div key={HEADING_LINES[lineIndex]} className="whitespace-nowrap flex justify-center">
                  {letters.map((char, i) => {
                    const delay = (LINE_START_INDEX[lineIndex] + i) * 25;
                    return (
                      <span
                        key={i}
                        className="inline-block opacity-0"
                        style={{
                          animation: `ml-letter-in 500ms cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              ))}
            </h1>

            {/* Subtitle row — letters spread edge-to-edge, matching the site's tracked-out look */}
            <div
              className="absolute left-0 right-0 -bottom-14 lg:-bottom-16 flex justify-between overflow-hidden px-4 lg:px-2"
              style={
                {
                  "--ml-row-from": "100%",
                  animation: "ml-row-in 600ms cubic-bezier(0.16,1,0.3,1) 150ms both",
                } as React.CSSProperties
              }
            >
              {"IN PENANG&KL".split("").map((char, i) => (
                <span key={i} className="font-neue-montreal text-[11.6px] uppercase text-dust">
                  {char === " " ? "  " : char}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          className="absolute bottom-16 md:bottom-24 left-0 right-0 text-center max-w-2xl mx-auto max-md:px-8 opacity-0"
          style={{ animation: "ml-fade-in 500ms ease-out 450ms both" }}
        >
          <p className="font-neue-montreal font-bold text-[13.05px] uppercase leading-[1.5] text-dust">
            LET&apos;S TRAVEL TOGETHER, WATCH THE SUNSET AT THE BEACH, SEE WORLD HERITAGE SITES,
            AND EXPLORE THE CITY CENTER.
          </p>
        </div>
      </div>

      {/* The whole cover is the affordance — clicking anywhere opens the collection. */}
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          disabled={exiting}
          aria-label="Open the stamp collection"
          className="absolute inset-0 z-20 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-dust"
        />
      ) : null}
    </section>
  );
}
