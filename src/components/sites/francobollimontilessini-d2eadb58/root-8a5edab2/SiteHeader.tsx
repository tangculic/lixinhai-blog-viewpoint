"use client";

import { cn } from "@/lib/utils";

export type SiteView = "index" | "all";

const NAV: readonly { view: SiteView; label: string }[] = [
  { view: "index", label: "Index" },
  { view: "all", label: "All" },
];

export interface SiteHeaderProps {
  view: SiteView;
  onView: (view: SiteView) => void;
}

/**
 * Fixed top nav with the source's hover-swap "flip up" text effect.
 *
 * The two entries switch between views rather than routing: "All" lays the whole
 * collection out, "Index" folds it back to the single-stamp canvas — which is still
 * mounted underneath, so it returns on the stamp it was left on.
 */
export function SiteHeader({ view, onView }: SiteHeaderProps) {
  return (
    // Above an opened poster, as on the reference — the nav stays reachable from it.
    <header className="fixed top-0 right-0 left-0 z-60 m-4 lg:mx-6 lg:my-6">
      <nav>
        <ul className="flex items-center justify-between">
          {NAV.map((item) => (
            <li key={item.view} className="overflow-hidden">
              <button
                type="button"
                onClick={() => onView(item.view)}
                aria-current={view === item.view ? "page" : undefined}
                className={cn(
                  "group relative inline-block cursor-pointer p-4 font-neue-montreal text-[13.05px] leading-none font-bold text-[#F2EEDE] uppercase transition-opacity duration-200",
                  view === item.view ? "opacity-100" : "opacity-60 hover:opacity-100",
                )}
              >
                <div className="relative h-[1em] overflow-hidden">
                  <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
                    <span>{item.label}</span>
                    <span>{item.label}</span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
