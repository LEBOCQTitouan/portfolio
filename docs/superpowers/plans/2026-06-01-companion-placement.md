# Companion Placement Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the companion orb into dedicated, non-overlapping space — a right-gutter lane tracking the active section on wide screens (`≥1200px`), a reserved bottom dock below that — replacing the authored viewport-% anchors with derived section-tracking.

**Architecture:** Reuse the existing `interpolateOrb` hero-phase machinery, but feed it a **computed gutter target** (from viewport width + the active section's `getBoundingClientRect`) instead of per-line `anchor`s. A `(min-width:1200px)` media query selects gutter vs dock mode; the dock reserves page space via a CSS variable. Pure geometry helpers are unit-tested; the visual placement is tuned via `npm run preview`.

**Tech Stack:** Next.js 16 (client component), React 19, TypeScript, Tailwind v4 + CSS, Vitest. Spec: `docs/superpowers/specs/2026-06-01-companion-placement-design.md`.

**Every task:** after changes, `npx tsc --noEmit && npx vitest run && npm run lint` pass (and `npm run build` + a `npm run preview` eyeball at the end). Branch: `feat/companion-placement`. **Worker/positioning only — no new deps.**

---

## File Structure

- Modify: `src/components/companion/hero-phase.ts` (+ test) — add gutter-target + clamped-top helpers; keep `interpolateOrb`.
- Modify: `src/components/companion/companion.tsx` (+ test) — mode selection, gutter section-tracking, dock mode, hero re-target.
- Modify: `src/lib/narration/types.ts` — drop `anchor` from `NarrationLine`/remove `Anchor`.
- Modify: `src/lib/narration/script.ts` — remove `anchor` from every line (en + fr).
- Modify: `src/app/globals.css` — `.companion-gutter` + `.companion-bottom-dock` styles, reserved-dock padding var.
- Modify: `src/app/[lang]/layout.tsx` — apply the reserved-dock padding var to the content container (or the Companion sets it on `documentElement`).

---

## Task 1: Gutter geometry helpers (pure)

**Files:** Modify `src/components/companion/hero-phase.ts`, `src/components/companion/hero-phase.test.ts`

- [ ] **Step 1: Add failing tests** to `hero-phase.test.ts`:

```ts
import { gutterTargetPercent, COMPANION_SIZE } from "./hero-phase";

describe("gutterTargetPercent", () => {
  it("places x near the right edge (in the gutter)", () => {
    const { x } = gutterTargetPercent(1280, 800, { top: 100, height: 200 });
    expect(x).toBeGreaterThan(90); // right gutter
    expect(x).toBeLessThan(100);
  });
  it("y tracks the section's vertical center as a viewport %", () => {
    const { y } = gutterTargetPercent(1280, 800, { top: 300, height: 200 }); // center 400 of 800 = 50%
    expect(y).toBeCloseTo(50);
  });
  it("clamps y so the orb stays on screen", () => {
    expect(gutterTargetPercent(1280, 800, { top: -500, height: 100 }).y).toBe(12); // MIN
    expect(gutterTargetPercent(1280, 800, { top: 2000, height: 100 }).y).toBe(88); // MAX
  });
  it("falls back to mid-screen when no rect / zero viewport", () => {
    expect(gutterTargetPercent(1280, 800, null).y).toBe(50);
    expect(gutterTargetPercent(0, 0, null)).toEqual({ x: 90, y: 50 });
  });
});
```

- [ ] **Step 2: Run → fails.** `npx vitest run src/components/companion/hero-phase.test.ts`.

- [ ] **Step 3: Implement** — append to `hero-phase.ts`:

```ts
export const COMPANION_SIZE = 92;
const GUTTER_INSET = 28; // px from the right viewport edge toward the orb centre
const MIN_TOP_PCT = 12;
const MAX_TOP_PCT = 88;

/** Resting orb position (viewport %) in the right gutter, tracking a section's centre. */
export function gutterTargetPercent(
  vw: number,
  vh: number,
  sectionRect: { top: number; height: number } | null,
  orbSize = COMPANION_SIZE,
): { x: number; y: number } {
  const x = vw > 0 ? ((vw - GUTTER_INSET - orbSize / 2) / vw) * 100 : 90;
  const centre = sectionRect ? sectionRect.top + sectionRect.height / 2 : vh / 2;
  const yRaw = vh > 0 ? (centre / vh) * 100 : 50;
  const y = Math.min(MAX_TOP_PCT, Math.max(MIN_TOP_PCT, yRaw));
  return { x, y };
}
```

- [ ] **Step 4: Run → passes.** `npx vitest run src/components/companion/hero-phase.test.ts`.

- [ ] **Step 5: Commit**
```bash
git add src/components/companion/hero-phase.ts src/components/companion/hero-phase.test.ts
git commit -m "feat(companion): gutter-target geometry helper"
```

---

## Task 2: Companion controller — gutter lane + bottom dock

**Files:** Modify `src/components/companion/companion.tsx`, `src/components/companion/companion.test.tsx`

This replaces the viewport-% anchor positioning. Mode = gutter (`≥1200px`) vs dock (below). Gutter mode positions the orb via the computed gutter target (tracking the active section's rect, updated on scroll); the hero-phase interpolates from the aura to that target. Dock mode renders into a fixed bottom dock and reserves page space via `--companion-dock-h`.

- [ ] **Step 1: Update the gating test + add mode tests** in `companion.test.tsx`. Keep the existing tests (mute toggle, `/blog` null, active section text/mood, hero-phase aura) but: (a) the matchMedia mock now keys on `(min-width: 1200px)`; (b) add a test that in dock mode (`matchMedia(min-width:1200px)=false`) the dock element has class `companion-bottom-dock`; (c) in gutter mode (`=true`, no orb-home) the dock has class `companion-gutter`. Use the existing `MockIntersectionObserver` + `setMatchMedia` helpers. Example additions:

```ts
it("uses the bottom dock below 1200px", () => {
  setMatchMedia("(min-width: 1200px)", false);
  renderWithSections(["hero", "pillars"]);
  expect(document.querySelector(".companion-bottom-dock")).toBeInTheDocument();
});
it("uses the gutter lane at >=1200px", () => {
  setMatchMedia("(min-width: 1200px)", true);
  setMatchMedia("(prefers-reduced-motion: reduce)", false);
  renderWithSections(["hero", "pillars"]);
  expect(document.querySelector(".companion-gutter")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → new tests fail.** `npx vitest run src/components/companion/companion.test.tsx`.

- [ ] **Step 3: Replace `src/components/companion/companion.tsx`:**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { getNarration } from "@/lib/narration/resolver";
import { pickActiveSection } from "./active-section";
import { getMuted, setMuted, subscribeMuted } from "./mute-storage";
import { useReducedMotion } from "./use-reduced-motion";
import { scrollProgress, interpolateOrb, gutterTargetPercent } from "./hero-phase";
import { Orb } from "./orb";
import { SpeechBubble } from "./speech-bubble";
import { useT } from "@/i18n/use-t";
import { isLocale, defaultLocale } from "@/i18n/config";

const WIDE_QUERY = "(min-width: 1200px)";
const DOCK_HEIGHT = 76; // px reserved at the bottom in dock mode

export function Companion() {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  const lang = isLocale(seg) ? seg : defaultLocale;
  const lines = getNarration(pathname, lang);
  const { t } = useT();
  const reducedMotion = useReducedMotion();

  const muted = useSyncExternalStore(subscribeMuted, getMuted, () => false);
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
  function recompute() {
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
  }

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
  }, [pathname, lines.length]);

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
  }, [pathname]);

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

  let dockClass: string;
  let dockStyle: CSSProperties;
  let orbStyle: CSSProperties | undefined;
  if (dockMode) {
    dockClass = "companion-bottom-dock";
    dockStyle = {};
    orbStyle = undefined;
  } else if (geo) {
    dockClass = "companion-gutter";
    dockStyle = { left: `${geo.x}%`, top: `${geo.y}%`, zIndex: geo.front ? 40 : -1 };
    orbStyle = {
      width: geo.size,
      height: geo.size,
      filter: `blur(${geo.blur}px)`,
      opacity: geo.opacity,
      ...(geo.front ? null : { animation: "orb-breathe 6s ease-in-out infinite" }),
    };
  } else {
    dockClass = "companion-gutter";
    dockStyle = { left: `${target.x}%`, top: `${target.y}%` };
    orbStyle = undefined;
  }

  const showBubble = !muted && (geo ? geo.bubble : true);
  const toggleMute = () => setMuted(!muted);

  return (
    <>
      <div className={dockClass} style={dockStyle} aria-hidden="true">
        {showBubble && <SpeechBubble text={activeLine.text} reducedMotion={reducedMotion} />}
        <Orb mood={activeLine.mood} muted={muted} style={orbStyle} />
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
```

Note: `activeLine.anchor` is no longer referenced (anchors removed in Task 3). `interpolateOrb` already accepts a `{x,y}` target — now fed the gutter target. `CORNER_ANCHOR`/`Anchor` import dropped.

- [ ] **Step 4: Run → tests pass.** `npx vitest run src/components/companion` then `npx vitest run`.

- [ ] **Step 5: tsc/lint** — `npx tsc --noEmit && npm run lint` (tsc will flag `activeLine.anchor` is gone only after Task 3; the controller above doesn't use it, so it should be clean — if `NarrationLine.anchor` is still required by the type, the script still has it and compiles. Good.)

- [ ] **Step 6: Commit**
```bash
git add src/components/companion/companion.tsx src/components/companion/companion.test.tsx
git commit -m "feat(companion): gutter-lane + bottom-dock placement, section-tracking"
```

---

## Task 3: Drop the authored `anchor` field

**Files:** Modify `src/lib/narration/types.ts`, `src/lib/narration/script.ts`

- [ ] **Step 1: Remove `Anchor` + `anchor`** from `src/lib/narration/types.ts`:

```ts
export type Mood = "calm" | "warm" | "focused";

export type NarrationLine = {
  id: string;
  mood: Mood;
  text: string;
};

export type NarrationMap = Record<string, NarrationLine[]>;
```

- [ ] **Step 2: Strip `anchor` from every line** in `src/lib/narration/script.ts` — remove the `, anchor: { … }` from each `{ id, mood, text, anchor }` in BOTH the `en` and `fr` maps (leaving `{ id, mood, text }`). Use a careful find/replace or edit each line.

- [ ] **Step 3: Fix any remaining references** — `grep -rn "anchor" src/` should return nothing under `src/lib/narration` or `src/components/companion`. If `resolver.test.ts` or `script` fixtures reference `anchor`, remove it there too.

- [ ] **Step 4: Gate** — `npx tsc --noEmit && npx vitest run && npm run lint`. Expected green (the controller already stopped using `anchor` in Task 2).

- [ ] **Step 5: Commit**
```bash
git add src/lib/narration/types.ts src/lib/narration/script.ts
git commit -m "refactor(companion): drop authored narration anchors (now derived)"
```

---

## Task 4: Gutter & dock styles

**Files:** Modify `src/app/globals.css`, `src/app/[lang]/layout.tsx`

- [ ] **Step 1: Replace the `.companion-dock` block** in `globals.css` with gutter + dock variants. Find the existing `.companion-dock`/`.companion-dock.side-*` rules and replace with:

```css
/* Companion — gutter lane (wide) */
.companion-gutter {
  position: fixed;
  z-index: 40;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column-reverse; /* bubble stacked ABOVE the orb, within the gutter */
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: 16rem; /* keep the bubble inside the gutter, never over the column */
  pointer-events: none;
}

/* Companion — reserved bottom dock (narrow) */
.companion-bottom-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 16px;
  min-height: var(--companion-dock-h, 76px);
  background: color-mix(in srgb, var(--background) 86%, transparent);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--border);
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .companion-gutter {
    transition: left 0.6s cubic-bezier(0.6, 0.02, 0.2, 1), top 0.6s cubic-bezier(0.6, 0.02, 0.2, 1);
  }
}
```
(The existing `.companion-orb`, `.companion-bubble`, `.companion-mute`, `orb-breathe` keyframes stay. The bubble's tail/`side-*` rules can be removed since the gutter stacks vertically; verify nothing else references `side-left`/`side-right`.)

- [ ] **Step 2: Reserve dock space** — in `src/app/[lang]/layout.tsx`, add `style={{ paddingBottom: "var(--companion-dock-h, 0px)" }}` to the `<main id="main">` element (the Companion sets `--companion-dock-h` to `76px` only in dock mode, `0` otherwise). This keeps the dock from covering the last content.

- [ ] **Step 3: Gate** — `npx tsc --noEmit && npx vitest run && npm run lint && npm run build`. Green; both locales prerender.

- [ ] **Step 4: Commit**
```bash
git add src/app/globals.css src/app/[lang]/layout.tsx
git commit -m "style(companion): gutter-lane and reserved bottom-dock styles"
```

---

## Task 5: Verify & PR

- [ ] **Step 1: Full gate**
`npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: green; both locales prerender.

- [ ] **Step 2: Manual preview (the placement needs eyes)** — `npm run preview`, at a **wide window (≥1200px)** on `/en`:
- Scroll a non-landing page (e.g. `/en/about`): the orb rides the **right gutter** beside the active section, the bubble stacked above it — **never over the reading column**.
- The landing hero aura still plays and the orb settles into the gutter as it scrolls out.
- **Resize narrow (<1200px):** the orb + bubble move to the **bottom dock**; the last content is **not covered** (page reserves space).
- Mute (`×`) hides the bubble/shrinks the orb in both modes; reload keeps it muted.
- `/en/blog/...`: no orb. OS reduce-motion: orb jumps (no glide), no aura.
Stop preview.

- [ ] **Step 3: Worker size** — `npx wrangler deploy --dry-run 2>&1 | grep -i gzip` → under 3072 KiB (positioning only, no new deps).

- [ ] **Step 4: Push & PR**
```bash
git push -u origin feat/companion-placement
gh pr create --title "feat: companion gutter-lane + bottom-dock placement" --body "Implements docs/superpowers/specs/2026-06-01-companion-placement-design.md. Orb gets dedicated non-overlapping space: a right-gutter lane tracking the active section (>=1200px), a reserved bottom dock below. Drops authored narration anchors for derived section-tracking; landing aura kept as the hero exception."
```

---

## Self-Review Notes

- **Spec coverage:** two modes gutter/dock (Tasks 2, 4) · gutter tracks active section (Task 2 `recompute` + Task 1 helper) · 1200px split (Task 2) · reserved dock padding via `--companion-dock-h` (Tasks 2, 4) · anchors dropped for derived tracking (Tasks 2, 3) · landing aura exception preserved (Task 2 hero-phase re-target to the gutter target) · mute/reduced-motion/`/blog` preserved (Task 2) · testing of pure helper + mode selection (Tasks 1, 2). All covered.
- **Type consistency:** `gutterTargetPercent`, `COMPANION_SIZE`, `interpolateOrb(p, {x,y})`, `NarrationLine {id,mood,text}` consistent across helper, controller, and type. The controller stops referencing `anchor` (Task 2) before the field is removed (Task 3), so each task compiles.
- **Visual tuning:** `GUTTER_INSET`, `DOCK_HEIGHT`, the `1200px` breakpoint, and `max-width:16rem` bubble cap are single constants to adjust during the preview step.
