"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { getNarration } from "@/lib/narration/resolver";
import { resolveLineText } from "@/lib/narration/resolve-line-text";
import { pickActiveSection } from "./active-section";
import { getMuted, setMuted, subscribeMuted } from "./mute-storage";
import { useReducedMotion } from "./use-reduced-motion";
import { scrollProgress, interpolateOrb, gutterTargetPercent } from "./hero-phase";
import { MOTION, stepSpring, hoverOffset, stepSquash, type SpringState } from "./orb-motion";
import { Orb } from "./orb";
import { SpeechBubble } from "./speech-bubble";
import { useReaction } from "./use-reaction";
import type { Gaze } from "./eyes";
import { useEyeLife } from "./use-eye-life";
import { eyeShape } from "./eyes";
import { useT } from "@/i18n/use-t";
import { isLocale, defaultLocale } from "@/core/domain/locale";

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
  // Randomised nod duration (2.6–4.2s) so the sleepy nod varies per entry. Kept in a
  // ref because it is non-reactive cosmetic jitter (a one-render staleness is
  // irrelevant for an animation duration), and Date.now is impure so it must not run
  // during render — write it in an effect instead.
  const nodDur = useRef(3.2);
  useEffect(() => {
    if (reaction === "sleepy") nodDur.current = 2.6 + ((Date.now() % 10) / 10) * 1.6;
  }, [reaction]);
  const [slosh, setSlosh] = useState(false);
  const eyesRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [pokeNonce, setPokeNonce] = useState(0);
  const onPoke = () => {
    poke();
    setPokeNonce((n) => n + 1);
    if (muted) return;
    setSlosh(true);
    window.setTimeout(() => setSlosh(false), 600);
  };
  const [active, setActive] = useState<{ route: string; id: string; text?: string } | null>(null);
  const [isWide, setIsWide] = useState(true);
  const [progress, setProgress] = useState(0);
  const [heroPresent, setHeroPresent] = useState(false);
  const [target, setTarget] = useState({ x: 90, y: 50 }); // gutter target (viewport %)
  const ratios = useRef<Record<string, number>>({});
  const activeIdRef = useRef<string | null>(null);

  // Motion loop plumbing (imperative; bypasses React re-renders).
  const gutterRef = useRef<HTMLDivElement | null>(null); // positioned wrapper
  const squashRef = useRef<HTMLSpanElement | null>(null); // orb wrapper (squash target)
  const posPctRef = useRef<{ x: number; y: number }>({ x: 90, y: 50 }); // current target (vw/vh %)
  // Spring motion runs in the gutter (wide) when motion is allowed.
  const motionMode = isWide && !reducedMotion;
  // The orb unmounts on no-narration routes (e.g. /blog). Track its presence so
  // the imperative spring loop re-binds to the freshly-mounted node on the way
  // back — otherwise it keeps driving the detached old node and the new one is
  // left at left:0/top:0 (the top-left corner).
  const orbMounted = lines.length > 0;

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
          const el = document.querySelector<HTMLElement>(`[data-narrate="${next}"]`);
          setActive({ route: pathname, id: next, text: el?.dataset.narrateText });
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

  // Spring loop: drive position (gutter wrapper) and squash (orb wrapper) via
  // transform. Runs only in wide, motion-allowed mode; dock/reduced-motion skip it.
  useEffect(() => {
    if (!motionMode) return;
    const gutter = gutterRef.current;
    const squashEl = squashRef.current;
    if (!gutter || !squashEl) return;

    let raf = 0;
    let prev = 0;
    let inited = false;
    let sx: SpringState = { pos: 0, vel: 0 };
    let sy: SpringState = { pos: 0, vel: 0 };
    let squash = 0;
    let lean = 0;

    const loop = (now: number) => {
      const dt = Math.min(MOTION.dtMax, prev ? (now - prev) / 1000 : 0.016);
      prev = now;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const tx = (posPctRef.current.x / 100) * vw;
      const ty = (posPctRef.current.y / 100) * vh;

      if (!inited) {
        sx = { pos: tx, vel: 0 };
        sy = { pos: ty, vel: 0 };
        inited = true;
      }
      sx = stepSpring(sx, tx, dt);
      sy = stepSpring(sy, ty, dt);

      const hv = hoverOffset(now);
      const s = stepSquash(sy.vel, squash, lean, dt);
      squash = s.smoothSquash;
      lean = s.smoothLean;

      gutter.style.transform = `translate(${sx.pos + hv.x}px, ${sy.pos + hv.y}px) translate(-50%, -50%)`;
      squashEl.style.transform = `scaleX(${s.scaleX}) scaleY(${s.scaleY}) rotate(${s.tilt}deg)`;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      // Clear inline transforms so a later reduced-motion/dock render starts clean.
      gutter.style.transform = "";
      squashEl.style.transform = "";
    };
  }, [motionMode, orbMounted]);

  // Reserve bottom space in dock mode so the dock never covers content.
  const dockMode = !isWide;
  useEffect(() => {
    const px = dockMode && lines.length > 0 && !muted ? `${DOCK_HEIGHT}px` : "0px";
    document.documentElement.style.setProperty("--companion-dock-h", px);
    return () => document.documentElement.style.setProperty("--companion-dock-h", "0px");
  }, [dockMode, lines.length, muted]);

  const eyeReactionShape = eyeShape(lines[0]?.mood ?? "calm", reaction);
  useEyeLife({
    containerRef: eyesRef,
    reaction,
    shape: eyeReactionShape,
    activeKey: active?.id ?? null,
    hovering,
    pokeNonce,
    gaze,
    reducedMotion,
  });

  if (lines.length === 0) return null;

  const activeId = active?.route === pathname ? active.id : null;
  const activeLine = lines.find((l) => l.id === activeId) ?? lines[0];
  const activeText = resolveLineText(active?.route === pathname ? active.text : undefined, activeLine.text);

  // Hero aura only on the landing, wide, not muted, not reduced-motion.
  const heroPhase = heroPresent && isWide && !muted && !reducedMotion;
  const geo = heroPhase ? interpolateOrb(progress, target) : null;

  // Mirror the live position target (viewport %) for the rAF loop to read.
  // Safe in React 18 (synchronous render): idempotent mirror, no tearing.
  // eslint-disable-next-line react-hooks/refs
  posPctRef.current = geo ? { x: geo.x, y: geo.y } : { x: target.x, y: target.y };

  // Randomised nod duration: applied only while sleepy so it varies per entry.
  // eslint-disable-next-line react-hooks/refs -- intentional: non-reactive cosmetic jitter (see nodDur above)
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
    // Motion mode: loop drives transform from (0,0). Reduced motion: static %.
    dockStyle = motionMode
      ? { left: 0, top: 0, zIndex: geo.front ? 40 : -1 }
      : { left: `${geo.x}%`, top: `${geo.y}%`, zIndex: geo.front ? 40 : -1 };
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
    dockStyle = motionMode ? { left: 0, top: 0 } : { left: `${target.x}%`, top: `${target.y}%` };
    orbStyle = nodDurStyle ?? undefined;
  }

  const showBubble = !muted && (geo ? geo.bubble : true);
  const toggleMute = () => setMuted(!muted);

  return (
    <>
      <div
        ref={gutterRef}
        className={dockClass}
        style={dockStyle}
        aria-hidden="true"
        {...(dockMode ? { "data-dock-active": !muted ? "true" : undefined } : {})}
      >
        {showBubble && <SpeechBubble text={activeText} reducedMotion={reducedMotion} />}
        <span
          ref={squashRef}
          style={{ position: "relative", display: "inline-flex", pointerEvents: "auto" }}
          onPointerDown={onPoke}
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
        >
          {reaction === "asleep" && (
            <div className="companion-dream" aria-hidden="true"><span>z</span><span>z</span></div>
          )}
          <Orb mood={activeLine.mood} reaction={reaction} gaze={gaze} style={orbStyle} className={slosh ? "is-sloshing" : undefined} eyesRef={eyesRef} />
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
