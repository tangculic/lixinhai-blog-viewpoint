# Behaviors — francobollimontilessini.com (Index page, `/`)

## Interaction model
Mostly static on the homepage. The only genuinely interactive pieces in scope:
- **Nav link hover** (click-target is a real link, hover is CSS/JS driven) — hover-swap
  text technique (see below).
- **Entrance animation** (time-driven, plays once on load).
- **Cursor glow** (pointer-move driven, fine-pointer devices only).
The draggable carousel (`cursor-grab`) belongs to the hidden, out-of-scope carousel layer.

## Nav hover-swap
Each nav `<a>` renders its label **twice** as stacked text (e.g. textContent is literally
`"IndexIndex"`, `"AllAll"`, `"AboutAbout"`) inside an `overflow-hidden` wrapper. This is
the standard "flip up on hover" technique: two identical copies stacked vertically, the
container clips to one line's height, and hover translates the inner stack up by 100% so
the second copy slides in. Implement with a `group` wrapper, `overflow-hidden` fixed
height, and `translate-y-0 group-hover:-translate-y-1/2 transition-transform duration-300`
(the site's own transitions elsewhere run ~300-700ms ease, so this range is a safe match).
Font: `font-neue-montreal font-bold text-[13.05px] uppercase` (see DESIGN_TOKENS.md).

## Heading letter reveal (entrance, time-driven)
"MONTI" and "LESSINI" are each split into one `<div>` per letter (confirmed via DOM
walk — each letter is its own block-level element with the same computed font/tracking).
This is the standard setup for a GSAP stagger reveal (letters fade/slide up with a small
stagger delay on load). Implement as a CSS entrance: each letter `opacity:0
translateY(0.4em)` → `opacity:1 translateY(0)`, staggered ~20-30ms per letter, total
heading reveal ~0.6-0.8s, ease `power2.out`-like (`cubic-bezier(0.16,1,0.3,1)` is a close
CSS equivalent).

## Backdrop fade (entrance, time-driven)
`aside > div.bg-black.mix-blend-multiply` covers the full cover. On a healthy page load
this starts opaque (full black, hiding the poster) and fades to fully transparent as the
poster/title/description fade/stagger in — a classic "flash to reveal" cover intro. By
the time the intro settles, GSAP has cleared its inline styles, and the element's own
resting opacity should read as ~0 (fully invisible) even though the *class* itself has no
opacity utility — treat this element as `opacity-0` at rest and only animate it in the
entrance sequence (see the crash caveat below for why the live computed style read `1`
during extraction — the entrance timeline simply never ran).

## Title/subtitle row reveal
The "ITALY / 2026" row and "IN FRANCOBOLLI" row each sit in an `overflow-hidden` wrapper
offset above/below the heading (`-top-16` / `-bottom-16`) — same clip-and-slide entrance
technique as the nav hover, but time-driven on load instead of hover-driven: they start
translated out of view and slide into place, roughly concurrent with the heading stagger.

## Cursor glow (pointer-move driven, desktop only)
`main > div.fixed.z-10.mix-blend-screen.opacity-0.invisible.pointer-fine` — a
soft radial-gradient glow that follows the cursor on fine-pointer (mouse) devices only
(Tailwind `pointer-fine:` variant = `@media (pointer: fine)`). At rest it is
`opacity-0 invisible`; on first `mousemove` it should become `visible` and track the
cursor position (translate to `clientX/clientY`), with `mix-blend-mode: screen` so it
lightens whatever is beneath it. Treat as a nice-to-have polish layer — implement as a
small fixed div with a radial-gradient background, translated via `transform:
translate3d(x,y,0)` on `pointermove`, smoothed with a CSS transition (~150ms) or a
simple lerp.

## Responsive
No layout breakpoint changes the *type* of interaction — only sizes/paddings change (see
PAGE_TOPOLOGY.md). No distinct mobile interaction model.

## Known live-site bug (do not reproduce)
During extraction, reloading/resizing the page repeatedly triggered a React hydration
mismatch (console errors, minified React #418/#423/#425) that left the entrance backdrop
permanently opaque black, hiding the whole page. This reproduced across a fresh tab too,
so it is a real, if intermittent, defect in the live deployment — not something to clone.
The reference screenshots for this build were captured in the one healthy load before
this started reproducing.
