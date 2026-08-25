"use client";

import { useCallback, useState } from "react";

import { ContactSheet } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/ContactSheet";
import { PosterDetail } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/PosterDetail";
import { SiteHeader, type SiteView } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/SiteHeader";
import { StampGate } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampGate";
import type { Poster } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/** An open poster, together with the stamp box it was opened from — if there was one. */
interface Opened {
  poster: Poster;
  from: DOMRect | null;
}

/**
 * The page's three states in one place: the index canvas, the "All" sheet over it, and a
 * poster opened out over either.
 *
 * Both views stay mounted for the whole visit — switching is a matter of which one is on
 * top — so "Index" always returns to the stamp the canvas was left on rather than
 * replaying the cover.
 */
export function StampSite() {
  const [view, setView] = useState<SiteView>("index");
  const [opened, setOpened] = useState<Opened | null>(null);

  const open = useCallback((poster: Poster, from: DOMRect) => {
    setOpened({ poster, from });
  }, []);

  // "Scopri" moves between poster pages. There is no stamp on screen to grow out of, so
  // the next page arrives without a flight rather than pretending to unfold from nothing.
  const navigate = useCallback((poster: Poster) => {
    setOpened({ poster, from: null });
  }, []);

  // The nav sits above an opened poster, so switching view has to put it away — otherwise
  // the poster would still be covering whichever view you just asked for.
  const changeView = useCallback((next: SiteView) => {
    setOpened(null);
    setView(next);
  }, []);

  return (
    <>
      <StampGate onOpenPoster={open} />
      <ContactSheet open={view === "all"} onOpenPoster={open} />
      <SiteHeader view={view} onView={changeView} />

      {opened ? (
        <PosterDetail
          // Keyed by slug so opening a second poster restarts the flight rather than
          // re-animating the first one's element to a new destination.
          key={opened.poster.slug}
          poster={opened.poster}
          from={opened.from}
          onClose={() => setOpened(null)}
          onNavigate={navigate}
        />
      ) : null}
    </>
  );
}
