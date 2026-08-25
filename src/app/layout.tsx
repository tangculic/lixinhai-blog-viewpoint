import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} ${neueMontreal.variable} ${cenzoFlare.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
