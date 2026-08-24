# Artifact Manifest — francobollimontilessini.com (Index page, `/`)

No AI-generated (Atlas Cloud) fallback assets were used. **All visual assets are the
original binary files downloaded from the live site.**

## Assets (all originals, verified)

| Source URL | Saved as | Size | Native dims |
|---|---|---|---|
| `/posters/PassoMalera.jpg` | `public/sites/…/root-8a5edab2/poster-passo-malera.jpg` | 621 KB | 2048×2048 |
| `/images/paper.jpg` | `public/sites/…/shared/paper-texture.jpg` | 462 KB | 1343×1920 |
| `/images/shadows.jpg` | `public/sites/…/shared/shadows-texture.jpg` | 109 KB | 1920×945 |
| `/_next/static/media/2e1e1644b1f0644d-s.p.woff2` | `public/sites/…/shared/fonts/neue-montreal.woff2` | 25 KB | — |
| `/_next/static/media/580a34bc5af67998-s.p.woff2` | `public/sites/…/shared/fonts/cenzo-flare.woff2` | 24 KB | — |

Verified as genuine full-bleed content: corner pixels sampled on all three images are
real image content (sky blue / paper cream / wall grey), no letterbox padding.

Mountain-peaks logo icon was extracted **verbatim** as inline SVG (see `DESIGN_TOKENS.md`).

## Download method (important for future runs)

`curl` from the Bash tool **cannot reach this domain** in this environment — every request
fails with `curl: (43) A libcurl function was given a bad argument`, including with the
sandbox disabled, while `curl https://www.google.com` succeeds. It is host-specific, not
a general network block.

**PowerShell `Invoke-WebRequest` works fine.** Use that for asset downloads here:

```powershell
Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 30
```

## Correction to an earlier version of this file

An earlier revision claimed the originals were unobtainable and that browser
**screenshots** of the assets had been substituted. That was wrong on both counts —
`curl` failing was mistaken for "no network path to the host", and PowerShell was never
tried. The screenshot substitutes were also silently broken: each contained RGB(14,14,14)
letterbox bars from the browser's dark background, which, multiply-blended, crushed
everything outside the centre strip to black. All substitutes have been replaced by the
originals above and the screenshot files deleted.

## Font wiring status — NOT yet applied

The two original `.woff2` files are downloaded but **not yet referenced by the app**.
`src/app/layout.tsx` still loads the Google Fonts stand-ins (Archivo for PP Neue
Montreal, Paytone One for Cenzo Flare). Switching to the real files via
`next/font/local` is a separate pending change.
