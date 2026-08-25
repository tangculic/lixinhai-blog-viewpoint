import { StampSite } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampSite";
import { FrostOverlay } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/FrostOverlay";
import { CursorGlow } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/CursorGlow";

export default function Home() {
  return (
    <main className="isolate h-svh w-screen overflow-hidden">
      <StampSite />
      <CursorGlow />
      {/* Last, and above everything: the frosted finish covers the nav and any open
          poster too, so the whole page reads as one sheet. */}
      <FrostOverlay />
    </main>
  );
}
