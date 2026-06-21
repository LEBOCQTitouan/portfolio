"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function GlowGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let rows: HTMLElement[] = [];
    let rects: DOMRect[] = [];
    let frame = 0;
    let last: { x: number; y: number } | null = null;

    const measure = () => {
      rows = Array.from(root.querySelectorAll<HTMLElement>("[data-glow-row]"));
      rects = rows.map((row) => row.getBoundingClientRect());
    };

    const apply = () => {
      frame = 0;
      if (!last) return;
      const { x, y } = last;
      rows.forEach((row, i) => {
        const rect = rects[i];
        if (!rect) return;
        row.style.setProperty("--mx", `${x - rect.left}px`);
        row.style.setProperty("--my", `${y - rect.top}px`);
        row.toggleAttribute("data-hot", y >= rect.top && y <= rect.bottom);
      });
    };

    const onMove = (e: PointerEvent | MouseEvent) => {
      if ("pointerType" in e && e.pointerType !== "mouse") return;
      root.setAttribute("data-on", "");
      last = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      root.removeAttribute("data-on");
      rows.forEach((row) => row.removeAttribute("data-hot"));
    };

    measure();
    root.addEventListener("pointermove", onMove as EventListener);
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove as EventListener);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} data-glow-group className={className}>
      {children}
    </div>
  );
}
