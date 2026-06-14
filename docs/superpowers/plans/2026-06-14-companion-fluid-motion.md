# Companion Fluid Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the companion mascot's linear/CSS-transition scroll motion with a velocity-reactive spring, volume-preserving squash, and an idle hover, so it feels weighted and alive.

**Architecture:** A single `requestAnimationFrame` loop in `companion.tsx` reads a target position and writes `transform` straight to the orb's DOM nodes via refs (bypassing React re-renders). All bounded/testable motion math (spring step, squash, hover) lives in a new pure module `orb-motion.ts`. The old `left/top` CSS transition is removed; position is now driven entirely by `transform`. Reduced-motion and mobile dock paths keep their current static behavior.

**Tech Stack:** TypeScript, React (client component), Vitest. No new dependencies.

---

## File Structure

- **Create** `src/components/companion/orb-motion.ts` — pure motion math + the `MOTION` constants (spring step, idle hover, squash). One responsibility: deterministic, testable physics helpers.
- **Create** `src/components/companion/orb-motion.test.ts` — unit tests for the above.
- **Modify** `src/components/companion/companion.tsx` — imperative glue: refs, target mirror, the rAF loop, and the gutter render branch.
- **Modify** `src/app/globals.css` — remove the `left/top` transition on `.companion-gutter` (the spring is now the sole smoother).

Approved motion constants (Playful + hover): `k=180`, `c=14`, `squashMax=0.08`, `leanMax=0.05`, `hoverAmp=9`, `hoverSpeed=1.0`.

---

## Task 1: Pure motion math module (`orb-motion.ts`)

**Files:**
- Create: `src/components/companion/orb-motion.ts`
- Test: `src/components/companion/orb-motion.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/companion/orb-motion.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { MOTION, stepSpring, hoverOffset, stepSquash } from "./orb-motion";

describe("stepSpring", () => {
  it("converges to the target and settles (velocity → ~0)", () => {
    let s = { pos: 0, vel: 0 };
    for (let i = 0; i < 600; i++) s = stepSpring(s, 100, 1 / 60);
    expect(s.pos).toBeCloseTo(100, 1);
    expect(Math.abs(s.vel)).toBeLessThan(0.5);
  });

  it("is under-damped at the default preset (overshoots the target at least once)", () => {
    let s = { pos: 0, vel: 0 };
    let overshot = false;
    for (let i = 0; i < 600; i++) {
      s = stepSpring(s, 100, 1 / 60);
      if (s.pos > 100.5) overshot = true;
    }
    expect(overshot).toBe(true);
  });
});

describe("hoverOffset", () => {
  it("stays within ±hoverAmp on both axes", () => {
    for (let t = 0; t < 60000; t += 123) {
      const { x, y } = hoverOffset(t);
      expect(Math.abs(x)).toBeLessThanOrEqual(MOTION.hoverAmp + 1e-6);
      expect(Math.abs(y)).toBeLessThanOrEqual(MOTION.hoverAmp + 1e-6);
    }
  });

  it("is not a degenerate line (x and y differ over time)", () => {
    const a = hoverOffset(1000);
    const b = hoverOffset(4000);
    expect(a.x).not.toBeCloseTo(a.y, 3);
    expect(a.x).not.toBeCloseTo(b.x, 3);
  });
});

describe("stepSquash", () => {
  it("is volume-preserving: scaleX * scaleY ≈ 1", () => {
    const r = stepSquash(2000, 0, 0, 1 / 60);
    expect(r.scaleX * r.scaleY).toBeCloseTo(1, 5);
  });

  it("stays bounded by squashMax even for extreme velocity", () => {
    // Drive hard for many frames so the low-pass reaches its ceiling.
    let sq = 0, ln = 0, last = { scaleX: 1, scaleY: 1, tilt: 0, smoothSquash: 0, smoothLean: 0 };
    for (let i = 0; i < 240; i++) {
      last = stepSquash(1e9, sq, ln, 1 / 60);
      sq = last.smoothSquash; ln = last.smoothLean;
    }
    expect(last.smoothSquash).toBeLessThanOrEqual(MOTION.squashMax + 1e-6);
    expect(last.scaleY).toBeLessThanOrEqual(1 + MOTION.squashMax + 1e-6);
  });

  it("returns no deformation at zero velocity from rest", () => {
    const r = stepSquash(0, 0, 0, 1 / 60);
    expect(r.scaleX).toBeCloseTo(1, 6);
    expect(r.scaleY).toBeCloseTo(1, 6);
    expect(r.tilt).toBeCloseTo(0, 6);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/companion/orb-motion.test.ts`
Expected: FAIL — `Failed to resolve import "./orb-motion"` (module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/components/companion/orb-motion.ts`:

```ts
/**
 * Pure, deterministic motion helpers for the companion orb.
 * The component runs these inside a requestAnimationFrame loop and writes the
 * results to the DOM as transforms. Keeping the math here makes it testable.
 */

/** Approved "Playful + hover" feel (validated in .context/mascot-motion-demo.html). */
export const MOTION = {
  k: 180, // spring stiffness
  c: 14, // spring damping (under-damped → slight overshoot + settle)
  squashMax: 0.08, // max stretch fraction (volume-preserving)
  leanMax: 0.05, // max tilt fraction
  hoverAmp: 9, // idle-drift amplitude (px)
  hoverSpeed: 1.0, // idle-drift rate
  velSat: 900, // velocity saturation for squash (px/s)
  smoothRate: 12, // low-pass rate for squash/lean
  dtMax: 0.032, // clamp dt so a stalled tab can't explode the spring
} as const;

export type SpringState = { pos: number; vel: number };

/** One semi-implicit (symplectic) Euler step of a unit-mass damped spring. */
export function stepSpring(
  s: SpringState,
  target: number,
  dt: number,
  k = MOTION.k,
  c = MOTION.c,
): SpringState {
  const a = (target - s.pos) * k - s.vel * c;
  const vel = s.vel + a * dt;
  const pos = s.pos + vel * dt;
  return { pos, vel };
}

/**
 * Idle hover: two non-harmonic sine waves per axis → an organic drift that
 * never visibly repeats. Bounded to ±amp on each axis.
 */
export function hoverOffset(timeMs: number, amp = MOTION.hoverAmp, speed = MOTION.hoverSpeed) {
  const ts = (timeMs / 1000) * speed;
  // Each axis sums two non-harmonic sines whose peaks total `1.5`; scale by
  // (amp / 1.5) so vertical drift peaks at ±amp. Horizontal is gentler (×0.6).
  return {
    x: (Math.sin(ts * 0.9) + Math.sin(ts * 0.37 + 1.7) * 0.5) * (amp / 1.5) * 0.6,
    y: (Math.sin(ts * 1.3 + 0.6) + Math.sin(ts * 0.53) * 0.5) * (amp / 1.5),
  };
}

export type SquashResult = {
  scaleX: number;
  scaleY: number;
  tilt: number; // degrees
  smoothSquash: number;
  smoothLean: number;
};

/**
 * Velocity-driven squash & lean, made tasteful:
 *  - saturate velocity with tanh so fast scroll can't blow it up,
 *  - low-pass smooth so it eases in/out (no per-frame jitter),
 *  - volume-preserving: scaleY=1+s, scaleX=1/(1+s) — squishes, never balloons.
 */
export function stepSquash(
  vy: number,
  prevSquash: number,
  prevLean: number,
  dt: number,
): SquashResult {
  const drive = Math.tanh(vy / MOTION.velSat); // −1..1
  const rate = Math.min(1, dt * MOTION.smoothRate);
  const smoothSquash = prevSquash + (drive * MOTION.squashMax - prevSquash) * rate;
  const smoothLean = prevLean + (drive * MOTION.leanMax - prevLean) * rate;
  const scaleY = 1 + smoothSquash;
  const scaleX = 1 / (1 + smoothSquash);
  const tilt = smoothLean * 40; // small tilt in degrees
  return { scaleX, scaleY, tilt, smoothSquash, smoothLean };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/companion/orb-motion.test.ts`
Expected: PASS (4 describe blocks, all green).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/orb-motion.ts src/components/companion/orb-motion.test.ts
git commit -m "feat(companion): pure spring/hover/squash motion math"
```

---

## Task 2: Remove the CSS left/top transition

**Files:**
- Modify: `src/app/globals.css:361-366`

- [ ] **Step 1: Delete the transition block**

Remove these lines (the spring is now the sole smoother; leaving a `left/top` transition would fight the transform-driven position):

```css
/* Motion only when the user allows it. */
@media (prefers-reduced-motion: no-preference) {
  .companion-gutter {
    transition: left 0.6s cubic-bezier(0.6, 0.02, 0.2, 1), top 0.6s cubic-bezier(0.6, 0.02, 0.2, 1);
  }
}
```

Delete the entire block above (4 CSS lines plus the comment and the `@media` wrapper). Leave the rest of the file unchanged. `.companion-gutter` keeps its base `transform: translate(-50%, -50%)` rule at line 224 — that centering is preserved and composed by the loop in Task 3.

- [ ] **Step 2: Verify the build still compiles the CSS**

Run: `npx vitest run src/components/companion/companion.test.tsx`
Expected: PASS (no test asserts the transition; this just confirms nothing broke).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(companion): drop left/top transition; spring will drive position"
```

---

## Task 3: Drive position/squash from a rAF spring loop in `companion.tsx`

**Files:**
- Modify: `src/components/companion/companion.tsx`

Context for the implementer:
- `.companion-gutter` is the positioned wrapper (`position: fixed; transform: translate(-50%, -50%)`). We will set `left: 0; top: 0` on it in motion mode and write `transform: translate(<px>, <px>) translate(-50%, -50%)` each frame so centering is preserved.
- The inner `<span>` at the current line ~183 (the one with `onPointerDown={onPoke}`) wraps the orb; we apply the squash transform there so it composes with — and never overwrites — the orb's own keyframe animations.
- `size`/`blur`/`opacity`/`bubble`/`front` stay React-driven exactly as today. Only **position** and **squash** are imperative.
- Reduced-motion and dock mode do **not** run the loop and keep current behavior.

- [ ] **Step 1: Add the import**

At the top of `companion.tsx`, alongside the existing `./hero-phase` import, add:

```ts
import { MOTION, stepSpring, hoverOffset, stepSquash, type SpringState } from "./orb-motion";
```

- [ ] **Step 2: Add refs for the loop**

Immediately after the existing `const activeIdRef = useRef<string | null>(null);` line, add:

```ts
  // Motion loop plumbing (imperative; bypasses React re-renders).
  const gutterRef = useRef<HTMLDivElement | null>(null); // positioned wrapper
  const squashRef = useRef<HTMLSpanElement | null>(null); // orb wrapper (squash target)
  const posPctRef = useRef<{ x: number; y: number }>({ x: 90, y: 50 }); // current target (vw/vh %)
```

- [ ] **Step 3: Compute `motionMode` and mirror the position target**

Find the block that computes `heroPhase` and `geo` (currently):

```ts
  // Hero aura only on the landing, wide, not muted, not reduced-motion.
  const heroPhase = heroPresent && isWide && !muted && !reducedMotion;
  const geo = heroPhase ? interpolateOrb(progress, target) : null;
```

Replace it with:

```ts
  // Hero aura only on the landing, wide, not muted, not reduced-motion.
  const heroPhase = heroPresent && isWide && !muted && !reducedMotion;
  const geo = heroPhase ? interpolateOrb(progress, target) : null;

  // Spring motion runs in the gutter (wide) when motion is allowed.
  const motionMode = isWide && !reducedMotion;
  // Mirror the live position target (viewport %) for the rAF loop to read.
  posPctRef.current = geo ? { x: geo.x, y: geo.y } : { x: target.x, y: target.y };
```

- [ ] **Step 4: Add the rAF loop effect**

Add this effect just after the scroll-tracking effect (the one that ends with the `cancelAnimationFrame(raf)` cleanup, currently ~line 125):

```ts
  // Spring loop: drive position (gutter wrapper) and squash (orb wrapper) via
  // transform. Runs only in wide, motion-allowed mode; dock/reduced-motion skip it.
  useEffect(() => {
    if (!motionMode) return;
    const gutter = gutterRef.current;
    const squash = squashRef.current;
    if (!gutter || !squash) return;

    let raf = 0;
    let prev = 0;
    let inited = false;
    let sx: SpringState = { pos: 0, vel: 0 };
    let sy: SpringState = { pos: 0, vel: 0 };
    let sq = 0;
    let ln = 0;

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
      const s = stepSquash(sy.vel, sq, ln, dt);
      sq = s.smoothSquash;
      ln = s.smoothLean;

      gutter.style.transform = `translate(${sx.pos + hv.x}px, ${sy.pos + hv.y}px) translate(-50%, -50%)`;
      squash.style.transform = `scaleX(${s.scaleX}) scaleY(${s.scaleY}) rotate(${s.tilt}deg)`;

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      // Clear inline transforms so a later reduced-motion/dock render starts clean.
      gutter.style.transform = "";
      squash.style.transform = "";
    };
  }, [motionMode]);
```

- [ ] **Step 5: Switch the gutter render branch to transform-driven position**

Find the style-assembly block (currently the `if (dockMode) … else if (geo) … else …` ladder, ~lines 150-169). Replace the two gutter branches so that in motion mode the wrapper is pinned to `0,0` (the loop supplies the transform), and in reduced-motion it keeps the old `left/top` %.

Replace this:

```ts
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
```

With this:

```ts
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
```

- [ ] **Step 6: Attach the refs in JSX**

Attach `gutterRef` to the positioned wrapper and `squashRef` to the orb wrapper span.

Change the opening wrapper `<div>` (currently `<div className={dockClass} style={dockStyle} aria-hidden="true" …>`) to add the ref:

```tsx
      <div
        ref={gutterRef}
        className={dockClass}
        style={dockStyle}
        aria-hidden="true"
        {...(dockMode ? { "data-dock-active": !muted ? "true" : undefined } : {})}
      >
```

Change the inner orb wrapper span (currently `<span style={{ position: "relative", display: "inline-flex", pointerEvents: "auto" }} onPointerDown={onPoke}>`) to add the ref:

```tsx
        <span
          ref={squashRef}
          style={{ position: "relative", display: "inline-flex", pointerEvents: "auto" }}
          onPointerDown={onPoke}
        >
```

- [ ] **Step 7: Run the component tests**

Run: `npx vitest run src/components/companion/companion.test.tsx`
Expected: PASS — all 7 tests green. (They assert orb size, mood, mute, and `.companion-gutter`/`.companion-bottom-dock` presence; none assert `left/top`, so transform-driven positioning does not affect them. The rAF loop is harmless under jsdom.)

- [ ] **Step 8: Commit**

```bash
git add src/components/companion/companion.tsx
git commit -m "feat(companion): spring-driven position, squash, and idle hover on scroll"
```

---

## Task 4: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — entire suite green, including the new `orb-motion.test.ts`.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors. (If `@typescript-eslint` flags the `posPctRef.current = …` assignment during render, it is intentional — a mutable ref mirror, not React state. Only suppress with an inline `eslint-disable-next-line` comment if the existing config errors on it, matching the existing `react-hooks/set-state-in-effect` disable style already in this file.)

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 4: Manual check against the approved demo**

Run: `npm run dev`, open the landing page at ≥1280px width, and confirm:
  - Scrolling past the hero: the orb shrinks and glides with weight (slight overshoot/settle), not glued 1:1 to the scrollbar.
  - Within/between sections: the orb continuously drifts toward its target instead of sitting still then jumping.
  - When you stop scrolling: the orb gently hovers around its point (does not freeze).
  - Fast scroll: a subtle squish appears and eases out; the orb never deforms into a blob.
  - Toggle OS "reduce motion": the orb places statically with no spring/hover/squash.
  - Narrow viewport (<1280px): the bottom dock behaves exactly as before.

- [ ] **Step 5: Final commit (if any lint/build fixups were needed)**

```bash
git add -A
git commit -m "chore(companion): verification fixups for fluid motion"
```
(Skip if nothing changed.)

---

## Notes for the implementer

- **Do not** spring `size`/`blur`/`opacity` — they stay React-driven from scroll `progress`, matching the approved demo.
- **Do not** touch `active-section.ts`, narration, mute, eyes/gaze, or the orb art.
- The reference demo lives at `.context/mascot-motion-demo.html` (gitignored). The "Playful" preset there is the source of truth for the feel; `MOTION` mirrors its final slider values.
- The rAF loop and DOM transform writes are **not** unit-tested (jsdom has no layout); they are covered by Step 4's manual check plus the existing render tests. This is an explicit, accepted gap.
