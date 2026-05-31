"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { getNarration } from "@/lib/narration/resolver";
import type { Anchor } from "@/lib/narration/types";
import { pickActiveSection } from "./active-section";
import { getMuted, setMuted, subscribeMuted } from "./mute-storage";
import { useReducedMotion } from "./use-reduced-motion";
import { scrollProgress, interpolateOrb } from "./hero-phase";
import { Orb } from "./orb";
import { SpeechBubble } from "./speech-bubble";

const DESKTOP_QUERY = "(min-width: 640px)";
const CORNER_ANCHOR: Anchor = { x: 88, y: 86, side: "left" };

export function Companion() {
  const pathname = usePathname();
  const lines = getNarration(pathname);
  const reducedMotion = useReducedMotion();

  const muted = useSyncExternalStore(subscribeMuted, getMuted, () => false);
  const [active, setActive] = useState<{ route: string; id: string } | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [progress, setProgress] = useState(0); // hero-phase scroll progress (0..1)
  const [heroPresent, setHeroPresent] = useState(false);
  const ratios = useRef<Record<string, number>>({});

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
        if (next) setActive({ route: pathname, id: next });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname, lines.length]);

  // Hero phase: track scroll progress over the [data-orb-home] hero.
  useEffect(() => {
    const home = document.querySelector<HTMLElement>("[data-orb-home]");
    // Sync with DOM presence — legitimate external-system synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeroPresent(!!home);
    if (!home) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setProgress(scrollProgress(window.scrollY, home.offsetHeight));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  if (lines.length === 0) return null;

  const activeId = active?.route === pathname ? active.id : null;
  const activeLine = lines.find((l) => l.id === activeId) ?? lines[0];

  // Hero phase is active only on a route with an orb-home, on desktop, not muted,
  // and not under reduced motion (then we fall back to the plain V0 companion).
  const heroPhase = heroPresent && isDesktop && !muted && !reducedMotion;

  const travelAnchor = !isDesktop || muted ? CORNER_ANCHOR : activeLine.anchor;
  const geo = heroPhase ? interpolateOrb(progress, travelAnchor) : null;

  const dockStyle: CSSProperties = geo
    ? { left: `${geo.x}%`, top: `${geo.y}%`, zIndex: geo.front ? 40 : 5 }
    : { left: `${travelAnchor.x}%`, top: `${travelAnchor.y}%` };

  const orbStyle: CSSProperties | undefined = geo
    ? { width: geo.size, height: geo.size, filter: `blur(${geo.blur}px)`, opacity: geo.opacity }
    : undefined;

  const showBubble = !muted && (geo ? geo.bubble : true);

  const toggleMute = () => setMuted(!muted);

  return (
    <>
      <div
        className={`companion-dock side-${travelAnchor.side}`}
        style={dockStyle}
        aria-hidden="true"
      >
        {showBubble && <SpeechBubble text={activeLine.text} reducedMotion={reducedMotion} />}
        <Orb mood={activeLine.mood} muted={muted} style={orbStyle} />
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
