import { SiteHeader } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/SiteHeader";
import { StampGate } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/StampGate";
import { TextureOverlay } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/TextureOverlay";
import { CursorGlow } from "@/components/sites/francobollimontilessini-d2eadb58/root-8a5edab2/CursorGlow";

export default function Home() {
  return (
    <main className="isolate h-svh w-screen overflow-hidden">
      <StampGate />
      <TextureOverlay />
      <CursorGlow />
      <SiteHeader />
    </main>
  );
}
