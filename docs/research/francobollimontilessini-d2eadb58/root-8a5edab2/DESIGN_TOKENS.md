# Design Tokens — francobollimontilessini.com (Index page, `/`)

## Colors
- Cream/off-white text: `rgb(242, 238, 222)` = `#F2EEDE` (all title/nav/body text on cover)
- Carousel fallback green (poster's own hill palette, reused as page bg fallback): `#51B37C`
- Poster illustration palette (from `/posters/PassoMalera.jpg`): sky blue ~`#4F92E8`,
  hill green ~`#22B573` / darker foreground hill ~`#0E5C3B`, house white `#FFFFFF`,
  roof/cow markings dark brown/black `#2B1B12`
- Per-location accent pairs used elsewhere on the site (bg/fg), not used on this page but
  recorded for future pages: see `posterItems` dump below.
- Backdrop: `#000000` multiply blend (entrance-only, see BEHAVIORS.md)

## Typography
Two self-hosted font families (Next `next/font/local`, not recoverable as exact files in
this pass — see Font substitution below):

- **`font-neue-montreal`** (label/body font) — weight 700 used everywhere observed
  (nav links, "ITALY"/"2026", description paragraph). All uses are `uppercase`,
  `font-bold`, `text-[13.05px]`–`text-[23.2px]` depending on element, `letter-spacing:
  normal`.
- **`font-cenzo-flare`** (display font) — weight 900 (`font-black`), used only for the
  "MONTI LESSINI" heading. `text-[20vw] lg:text-[14vw]` (179.2px at 1280px viewport),
  `line-height: 0.8`, `letter-spacing: wider` (computed `8.96px` at 179.2px size — i.e.
  tracking ≈ 0.05em), `uppercase`, `text-align: center`.

### Font substitution (exact files not extractable — see note below)
- `font-neue-montreal` → **Archivo** (Google Fonts), weight 700. Close grotesque-sans
  match for proportions/x-height.
- `font-cenzo-flare` → **Paytone One** (Google Fonts), weight 400 (it only ships one
  bold-ish weight). Closest common match for the heading's chunky, rounded-terminal
  display letterforms.

> Extraction note: the live site's actual `.woff2` files could not be downloaded in this
> environment (outbound `curl`/`fetch` to the target domain is blocked from the tool
> sandbox, and in-page `<a download>` / Blob downloads did not land in an
> automation-accessible folder). Font substitutes above are a deliberate, disclosed
> fallback — swap in the real PP Neue Montreal / Cenzo Flare files if you obtain licenses.

## Spacing / sizing
- Header: `m-4` (mobile) / `lg:mx-6 lg:my-6` (desktop)
- Description block: `max-w-2xl mx-auto`, `bottom-24`, `max-md:px-8`
- Mountain icon: intrinsic `223×74`, `max-lg:h-12`
- Nav link text: `13.05px` / `700` / uppercase, `p-4` hit area

## Global overlay assets (mix-blend-multiply, full-bleed, always on)
1. `/images/paper.jpg` — paper grain/fold texture, full opacity, `object-cover`
2. `/images/shadows.jpg` — dappled light-leak vignette, `opacity: 35%`, `object-cover`
Both saved as the **original downloaded files** at
`public/sites/francobollimontilessini-d2eadb58/shared/paper-texture.jpg` (1343×1920) and
`shadows-texture.jpg` (1920×945).

## Hero poster asset
`/posters/PassoMalera.jpg` (2048×2048) — saved as the **original downloaded file** at
`public/sites/francobollimontilessini-d2eadb58/root-8a5edab2/poster-passo-malera.jpg`.

> Asset note: all images and both `.woff2` fonts are the real originals, fetched with
> PowerShell `Invoke-WebRequest` (`curl` fails against this host with error 43 — see
> `ARTIFACT_MANIFEST.md`). The font files are downloaded but not yet wired into
> `layout.tsx`, which still uses the Google Fonts stand-ins described above.

## Mountain-peaks icon (extracted verbatim, full-fidelity vector)
```svg
<svg width="223" height="74" viewBox="0 0 223 74" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M91.0094 11.2009L54.8613 73.8095H165.942L129.794 11.2009C121.177 -3.72581 99.6266 -3.72581 91.0094 11.2009Z"/>
<path d="M20.2304 40.0524L0.742188 73.8093H78.5034L59.0152 40.0524C50.398 25.1257 28.8476 25.1257 20.2304 40.0524Z"/>
<path d="M163.846 40.0524L144.357 73.8093H222.119L202.63 40.0524C194.013 25.1257 172.463 25.1257 163.846 40.0524Z"/>
</svg>
```

## Copy (verbatim)
- Nav: "Index" (/, current), "All" (/discover), "About" (/about)
- Eyebrow row: "ITALY" ... "2026"
- Heading: "MONTI LESSINI"
- Subtitle: "IN FRANCOBOLLI"
- Description: "I luoghi più iconici della Lessinia raccontati da dei francobolli,
  oggetti di per sé liberi, reinterpretati attraverso la lente delle storie che ci
  appartengono."

## posterItems data (from `__NEXT_DATA__`, for future /discover or /poster pages)
16 locations, each `{slug, name, location, image, bg, fg, coordinates}`:
1. passo-malera | Passo Malera | S.Giorgio di Boscochiesanuova | /posters/PassoMalera.jpg | #51B37C/#DF6A69
2. monte-tomba | Monte Tomba | Rifugio Primaneve di Boscochiesanuova | /posters/MonteTomba.jpg | #5D8BBA/#E190B9
3. monte-cornetto | Monte Cornetto | Sant'Anna d'Alfaedo | /posters/MonteCornetto.jpg | #DF92B6/#F9CD6C
4. valle-sfingi | Valle delle Sfingi | Camposilvano | /posters/ValledelleSfingi.jpg | #5D8BBA/#DD92AC
5. eremo-smoro | Eremo di S.Moro | S. Mauro di Saline | /posters/EremodiSMoro.jpg | #DF6A69/#F9CD6C
6. malga-pidocchio | Malga Pidocchio | Erbezzo | /posters/MalgaPidocchio.jpg | #51B37C/#DF6A69
7. ponte-di-veja | Ponte di Veja | Velo Veronese | /posters/PontediVeja.jpg | #DF6A69/#51B37C
8. malga-buse | Malga Buse | Velo Veronese | /posters/MalgaBuse.jpg | #DF6A69/#F9CD6C
9. corno-daquilio | Corno D'Aquilio | Località Tomasi | /posters/Corno-DAquilio.jpg | #7b8024/#4ea16f
10. cascate-di-molina | Cascate di Molina | Molina | /posters/CascatediMolina.jpg | #51B37C/#DF6A69
11. rifugio-gaibana | Rifugio Gaibana | Molina | /posters/RifugioGaibana.jpg | #5D8BBA/#DD92AC
12. malga-brusa | Malga Brusà | S.Giorgio di Boscochiesanuova | /posters/MalgaBrusa.jpg | #51B37C/#DF6A69
13. casetta-delle-fade | Casetta delle Fade | Vajo della Pissadora Val Squaranto | /posters/CasettadelleFadedelvajodellaPissarota.jpg | #F9CD6C/#4CB57A
14. grotta-del-ciabattino | Grotta Ciabattino | Sant'Anna d'Alfaedo | /posters/GrottadelCiabattino.jpg | #D1726D/#4CB57A
15. giazza | Giazza | Selva di Progno | /posters/Giazza.jpg | #EBC46D/#51B37C
16. busoni-di-sega-di-ala | Busoni Sega di Ala | Sega di Ala | /posters/BusonidiSegadiAla.jpg | #DD92AC/#F9CD6C
