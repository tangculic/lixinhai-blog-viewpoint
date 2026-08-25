import { assetPath } from "@/lib/asset-path";

/** A 320px tile of fine gaussian noise, generated once and repeated. */
const GRAIN = assetPath("/sites/francobollimontilessini-d2eadb58/shared/paper-grain.png");

/**
 * The page-wide finish: a sheet of grained paper laid over everything.
 *
 * The grain is a small tile repeated rather than one full-screen bitmap. That keeps it
 * even — the source's texture was dappled, and blurring the blotches out of it was both
 * the wrong look and expensive enough to stall the compositor — and it means the whole
 * finish costs 48KB. `overlay` blending is what makes it read as paper rather than a grey
 * film: it darkens and lightens around each colour instead of washing it out.
 *
 * Over the grain sit two gradients: a cool wash that falls from the top, and a soft edge
 * shade. They are what carries the frosted, lit-from-above feel; the grain alone is flat.
 */
export function FrostOverlay() {
  return (
    <aside aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div
        className="absolute inset-0 opacity-[0.2] mix-blend-overlay"
        style={{ backgroundImage: `url(${GRAIN})`, backgroundSize: "320px 320px" }}
      />

      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.14) 40%, rgba(255,255,255,0.03) 62%, rgba(22,30,48,0.16) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-multiply"
        style={{
          background:
            "radial-gradient(130% 105% at 50% 45%, rgba(255,255,255,0) 58%, rgba(96,104,120,0.5) 100%)",
        }}
      />
    </aside>
  );
}
