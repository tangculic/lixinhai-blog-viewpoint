"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  PENANG_BOUNDS,
  PENANG_PLACES,
  distanceKm,
  type Place,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/penang-places";

const labelClass = "font-neue-montreal text-[11.6px] font-bold uppercase";

/**
 * The atlas panel: every place in the collection pinned on Penang, pannable and zoomable
 * inside the island's own bounds and no further.
 *
 * Leaflet is loaded on demand rather than imported at the top, for two reasons. It touches
 * `window` as it initialises, so it cannot be part of a statically pre-rendered page at
 * all; and it is the heaviest thing on the site, which only one of ten poster pages has
 * any use for.
 *
 * Pins are `divIcon`s — plain markup we style ourselves. Leaflet's stock marker is a PNG
 * referenced by a relative URL, which breaks under this build's base path, and a bitmap
 * pin would sit oddly on a page made of flat colour anyway.
 */
export function PenangMap({ onOpenPoster }: { onOpenPoster?: (slug: string) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  /** The places picked for measuring, oldest first, at most two. */
  const [picked, setPicked] = useState<Place[]>([]);

  // The map instance and the line between the two picks, both outside React: Leaflet owns
  // this subtree, and re-rendering it is not something React can help with.
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const lineRef = useRef<import("leaflet").Polyline | null>(null);
  /** Latest picks, readable from the marker handlers without re-binding them. */
  const pickedRef = useRef<Place[]>([]);
  pickedRef.current = picked;

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !hostRef.current) return;
      leafletRef.current = L;

      const bounds = L.latLngBounds(
        [PENANG_BOUNDS.south, PENANG_BOUNDS.west],
        [PENANG_BOUNDS.north, PENANG_BOUNDS.east],
      );

      map = L.map(hostRef.current, {
        maxBounds: bounds,
        // Nothing springs back: the island is the whole world here.
        maxBoundsViscosity: 1,
        minZoom: 10,
        maxZoom: 17,
        zoomControl: true,
        scrollWheelZoom: false, // The page is long; the wheel belongs to it.
        attributionControl: true,
      });
      map.fitBounds(bounds);
      mapRef.current = map;

      // Carto rather than Amap. Amap answers 200 for tiles anywhere on earth, but outside
      // mainland China every one of them is the same 179-byte fully transparent PNG — it
      // simply has no data for Malaysia. That is why this panel drew pins, zoom buttons
      // and an attribution line over an empty sheet: the tiles were arriving, and they
      // were blank. Checked directly: Penang and KL return 179 bytes at every zoom, the
      // same request over Beijing returns ~12KB of real map.
      //
      // Carto's basemaps are global, sit on Fastly (reachable from the mainland, where
      // most of this page's readers are, unlike openstreetmap.org's own servers), and
      // Voyager's warm paper-and-water palette sits closer to this collection's flat
      // colour than the near-white Positron sheet would.
      //
      // Carto serves plain WGS-84 — no GCJ-02 shift to undo — so the coordinates in
      // `penang-places` are used exactly as written.
      const carto = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          attribution: "&copy; OpenStreetMap &copy; CARTO",
          maxZoom: 20,
        },
      ).addTo(map);

      // If Carto turns out to be unreachable after all, fall back rather than leave the
      // same blank sheet behind. A handful of failures is normal on a flaky connection —
      // it takes a sustained run of them, across the whole visible screenful, to switch.
      let failures = 0;
      carto.on("tileerror", () => {
        if (++failures < 12 || !map) return;
        carto.off("tileerror");
        map.removeLayer(carto);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        }).addTo(map);
      });

      for (const place of PENANG_PLACES) {
        const icon = L.divIcon({
          className: "",
          html: `<span class="ml-pin" data-id="${place.id}"><b class="ml-pin-dot"></b><span class="ml-pin-label">${place.name}</span></span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });
        const marker = L.marker([place.lat, place.lng], { icon, title: place.english }).addTo(map);

        // Listened for on the pin itself rather than through `marker.on("click")`.
        // Leaflet's version routes the event through the map's own delegation, which
        // needs a genuine pointer behind it; this fires for anything that reaches the
        // element, keyboard and assistive tooling included.
        const el = marker.getElement();
        el?.addEventListener("click", (event) => {
          event.stopPropagation();
          setPicked((current) => {
            // Two is the most a measurement needs; a third starts a new pair.
            if (current.some((p) => p.id === place.id)) {
              return current.filter((p) => p.id !== place.id);
            }
            return current.length >= 2 ? [place] : [...current, place];
          });
        });
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // The line between the two picks lives and dies with the pair.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    lineRef.current?.remove();
    lineRef.current = null;

    if (picked.length === 2) {
      lineRef.current = L.polyline(
        picked.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#F9CD6C", weight: 3, dashArray: "8 8" },
      ).addTo(map);
    }
  }, [picked]);

  // Pin styling. Kept here rather than in the global sheet because it describes markup
  // that only this component creates, as a string, where Tailwind cannot see it.
  const pinStyles = `
    .ml-pin { position:absolute; transform:translate(-50%,-100%); display:flex; flex-direction:column;
      align-items:center; gap:2px; cursor:pointer; white-space:nowrap; }
    .ml-pin-dot { width:13px; height:13px; border-radius:9999px; background:#DF6A69;
      border:2.5px solid #F2EEDE; box-shadow:0 2px 6px rgba(0,0,0,.35); order:2; }
    .ml-pin-label { order:1; font-family:var(--font-neue-montreal),sans-serif; font-weight:700;
      font-size:11px; line-height:1; color:#20303f; background:#F2EEDE; padding:4px 7px;
      border-radius:9999px; box-shadow:0 2px 8px rgba(0,0,0,.28); }
    .ml-pin[data-picked="true"] .ml-pin-dot { background:#F9CD6C; transform:scale(1.25); }
    .ml-pin[data-picked="true"] .ml-pin-label { background:#F9CD6C; }
    /* The ground behind a tile that has not arrived yet — Voyager's own water tone, so
       the gap during loading reads as sea rather than as a hole. */
    .leaflet-container { background:#cfe0e4; font-family:var(--font-neue-montreal),sans-serif; }
  `;

  // Leaflet owns the pin nodes, so the picked state is written onto them directly.
  useEffect(() => {
    const ids = new Set(picked.map((p) => p.id));
    for (const node of document.querySelectorAll<HTMLElement>(".ml-pin")) {
      node.dataset.picked = String(ids.has(node.dataset.id ?? ""));
    }
  }, [picked]);

  const pair = picked.length === 2 ? picked : null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 md:px-10">
      <style>{pinStyles}</style>

      {/* The mat: a cream border in the collection's own dust tone, echoing the stamp's
          own die-cut border rather than borrowing a generic card frame. */}
      <div className="relative rounded-2xl bg-dust/15 p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] ring-1 ring-dust/40 md:p-3">
        <div className="relative overflow-hidden rounded-lg ring-1 ring-black/15">
          <div ref={hostRef} className="h-[clamp(340px,62vh,620px)] w-full bg-black/10" />
          {!ready ? (
            <p
              className={cn(
                labelClass,
                "absolute inset-0 flex items-center justify-center text-dust",
              )}
            >
              Loading map…
            </p>
          ) : null}
        </div>
      </div>

      {/* The measurement. Two pins picked, one distance — and a way back to a clean map. */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className={cn(labelClass, "text-dust/80")}>
          {pair
            ? `${pair[0].name} → ${pair[1].name} · ${distanceKm(pair[0], pair[1]).toFixed(1)} km`
            : picked.length === 1
              ? `${picked[0].name} — pick one more to measure`
              : "Tap two places to measure the distance between them"}
        </p>

        <div className="flex gap-3">
          {picked.length === 1 && picked[0].slug && onOpenPoster ? (
            <button
              type="button"
              onClick={() => onOpenPoster(picked[0].slug as string)}
              className="cursor-pointer rounded-full border border-dust/70 px-5 py-2 font-neue-montreal text-[11.6px] font-bold text-dust uppercase transition-colors duration-200 hover:bg-dust hover:text-black"
            >
              打开邮票
            </button>
          ) : null}
          {picked.length ? (
            <button
              type="button"
              onClick={() => setPicked([])}
              className="cursor-pointer rounded-full border border-dust/40 px-5 py-2 font-neue-montreal text-[11.6px] font-bold text-dust/80 uppercase transition-colors duration-200 hover:border-dust/70 hover:text-dust"
            >
              清除
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
