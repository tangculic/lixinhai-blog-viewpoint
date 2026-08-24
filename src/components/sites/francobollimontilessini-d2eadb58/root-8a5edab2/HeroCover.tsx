"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/asset-path";
import { MountainPeaksIcon } from "@/components/sites/francobollimontilessini-d2eadb58/shared/icons";

const HEADING_LINES = ["MONTI", "LESSINI"] as const;

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
          src={assetPath("/sites/francobollimontilessini-d2eadb58/root-8a5edab2/poster-passo-malera.jpg")}
          alt="Passo Malera — illustrated poster of green hills, a mountain house, and grazing cows under a blue sky"
          fill
          priority
          className="object-cover object-top"
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
        {/* Title block */}
        <div className="absolute inset-0 flex flex-col items-center justify-center md:pb-40 text-center px-4">
          <MountainPeaksIcon className="w-[140px] h-[46px] lg:w-[223px] lg:h-[74px] max-lg:h-12 text-dust mb-2" />

          <div className="relative w-full max-w-3xl">
            {/* Eyebrow row */}
            <div className="absolute left-0 right-0 -top-10 lg:-top-16 flex justify-between overflow-hidden px-2">
              <div
                className="font-neue-montreal font-bold text-[13px] lg:text-[23.2px] uppercase text-dust"
                style={
                  {
                    "--ml-row-from": "-100%",
                    animation: "ml-row-in 600ms cubic-bezier(0.16,1,0.3,1) 100ms both",
                  } as React.CSSProperties
                }
              >
                ITALY
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
            <h1 className="font-cenzo-flare font-black uppercase leading-[0.8] tracking-wider text-center text-[20vw] lg:text-[14vw] text-dust">
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
              className="absolute left-0 right-0 -bottom-8 lg:-bottom-16 flex justify-between overflow-hidden px-2"
              style={
                {
                  "--ml-row-from": "100%",
                  animation: "ml-row-in 600ms cubic-bezier(0.16,1,0.3,1) 150ms both",
                } as React.CSSProperties
              }
            >
              {"IN FRANCOBOLLI".split("").map((char, i) => (
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
            I luoghi più iconici della Lessinia raccontati da dei francobolli, oggetti di per sé
            liberi, reinterpretati attraverso la lente delle storie che ci appartengono.
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
