"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getNarration } from "@/lib/narration/resolver";
import type { Anchor } from "@/lib/narration/types";
import { pickActiveSection } from "./active-section";
import { getMuted, setMuted as persistMuted } from "./mute-storage";
import { useReducedMotion } from "./use-reduced-motion";
import { Orb } from "./orb";
import { SpeechBubble } from "./speech-bubble";

const DESKTOP_QUERY = "(min-width: 640px)";
const CORNER_ANCHOR: Anchor = { x: 88, y: 86, side: "left" };

export function Companion() {
  const pathname = usePathname();
  const lines = getNarration(pathname);
  const reducedMotion = useReducedMotion();

  const [muted, setMutedState] = useState<boolean>(() => getMuted());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const ratios = useRef<Record<string, number>>({});

  // desktop vs mobile (mobile docks in the corner, no travel)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // observe narrated sections
  useEffect(() => {
    if (lines.length === 0) return;
    ratios.current = {};
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-narrate]"));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.narrate;
          if (id) ratios.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }
        const next = pickActiveSection(ratios.current);
        if (next) setActiveId(next);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname, lines.length]);

  if (lines.length === 0) return null;

  const active = lines.find((l) => l.id === activeId) ?? lines[0];
  const anchor = !isDesktop || muted ? CORNER_ANCHOR : active.anchor;

  const toggleMute = () => {
    setMutedState((m) => {
      const next = !m;
      persistMuted(next);
      return next;
    });
  };

  return (
    <>
      <div
        className={`companion-dock side-${anchor.side}`}
        style={{ left: `${anchor.x}%`, top: `${anchor.y}%` }}
        aria-hidden="true"
      >
        {!muted && <SpeechBubble text={active.text} reducedMotion={reducedMotion} />}
        <Orb mood={active.mood} muted={muted} />
      </div>
      <button
        type="button"
        className="companion-mute"
        onClick={toggleMute}
        aria-label={muted ? "Unmute site companion" : "Mute site companion"}
      >
        {muted ? "◌" : "×"}
      </button>
    </>
  );
}
