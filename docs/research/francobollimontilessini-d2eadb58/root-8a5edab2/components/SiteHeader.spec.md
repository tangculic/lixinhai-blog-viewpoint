# SiteHeader Specification

## Overview
- Target file: `src/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/SiteHeader.tsx`
- Interaction model: static layout, hover-driven text-swap on links

## DOM structure
`header` (fixed, top) > `nav` > `ul` (3 columns: left / center / right, `grid-cols-[1fr_auto_1fr]`)
> `li` > `a` (Link) > `div.overflow-hidden` > two stacked identical text spans.

- Index (`/`), All (`/discover`), About (`/about`) as the 3 links.
- Only "Index" is the real current route in this build; the other two are rendered as
  plain (non-functional in this pass, since `/discover` and `/about` are out of scope) —
  render as real `<Link>`s pointing to `/discover` and `/about` anyway (harmless 404 until
  those are built later; do not disable them).

## Computed styles
- header: `position: fixed; top:0; left:0; right:0; z-index:10; margin: 1rem;` at `lg:`
  (≥1024px) → `margin-inline: 1.5rem; margin-block: 1.5rem;`
- ul: `display:grid; grid-template-columns: 1fr auto 1fr; align-items:center;`
- li: `overflow:hidden; padding-right: 0.5rem;`
- a: `position:relative; display:inline-block; cursor:pointer; padding: 1rem; line-height:1;`
- text: `font-family: var(--font-neue-montreal); font-weight:700; font-size:13.05px;
  text-transform:uppercase; color:#F2EEDE; letter-spacing:normal;`

## Hover behavior
Each link's text renders twice, stacked, in an `overflow-hidden` wrapper the height of
one line. Default: top copy visible. On hover: inner stack translates up 100%
(`-translate-y-1/2` works since wrapper height = 1 line and both copies are equal height
stacked with `flex flex-col`), revealing the second (identical) copy — a "flip" effect
that reads as a subtle refresh/underline-replacement cue. `transition: transform 300ms
cubic-bezier(0.4,0,0.2,1)`.

## Text content (verbatim)
Index / All / About

## Responsive
- Desktop (1440px): margins `1.5rem`, as above.
- Mobile (390px): margins `1rem` (Tailwind `m-4` default, no breakpoint override below `lg`).
- No column/stacking change — nav is always the 3-column row.
