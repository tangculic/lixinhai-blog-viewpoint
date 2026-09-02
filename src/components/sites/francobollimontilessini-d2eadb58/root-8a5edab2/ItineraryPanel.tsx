"use client";

import { cn } from "@/lib/utils";
import { RouteMap } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/RouteMap";
import {
  DAY4_ROUTE,
  DAY5_ROUTE,
  DAYS,
  GEORGE_TOWN_ROUTE,
  GEORGE_TOWN_STOPS,
  PENANG_ROUTES,
  PENANG_STOPS,
  TRAVEL_NOTES,
  USM_ROUTE,
  USM_STOPS,
  type Route,
  type Stop,
} from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/itinerary";

/**
 * `RouteMap` rebuilds its Leaflet instance whenever its `stops` or `routes` identity
 * changes, so every list it is handed is worked out once here at module scope rather than
 * on each render.
 */
const stopsOf = (route: Route, pool: readonly Stop[]) => {
  const ids = new Set(route.stops);
  return pool.filter((s) => ids.has(s.id));
};

const DAY_MAP: Record<string, { stops: readonly Stop[]; routes: readonly Route[] }> = {
  day4: { stops: stopsOf(DAY4_ROUTE, PENANG_STOPS), routes: [DAY4_ROUTE] },
  day5: { stops: stopsOf(DAY5_ROUTE, PENANG_STOPS), routes: [DAY5_ROUTE] },
};

const USM_ROUTES = [USM_ROUTE];
const GEORGE_TOWN_ROUTES = [GEORGE_TOWN_ROUTE];

const kicker = "font-neue-montreal text-[11.5px] font-bold tracking-[0.14em] text-dust/55 uppercase";
const heading = "font-neue-montreal text-[clamp(20px,4vw,29px)] font-bold leading-[1.2] text-dust";
const body = "font-neue-montreal text-[clamp(13.5px,3vw,16px)] leading-[1.8] text-dust/90";

/** A titled block with a rule above it, the shape every section on this page shares. */
function Section({
  eyebrow,
  title,
  note,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  note?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-t border-dust/20 pt-8 md:pt-12", className)}>
      <p className={kicker}>{eyebrow}</p>
      <h2 className={cn(heading, "mt-2")}>{title}</h2>
      {note ? <p className={cn(body, "mt-2 text-dust/70")}>{note}</p> : null}
      <div className="mt-6 md:mt-8">{children}</div>
    </section>
  );
}

/** A map with its own caption, used for the two walks nested inside day four. */
function SubMap({
  title,
  note,
  stops,
  routes,
  onOpenPoster,
}: {
  title: string;
  note: string;
  stops: readonly Stop[];
  routes: readonly Route[];
  onOpenPoster?: (slug: string) => void;
}) {
  return (
    <div className="mt-8">
      <h4 className="font-neue-montreal text-[clamp(15px,3.2vw,19px)] font-bold text-dust">
        {title}
      </h4>
      <p className={cn(body, "mt-1 text-dust/65")}>{note}</p>
      <div className="mt-4">
        <RouteMap
          stops={stops}
          routes={routes}
          numbered
          compact
          height="clamp(380px,64vh,580px)"
          onOpenPoster={onOpenPoster}
        />
      </div>
    </div>
  );
}

/**
 * Everything the map stamp opens onto: the island route across all four days, then each
 * day written out — two of them with the same map narrowed to that day alone, and day four
 * with the two walks it contains — and the practical notes at the foot.
 */
export function ItineraryPanel({ onOpenPoster }: { onOpenPoster?: (slug: string) => void }) {
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-10 px-6 md:space-y-14 md:px-10">
      <section>
        <p className={kicker}>10.3 - 10.6 · Penang</p>
        <h2 className={cn(heading, "mt-2")}>主行程地图</h2>
        <p className={cn(body, "mt-2 text-dust/70")}>
          每一天一种颜色，箭头指向当天的行进方向，线上标注两点之间的距离与车程。
        </p>
        <div className="mt-6 md:mt-8">
          <RouteMap
            stops={PENANG_STOPS}
            routes={PENANG_ROUTES}
            height="clamp(440px,82vh,760px)"
            onOpenPoster={onOpenPoster}
          />
        </div>
      </section>

      {DAYS.map((day, i) => {
        const map = DAY_MAP[day.id];
        return (
          <Section
            key={day.id}
            eyebrow={`Day ${i + 1}`}
            title={day.date}
            note={day.summary}
            className="scroll-mt-8"
          >
            {map ? (
              <div className="mb-8">
                <RouteMap
                  stops={map.stops}
                  routes={map.routes}
                  height="clamp(400px,68vh,620px)"
                  onOpenPoster={onOpenPoster}
                />
              </div>
            ) : null}

            {/* The day's own schedule. A coloured rule down the left ties the block to the
                line this day draws on the map above. */}
            <ol
              className={cn(body, "space-y-2 border-l-2 pl-5")}
              style={{ borderColor: day.color }}
            >
              {day.lines.map((line, j) => {
                // The walking orders belong to the line above them rather than to the
                // clock, so they are set in as a continuation. The indent is an em, not the
                // run of full-width spaces it used to be: six of those is a fifth of a
                // phone's width spent on nothing, and it cannot give any of it back when
                // the line then wraps.
                const aside = line.startsWith("路线：");
                return (
                  <li
                    key={j}
                    className={aside ? "pl-[1.15em] text-dust/70" : undefined}
                    style={{ textWrap: "pretty" }}
                  >
                    {line}
                  </li>
                );
              })}
            </ol>

            {day.id === "day4" ? (
              <>
                <SubMap
                  title="USM 游览地图"
                  note="西门 K19&18 → 公园 → 图书馆 → 纪念品店 → ZUS 咖啡店 → 印尼餐厅 → 咖啡厅（足球场）"
                  stops={USM_STOPS}
                  routes={USM_ROUTES}
                  onOpenPoster={onOpenPoster}
                />
                <SubMap
                  title="乔治市游览地图"
                  note="线上标注两点之间的距离与步行时间，全程约 6km。"
                  stops={GEORGE_TOWN_STOPS}
                  routes={GEORGE_TOWN_ROUTES}
                  onOpenPoster={onOpenPoster}
                />
              </>
            ) : null}
          </Section>
        );
      })}

      <Section eyebrow="Before you go" title="马来西亚旅行注意事项">
        <ol className={cn(body, "space-y-3")}>
          {TRAVEL_NOTES.map((note, i) => (
            <li key={i} className="flex gap-3" style={{ textWrap: "pretty" }}>
              <span className="shrink-0 font-bold text-ochre tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{note}</span>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
