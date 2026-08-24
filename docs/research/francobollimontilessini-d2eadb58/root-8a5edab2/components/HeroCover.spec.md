# HeroCover Specification

## Overview
- Target file: `src/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/HeroCover.tsx`
- Screenshot: `docs/design-references/francobollimontilessini-d2eadb58/root-8a5edab2/desktop-full.jpg`
- Interaction model: static layout; time-driven entrance animation on mount

## DOM structure
`section.fixed.inset-0` (green fallback bg `#51B37C`)
└ `div.absolute.inset-0` — poster layer: `img` (`/posters/PassoMalera.jpg` stand-in),
  `object-cover`, `aspect-square`, full width, pinned `top:0`
└ `div.absolute.inset-0.bg-black.mix-blend-multiply` — entrance backdrop, `opacity:0` at
  rest (see BEHAVIORS.md — animate from `opacity:1→0` on mount only)
└ `div.absolute.inset-0.flex.flex-col.items-center.justify-center` — title block:
  - mountain-peaks svg icon (verbatim markup in DESIGN_TOKENS.md), centered, `w-[223px]
    h-[74px] max-lg:h-12`, `fill: #F2EEDE`
  - eyebrow row: flex row, `justify-between`, full width of heading block, "ITALY" left /
    "2026" right, `font-neue-montreal font-bold text-[13px] lg:text-[23.2px] uppercase
    text-[#F2EEDE]`
  - heading: "MONTI" / "LESSINI" two lines, `font-cenzo-flare font-black uppercase
    leading-[0.8] tracking-wider text-center text-[20vw] lg:text-[14vw] text-[#F2EEDE]`
  - subtitle row below heading: "IN FRANCOBOLLI", letters spread via `flex justify-between`
    across a `max-w` matching the heading width, `font-neue-montreal text-[11.6px]
    uppercase text-[#F2EEDE]`
└ `div.absolute.bottom-24.left-0.right-0.text-center.max-w-2xl.mx-auto.max-md:px-8` —
  description paragraph, `font-neue-montreal font-bold text-[13.05px] uppercase
  leading-[1.5] text-[#F2EEDE]`

## Entrance animation (mount only, run once)
1. Backdrop `opacity:1 → 0` over ~600ms ease-out (page "reveals" from black).
2. Heading letters: split "MONTI" and "LESSINI" into per-letter `<span>`s; each animates
   `opacity:0, translateY(0.4em) → opacity:1, translateY(0)`, staggered ~20ms/letter,
   easing `cubic-bezier(0.16,1,0.3,1)`, starting ~100ms after mount.
3. Eyebrow row and subtitle row: each slides from `translateY(-100%)`/`translateY(100%)`
   (clipped by `overflow-hidden` wrapper) to `translateY(0)`, ~500ms, roughly concurrent
   with the heading stagger.
4. Description paragraph: simple `opacity:0→1` fade, ~400ms, slightly delayed after the
   heading (~300-400ms after mount).
Implement with CSS `@keyframes` + `animation-fill-mode: both` and staggered
`animation-delay` per letter (inline style `--i` index is fine) — no animation library
needed for this scope.

## Global overlays (siblings of HeroCover, rendered once at page level, not inside this component)
- paper grain `img`, full-bleed, `mix-blend-multiply`
- shadows vignette `img`, full-bleed, `opacity:.35 mix-blend-multiply`
- cursor glow: `fixed` div, radial-gradient, `mix-blend-screen`, hidden until
  `pointermove` on `(pointer: fine)`, then follows cursor with a smoothed `transform:
  translate3d()`, ~150ms transition.
(These are implemented in `page.tsx` directly, wrapping `HeroCover` — not part of this component.)

## Assets
- Poster: `public/sites/francobollimontilessini-d2eadb58/root-8a5edab2/poster-passo-malera.jpg` (original, 2048×2048)
- Paper grain: `public/sites/francobollimontilessini-d2eadb58/shared/paper-texture.jpg`
- Shadows vignette: `public/sites/francobollimontilessini-d2eadb58/shared/shadows-texture.jpg`
- Mountain icon: inline SVG (verbatim in DESIGN_TOKENS.md)

## Text content (verbatim)
See DESIGN_TOKENS.md "Copy" section.

## Responsive
- Desktop (1440px): heading `14vw` (~179px effective at 1280px reference capture).
- Tablet (768px): heading still `20vw` (breakpoint is `lg`=1024px, so 768px uses the
  mobile `20vw` value) — description gets `px-8` side padding below 768px (`max-md`).
- Mobile (390px): heading `20vw` (~78px), mountain icon `h-12` (48px) instead of `74px`,
  everything stays centered/stacked (no column layout at any width — it's always a single
  centered column).
- Breakpoints: `md`=768px (description padding), `lg`=1024px (heading size, icon size,
  header margin).
