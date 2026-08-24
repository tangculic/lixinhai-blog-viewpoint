# Page Topology — francobollimontilessini.com (Index page, `/`)

## Important finding: homepage scope

The homepage renders as a **single fixed-viewport "cover" screen** (no vertical scroll:
`document.body.scrollHeight === window.innerHeight`). It is NOT the draggable stamp
gallery — that lives at `/discover` (nav "All"), out of scope for this pass. The DOM does
contain a 19-item draggable stamp carousel (`main > section`, `cursor-grab`, GSAP Flip
source elements for shared-element transitions to `/discover` and `/poster/[slug]`), but
it sits fully behind (z-index) the cover overlay described below and is never visible on
initial load. It is not built in this pass. `/poster/[slug]` (16 routes) and `/about` are
also out of scope.

**Live-site note:** during extraction the live site intermittently hydration-crashed
(React errors #418/#423/#425 in console) after a reload/resize, leaving a permanently
black screen (the entrance backdrop layer stuck at opacity 1 because the GSAP intro
timeline that fades it out never ran). This is a bug on the live site, not part of the
intended design — the reference screenshots below were captured before this occurred and
reflect the intended, settled visual state, which is what this clone targets.

## DOM stack (top to bottom in z-order)

1. `header` (`fixed top-0 left-0 right-0 z-10`) — nav: Index / All / About
2. `main > section` (`fixed inset-0 cursor-grab`, z-auto/0) — hidden stamp carousel (OUT OF SCOPE)
3. `main > aside[0]` — **the cover** (z-5/z-10 children), full viewport:
   - shadow svg (blur filter def, decorative, negligible visually)
   - `div.poster/source` (z-5) → `<img>` object-cover, aspect-square, full viewport width,
     src `/posters/PassoMalera.jpg` (2048×2048 flat-illustration poster: blue sky, two
     green hills, small white house w/ dark roof on the ridge, 3 grazing cow icons)
   - 2 more small svgs (decorative blur defs)
   - shadow div (flip-id `passo-malera:shadow`, pointer-events none, negligible)
   - title block (z-10): mountain-peaks svg icon + "ITALY"/"2026" label row + giant
     "MONTI LESSINI" heading (per-letter spans) + "IN FRANCOBOLLI" spaced subtitle
   - description paragraph (z-10, bottom-anchored)
   - backdrop div (`bg-black mix-blend-multiply`) — entrance-only dark-to-light fade;
     at rest it is visually inert (see BEHAVIORS.md)
4. `main > aside[1]` (`fixed z-20 mix-blend-multiply pointer-events-none`) — global grain:
   `img /images/paper.jpg` (paper grain, full bleed) + `img /images/shadows.jpg`
   (dappled-light vignette, opacity 35%, multiply)
5. `main > div` (`fixed z-10 mix-blend-screen opacity-0 invisible pointer-fine`) — cursor
   glow effect, hidden until pointer move on fine-pointer (desktop) devices

## Layout

- No scroll, single fixed viewport (`100svh`/`100lvh`), content is centered vertically
  with the heading roughly mid-screen and the description pinned near the bottom
  (`bottom-24`, `max-w-2xl`, centered).
- Header nav sits top, small margin (`m-4 lg:mx-6 lg:my-6`).
- Poster image is `aspect-square`, positioned `top:0` full width, so on wide/short
  viewports it doesn't reach the bottom (green fallback background color shows through
  if needed — `#51B37C`, the same green as the hidden carousel's background layer).

## Responsive

- Heading: `text-[20vw]` on mobile, `lg:text-[14vw]` from the `lg` breakpoint (1024px) up.
- Card/carousel-only classes (`w-2/3 lg:w-1/3`) are irrelevant here (out of scope).
- Description paragraph: `max-md:px-8` (adds side padding under 768px).
- Mountain icon: `max-lg:h-12` (smaller under 1024px).
- Title block: `md:pb-40` extra bottom padding ≥768px.
