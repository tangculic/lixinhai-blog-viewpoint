/**
 * Prefixes a root-relative public asset with the deployment's base path.
 *
 * Needed because the site is exported statically to a GitHub Pages *project* page, served
 * from `/<repo>/` rather than a domain root. `next/image` normally injects `basePath` while
 * building its optimizer URL, but this build sets `images.unoptimized` — there is no
 * optimizer on a static host — so `src` reaches the DOM exactly as written and has to carry
 * the prefix itself. The same applies to any raw `<img>`, `<video>`, or CSS `url()`.
 *
 * `NEXT_PUBLIC_BASE_PATH` is empty for local dev and root deployments, making this a no-op.
 */
export const assetPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
