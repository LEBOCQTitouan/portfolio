# Mascot Eye Life Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the companion's eyes feel alive via a lifelike blink, Curious idle saccades, and hover/poke reactivity — without changing the flat dark-oval look.

**Architecture:** A new pure module `eye-life.ts` holds all the testable math (blink transform curve, randomized scheduling, saccades, suppression rules). A new imperative hook `use-eye-life.ts` runs one `requestAnimationFrame` loop that writes transforms directly to the eye DOM nodes, bypassing React re-renders — the same pattern `companion.tsx` already uses for its spring loop. The eyes' markup gains a wrapper/lid split so the gaze `translate` (wrapper) and the blink/focus `scale` (lid) compose without fighting.

**Tech Stack:** TypeScript (strict), React 18, Next.js (this repo's vendored fork — see Global Constraints), Vitest + Testing Library.

## Global Constraints

- **This is NOT stock Next.js.** Per `AGENTS.md`, before writing framework-level code read the relevant guide in `node_modules/next/dist/docs/`. This feature is component-local (no routing/server APIs) so it should not need framework APIs — do not introduce any.
- **No new dependencies.** Use the Web platform (`requestAnimationFrame`, `performance.now`) and existing utilities only.
- **Follow the existing companion pattern:** pure deterministic math in a `*.ts` module (like `orb-motion.ts`, `reaction-state.ts`), imperative rAF glue in the component/hook, randomness injected as a `rand: () => number` parameter so it is unit-testable (see `orb-motion.test.ts` style).
- **Reduced motion:** under `prefers-reduced-motion: reduce` the hook must start no loop and no listeners; eyes hold their static resting shape. Use the existing `useReducedMotion()` hook.
- **Accessibility:** eyes stay `aria-hidden="true"`; this is decorative motion only.
- **Eyes stay flat dark ovals** (`#15202e`). No glint, gradient, or recolor.
- **Commits:** Conventional Commits, imperative, scoped (e.g. `feat(companion): ...`). Commit at the end of each task only.
- **Test runner:** `npx vitest run <path>` for one file; `npm run test` for the suite.

---

## File Structure

- `src/components/companion/eye-life.ts` — **new.** Pure: `BLINK` config, easing, `blinkTransform`, `nextBlinkDelay`, `wantsDoubleBlink`, `saccadeTarget`, `saccadeIntensity`, `blinkAllowed`, `focusScale`, and motion constants (`EYE_GAZE_PX`, `SACCADE`, `STARTLE_AMP`, `FOCUS_SCALE`).
- `src/components/companion/eye-life.test.ts` — **new.** Unit tests for the above.
- `src/components/companion/use-eye-life.ts` — **new.** The imperative hook: one rAF loop + blink scheduler + scroll listener; reads latest inputs via a ref; triggers blink on active-section change and startle on poke via a shared command ref.
- `src/components/companion/eyes.tsx` — **modify.** Wrapper/lid markup; accept a `containerRef`; export an `EyeShape` type.
- `src/components/companion/eyes.test.tsx` — **modify.** Assert the lid elements exist.
- `src/components/companion/orb.tsx` — **modify.** Thread an `eyesRef` through to `Eyes`.
- `src/components/companion/companion.tsx` — **modify.** Add the eyes ref, `hovering` state, `pokeNonce`, compute `shape`, and call `useEyeLife`.
- `src/app/globals.css` — **modify.** Move per-shape sizing onto `.companion-eye__lid`, add the lid base rule, remove the `eye-blink` keyframe + its `data-shape="open"` animation rule.

---

## Task 1: Blink curve (pure)

**Files:**
- Create: `src/components/companion/eye-life.ts`
- Test: `src/components/companion/eye-life.test.ts`

**Interfaces:**
- Consumes: `EyeShape` (string union `"open" | "happy" | "squint" | "closed" | "angry"`) — defined locally as a literal type in this task; exported from `eyes.tsx` in Task 3. To avoid a circular import, declare the union inline in `eye-life.ts` as its own `EyeShape` type and let Task 3's export be structurally identical.
- Produces: `BLINK` config, `blinkTransform(elapsedMs: number, shape: EyeShape): { scaleX: number; scaleY: number; done: boolean }`.

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/eye-life.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { BLINK, blinkTransform } from "./eye-life";

describe("blinkTransform", () => {
  it("is fully open at elapsed 0 and not done", () => {
    const b = blinkTransform(0, "open");
    expect(b.scaleY).toBeCloseTo(1, 3);
    expect(b.scaleX).toBeCloseTo(1, 3);
    expect(b.done).toBe(false);
  });

  it("reaches the slit (not a flat line) while held shut", () => {
    const mid = (BLINK.closeMs + BLINK.holdMs) / 2 + BLINK.closeMs / 2; // inside hold
    const b = blinkTransform(BLINK.closeMs + 1, "open");
    expect(b.scaleY).toBeCloseTo(BLINK.minY, 2);
    expect(b.scaleY).toBeGreaterThan(0.05); // slit, never a knife edge
    expect(b.scaleX).toBeGreaterThan(1); // width bulges (squash)
    expect(mid).toBeGreaterThan(0);
  });

  it("closes faster than it opens (asymmetric)", () => {
    // halfway-closed point happens before halfway-open point in time
    const quarterClose = blinkTransform(BLINK.closeMs * 0.5, "open").scaleY;
    const quarterOpen = blinkTransform(BLINK.closeMs + BLINK.holdMs + BLINK.openMs * 0.5, "open").scaleY;
    expect(quarterClose).toBeLessThan(1);
    expect(quarterOpen).toBeGreaterThan(BLINK.minY);
  });

  it("overshoots past full height during reopen", () => {
    let maxY = 0;
    for (let t = BLINK.closeMs + BLINK.holdMs; t <= BLINK.totalMs; t += 2) {
      maxY = Math.max(maxY, blinkTransform(t, "open").scaleY);
    }
    expect(maxY).toBeGreaterThan(1.0); // settle-from-overshoot
  });

  it("returns to rest and reports done at total duration", () => {
    const b = blinkTransform(BLINK.totalMs, "open");
    expect(b.scaleY).toBeCloseTo(1, 2);
    expect(b.scaleX).toBeCloseTo(1, 2);
    expect(b.done).toBe(true);
  });

  it("collapses less for an already-narrow squint eye", () => {
    const open = blinkTransform(BLINK.closeMs + 1, "open").scaleY;
    const squint = blinkTransform(BLINK.closeMs + 1, "squint").scaleY;
    expect(squint).toBeGreaterThan(open);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/companion/eye-life.test.ts`
Expected: FAIL — `Failed to resolve import "./eye-life"` / `blinkTransform is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Create `src/components/companion/eye-life.ts`:

```ts
/**
 * Pure, deterministic helpers for the companion's eye "life" (blink, saccades,
 * reactivity). The hook (use-eye-life.ts) runs these inside a requestAnimationFrame
 * loop and writes the results to the DOM as transforms. Keeping the math here makes
 * it testable — randomness is always injected as `rand: () => number`.
 */

/** Eye shapes, structurally identical to eyeShape()'s return union (eyes.tsx). */
export type EyeShape = "open" | "happy" | "squint" | "closed" | "angry";

/** Blink timing + shape, derived from animation research (Disney/ILM/Bloop).
 *  Asymmetric: fast accelerating close, slower settling open. ~260ms total. */
export const BLINK = {
  closeMs: 85, // open → shut (ease-in)
  holdMs: 45, // held shut (a real beat)
  openMs: 130, // shut → open (ease-out), ~1.5× the close
  totalMs: 260,
  minY: 0.1, // closed height: a slit, never a flat line
  squintMinY: 0.5, // a squint eye is already short → shallower collapse
  squashX: 1.08, // width bulge at closure (volume preservation)
  overshootY: 0.05, // height overshoot on reopen, then settle
} as const;

const easeIn = (u: number) => u * u; // accelerate into the close
const easeOut = (u: number) => 1 - (1 - u) * (1 - u); // decelerate / settle open
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** scaleX/scaleY for the lid at `elapsedMs` into a blink, plus `done`. */
export function blinkTransform(
  elapsedMs: number,
  shape: EyeShape,
): { scaleX: number; scaleY: number; done: boolean } {
  const minY = shape === "squint" ? BLINK.squintMinY : BLINK.minY;
  const { closeMs, holdMs, openMs, totalMs, squashX, overshootY } = BLINK;

  if (elapsedMs <= 0) return { scaleX: 1, scaleY: 1, done: false };
  if (elapsedMs >= totalMs) return { scaleX: 1, scaleY: 1, done: true };

  // Close
  if (elapsedMs < closeMs) {
    const e = easeIn(elapsedMs / closeMs);
    return { scaleX: lerp(1, squashX, e), scaleY: lerp(1, minY, e), done: false };
  }
  // Hold shut
  if (elapsedMs < closeMs + holdMs) {
    return { scaleX: squashX, scaleY: minY, done: false };
  }
  // Open (with overshoot bump that returns to 0 at the end)
  const u = (elapsedMs - closeMs - holdMs) / openMs;
  const e = easeOut(u);
  const bump = Math.sin(Math.PI * u); // 0 → 1 → 0
  return {
    scaleX: lerp(squashX, 1, e) - 0.01 * bump,
    scaleY: lerp(minY, 1, e) + overshootY * bump,
    done: false,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/companion/eye-life.test.ts`
Expected: PASS (6 passing).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/eye-life.ts src/components/companion/eye-life.test.ts
git commit -m "feat(companion): add lifelike blink transform curve"
```

---

## Task 2: Scheduling, saccades & reactivity rules (pure)

**Files:**
- Modify: `src/components/companion/eye-life.ts`
- Test: `src/components/companion/eye-life.test.ts`

**Interfaces:**
- Consumes: `EyeShape`, `Reaction` (`import type { Reaction } from "./reaction-state"`).
- Produces:
  - `EYE_GAZE_PX: number` (px the eyes travel toward the gaze; = 3, matches today's `MAX_OFFSET`)
  - `SACCADE: { ampPx: number; smooth: number }`
  - `STARTLE_AMP: number`, `FOCUS_SCALE: number`
  - `nextBlinkDelay(rand: () => number): number` — ms in [3000, 6000)
  - `wantsDoubleBlink(rand: () => number): boolean` — ~10%
  - `saccadeTarget(rand: () => number, intensity: number): { x: number; y: number }` — px offset
  - `saccadeIntensity(msSinceScroll: number): number` — 0.35 while reading, 1 when idle
  - `blinkAllowed(reaction: Reaction, shape: EyeShape): boolean`
  - `focusScale(hovering: boolean): number`

- [ ] **Step 1: Write the failing test**

Append to `src/components/companion/eye-life.test.ts`:

```ts
import {
  EYE_GAZE_PX, SACCADE, STARTLE_AMP, FOCUS_SCALE,
  nextBlinkDelay, wantsDoubleBlink, saccadeTarget, saccadeIntensity,
  blinkAllowed, focusScale,
} from "./eye-life";

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("nextBlinkDelay", () => {
  it("stays within 3–6s for the rand range", () => {
    expect(nextBlinkDelay(() => 0)).toBeCloseTo(3000, 0);
    expect(nextBlinkDelay(() => 0.999)).toBeLessThan(6000);
    expect(nextBlinkDelay(() => 0.999)).toBeGreaterThanOrEqual(3000);
  });
});

describe("wantsDoubleBlink", () => {
  it("fires only in the low ~10% of the rand range", () => {
    expect(wantsDoubleBlink(() => 0.05)).toBe(true);
    expect(wantsDoubleBlink(() => 0.5)).toBe(false);
  });
});

describe("saccadeTarget", () => {
  it("scales amplitude with intensity (reading < idle)", () => {
    const reading = saccadeTarget(seq([0, 1]), 0.35);
    const idle = saccadeTarget(seq([0, 1]), 1);
    expect(Math.hypot(idle.x, idle.y)).toBeGreaterThan(Math.hypot(reading.x, reading.y));
  });

  it("stays within the amplitude envelope", () => {
    for (let i = 0; i < 50; i++) {
      const r = seq([i / 50, ((i * 7) % 50) / 50]);
      const t = saccadeTarget(r, 1);
      expect(Math.hypot(t.x, t.y)).toBeLessThanOrEqual(SACCADE.ampPx + 1e-6);
    }
  });
});

describe("saccadeIntensity", () => {
  it("is calmer right after a scroll than when idle", () => {
    expect(saccadeIntensity(200)).toBeLessThan(saccadeIntensity(5000));
    expect(saccadeIntensity(5000)).toBe(1);
  });
});

describe("blinkAllowed", () => {
  it("blinks only in alert-open states", () => {
    expect(blinkAllowed("active", "open")).toBe(true);
    expect(blinkAllowed("active", "happy")).toBe(true);
    expect(blinkAllowed("active", "squint")).toBe(true); // focused mood
    expect(blinkAllowed("sleepy", "open")).toBe(true);
    expect(blinkAllowed("annoyed", "squint")).toBe(false);
    expect(blinkAllowed("angry", "angry")).toBe(false);
    expect(blinkAllowed("asleep", "closed")).toBe(false);
    expect(blinkAllowed("sleeping", "closed")).toBe(false);
  });
});

describe("focusScale", () => {
  it("narrows on hover, rests otherwise", () => {
    expect(focusScale(true)).toBeCloseTo(FOCUS_SCALE, 3);
    expect(focusScale(false)).toBe(1);
    expect(EYE_GAZE_PX).toBeGreaterThan(0);
    expect(STARTLE_AMP).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/companion/eye-life.test.ts`
Expected: FAIL — `nextBlinkDelay is not a function` (new exports missing).

- [ ] **Step 3: Write the minimal implementation**

Append to `src/components/companion/eye-life.ts`:

```ts
import type { Reaction } from "./reaction-state";

/** Px the eyes travel toward the gaze vector (matches the old MAX_OFFSET). */
export const EYE_GAZE_PX = 3;
/** Curious saccade calibration. */
export const SACCADE = { ampPx: 2.4, smooth: 0.16 } as const;
/** Startle widen on poke (fraction added to lid scale, decays away). */
export const STARTLE_AMP = 0.22;
/** Eye scale while hovering the orb (a focused narrowing on the user). */
export const FOCUS_SCALE = 0.72;

/** Randomized idle cadence: one blink every 3–6s. */
export function nextBlinkDelay(rand: () => number): number {
  return 3000 + rand() * 3000;
}

/** ~10% of blinks are double-blinks. */
export function wantsDoubleBlink(rand: () => number): boolean {
  return rand() < 0.1;
}

/** Next micro-dart offset (px). Amplitude scales with `intensity`. */
export function saccadeTarget(rand: () => number, intensity: number): { x: number; y: number } {
  const ang = rand() * Math.PI * 2;
  const mag = rand() * SACCADE.ampPx * intensity;
  return { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag * 0.7 };
}

/** Calmer eyes while actively scrolling (reading), wandering when idle. */
export function saccadeIntensity(msSinceScroll: number): number {
  return msSinceScroll < 1200 ? 0.35 : 1;
}

/** Blink only when the eyes are alertly open. */
export function blinkAllowed(reaction: Reaction, shape: EyeShape): boolean {
  if (shape === "closed" || shape === "angry") return false;
  if (reaction === "asleep" || reaction === "sleeping" || reaction === "angry" || reaction === "annoyed") {
    return false;
  }
  return true;
}

/** Steady-state eye scale from hover (startle is a separate transient pulse). */
export function focusScale(hovering: boolean): number {
  return hovering ? FOCUS_SCALE : 1;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/companion/eye-life.test.ts`
Expected: PASS (all, ~12 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/eye-life.ts src/components/companion/eye-life.test.ts
git commit -m "feat(companion): add eye saccade, blink-cadence & reactivity rules"
```

---

## Task 3: Wrapper/lid markup + CSS

**Files:**
- Modify: `src/components/companion/eyes.tsx`
- Modify: `src/components/companion/eyes.test.tsx`
- Modify: `src/components/companion/orb.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: `EyeShape` type re-exported from `eyes.tsx`; `Eyes` gains optional `containerRef?: Ref<HTMLDivElement>`; `Orb` gains optional `eyesRef?: Ref<HTMLDivElement>`. Each `.companion-eye` wrapper now contains one `.companion-eye__lid`.

- [ ] **Step 1: Write the failing test**

Edit `src/components/companion/eyes.test.tsx` — add this case inside the `describe("Eyes", ...)` block:

```ts
  it("renders a lid inside each eye wrapper", () => {
    const { container } = render(<Eyes mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} />);
    expect(container.querySelectorAll(".companion-eye")).toHaveLength(2);
    expect(container.querySelectorAll(".companion-eye .companion-eye__lid")).toHaveLength(2);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/companion/eyes.test.tsx`
Expected: FAIL — expected length 2, received 0 (no `.companion-eye__lid` yet).

- [ ] **Step 3: Update `eyes.tsx`**

Replace the whole file with:

```tsx
import type { CSSProperties, Ref } from "react";
import type { Mood } from "@/lib/narration/types";
import type { Reaction } from "./reaction-state";
import { moodParams } from "./moods";

export type Gaze = { x: number; y: number }; // each component ~[-1, 1]
export type EyeShape = "open" | "happy" | "squint" | "closed" | "angry";

/** Resolve the eye shape: reaction wins over mood where it matters. */
export function eyeShape(mood: Mood, reaction: Reaction): EyeShape {
  if (reaction === "sleeping" || reaction === "asleep") return "closed";
  if (reaction === "angry") return "angry";
  if (reaction === "annoyed") return "squint";
  return moodParams(mood).eye;
}

const MAX_OFFSET = 3; // px the eyes travel toward the gaze (CSS-var fallback)

export function Eyes({
  mood,
  reaction,
  gaze,
  containerRef,
}: {
  mood: Mood;
  reaction: Reaction;
  gaze: Gaze;
  containerRef?: Ref<HTMLDivElement>;
}) {
  const shape = eyeShape(mood, reaction);
  // CSS-var translate is the fallback used when the eye-life hook is not driving
  // these nodes (standalone Orb in stories, and reduced motion). When the hook is
  // active it overwrites each wrapper's inline transform every frame.
  const style = {
    "--gx": `${Math.max(-1, Math.min(1, gaze.x)) * MAX_OFFSET}px`,
    "--gy": `${Math.max(-1, Math.min(1, gaze.y)) * MAX_OFFSET}px`,
  } as CSSProperties;
  return (
    <div className="companion-eyes" data-shape={shape} style={style} aria-hidden="true" ref={containerRef}>
      <span className="companion-eye">
        <span className="companion-eye__lid" />
      </span>
      <span className="companion-eye">
        <span className="companion-eye__lid" />
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Thread the ref through `orb.tsx`**

In `src/components/companion/orb.tsx`, add `Ref` to the React import, add the prop, and pass it down. Change the import line and the function signature:

```tsx
import type { CSSProperties, Ref } from "react";
```

Add `eyesRef` to the destructured props and its type:

```tsx
export function Orb({
  mood,
  reaction,
  gaze,
  style,
  className,
  eyesRef,
}: {
  mood: Mood;
  reaction: Reaction;
  gaze: Gaze;
  style?: CSSProperties;
  className?: string;
  eyesRef?: Ref<HTMLDivElement>;
}) {
```

And pass it to `Eyes`:

```tsx
      <Eyes mood={mood} reaction={reaction} gaze={gaze} containerRef={eyesRef} />
```

- [ ] **Step 5: Update the CSS in `globals.css`**

In `src/app/globals.css`, replace the eye block. Find:

```css
.companion-eye {
  width: 9px; height: 15px; border-radius: 50%; background: #15202e;
  transform: translate(var(--gx, 0), var(--gy, 0));
}
.companion-eyes[data-shape="squint"] .companion-eye { height: 5px; border-radius: 4px; }
.companion-eyes[data-shape="happy"] .companion-eye { height: 7px; width: 12px; background: transparent; border-bottom: 3px solid #15202e; border-radius: 0 0 12px 12px; }
.companion-eyes[data-shape="closed"] .companion-eye { height: 3px; border-radius: 3px; }
.companion-eyes[data-shape="angry"] .companion-eye { height: 4px; border-radius: 3px; }
.companion-eyes[data-shape="angry"] .companion-eye:first-child { transform: translate(var(--gx,0), var(--gy,0)) rotate(20deg); }
.companion-eyes[data-shape="angry"] .companion-eye:last-child { transform: translate(var(--gx,0), var(--gy,0)) rotate(-20deg); }
```

Replace with (wrapper = box + gaze translate; lid = shape + the scale target the hook drives):

```css
.companion-eye {
  width: 9px; height: 15px; display: flex; align-items: center; justify-content: center;
  transform: translate(var(--gx, 0), var(--gy, 0));
}
.companion-eye__lid { width: 9px; height: 15px; border-radius: 50%; background: #15202e; }
.companion-eyes[data-shape="squint"] .companion-eye__lid { height: 5px; border-radius: 4px; }
.companion-eyes[data-shape="happy"] .companion-eye__lid { height: 7px; width: 12px; background: transparent; border-bottom: 3px solid #15202e; border-radius: 0 0 12px 12px; }
.companion-eyes[data-shape="closed"] .companion-eye__lid { height: 3px; border-radius: 3px; }
.companion-eyes[data-shape="angry"] .companion-eye__lid { height: 4px; border-radius: 3px; }
.companion-eyes[data-shape="angry"] .companion-eye:first-child .companion-eye__lid { transform: rotate(20deg); }
.companion-eyes[data-shape="angry"] .companion-eye:last-child .companion-eye__lid { transform: rotate(-20deg); }
```

Then remove the now-dead blink keyframe. In the `@media (prefers-reduced-motion: no-preference)` block, delete these two pieces:

```css
  .companion-eyes[data-shape="open"] .companion-eye { animation: eye-blink 5.5s infinite; }
  @keyframes eye-blink {
    0%, 92%, 100% { transform: translate(var(--gx,0), var(--gy,0)) scaleY(1); }
    96% { transform: translate(var(--gx,0), var(--gy,0)) scaleY(0.1); }
  }
```

- [ ] **Step 6: Run the eye tests**

Run: `npx vitest run src/components/companion/eyes.test.tsx`
Expected: PASS (4 tests — the three originals still pass because `data-shape` and `--gx/--gy` are unchanged, plus the new lid test).

- [ ] **Step 7: Commit**

```bash
git add src/components/companion/eyes.tsx src/components/companion/eyes.test.tsx src/components/companion/orb.tsx src/app/globals.css
git commit -m "feat(companion): split eyes into wrapper+lid, drop CSS blink loop"
```

---

## Task 4: The eye-life hook + wiring

**Files:**
- Create: `src/components/companion/use-eye-life.ts`
- Modify: `src/components/companion/companion.tsx`

**Interfaces:**
- Consumes: everything from `eye-life.ts` (Tasks 1–2), `eyeShape`/`EyeShape` from `eyes.tsx`, `Reaction` from `reaction-state.ts`.
- Produces: `useEyeLife(inputs: EyeLifeInputs): void`.

This task is imperative animation glue (an rAF loop + DOM writes) that cannot be meaningfully unit-tested in isolation — consistent with the untested spring loop in `companion.tsx`. Its deliverable is verified by running the app (Step 4).

- [ ] **Step 1: Create the hook**

Create `src/components/companion/use-eye-life.ts`:

```ts
import { useEffect, useRef, type RefObject } from "react";
import type { Reaction } from "./reaction-state";
import type { EyeShape } from "./eyes";
import {
  BLINK, blinkTransform, nextBlinkDelay, wantsDoubleBlink,
  saccadeTarget, saccadeIntensity, blinkAllowed, focusScale,
  EYE_GAZE_PX, SACCADE, STARTLE_AMP,
} from "./eye-life";

export type EyeLifeInputs = {
  containerRef: RefObject<HTMLDivElement | null>;
  reaction: Reaction;
  shape: EyeShape;
  /** Identity of the active narration section; a change fires a "blink for a reason". */
  activeKey: string | null;
  hovering: boolean;
  /** Increments on each poke; a change fires a startle widen. */
  pokeNonce: number;
  gaze: { x: number; y: number };
  reducedMotion: boolean;
};

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function useEyeLife(inputs: EyeLifeInputs) {
  // Latest inputs, read inside the rAF loop without re-subscribing.
  const ref = useRef(inputs);
  ref.current = inputs;
  // Commands from React effects into the running loop.
  const cmd = useRef({ wantBlink: false, wantStartle: false });

  // Fire a blink when the active section changes.
  useEffect(() => {
    cmd.current.wantBlink = true;
  }, [inputs.activeKey]);

  // Startle widen on poke.
  useEffect(() => {
    if (inputs.pokeNonce > 0) cmd.current.wantStartle = true;
  }, [inputs.pokeNonce]);

  useEffect(() => {
    if (inputs.reducedMotion) return;
    const container = inputs.containerRef.current;
    if (!container) return;
    const wraps = Array.from(container.querySelectorAll<HTMLElement>(".companion-eye"));
    const lids = Array.from(container.querySelectorAll<HTMLElement>(".companion-eye__lid"));
    if (wraps.length === 0 || lids.length === 0) return;

    let raf = 0;
    let sx = 0, sy = 0; // eased saccade offset (px)
    let tx = 0, ty = 0; // current saccade target (px)
    let focus = 1; // eased hover focus scale
    let startle = 0; // decaying startle pulse
    let blinkStart = -Infinity; // performance.now of the active blink
    let secondBlinkAt = Infinity; // queued double-blink time
    let lastScrollAt = -Infinity;
    let nextBlinkAt = now() + nextBlinkDelay(Math.random);

    const onScroll = () => { lastScrollAt = now(); };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tryStartBlink = (t: number, inp: EyeLifeInputs) => {
      if (blinkAllowed(inp.reaction, inp.shape) && blinkStart === -Infinity) blinkStart = t;
    };

    const loop = () => {
      const t = now();
      const inp = ref.current;

      // Commands from effects.
      if (cmd.current.wantBlink) { cmd.current.wantBlink = false; tryStartBlink(t, inp); }
      if (cmd.current.wantStartle) { cmd.current.wantStartle = false; startle = STARTLE_AMP; }

      // Idle blink schedule.
      if (t >= nextBlinkAt) {
        tryStartBlink(t, inp);
        if (wantsDoubleBlink(Math.random)) secondBlinkAt = t + BLINK.totalMs + 120;
        nextBlinkAt = t + nextBlinkDelay(Math.random);
      }
      if (t >= secondBlinkAt) { secondBlinkAt = Infinity; tryStartBlink(t, inp); }

      // Saccade: pick a new dart once we've settled on the last one.
      const intensity = saccadeIntensity(t - lastScrollAt);
      if (Math.abs(sx - tx) < 0.2 && Math.abs(sy - ty) < 0.2) {
        const tgt = saccadeTarget(Math.random, intensity);
        tx = tgt.x; ty = tgt.y;
      }
      sx += (tx - sx) * SACCADE.smooth;
      sy += (ty - sy) * SACCADE.smooth;

      // Wrapper translate = gaze + saccade.
      const gx = inp.gaze.x * EYE_GAZE_PX + sx;
      const gy = inp.gaze.y * EYE_GAZE_PX + sy;
      for (const w of wraps) w.style.transform = `translate(${gx.toFixed(2)}px, ${gy.toFixed(2)}px)`;

      // Lid scale = blink × (focus + startle), only in alert-open states. In
      // suppressed states (asleep/angry/annoyed) clear the inline transform so the
      // CSS resting shape (closed line, angry rotate) shows.
      const allow = blinkAllowed(inp.reaction, inp.shape);
      focus += (focusScale(inp.hovering) - focus) * 0.18;
      startle += (0 - startle) * 0.12;
      if (allow) {
        let bx = 1, by = 1;
        if (blinkStart > -Infinity) {
          const b = blinkTransform(t - blinkStart, inp.shape);
          bx = b.scaleX; by = b.scaleY;
          if (b.done) blinkStart = -Infinity;
        }
        const f = focus * (1 + startle);
        for (const l of lids) l.style.transform = `scaleX(${(bx * f).toFixed(3)}) scaleY(${(by * f).toFixed(3)})`;
      } else {
        blinkStart = -Infinity;
        for (const l of lids) l.style.transform = "";
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      for (const w of wraps) w.style.transform = "";
      for (const l of lids) l.style.transform = "";
    };
    // Re-create the loop only when the binding context changes; live values are
    // read through `ref`. `shape`/`reaction`/`gaze`/`hovering` deliberately omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs.reducedMotion, inputs.containerRef]);
}
```

- [ ] **Step 2: Wire it into `companion.tsx`**

Make four edits to `src/components/companion/companion.tsx`:

(a) Add imports near the other companion imports:

```tsx
import { useEyeLife } from "./use-eye-life";
import { eyeShape } from "./eyes";
```

(b) Add the eyes ref, hover state, and poke nonce alongside the existing state (near the `const [slosh, setSlosh] = useState(false);` line):

```tsx
  const eyesRef = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [pokeNonce, setPokeNonce] = useState(0);
```

(c) In the existing `onPoke` handler, bump the nonce. Change:

```tsx
  const onPoke = () => {
    poke();
    if (muted) return;
    setSlosh(true);
    window.setTimeout(() => setSlosh(false), 600);
  };
```

to:

```tsx
  const onPoke = () => {
    poke();
    setPokeNonce((n) => n + 1);
    if (muted) return;
    setSlosh(true);
    window.setTimeout(() => setSlosh(false), 600);
  };
```

(d) Just before the `if (lines.length === 0) return null;` line (so hooks run unconditionally), call the hook. Note `activeLine` is computed after that early return today; compute the shape inputs from the current pre-return values instead — add:

```tsx
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
```

> Note on `shape`: the precise per-section mood is `activeLine.mood`, computed after the early return. Using `lines[0].mood` here keeps all hooks above the early return (Rules of Hooks) and is correct for blink suppression because suppression depends on `reaction` (asleep/angry/annoyed), not the fine mood — the mood only distinguishes open/happy/squint, all of which blink. The squint-depth nicety uses this approximate shape; acceptable.

(e) Pass the ref into `Orb` and add hover handlers to the squash span. Change the orb's wrapper span and Orb element:

```tsx
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
```

- [ ] **Step 3: Run the full companion test suite + typecheck**

Run: `npx vitest run src/components/companion/`
Expected: PASS (all companion tests, including the new `eye-life.test.ts` and updated `eyes.test.tsx`).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification in the running app**

Run: `npm run dev`, open the site on a wide viewport (≥1280px), and confirm:
- Eyes **blink** on an irregular cadence (~every 3–6s), occasionally twice; the blink **snaps shut and eases open**, both eyes together.
- Eyes get a **blink on section change** while scrolling between narrated sections.
- Eyes **dart slightly** (saccades) and track the cursor; the darting is calmer mid-scroll, wanders more when idle.
- **Hover** the orb → eyes narrow (focus). **Click** it → a startle widen, then settle (alongside the existing slosh).
- Idle ~20–30s → eyes go sleepy/closed with **no blink**; poke 6× → angry, **no blink** and the angled eyes still render.
- In OS "reduce motion" mode (macOS: System Settings → Accessibility → Display → Reduce motion), reload: eyes are **static**, no blink/saccade, holding their resting shape.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/use-eye-life.ts src/components/companion/companion.tsx
git commit -m "feat(companion): drive eyes with lifelike blink, saccades & reactivity"
```

---

## Self-Review notes (for the implementer)

- **Spec coverage:** blink curve (Task 1) ↔ spec §"The blink spec"; cadence/double-blink/saccade/suppression/focus (Task 2) ↔ spec §"Behavioral rules"; markup split + CSS (Task 3) ↔ spec §"Architecture › Markup"; hook + wiring + reduced motion (Task 4) ↔ spec §"Architecture › hook" + §"Reduced motion".
- **Blink-on-gaze-retarget** is implemented as blink-on-active-section-change (`activeKey`), matching the spec's clarification that the meaningful discrete event is the section jump, not continuous pointer motion.
- **Type consistency:** `EyeShape` is declared in `eye-life.ts` (Task 1) and re-exported structurally identical from `eyes.tsx` (Task 3); the hook imports it from `eyes.tsx`. `blinkAllowed`, `focusScale`, `saccadeTarget`, `blinkTransform`, `BLINK`, `SACCADE`, `STARTLE_AMP`, `EYE_GAZE_PX` names are used identically across Tasks 2 and 4.
- **No placeholders:** every code step shows complete content.
```
