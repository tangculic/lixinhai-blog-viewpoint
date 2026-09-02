"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

import { SiteHeader, type SiteView } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/SiteHeader";
import { StampDefs } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/stamp/StampDefs";
import { StampGate } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampGate";
import { POSTERS, type Poster } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/posters";

/**
 * Neither of these is on screen when the page opens, and between them they carry the
 * gallery, the plates and the torn joins — none of which the cover or the reel need.
 *
 * Hydration is what stands between the page appearing and the cover answering a tap, and
 * it has to bring up every statically imported component whether or not it is showing.
 * Split out, the first tap waits on the cover and the reel alone.
 */
const loadSheet = () =>
  import("@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/ContactSheet").then(
    (m) => m.ContactSheet,
  );
const loadDetail = () =>
  import("@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/PosterDetail").then(
    (m) => m.PosterDetail,
  );

const ContactSheet = dynamic(loadSheet, { ssr: false });
const PosterDetail = dynamic(loadDetail, { ssr: false });

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
  /**
   * The sheet is mounted permanently once it has been asked for — closing it is a matter
   * of which view is on top — but it is not mounted before that, or splitting it out
   * would only move its download, not defer it.
   */
  const [sheetWanted, setSheetWanted] = useState(false);
  /**
   * Set once, on load, when the address names a poster. The cover is skipped in that case:
   * someone following a link to a page does not want to be shown the front door first.
   */
  const [deepLinked, setDeepLinked] = useState(false);

  // Both chunks are fetched as soon as the browser is doing nothing else, so the split
  // costs a background request while the visitor reads the cover rather than a wait on
  // the tap that needs them. `requestIdleCallback` is still missing on Safari; a short
  // timeout is close enough for something with no deadline.
  useEffect(() => {
    const warm = () => {
      void loadDetail();
      void loadSheet();
    };
    const idle = window.requestIdleCallback;
    if (idle) {
      const handle = idle(warm, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(warm, 1200);
    return () => window.clearTimeout(handle);
  }, []);

  /**
   * `#/<slug>` is a poster's address.
   *
   * The whole collection is one document with the pages layered over it, so there are no
   * routes to give them — and a static export has no server to invent any. The hash is
   * written with `replaceState` rather than by assigning to `location.hash`: assignment
   * fires `hashchange`, which would read the slug straight back and re-open the page as an
   * arrival, cancelling the flight the tap just started.
   */
  const syncHash = useCallback((slug: string | null) => {
    const { pathname, search } = window.location;
    window.history.replaceState(null, "", slug ? `#/${slug}` : `${pathname}${search}`);
  }, []);

  useEffect(() => {
    const slug = window.location.hash.replace(/^#\/?/, "");
    const poster = POSTERS.find((p) => p.slug === slug);
    if (!poster) return;
    // Out of band rather than straight away: this runs while the tree is still hydrating,
    // and opening the page from inside that pass is a render cascading over the one the
    // cover is already doing.
    //
    // A timer rather than `requestAnimationFrame`, which is what this was: a link opened in
    // a background tab arrives on a document that is never painted, so the frame callback
    // is never called and the page sat on the cover for as long as the tab stayed hidden.
    const handle = window.setTimeout(() => {
      setOpened({ poster, from: null });
      setDeepLinked(true);
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  const open = useCallback(
    (poster: Poster, from: DOMRect) => {
      setOpened({ poster, from });
      syncHash(poster.slug);
    },
    [syncHash],
  );

  // "Scopri" moves between poster pages. There is no stamp on screen to grow out of, so
  // the next page arrives without a flight rather than pretending to unfold from nothing.
  const navigate = useCallback(
    (poster: Poster) => {
      setOpened({ poster, from: null });
      syncHash(poster.slug);
    },
    [syncHash],
  );

  const close = useCallback(() => {
    setOpened(null);
    syncHash(null);
  }, [syncHash]);

  // The nav sits above an opened poster, so switching view has to put it away — otherwise
  // the poster would still be covering whichever view you just asked for.
  const changeView = useCallback(
    (next: SiteView) => {
      close();
      setView(next);
      if (next === "all") setSheetWanted(true);
    },
    [close],
  );

  return (
    <>
      {/* The stamp geometry, once for the whole document. Everything that draws a stamp
          — the reel, the sheet, every gallery slide — points at this. */}
      <StampDefs />

      <StampGate onOpenPoster={open} skipCover={deepLinked} />
      {sheetWanted ? <ContactSheet open={view === "all"} onOpenPoster={open} /> : null}
      <SiteHeader view={view} onView={changeView} />

      {opened ? (
        <PosterDetail
          // Keyed by slug so opening a second poster restarts the flight rather than
          // re-animating the first one's element to a new destination.
          key={opened.poster.slug}
          poster={opened.poster}
          from={opened.from}
          onClose={close}
          onNavigate={navigate}
        />
      ) : null}
    </>
  );
}
