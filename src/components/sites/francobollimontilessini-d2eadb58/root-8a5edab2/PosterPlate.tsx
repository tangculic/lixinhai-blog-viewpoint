import Image from "next/image";

import { cn } from "@/lib/utils";
import { StampFrame } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampFrame";
import { StampPrint } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampPrint";
import { StampShadow } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampShadow";

interface PosterPlateProps {
  src: string;
  alt: string;
  /** Print the "ITALIA" wordmark over the artwork. Only the Italian stamp wants it. */
  lettering?: boolean;
  /** Tint for the printed caption. */
  captionClass?: string;
  objectPosition?: string;
  /**
   * Fetch immediately instead of waiting to come into view.
   *
   * For the slides just off the right edge of the strip. Lazy loading measures against
   * the viewport, and a slide one drag away is outside it, so the fetch only starts once
   * the swipe has already happened — which is exactly the wait it is supposed to avoid.
   */
  eager?: boolean;
  className?: string;
}

/**
 * A stamp with no behaviour: die-cut border, artwork, cast shadow.
 *
 * `StampCard` is the interactive one — it tilts, it opens, it reports its photo box
 * upwards. The opened page needs the same object several times over as plain decoration
 * (every gallery slide, and the tilted teaser at the foot of the page), and none of that
 * machinery with it.
 */
export function PosterPlate({
  src,
  alt,
  lettering = false,
  captionClass,
  objectPosition,
  eager = false,
  className,
}: PosterPlateProps) {
  return (
    <div className={cn("relative aspect-[496/661]", className)}>
      <StampShadow className="absolute top-4 left-8 z-0 w-[110%]" />

      <div className="absolute inset-0 z-5 overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 340px, 55vw"
          loading={eager ? "eager" : "lazy"}
          className="object-cover"
          style={{ objectPosition }}
          // Native image dragging would hijack the strip's own drag on the first move.
          draggable={false}
        />
      </div>

      {lettering ? <StampPrint className={cn("absolute inset-0 z-5", captionClass)} /> : null}
      <StampFrame className="absolute top-[-12%] left-[-12%] z-1 w-[124%]" />
    </div>
  );
}
