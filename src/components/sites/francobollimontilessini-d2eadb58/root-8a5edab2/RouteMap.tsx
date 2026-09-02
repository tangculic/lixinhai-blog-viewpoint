"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Route, Stop } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/itinerary";

/** A car and a walker, drawn small enough to sit inside an 11px label. */
const MODE_ICON = {
  car: '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="currentColor" d="M5 11l1.6-4.6A1.5 1.5 0 0 1 8 5.4h8a1.5 1.5 0 0 1 1.4 1L19 11v6h-2v-1.6H7V17H5v-6Zm2.2-.8h9.6l-1-2.9H8.2l-1 2.9ZM8 14.6a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Zm8 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"/></svg>',
  walk: '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.4" cy="4.4" r="1.9" fill="currentColor" stroke="none"/><path d="M12.6 8.4 9.8 10.6 8.7 13.6M12.6 8.4l2.3 1.7.9 2.7M12.6 8.4l-.7 4.4 2.5 2.7.7 4.1M11.9 12.8 9 16.4l-.7 3.6"/></g></svg>',
} as const;

/**
 * Points east; each arrow marker rotates it onto its line's own bearing.
 *
 * Filled in the day's colour and outlined in the page's cream, so it reads as an arrow
 * against a pale road, a green park or blue water alike — a bare triangle in the line's own
 * colour disappeared into the line.
 */
const ARROW =
  '<svg viewBox="0 0 20 16" width="19" height="15" aria-hidden="true"><path d="M2.4 1.5 17 8 2.4 14.5 5.6 8Z" fill="currentColor" stroke="#F2EEDE" stroke-width="1.6" stroke-linejoin="round"/></svg>';

/** Roughly how far apart the arrowheads march along a line, in pixels. */
const ARROW_SPACING = 78;
const ARROW_MAX = 5;

/**
 * Half the gap between the two lines of an out-and-back, in pixels. Each leg slides this
 * far to the left of its own direction of travel, so the pair ends up in its own lane
 * rather than as two arrowheads pointing opposite ways along one stroke.
 */
const LANE = 5.5;

/**
 * Where a distance label may stand relative to its own line, in pixels along the line's
 * normal. The first rung is the left-hand side of travel; the sign then flips so a label
 * tries the far side before travelling any further out.
 *
 * Every rung is far enough out to leave a visible length of leader between the line and the
 * chip — the whole ladder is drawn with one, so a label always says which leg it belongs
 * to, not only the ones that had to be parked clear of a crowd.
 */
const LABEL_OFFSETS = [40, -40, 58, -58, 78, -78, 100, -100, 124, -124];

/**
 * How far a distance label may slide along its own leg, as a fraction of the leg, from
 * wherever the data put it. Sideways room alone runs out on a phone, where the whole island
 * fits at a zoom that leaves ten chips fighting over a few hundred pixels.
 */
const ALONG = [0, -0.15, 0.15, -0.28, 0.28, -0.38, 0.38, -0.46, 0.46];

/** The dark of the distance chip. The leader and its anchor dot are drawn to match it. */
const CHIP_INK = "#1A2836";

/** The four places a name can hang, in the order a crowded one tries them. */
const SIDES = ["up", "down", "right", "left"] as const;
type Side = (typeof SIDES)[number];

/**
 * Roughly how wide a run of text prints, without laying it out.
 *
 * Only used to keep labels off each other, where being a few pixels out costs nothing. A
 * CJK glyph is square at the nominal size; Latin and digits run a little over half that.
 */
const textWidth = (text: string, size: number) => {
  let w = 0;
  for (const ch of text) w += /[⺀-￿]/.test(ch) ? size : size * 0.58;
  return w;
};

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.y - b.y) < (a.h + b.h) / 2;

/**
 * Whether a label's box stands clear of a line.
 *
 * Measured from the box's edge, not from its centre. Testing whether the line falls inside
 * the box's own rectangle is the obvious version and it is wrong on a diagonal: a label set
 * 27px off a line running at 45° is genuinely clear of it, but the corner of its axis-
 * aligned rectangle reaches back over the line, and every label on the map ended up shoved
 * out to the far end of the ladder because of it.
 *
 * `reach` is how far the rectangle extends in the direction of the line — the width where
 * the line is horizontal, the height where it is vertical, and the mix between.
 */
const clearsLine = (x1: number, y1: number, x2: number, y2: number, box: Box, pad = 2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((box.x - x1) * dx + (box.y - y1) * dy) / len2)) : 0;
  const vx = box.x - (x1 + dx * t);
  const vy = box.y - (y1 + dy * t);
  const dist = Math.hypot(vx, vy);
  if (dist === 0) return false;
  const reach = (Math.abs(vx) / dist) * (box.w / 2) + (Math.abs(vy) / dist) * (box.h / 2);
  return dist > reach + pad;
};

/**
 * Markup this component writes as a string, where Tailwind cannot reach it. Injected once
 * per map instance; duplicate rules across several maps on a page are harmless.
 *
 * Pins and leg labels are hung off a zero-size box sitting exactly on their coordinate, and
 * every part is placed from there: the dot is centred on the point, and the name is pushed
 * to whichever side of it `labelSide` asks for.
 *
 * The two kinds of label are deliberately opposite. A place is a cream lozenge, the same
 * paper as the rest of the collection; a distance is a dark slate chip edged in its day's
 * colour. Nothing about them is confusable at a glance, which they were when both were
 * cream pills.
 */
const mapStyles = `
  .ml-rm-pin { position:absolute; cursor:pointer; }
  .ml-rm-dot { position:absolute; left:0; top:0; display:grid; place-items:center;
    width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:9999px;
    background:var(--ml-pin,#DF6A69); border:2.5px solid #F2EEDE;
    box-shadow:0 2px 6px rgba(0,0,0,.4); font-size:10px; font-weight:700; color:#20303f;
    line-height:1; }
  .ml-rm-dot[data-plain="1"] { width:14px; height:14px; margin:-7px 0 0 -7px; }
  .ml-rm-label { position:absolute; white-space:nowrap;
    font-family:var(--font-neue-montreal),sans-serif; font-weight:700; font-size:11px;
    line-height:1; color:#20303f; background:#F2EEDE; padding:4px 7px; border-radius:9999px;
    box-shadow:0 2px 8px rgba(0,0,0,.28); }
  .ml-rm-pin[data-compact="1"] .ml-rm-label { font-size:10px; padding:3px 6px; }
  /* Narrow container, not narrow viewport: several of these maps sit at different widths on
     the same page, so a media query would size the wrong ones. The flag is set per pin from
     the map's own measured width. */
  .ml-rm-pin[data-narrow="1"] .ml-rm-label { font-size:10px; padding:3px 5px; }
  .ml-rm-pin[data-narrow="1"][data-compact="1"] .ml-rm-label { font-size:9px; padding:2px 5px; }
  .ml-rm-pin[data-side="up"]    .ml-rm-label { left:0; bottom:14px; transform:translateX(-50%); }
  .ml-rm-pin[data-side="down"]  .ml-rm-label { left:0; top:14px;    transform:translateX(-50%); }
  .ml-rm-pin[data-side="left"]  .ml-rm-label { right:14px; top:0;   transform:translateY(-50%); }
  .ml-rm-pin[data-side="right"] .ml-rm-label { left:14px;  top:0;   transform:translateY(-50%); }
  .ml-rm-pin:hover .ml-rm-label { background:#F9CD6C; }

  .ml-rm-arrow { position:absolute; left:0; top:0; display:block; pointer-events:none;
    color:var(--ml-leg,#F9CD6C); filter:drop-shadow(0 1px 2px rgba(0,0,0,.35)); }

  .ml-rm-leg { position:absolute; pointer-events:none; }
  /* The leader and its anchor dot are the chip's own ink rather than the day's colour: they
     belong to the label, and in the route colour they read as another piece of route. */
  .ml-rm-lead { position:absolute; left:0; top:0; height:0;
    border-top:2.5px dashed ${CHIP_INK}; transform-origin:0 0; }
  .ml-rm-anchor { position:absolute; left:0; top:0; width:7px; height:7px;
    margin:-3.5px 0 0 -3.5px; border-radius:9999px; background:${CHIP_INK};
    box-shadow:0 0 0 1.5px rgba(242,238,222,.9); }
  .ml-rm-pill { position:absolute; left:0; top:0; display:flex; flex-direction:column;
    align-items:center; gap:1px; white-space:nowrap;
    font-family:var(--font-neue-montreal),sans-serif; font-weight:700; font-size:10.5px;
    line-height:1.25; color:#F4F1E6; background:${CHIP_INK};
    border:1.5px solid var(--ml-leg,#F9CD6C); padding:3px 7px; border-radius:7px;
    box-shadow:0 2px 8px rgba(0,0,0,.35); }
  .ml-rm-leg[data-narrow="1"] .ml-rm-pill { font-size:9.5px; padding:2px 6px; }
  .ml-rm-pill-row { display:flex; align-items:center; gap:3px; opacity:.88; }

  /* The ground behind a tile that has not arrived — Voyager's own water tone, so a gap
     while loading reads as sea rather than as a hole. */
  .leaflet-container { background:#cfe0e4; font-family:var(--font-neue-montreal),sans-serif; }
`;

export interface RouteMapProps {
  stops: readonly Stop[];
  routes: readonly Route[];
  /** Print each stop's position in the walk inside its dot. Only means anything on a map
   *  showing one ordered route; three of the island's days pass through the same guest
   *  house and there is no single number to give it. */
  numbered?: boolean;
  /** Smaller names, for the two walks — a dozen stops inside a few hundred metres. */
  compact?: boolean;
  /** CSS length for the map itself. */
  height?: string;
  /** Opens a stamp page, for the stops that have one. */
  onOpenPoster?: (slug: string) => void;
  className?: string;
}

/**
 * A route drawn on Carto's basemap: a coloured line per day, arrowheads marching along it,
 * a distance on every leg, a named pin on every stop, and under the map a legend that
 * switches each day's line on and off plus a button for every place.
 *
 * Leaflet is imported on demand — it touches `window` as it initialises, so it cannot be
 * part of a statically pre-rendered page.
 *
 * Pins are `divIcon`s rather than Leaflet's stock marker: the stock one is a PNG behind a
 * relative URL, which breaks under this build's base path, and a bitmap pin would sit oddly
 * on a page made of flat colour anyway.
 */
export function RouteMap({
  stops,
  routes,
  numbered = false,
  compact = false,
  height = "clamp(300px,52vh,520px)",
  onOpenPoster,
  className,
}: RouteMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  /**
   * True once the map has measured itself and found it is too narrow to carry the walk's
   * distances on the map at all — see the note where it is set.
   */
  const [legsBelow, setLegsBelow] = useState(false);
  /** Day labels the visitor has switched off. */
  const [hidden, setHidden] = useState<readonly string[]>([]);

  const byId = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);

  /** Where a stop sits in the walk — for the numbered dots and the buttons below. */
  const order = useMemo(() => {
    const seen = new Map<string, number>();
    let n = 0;
    for (const route of routes) {
      for (const id of route.stops) if (!seen.has(id)) seen.set(id, ++n);
    }
    return seen;
  }, [routes]);

  /**
   * Every measured leg as a row, for the narrow fallback below the map. Named by number
   * where the pins carry numbers, and by place where they do not — the island map's pins
   * show names, so "1→2" there would refer to something the reader cannot see.
   */
  const legRows = useMemo(
    () =>
      routes.flatMap((route) =>
        (route.legs ?? []).map((leg, i) => ({
          key: `${route.id}-${i}`,
          label: route.label,
          color: route.color,
          from: numbered
            ? String(order.get(route.stops[i]) ?? i + 1)
            : (byId.get(route.stops[i])?.name ?? ""),
          to: numbered
            ? String(order.get(route.stops[i + 1]) ?? i + 2)
            : (byId.get(route.stops[i + 1])?.name ?? ""),
          ...leg,
        })),
      ),
    [routes, order, byId, numbered],
  );

  /** One legend entry per label; 10.6 forks into two routes that share one. */
  const legend = useMemo(() => {
    const seen = new Map<string, Route>();
    for (const route of routes) if (!seen.has(route.label)) seen.set(route.label, route);
    return [...seen.values()];
  }, [routes]);

  const mapRef = useRef<import("leaflet").Map | null>(null);
  /** One layer group per legend entry, so a day can be taken off the map in one move. */
  const groupsRef = useRef(new Map<string, import("leaflet").LayerGroup>());

  /**
   * Read out of the handlers Leaflet owns, so a new `onOpenPoster` does not mean tearing
   * the map down and building it again.
   */
  const openRef = useRef(onOpenPoster);
  openRef.current = onOpenPoster;

  const go = useRef((stop: Stop) => {
    if (stop.slug) {
      openRef.current?.(stop.slug);
      return;
    }
    if (stop.amap) window.open(stop.amap, "_blank", "noopener,noreferrer");
  });

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;
    const groups = groupsRef.current;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !hostRef.current) return;

      const bounds = L.latLngBounds(stops.map((s) => [s.lat, s.lng] as [number, number]));

      map = L.map(hostRef.current, {
        zoomControl: true,
        // The page is long and the map is fitted to its own region already: a wheel or a
        // one-finger drag that started on the map belongs to the page, not to it. Pinch
        // still zooms, and moves the map with it.
        scrollWheelZoom: false,
        dragging: !L.Browser.mobile,
        touchZoom: true,
        attributionControl: true,
        maxZoom: 18,
      });
      // A phone is not a small desktop here. The padding below is what keeps a name inside
      // the frame, but on a 340px-wide map a flat 66px each side is two fifths of the width
      // — enough to cost a zoom level or two, which is exactly what a phone can least
      // afford. So it is a share of the container, capped at the desktop figure.
      const size = map.getSize();
      const narrow = size.x < 560;
      // A phone showing the George Town walk is the case that does not fit at any setting.
      // Its thirteen stops span 1.7km east to west, so `fitBounds` is limited by width, not
      // height — z14 on a 390px screen — and no map that tall or short changes that. The
      // whole walk lands in a band about 240px wide, and twelve two-line distance chips
      // cannot be laid inside it however cleverly they are shuffled; they simply print over
      // each other. So on the narrow walks the distances come off the map and are listed
      // underneath it instead, where they have a line each and are properly readable.
      // The island map is the other one that gives out. It is not `compact`, but on a phone
      // it fits the whole of Penang at z12, and ten chips in that band leave one printing
      // over another however they are shuffled. Days four and five, three and four legs
      // each, have room to spare — so the test is how many legs, not which map.
      const legCount = routes.reduce((n, r) => n + (r.legs?.length ?? 0), 0);
      const pillsOnMap = !(narrow && (compact || legCount > 6));
      setLegsBelow(!pillsOnMap);
      const padX = Math.round(Math.min(66, Math.max(22, size.x * 0.13)));
      const padTop = Math.round(Math.min(42, Math.max(20, size.y * 0.08)));
      const padBottom = stops.some((s) => s.labelSide === "down")
        ? Math.round(Math.min(46, Math.max(22, size.y * 0.085)))
        : Math.round(Math.min(24, Math.max(12, size.y * 0.045)));

      // Room for the pin labels, which stand beside the point they mark.
      //
      // The vertical figure is the one that matters: Penang is twice as tall as it is wide,
      // so height is what `fitBounds` ends up limited by, and every pixel spent on padding
      // there can cost a whole zoom level — at which point the names collapse into one
      // another and the map stops being readable at all.
      map.fitBounds(bounds, {
        paddingTopLeft: [padX, padTop],
        // A name hangs above its dot unless it was moved, so the bottom edge only needs
        // room where one was — Queensbay's, which is also the southernmost stop on two of
        // these maps and had its label cut in half by the frame.
        paddingBottomRight: [padX, padBottom],
      });
      // Generous, because it is only a leash. `fitBounds` on a wide container can already
      // be showing more ground than the stops themselves cover — a snug `maxBounds` would
      // then be smaller than the view it is supposed to contain, and Leaflet recentres on
      // every `moveend` trying to satisfy it.
      map.setMaxBounds(bounds.pad(1.5));
      mapRef.current = map;

      // Carto rather than Amap. Amap answers 200 for tiles anywhere on earth, but outside
      // mainland China every one of them is the same 179-byte fully transparent PNG — it
      // has no data for Malaysia, which is why an Amap-tiled version of this panel drew
      // pins and an attribution line over an empty sheet.
      //
      // Carto's basemaps are global, sit on Fastly (reachable from the mainland, where most
      // of this page's readers are, unlike openstreetmap.org's own servers), and Voyager's
      // warm paper-and-water palette sits closer to this collection's flat colour than the
      // near-white Positron sheet would. It serves plain WGS-84, so the coordinates in
      // `itinerary.ts` are used exactly as written.
      const carto = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 20 },
      ).addTo(map);

      // If Carto turns out to be unreachable, fall back rather than leave a blank sheet. A
      // handful of failures is normal on a flaky connection — it takes a sustained run of
      // them, across the whole visible screenful, to switch.
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

      // Everything below is laid out in screen pixels at the zoom `fitBounds` just chose,
      // and only then handed back to Leaflet as coordinates. Two labels a fixed distance
      // apart on screen is what legibility actually depends on, and Mercator's north-south
      // stretch means degrees cannot answer that question.
      const at = (s: Stop) => map!.latLngToLayerPoint([s.lat, s.lng]);

      // The visible frame, in those same layer pixels. Layer and container coordinates
      // differ only by where the map pane currently sits, so one reading of that shift
      // converts between them.
      const centre = map.getCenter();
      const shift = map.latLngToLayerPoint(centre).subtract(map.latLngToContainerPoint(centre));
      const frame = {
        left: shift.x + 4,
        top: shift.y + 4,
        right: shift.x + size.x - 4,
        bottom: shift.y + size.y - 4,
      };

      // ---- 1. how many times each stretch of road is used -------------------------
      // A day that drives out to the hill and back uses one road twice. Drawn as one line
      // it carries two arrowheads pointing opposite ways, which reads as no direction at
      // all; so each pass gets its own lane.
      const segKey = (a: Stop, b: Stop) => [a.id, b.id].sort().join("|");
      const shared = new Set<string>();
      const seenSeg = new Set<string>();
      for (const route of routes) {
        const list = route.stops.map((id) => byId.get(id)).filter(Boolean) as Stop[];
        for (let i = 0; i < list.length - 1; i++) {
          const k = segKey(list[i], list[i + 1]);
          if (seenSeg.has(k)) shared.add(k);
          seenSeg.add(k);
        }
      }

      // ---- 2. the geometry of every leg -------------------------------------------
      interface Drawn {
        route: Route;
        leg: NonNullable<Route["legs"]>[number] | undefined;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        rad: number;
        ax: number;
        ay: number;
      }
      const drawn: Drawn[] = [];

      for (const route of routes) {
        const list = route.stops.map((id) => byId.get(id)).filter(Boolean) as Stop[];
        for (let i = 0; i < list.length - 1; i++) {
          const a = list[i];
          const b = list[i + 1];
          const p1 = at(a);
          const p2 = at(b);
          const rad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const nx = Math.cos(rad - Math.PI / 2);
          const ny = Math.sin(rad - Math.PI / 2);
          // Always to the left of travel, so the two passes of a shared road end up on
          // opposite sides of it without either needing to know about the other.
          const lane = shared.has(segKey(a, b)) ? LANE : 0;
          const leg = route.legs?.[i];
          const t = leg?.at ?? 0.5;
          const x1 = p1.x + nx * lane;
          const y1 = p1.y + ny * lane;
          const x2 = p2.x + nx * lane;
          const y2 = p2.y + ny * lane;
          drawn.push({
            route,
            leg,
            x1,
            y1,
            x2,
            y2,
            rad,
            ax: x1 + (x2 - x1) * t,
            ay: y1 + (y2 - y1) * t,
          });
        }
      }

      // ---- 3. where each place name goes ------------------------------------------
      const labelSize = (compact ? 10 : 11) - (narrow ? 1 : 0);
      const placed: Box[] = [];
      const sideOf = new Map<string, Side>();
      const hiddenNames = new Set<string>();

      // Every dot first, so a name never lands on another stop's pin — including one it has
      // not been laid out yet.
      for (const stop of stops) {
        const p = at(stop);
        placed.push({ x: p.x, y: p.y, w: 24, h: 24 });
      }

      const boxOn = (p: { x: number; y: number }, side: Side, w: number, h: number): Box => {
        const gap = 14;
        switch (side) {
          case "down":
            return { x: p.x, y: p.y + gap + h / 2, w, h };
          case "left":
            return { x: p.x - gap - w / 2, y: p.y, w, h };
          case "right":
            return { x: p.x + gap + w / 2, y: p.y, w, h };
          default:
            return { x: p.x, y: p.y - gap - h / 2, w, h };
        }
      };

      for (const stop of stops) {
        const p = at(stop);
        const w = textWidth(stop.name, labelSize) + (compact ? 12 : 14);
        const h = labelSize + (compact ? 6 : 8);
        const preferred = stop.labelSide ?? "up";

        // The side named in the data is the one to use; the other three are a fallback for
        // whatever the phone's lower zoom has pushed together that the desktop fit had
        // room for.
        let side = preferred;
        let box = boxOn(p, preferred, w, h);
        let fits = false;
        for (const candidate of [preferred, ...SIDES.filter((s) => s !== preferred)]) {
          const b = boxOn(p, candidate, w, h);
          if (!placed.some((q) => overlaps(q, b))) {
            side = candidate;
            box = b;
            fits = true;
            break;
          }
        }
        sideOf.set(stop.id, side);

        // A phone showing the George Town walk has thirteen names inside 1.7km at a zoom
        // where that is a few hundred pixels: there is no arrangement of them that reads,
        // and printing them anyway produces a smear rather than a map. So on the narrow
        // walks a name that cannot be placed clear is dropped, its numbered dot left to
        // stand for it, and the numbered list under the map — which is there for exactly
        // this, and is a far better tap target besides — carries the name instead.
        //
        // Only the walks, and only when narrow. The island map's seven names all fit, and
        // dropping one of those would be losing something the reader cannot get back
        // without looking away.
        if (!fits && narrow && compact) {
          hiddenNames.add(stop.id);
          continue;
        }
        placed.push(box);
      }

      // ---- 4. draw ----------------------------------------------------------------
      groups.clear();
      for (const d of drawn) {
        let group = groups.get(d.route.label);
        if (!group) {
          group = L.layerGroup().addTo(map);
          groups.set(d.route.label, group);
        }

        const back = (x: number, y: number) => map!.layerPointToLatLng(L.point(x, y));

        L.polyline([back(d.x1, d.y1), back(d.x2, d.y2)], {
          color: d.route.color,
          weight: 3.5,
          opacity: 0.95,
          dashArray: d.route.dashed ? "9 8" : undefined,
          // The line is decoration over the tiles; every tap belongs to a pin.
          interactive: false,
        }).addTo(group);

        // Arrowheads repeated along the leg rather than one at its middle. A single head on
        // a line kilometres long is easy to miss, and with it the whole direction of the
        // day; a file of them reads as travel at a glance.
        const len = Math.hypot(d.x2 - d.x1, d.y2 - d.y1);
        const count = Math.max(1, Math.min(ARROW_MAX, Math.round(len / ARROW_SPACING)));
        const deg = ((d.rad * 180) / Math.PI).toFixed(1);
        for (let k = 0; k < count; k++) {
          const t = (k + 0.5) / count;
          L.marker(back(d.x1 + (d.x2 - d.x1) * t, d.y1 + (d.y2 - d.y1) * t), {
            interactive: false,
            // Under the pins: a stop's name has to stay readable where a line runs past it.
            zIndexOffset: -500,
            icon: L.divIcon({
              className: "",
              html: `<i class="ml-rm-arrow" style="--ml-leg:${d.route.color};transform:translate(-50%,-50%) rotate(${deg}deg)">${ARROW}</i>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
          }).addTo(group);
        }

        if (!d.leg || !pillsOnMap) continue;

        // Where the distance goes. It may step off its line along the normal, and it may
        // also slide along the line — which is what makes a phone work at all. On a narrow
        // screen the whole island fits at a zoom where ten of these chips are fighting over
        // the same few hundred pixels, and a search that could only move them further out
        // ran them off the edge of the map and still left them on top of each other.
        //
        // Candidates are scored rather than taken first-fit, so when nothing is truly clear
        // the least bad position wins instead of an arbitrary last rung.
        const pillSize = narrow ? 9.5 : 10.5;
        const w =
          Math.max(textWidth(d.leg.distance, pillSize), textWidth(d.leg.duration, pillSize) + 14) +
          (narrow ? 14 : 16);
        const h = narrow ? 30 : 34;
        const baseT = d.leg.at ?? 0.5;

        let best: { ax: number; ay: number; dx: number; dy: number; box: Box } | null = null;
        let bestCost = Infinity;

        for (const dt of ALONG) {
          const t = Math.min(0.86, Math.max(0.14, baseT + dt));
          const ax = d.x1 + (d.x2 - d.x1) * t;
          const ay = d.y1 + (d.y2 - d.y1) * t;

          for (const off of LABEL_OFFSETS) {
            const dx = Math.cos(d.rad - Math.PI / 2) * off;
            const dy = Math.sin(d.rad - Math.PI / 2) * off;
            const box = { x: ax + dx, y: ay + dy, w, h };

            let cost = 0;
            for (const p of placed) if (overlaps(p, box)) cost += 4;
            for (const o of drawn) if (!clearsLine(o.x1, o.y1, o.x2, o.y2, box)) cost += 3;
            // Off the edge of the map is worse than any amount of crowding: a label there
            // is simply not on the page.
            if (
              box.x - w / 2 < frame.left ||
              box.x + w / 2 > frame.right ||
              box.y - h / 2 < frame.top ||
              box.y + h / 2 > frame.bottom
            ) {
              cost += 40;
            }
            // Nudges are free but not weightless: all else equal, stay near the middle of
            // the leg and close in to the line.
            cost += Math.abs(dt) * 2 + Math.abs(off) / 40;

            if (cost < bestCost) {
              bestCost = cost;
              best = { ax, ay, dx, dy, box };
            }
            if (cost < 0.9) break;
          }
          if (bestCost < 0.9) break;
        }

        const spot = best ?? { ax: d.ax, ay: d.ay, dx: 0, dy: 0, box: { x: d.ax, y: d.ay, w, h } };
        placed.push(spot.box);

        // The leader, drawn on every label rather than only the ones parked far out: it
        // runs from a dot on the leg to the chip, which is what says *which two places*
        // this distance is between. Without it a chip standing between two lines belongs
        // to whichever one the reader guesses.
        const { dx, dy } = spot;
        const reach = Math.hypot(dx, dy);
        const leader = `<i class="ml-rm-lead" style="width:${reach.toFixed(1)}px;transform:rotate(${((Math.atan2(dy, dx) * 180) / Math.PI).toFixed(1)}deg)"></i><i class="ml-rm-anchor"></i>`;

        L.marker(back(spot.ax, spot.ay), {
          interactive: false,
          zIndexOffset: -400,
          icon: L.divIcon({
            className: "",
            html: `<span class="ml-rm-leg"${narrow ? ' data-narrow="1"' : ""} style="--ml-leg:${d.route.color}">${leader}<b class="ml-rm-pill" style="transform:translate(-50%,-50%) translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)"><span>${d.leg.distance}</span><span class="ml-rm-pill-row">${MODE_ICON[d.leg.mode]}${d.leg.duration}</span></b></span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
        }).addTo(group);
      }

      for (const stop of stops) {
        const n = order.get(stop.id);
        const badge = numbered && n ? String(n) : "";
        const marker = L.marker([stop.lat, stop.lng], {
          title: stop.name,
          icon: L.divIcon({
            className: "",
            html: `<span class="ml-rm-pin" data-side="${sideOf.get(stop.id) ?? "up"}"${compact ? ' data-compact="1"' : ""}${narrow ? ' data-narrow="1"' : ""} style="--ml-pin:${stop.slug ? "#F9CD6C" : "#DF6A69"}"><b class="ml-rm-dot"${badge ? "" : ' data-plain="1"'}>${badge}</b>${hiddenNames.has(stop.id) ? "" : `<span class="ml-rm-label">${stop.name}</span>`}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
        }).addTo(map);

        // Listened for on the pin itself rather than through `marker.on("click")`.
        // Leaflet's version routes the event through the map's own delegation, which needs
        // a genuine pointer behind it; this fires for anything that reaches the element.
        marker.getElement()?.addEventListener("click", (event) => {
          event.stopPropagation();
          go.current(stop);
        });
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      groups.clear();
    };
  }, [stops, routes, byId, order, numbered, compact]);

  // Leaflet owns the layers, so switching a day off is done to the map rather than by
  // re-rendering. `ready` is in the deps because the groups do not exist until it flips.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [label, group] of groupsRef.current) {
      const on = !hidden.includes(label);
      if (on && !map.hasLayer(group)) group.addTo(map);
      if (!on && map.hasLayer(group)) map.removeLayer(group);
    }
  }, [hidden, ready]);

  const toggle = useCallback((label: string) => {
    setHidden((current) =>
      current.includes(label) ? current.filter((l) => l !== label) : [...current, label],
    );
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <style>{mapStyles}</style>

      {/* The mat: a cream border in the collection's own dust tone, echoing the stamp's own
          die-cut border rather than borrowing a generic card frame. */}
      <div className="relative rounded-2xl bg-dust/15 p-2 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] ring-1 ring-dust/40 md:p-3">
        <div className="relative overflow-hidden rounded-lg ring-1 ring-black/15">
          <div ref={hostRef} style={{ height }} className="w-full bg-black/10" />
          {!ready ? (
            <p className="absolute inset-0 flex items-center justify-center font-neue-montreal text-[11.6px] font-bold text-dust uppercase">
              Loading map…
            </p>
          ) : null}
        </div>
      </div>

      {/* The legend doubles as the switch: several days on one island get tangled, and the
          only way to read one of them is to put the others away. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {legend.map((route) => {
          const off = hidden.includes(route.label);
          return (
            <button
              key={route.label}
              type="button"
              onClick={() => toggle(route.label)}
              aria-pressed={!off}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 font-neue-montreal text-[12px] font-bold transition-colors duration-200",
                off
                  ? "border-dust/25 text-dust/40"
                  : "border-dust/60 bg-dust/10 text-dust hover:bg-dust/20",
              )}
            >
              <span
                aria-hidden="true"
                className="h-[3px] w-7 shrink-0 rounded-full transition-opacity duration-200"
                style={{
                  opacity: off ? 0.3 : 1,
                  background: route.dashed
                    ? `repeating-linear-gradient(90deg, ${route.color} 0 6px, transparent 6px 11px)`
                    : route.color,
                }}
              />
              {route.label}
            </button>
          );
        })}
        <span className="font-neue-montreal text-[11px] font-bold text-dust/45">
          点击可隐藏 / 显示该日路线
        </span>
      </div>

      {/* The distances, when the map turned out to be too narrow to carry them — see the
          note in the effect. One row per leg, which is more legible than the chips ever
          were even where they did fit. */}
      {legsBelow ? (
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {legRows
            .filter((row) => !hidden.includes(row.label))
            .map((row) => (
              <li
                key={row.key}
                className="flex items-center gap-1.5 font-neue-montreal text-[11.5px] font-bold text-dust/85"
              >
                <span
                  aria-hidden="true"
                  className="h-[3px] w-3 shrink-0 rounded-full"
                  style={{ background: row.color }}
                />
                <span className="text-dust/50">
                  {row.from}→{row.to}
                </span>
                {row.distance}
                <span
                  aria-hidden="true"
                  className="text-dust/60"
                  dangerouslySetInnerHTML={{ __html: MODE_ICON[row.mode] }}
                />
                {row.duration}
              </li>
            ))}
        </ul>
      ) : null}

      {/* The jump buttons. Every pin is tappable on the map too, but on a phone a 20px dot
          in a cluster of a dozen is not a target — this is the same list, laid out flat. */}
      <div className="mt-5">
        <p className="font-neue-montreal text-[11px] font-bold tracking-wide text-dust/60 uppercase">
          可点击地图上景点或下方标签 · 有邮票的进入邮票页，其余打开高德地图
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {stops.map((stop) => {
            const n = order.get(stop.id);
            const inner = (
              <>
                {numbered && n ? <span className="font-bold opacity-60">{n}</span> : null}
                {stop.name}
                {stop.slug ? <span className="text-[10px] opacity-70">邮票</span> : null}
              </>
            );
            const chip =
              "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-neue-montreal text-[12.5px] font-bold transition-colors duration-200";
            return stop.slug ? (
              <button
                key={stop.id}
                type="button"
                onClick={() => go.current(stop)}
                className={cn(
                  chip,
                  "cursor-pointer border-ochre/80 text-ochre hover:bg-ochre hover:text-black",
                )}
              >
                {inner}
              </button>
            ) : (
              <a
                key={stop.id}
                href={stop.amap}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(chip, "border-dust/50 text-dust/90 hover:bg-dust hover:text-black")}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
