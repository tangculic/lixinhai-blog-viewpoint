"use client";

import { useEffect, useRef } from "react";

/**
 * Soft radial glow that follows the cursor on fine-pointer (mouse) devices only.
 * Hidden until the first pointer move; screen-blended so it lightens what's beneath it.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;

    function handleMove(e: PointerEvent) {
      if (!el) return;
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    }

    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed top-0 left-0 z-10 hidden pointer-fine:block invisible opacity-0 pointer-events-none mix-blend-screen transition-opacity duration-150"
      style={{
        width: 480,
        height: 480,
        background:
          "radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)",
        transitionProperty: "opacity, transform",
        transitionDuration: "150ms, 80ms",
      }}
    />
  );
}
