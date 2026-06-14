"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { getNarration } from "@/lib/narration/resolver";
import { pickActiveSection } from "./active-section";
import { getMuted, setMuted, subscribeMuted } from "./mute-storage";
import { useReducedMotion } from "./use-reduced-motion";
import { scrollProgress, interpolateOrb, gutterTargetPercent } from "./hero-phase";
import { Orb } from "./orb";
import { SpeechBubble } from "./speech-bubble";
import { useReaction } from "./use-reaction";
import type { Gaze } from "./eyes";
import { useT } from "@/i18n/use-t";
import { isLocale, defaultLocale } from "@/i18n/config";

const WIDE_QUERY = "(min-width: 1280px)";
const DOCK_HEIGHT = 76; // px reserved at the bottom in dock mode

export function Companion() {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  const lang = isLocale(seg) ? seg : defaultLocale;
  const lines = getNarration(pathname, lang);
  const { t } = useT();
  const reducedMotion = useReducedMotion();

  const muted = useSyncExternalStore(subscribeMuted, getMuted, () => false);
  const { reaction, poke } = useReaction(muted);
  const [gaze, setGaze] = useState<Gaze>({ x: 0, y: 0 });
  const nodDur = useRef(3.2);
  useEffect(() => {
    if (reaction === "sleepy") nodDur.current = 2.6 + ((Date.now() % 10) / 10) * 1.6; // 2.6–4.2s, varies per entry
  }, [reaction]);
  const [slosh, setSlosh] = useState(false);
  const onPoke = () => { poke(); setSlosh(true); window.setTimeout(() => setSlosh(false), 600); };
  const [active, setActive] = useState<{ route: string; id: string } | null>(null);
  const [isWide, setIsWide] = useState(true);
  const [progress, setProgress] = useState(0);
  const [heroPresent, setHeroPresent] = useState(false);
  const [target, setTarget] = useState({ x: 90, y: 50 }); // gutter target (viewport %)
  const ratios = useRef<Record<string, number>>({});
  const activeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(WIDE_QUERY);
    const update = () => setIsWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Recompute the gutter target from the active section's rect (and hero progress).
  const recompute = useCallback(() => {
    const home = document.querySelector<HTMLElement>("[data-orb-home]");
    if (home) {
      const p = scrollProgress(window.scrollY, home.offsetHeight);
      setProgress((prev) => (prev === p ? prev : p));
    }
    const id = activeIdRef.current;
    const el = id ? document.querySelector<HTMLElement>(`[data-narrate="${id}"]`) : null;
    const rect = el ? el.getBoundingClientRect() : null;
    const next = gutterTargetPercent(window.innerWidth, window.innerHeight, rect);
    setTarget((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
  }, []);

  // Cursor gaze: eyes follow the pointer relative to viewport center.
  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setGaze({ x, y });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  // Observe sections → active id.
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
        if (next) {
          activeIdRef.current = next;
          setActive({ route: pathname, id: next });
          recompute();
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname, lines.length, recompute]);

  // Track scroll → hero progress + gutter top.
  useEffect(() => {
    const home = document.querySelector<HTMLElement>("[data-orb-home]");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeroPresent(!!home);
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname, recompute]);

  // Reserve bottom space in dock mode so the dock never covers content.
  const dockMode = !isWide;
  useEffect(() => {
    const px = dockMode && lines.length > 0 && !muted ? `${DOCK_HEIGHT}px` : "0px";
    document.documentElement.style.setProperty("--companion-dock-h", px);
    return () => document.documentElement.style.setProperty("--companion-dock-h", "0px");
  }, [dockMode, lines.length, muted]);

  if (lines.length === 0) return null;

  const activeId = active?.route === pathname ? active.id : null;
  const activeLine = lines.find((l) => l.id === activeId) ?? lines[0];

  // Hero aura only on the landing, wide, not muted, not reduced-motion.
  const heroPhase = heroPresent && isWide && !muted && !reducedMotion;
  const geo = heroPhase ? interpolateOrb(progress, target) : null;

  // Randomised nod duration: applied only while sleepy so it varies per entry.
  const nodDurStyle: CSSProperties | null = reaction === "sleepy" ? { animationDuration: `5s, ${nodDur.current}s` } : null;

  let dockClass: string;
  let dockStyle: CSSProperties;
  let orbStyle: CSSProperties | undefined;
  if (dockMode) {
    dockClass = "companion-bottom-dock";
    dockStyle = {};
    orbStyle = nodDurStyle ?? undefined;
  } else if (geo) {
    dockClass = "companion-gutter";
    dockStyle = { left: `${geo.x}%`, top: `${geo.y}%`, zIndex: geo.front ? 40 : -1 };
    orbStyle = {
      width: geo.size,
      height: geo.size,
      filter: `blur(${geo.blur}px)`,
      opacity: geo.opacity,
      ...(geo.front ? null : { animation: "orb-breathe 6s ease-in-out infinite" }),
      ...nodDurStyle,
    };
  } else {
    dockClass = "companion-gutter";
    dockStyle = { left: `${target.x}%`, top: `${target.y}%` };
    orbStyle = nodDurStyle ?? undefined;
  }

  const showBubble = !muted && (geo ? geo.bubble : true);
  const toggleMute = () => setMuted(!muted);

  return (
    <>
      <div
        className={dockClass}
        style={dockStyle}
        aria-hidden="true"
        {...(dockMode ? { "data-dock-active": !muted ? "true" : undefined } : {})}
      >
        {showBubble && <SpeechBubble text={activeLine.text} reducedMotion={reducedMotion} />}
        <span style={{ position: "relative", display: "inline-flex", pointerEvents: "auto" }} onPointerDown={onPoke}>
          {reaction === "asleep" && (
            <div className="companion-dream" aria-hidden="true"><span>z</span><span>z</span></div>
          )}
          <Orb mood={activeLine.mood} reaction={reaction} gaze={gaze} style={orbStyle} className={slosh ? "is-sloshing" : undefined} />
        </span>
      </div>
      <button
        type="button"
        className="companion-mute"
        onClick={toggleMute}
        aria-label={muted ? t.companion.unmute : t.companion.mute}
      >
        {muted ? "◌" : "×"}
      </button>
    </>
  );
}
