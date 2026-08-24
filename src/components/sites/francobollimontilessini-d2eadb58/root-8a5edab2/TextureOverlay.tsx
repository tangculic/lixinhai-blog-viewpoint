import Image from "next/image";

import { assetPath } from "@/lib/asset-path";

/** Global paper-grain + dappled-light vignette, multiply-blended over the whole page. */
export function TextureOverlay() {
  return (
    <aside className="fixed inset-0 z-20 opacity-25 mix-blend-multiply pointer-events-none">
      <Image
        src={assetPath("/sites/francobollimontilessini-d2eadb58/shared/paper-texture.jpg")}
        alt=""
        fill
        aria-hidden
        className="object-cover object-left-top"
      />
      <Image
        src={assetPath("/sites/francobollimontilessini-d2eadb58/shared/shadows-texture.jpg")}
        alt=""
        fill
        aria-hidden
        className="object-cover opacity-35 mix-blend-multiply"
      />
    </aside>
  );
}
