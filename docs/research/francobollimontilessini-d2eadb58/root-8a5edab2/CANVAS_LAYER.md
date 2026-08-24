# Canvas Layer — francobollimontilessini.com (Index page, `/`)

Second extraction pass. The first pass built only the cover and recorded the layer behind
it as "out of scope"; this documents that layer and the transition into it.

## Correction to PAGE_TOPOLOGY.md

The hidden `main > section` is **not** the `/discover` gallery, and it is not a scattered
2D canvas. It is a horizontal, infinitely-looping **carousel** that lives on the homepage
itself, complete with its own title and coordinate text. `/discover` is a genuinely
different page (scattered stamps, no title text), and `/poster/[slug]` is a long
scrolling detail page. All three are distinct.

## Structure

```
main > section.fixed.inset-0.overflow-hidden.cursor-grab
├─ [0] div.absolute.inset-0                      → flat #51B37C ground
├─ [1] div.relative.z-1.h-full.flex.items-center  → the reel, 19 slides
│        .flex-nowrap.-left-[30vw].w-[80vw]
│        .lg:-left-[10vw].lg:w-[120vw]
├─ [2] div.fixed.inset-0.z-0.flex.flex-col        → text, BEHIND the reel
│        .justify-between.text-center
│        .pt-28.pb-14.lg:pt-20.lg:pb-8
│   ├─ div.flex.flex-nowrap            → title word 1 (17 items, w-full each)
│   └─ div
│       ├─ div.flex.flex-row-reverse   → title word 2 — runs the OTHER way
│       └─ div.flex                    → "place - N …° …' …" - E …° …' …""
└─ [3] aside.pointer-events-none                 → GSAP Flip destination elements
```

19 slides = the 16 posters plus loop padding: `[16th, 1…16, 16th, 1st, 2nd]`. Only the
centred slide keeps `pointer-events`.

## The reel runs on a diagonal, not a horizontal line

The flex row only sets the layout pitch (`1/3` of `120vw` = `40vw` at `lg`; `2/3` of
`80vw` = `53.333vw` below it). On top of that, **every slide carries its own
`matrix(s,0,0,s,tx,ty)`**, and across all 19 the per-index deltas are exactly linear.
Measured at a 1280×656 viewport, where the pitch `P` is 512px:

| per index | measured | as a multiple of `P` |
|---|---|---|
| `tx` | +174.08px | 0.34 |
| `ty` | +409.6px | 0.80 |
| `scale` | −0.1024 | — |

Adding the layout pitch itself, one step moves a slide by `(1.34·P, 0.80·P)` — a chain
receding at about **31° below horizontal**. Stamps up and to the left are nearer and
larger (`scale > 1`); down and to the right they shrink away. So the switch is **not a
horizontal pan**: dragging up-left pulls the next stamp forward and it *grows* into the
centre.

Cross-checked against a reference screenshot at 1920×1080 (`P = 768`): the model puts the
`d = −1` neighbour at x −350…211, y −461…287, and it is observed at x 0…215, y 0…300.

The site extrapolates this linearly to every slide, so far-off ones end up with negative
scale — harmless, they are nowhere near the viewport. Reproduced here with a ±2 slot
window, positioning each slot at the screen centre and pushing it out along the axis:

```
transform: translate(-50%,-50%) translate(1.34·P·d px, 0.80·P·d px) scale(1 − 0.1024·d)
```

Drag is projected onto that axis (unit `(0.859, 0.513)`, step length `1.5606·P`); the
cross-axis component is discarded.

**The text tracks stay horizontal.** Their transforms are pure `translateX` with `ty = 0`
— confirmed live at `tx = ∓5050, ty = 0` — one viewport width per index, and the second
word's track runs the opposite way.

## Parallax

Three text tracks move at rates tied to the reel. Each title item is a **full viewport
wide** while a slide is only `40vw`, so the text travels 2.5× the reel's distance. The
second word's track is `flex-row-reverse`, so it slides the opposite way — the two words
cross past each other as you drag. That opposing drift is the whole effect.

## The stamp

`article.relative.aspect-[496/661].[perspective:800px]`, four layers:

| Layer | Element | viewBox | Notes |
|---|---|---|---|
| shadow | `svg` z-0 `top-4 left-8 w-[110%]` | `0 0 496 661` | 1 path, `feGaussianBlur` σ 4.275, `opacity .2` |
| photo | `div` z-5 → `img.object-cover` | — | fills the card |
| print | `svg` z-5 `-inset-0` | `0 0 968.2 1292` | 2 groups: 8 paths `fill-dust` ("ITALIA" + "B" badge), 12 paths `fill-current` ("Monti Lessini") |
| frame | `svg` z-1 `top-[-12%] left-[-12%] w-[124%]` | `0 0 1200 1600` | 2 paths, the die-cut perforated border |

The caption group uses `fill-current`, so its colour is per poster: `#F2EEDE` on most,
`#5D8BBA` on the three pale ones (monte-tomba, valle-sfingi, rifugio-gaibana).

The card leans towards the pointer — `rotateX(var(--x-rotation)) rotateY(var(--y-rotation))`
over `perspective: 800px`, `duration-700 ease-linear`, `hover:duration-1000 hover:ease-out`.

## Root font size — important

The target sets `html { font-size: 72.5% }`, i.e. **1rem = 11.6px**. Every Tailwind
spacing and `rem` size on that site is therefore 72.5% of what the same class means here.
Values that matter, already resolved:

| Source class | There | Here |
|---|---|---|
| `.ml-title` `18.75rem` (lg) | 217.5px | `217.5px` |
| `.ml-title` `5.275rem` | 61.19px | `61.19px` |
| `.ml-title.preview` | `scale(.75)` | `lg:scale-75` |
| `pt-20` / `pb-8` | 58px / 23.2px | `lg:pt-[58px]` / `lg:pb-[23.2px]` |
| `pt-28` / `pb-14` | 81.2px / 40.6px | `pt-[81.2px]` / `pb-[40.6px]` |
| `p-28` | 81.2px | `lg:p-[81.2px]` |

Title colour is `#DF6A69`; ground `#51B37C`; dust `#F2EEDE`.

## Cover → canvas transition

The cover and the reel share GSAP Flip ids (`passo-malera:poster`, `:stamp`, `:frame`,
`:shadow`), with `/source` on one side and `/destination` on the other — the full-bleed
cover poster and the centred stamp are the same element flying between two boxes.

Reproduced here without GSAP (`StampGate.tsx`): both layers mount, the centred stamp's
photo box is measured, and the cover's poster is animated onto it with the Web Animations
API. **Geometry is animated, not `transform`** — the poster is `object-cover`, so
shrinking its box makes the image re-frame rather than squash, which is the character of
the move. The lettering clears out over the first 300ms, the canvas fades up over the
first 55%, and the handoff to the real stamp happens in a single commit so there is no gap.

## Per-poster palette

Each poster carries its own `bg` / `fg` / `path` triple. They are **not** in the rendered
markup for every stamp — only the current one reaches the DOM — but the whole table sits
in the Next.js flight payload embedded in the homepage, alongside each poster's `slug`
and decimal `coordinates`. Grep the HTML for `"bg":"#`.

Entries were matched to posters by decimal coordinate (e.g. `45.68636, 11.10644` is Passo
Malera's `N 45° 41' 10.93" - E 11° 6' 23.18"`), then cross-checked against the inline
`style="color:#…"` on the title-word divs, which agreed on all sixteen `fg` values.

`path` is the footpath colour — its presence is what confirms the trail is a real part of
the design and not a misreading of the screenshots. It is `#F9CD6C` for fourteen posters
and `#DF6A69` for malga-brusa and grotta-del-ciabattino.

The three posters whose stamp caption uses slate (`#5D8BBA`) are exactly the three whose
ground is also `#5D8BBA` — their artwork is pale snow, where a dust caption would vanish.

## The footpath between stamps — invented, not extracted

Reference screenshots show a wave of little yellow squares crossing the ground to the
left of the centred stamp while you move between stamps. It could not be found in the
source: it is absent from the SSR HTML, there is no `<canvas>` on the homepage, and the
only `strokeDasharray` in the bundles belongs to GSAP's DrawSVGPlugin. Each poster does
ship a Rive animation (`/animations/<Name>.riv`), but the one that plays on
`/poster/[slug]` does not contain it. Hunting it further was called off.

`StampTrail.tsx` therefore rebuilds it from the screenshots: tiles laid along a cubic
wave, each jittered in size and angle by a seeded PRNG so server and client agree, then
revealed with an animated `clip-path` — left-to-right when moving on, right-to-left
(from the stamp back out to the screen edge) when going back.

It was first built as a dashed stroke plus an `feTurbulence`/`feDisplacementMap` filter
for the hand-cut look. **Do not go back to that**: re-rasterising that filter over a
35vw band on every frame of the draw-on stalled the compositor hard enough that Chrome
stopped answering screenshot requests. Individually placed rects cost nothing.

## Deliberate content deviation: the Penang set

Stamps 2–7 no longer follow the target. Their artwork, titles and coordinates were
replaced with Penang subjects supplied by the project owner:

| # | slug | title | links to |
|---|---|---|---|
| 2 | `batu-ferringhi` | BATU / FERRINGHI | Ctrip area guide |
| 3 | `george-town` | GEORGE / TOWN | Ctrip area guide |
| 4 | `sayang-hotel` | SAYANG / HOTEL | — |
| 5 | `usm-campus` | USM / CAMPUS | — |
| 6 | `penang-hill` | PENANG / HILL | — |
| 7 | `penang-outlets` | OUTLETS / PENANG | — (not requested) |

Stamp 1 and stamps 8–16 are still the target's own posters, kept as placeholders.

Two things follow from the replacement artwork, which is flat illustration on a dust
ground at exactly 765×1024 (0.7500, against the card's 496:661 = 0.7504, so it fills the
frame with no crop):

- **`lettering: false`.** The printed "ITALIA" wordmark, the "B" badge and the "Monti
  Lessini" caption are all dust — the same colour as this artwork's ground, so they would
  be invisible, and they name the wrong country besides. `StampCard` skips the print
  layer for these.
- **The die-cut frame is also dust**, so on these stamps it reads only against the canvas
  ground; there is no edge between frame and artwork. Left as-is by decision, not oversight.

Coordinates are place centroids at whole-second precision, not the source's hundredths —
the extra digits would be invented.

## Not reproduced

- The **"DRAG" cursor**: a dot that expands into a labelled pill. Client-rendered only —
  it is absent from the SSR HTML, so it was not captured.
- The reverse transition (stamp → full-bleed) and the `/poster/[slug]` and `/about` routes.
- The live site's hydration crash (React #418/#423/#425) — a defect, not a behaviour.
