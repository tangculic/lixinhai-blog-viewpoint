import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Geist and Geist Mono came with the scaffold and were never used — this site sets every
// face explicitly, in the two below. `next/font` preloads whatever it is handed, so the
// pair were costing two `<link rel=preload>` and 51KB of font on the critical path,
// competing for a phone's first connections with the JavaScript that has to land before
// the cover answers a tap.

// The target site's own self-hosted faces, pulled from francobollimontilessini.com.
const neueMontreal = localFont({
  src: "../../public/sites/francobollimontilessini-d2eadb58/shared/fonts/neue-montreal.woff2",
  variable: "--font-neue-montreal",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const cenzoFlare = localFont({
  src: "../../public/sites/francobollimontilessini-d2eadb58/shared/fonts/cenzo-flare.woff2",
  variable: "--font-cenzo-flare",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Travel Together in Penang & KL",
  description:
    "Let's travel together, watch the sunset at the beach, see World Heritage sites, and explore the city center.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${neueMontreal.variable} ${cenzoFlare.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          Remembers a tap on the cover that arrives before React does.

          The cover is prerendered, so it is on screen and looks ready long before the
          bundle has landed and hydration has wired its button up — and a tap in that
          window used to fall on the floor, which reads as the page being broken rather
          than as it still loading. This is a handful of bytes, inline and parsed with the
          document, so it is listening from the first frame; `StampGate` picks the flag up
          as it mounts and opens straight away.

          Capture phase and a `closest` test, so only the cover itself counts — the nav
          sits above it and is not this button.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){function t(e){var n=e.target;if(n&&n.closest&&n.closest("[data-ml-open]")){window.__mlPendingOpen=1;document.removeEventListener("pointerdown",t,true)}}document.addEventListener("pointerdown",t,true)})()',
          }}
        />
        {children}
      </body>
    </html>
  );
}
