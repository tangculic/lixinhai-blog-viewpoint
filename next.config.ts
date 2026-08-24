import type { NextConfig } from "next";

// GitHub Pages serves this repo at tangculic.github.io/lixinhai-blog-viewpoint/ — a project
// page, not a domain root — so every asset and route has to be prefixed with the repo name.
// Set NEXT_PUBLIC_BASE_PATH="" (or leave GITHUB_ACTIONS unset) to build for local/root hosting.
const repoName = "lixinhai-blog-viewpoint";
const basePath = process.env.GITHUB_ACTIONS ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  // Static HTML export: GitHub Pages has no Node runtime, so there's no server to run
  // `output: "standalone"` on, and no `/_next/image` route to optimize images on demand.
  output: "export",
  basePath,
  assetPrefix: basePath,
  // Static export writes `/about/index.html` rather than `/about.html`, which is what
  // GitHub Pages (and most static hosts) expect for clean directory-style routes.
  trailingSlash: true,
  images: {
    // No image-optimization server on GitHub Pages — ship the source files as-is.
    unoptimized: true,
  },
  env: {
    // `unoptimized` images are emitted with their `src` verbatim — next/image only injects
    // basePath when routing through the (server-only) optimizer. Public assets therefore
    // have to prefix themselves; see `assetPath()`.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
