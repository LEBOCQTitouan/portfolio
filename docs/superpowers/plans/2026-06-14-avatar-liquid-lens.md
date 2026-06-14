# Avatar — Liquid-Energy Lens (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the solid gradient orb with a living "liquid-energy lens" companion — a wobbling translucent orb that refracts the page (glassmorphism), flows with living light tinted by the active subject, blinks/gazes, fights sleep then dreams, and sloshes/recoils + gets annoyed→angry when poked.

**Architecture:** A pure, unit-tested reaction state machine drives a presentational orb. Visuals are pure CSS/SVG (backdrop-filter, animated gradients, border-radius wobble) — no new deps, no canvas. The orb's color comes from a `--subject-accent` custom property set on `<body>` via CSS `:has()` (same lift the page aura uses), so the fixed orb wears the active page's color.

**Tech Stack:** Next 16, React 19, Tailwind v4, TypeScript, Vitest + Testing Library.

> **Spec:** `docs/superpowers/specs/2026-06-14-avatar-liquid-lens-design.md`. Builds on the shipped semantic palette + page aura. Behaviors were approved in the earlier avatar spec.

---

## File Structure

- **Modify** `src/app/globals.css` — add `--subject-accent`/`--subject-accent-soft` via `:has()` (mirrors `tokens.ts`); replace the `.companion-orb` block with the liquid-lens material + eyes + state-driven animations (all reduced-motion gated).
- **Create** `src/components/companion/reaction-state.ts` — pure state machine (mood-independent reaction overlay).
- **Create** `src/components/companion/reaction-state.test.ts` — full TDD.
- **Modify** `src/components/companion/moods.ts` — drop hardcoded rgba; export per-mood *render params* (eye shape + flow speed/warmth) consumed by the orb/eyes. Color now comes from `--subject-accent`.
- **Modify** `src/components/companion/moods.test.ts` — assert the new params contract.
- **Create** `src/components/companion/eyes.tsx` — eye geometry per `(mood, reaction, gaze)`.
- **Create** `src/components/companion/eyes.test.tsx` — render test for key states.
- **Modify** `src/components/companion/orb.tsx` — render the liquid body (blobs/sheen/spec) + `<Eyes>`, driven by `(mood, reaction, gaze, geometry)`.
- **Modify** `src/components/companion/orb.test.tsx` — update to the new structure.
- **Create** `src/components/companion/use-reaction.ts` — hook wiring activity/idle/poke/mute events into `reaction-state` (with `requestAnimationFrame`/timers; randomness injected).
- **Modify** `src/components/companion/companion.tsx` — wire pointer gaze, idle timers, poke handler (with click coords), pass `(mood, reaction, gaze)` to `<Orb>`. Keep all existing placement/hero/mute/i18n/narration logic.

The CSS values for the orb are lifted from the approved mockups (`/tmp/ds-review/orb-energy.html`, variant **B liquid**, + the glass demo). They are a working starting point; visual tuning happens in-browser per the verify steps.

---

## Task 1: Subject-color plumbing (`--subject-accent` via `:has()`)

**Files:**
- Modify: `src/app/globals.css`

> Same mechanism as the page aura: the companion renders outside the content `[data-subject]` scope, so set the subject color on `<body>` (which the fixed orb inherits) using `:has()`. CSS-only; not unit-tested — guard is build + the orb picking up color in Task 6.

- [ ] **Step 1: Add the block** immediately after the page-aura `:has()` rules (after the `.dark body:has([data-subject="ai"]) .page-aura {…}` line):

```css
/* ── Subject accent lifted to <body> for off-scope consumers (the companion) ── */
:root { --subject-accent: var(--accent); --subject-accent-soft: var(--accent-soft); }
body:has([data-subject="systems"]) { --subject-accent: #0b7268; --subject-accent-soft: rgba(11,114,104,0.16); }
body:has([data-subject="interface"]) { --subject-accent: #c42d63; --subject-accent-soft: rgba(196,45,99,0.16); }
body:has([data-subject="ai"]) { --subject-accent: #6d28d9; --subject-accent-soft: rgba(124,58,237,0.16); }
.dark body:has([data-subject="systems"]) { --subject-accent: #20c8b8; --subject-accent-soft: rgba(32,200,184,0.20); }
.dark body:has([data-subject="interface"]) { --subject-accent: #f06595; --subject-accent-soft: rgba(240,101,149,0.20); }
.dark body:has([data-subject="ai"]) { --subject-accent: #a78bfa; --subject-accent-soft: rgba(167,139,250,0.22); }
```

- [ ] **Step 2: Verify build** — Run: `npm run build`. Expected: succeeds. Run: `npx vitest run`. Expected: all pass (no behavior change yet).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(companion): lift active subject accent to body for the orb"
```

---

## Task 2: Reaction state machine (pure)

**Files:**
- Create: `src/components/companion/reaction-state.ts`
- Test: `src/components/companion/reaction-state.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// reaction-state.test.ts
import { describe, it, expect } from "vitest";
import { initialReactionState, reduceReaction, CFG } from "./reaction-state";

const t0 = 1_000_000;

describe("reduceReaction", () => {
  it("starts active", () => {
    expect(initialReactionState(t0).reaction).toBe("active");
  });

  it("mute → sleeping, overriding everything; unmute → active", () => {
    let s = initialReactionState(t0);
    s = reduceReaction(s, { type: "mute" });
    expect(s.reaction).toBe("sleeping");
    s = reduceReaction(s, { type: "tick", now: t0 + 999_999 }); // stays asleep-muted
    expect(s.reaction).toBe("sleeping");
    s = reduceReaction(s, { type: "unmute", now: t0 + 1_000_000 });
    expect(s.reaction).toBe("active");
  });

  it("idle → sleepy then asleep; activity wakes", () => {
    let s = initialReactionState(t0);
    s = reduceReaction(s, { type: "tick", now: t0 + CFG.sleepyAfter + 1 });
    expect(s.reaction).toBe("sleepy");
    s = reduceReaction(s, { type: "tick", now: t0 + CFG.asleepAfter + 1 });
    expect(s.reaction).toBe("asleep");
    s = reduceReaction(s, { type: "activity", now: t0 + CFG.asleepAfter + 2 });
    expect(s.reaction).toBe("active");
  });

  it("spam pokes escalate active → annoyed → angry within the window", () => {
    let s = initialReactionState(t0);
    let now = t0;
    for (let i = 0; i < CFG.annoyAt; i++) s = reduceReaction(s, { type: "poke", now: (now += 100) });
    expect(s.reaction).toBe("annoyed");
    for (let i = CFG.annoyAt; i < CFG.angerAt; i++) s = reduceReaction(s, { type: "poke", now: (now += 100) });
    expect(s.reaction).toBe("angry");
  });

  it("anger cools to active by time only (not by mere activity)", () => {
    let s = initialReactionState(t0);
    let now = t0;
    for (let i = 0; i < CFG.angerAt; i++) s = reduceReaction(s, { type: "poke", now: (now += 100) });
    expect(s.reaction).toBe("angry");
    s = reduceReaction(s, { type: "activity", now: now + 10 });
    expect(s.reaction).toBe("angry"); // activity does NOT calm anger
    s = reduceReaction(s, { type: "tick", now: now + CFG.cooldown + 1 });
    expect(s.reaction).toBe("active");
  });

  it("a single poke after the window resets the counter (no escalation)", () => {
    let s = initialReactionState(t0);
    s = reduceReaction(s, { type: "poke", now: t0 + 100 });
    expect(s.reaction).toBe("active");
    s = reduceReaction(s, { type: "poke", now: t0 + 100 + CFG.pokeWindow + 1 });
    expect(s.reaction).toBe("active");
    expect(s.pokes).toBe(1);
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/components/companion/reaction-state.test.ts` (module not found).

- [ ] **Step 3: Implement**

```ts
// reaction-state.ts
export type Reaction = "active" | "sleepy" | "asleep" | "annoyed" | "angry" | "sleeping";

export type ReactionState = {
  reaction: Reaction;
  muted: boolean;
  pokes: number;
  lastPokeAt: number;
  lastActivityAt: number;
};

export type ReactionEvent =
  | { type: "tick"; now: number }
  | { type: "poke"; now: number }
  | { type: "activity"; now: number }
  | { type: "mute" }
  | { type: "unmute"; now: number };

/** Tunable thresholds (ms / counts). */
export const CFG = {
  annoyAt: 3,        // pokes within the window → annoyed
  angerAt: 6,        // pokes within the window → angry
  pokeWindow: 1500,  // pokes must land within this gap to accumulate
  cooldown: 4000,    // anger/annoyance decays this long after the last poke
  sleepyAfter: 20000,
  asleepAfter: 30000,
} as const;

export function initialReactionState(now: number): ReactionState {
  return { reaction: "active", muted: false, pokes: 0, lastPokeAt: -Infinity, lastActivityAt: now };
}

function escalation(pokes: number): Reaction {
  if (pokes >= CFG.angerAt) return "angry";
  if (pokes >= CFG.annoyAt) return "annoyed";
  return "active";
}

export function reduceReaction(s: ReactionState, e: ReactionEvent): ReactionState {
  switch (e.type) {
    case "mute":
      return { ...s, muted: true, reaction: "sleeping" };
    case "unmute":
      return { ...s, muted: false, reaction: "active", lastActivityAt: e.now, pokes: 0 };
    case "poke": {
      if (s.muted) return s;
      const pokes = e.now - s.lastPokeAt <= CFG.pokeWindow ? s.pokes + 1 : 1;
      return { ...s, pokes, lastPokeAt: e.now, lastActivityAt: e.now, reaction: escalation(pokes) };
    }
    case "activity": {
      if (s.muted) return s;
      const next = s.reaction === "sleepy" || s.reaction === "asleep" ? "active" : s.reaction;
      return { ...s, lastActivityAt: e.now, reaction: next };
    }
    case "tick": {
      if (s.muted) return { ...s, reaction: "sleeping" };
      if (s.reaction === "annoyed" || s.reaction === "angry") {
        if (e.now - s.lastPokeAt >= CFG.cooldown) return { ...s, reaction: "active", pokes: 0 };
        return s;
      }
      const idle = e.now - s.lastActivityAt;
      const next: Reaction = idle >= CFG.asleepAfter ? "asleep" : idle >= CFG.sleepyAfter ? "sleepy" : "active";
      return next === s.reaction ? s : { ...s, reaction: next };
    }
  }
}
```

- [ ] **Step 4: Run → PASS** — `npx vitest run src/components/companion/reaction-state.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/reaction-state.ts src/components/companion/reaction-state.test.ts
git commit -m "feat(companion): pure reaction state machine"
```

---

## Task 3: Mood render params (`moods.ts` refactor)

**Files:**
- Modify: `src/components/companion/moods.ts`
- Modify: `src/components/companion/moods.test.ts`

> Color now comes from `--subject-accent`; mood only modulates eye shape + flow feel. This replaces the hardcoded `MOOD_COLORS`/`moodStyle` color contract.

- [ ] **Step 1: Replace the test** with the new contract:

```ts
// moods.test.ts
import { describe, it, expect } from "vitest";
import { MOOD_PARAMS, moodParams } from "./moods";
import type { Mood } from "@/lib/narration/types";

describe("moodParams", () => {
  const moods: Mood[] = ["calm", "warm", "focused"];

  it("defines params for every mood", () => {
    for (const m of moods) expect(MOOD_PARAMS[m]).toBeDefined();
  });

  it("maps each mood to an eye shape and a flow speed", () => {
    expect(moodParams("calm").eye).toBe("open");
    expect(moodParams("warm").eye).toBe("happy");
    expect(moodParams("focused").eye).toBe("squint");
    for (const m of moods) expect(moodParams(m).flowMs).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/components/companion/moods.test.ts`.

- [ ] **Step 3: Replace `moods.ts`** entirely with:

```ts
import type { Mood } from "@/lib/narration/types";

/** Per-mood render params. Color is NOT here — it comes from --subject-accent.
 *  `eye` is the resting eye shape; `flowMs` is the inner-light flow duration;
 *  `warmth` nudges the light's temperature (0 = neutral, + = warmer). */
export type MoodEye = "open" | "happy" | "squint";
export type MoodParams = { eye: MoodEye; flowMs: number; warmth: number };

export const MOOD_PARAMS: Record<Mood, MoodParams> = {
  calm: { eye: "open", flowMs: 6000, warmth: 0 },
  warm: { eye: "happy", flowMs: 5200, warmth: 0.15 },
  focused: { eye: "squint", flowMs: 4200, warmth: -0.1 },
};

export function moodParams(mood: Mood): MoodParams {
  return MOOD_PARAMS[mood];
}
```

- [ ] **Step 4: Run → PASS** — `npx vitest run src/components/companion/moods.test.ts`.

> NOTE: `orb.tsx` currently imports `moodStyle` from this file and `orb.test.tsx` asserts the old gradient — both are updated in Task 5, which is why the full suite is only re-greened there. Run only the moods test here.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/moods.ts src/components/companion/moods.test.ts
git commit -m "refactor(companion): moods carry render params, not colors"
```

---

## Task 4: Eyes component

**Files:**
- Create: `src/components/companion/eyes.tsx`
- Test: `src/components/companion/eyes.test.tsx`

> The eyes carry all expression. They render shape from `(mood, reaction)` and offset from `gaze` (a unit-ish vector). Pure presentational.

- [ ] **Step 1: Write the failing test**

```tsx
// eyes.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Eyes } from "./eyes";

describe("Eyes", () => {
  it("renders two eyes with the resolved shape as a data attribute", () => {
    const { container } = render(<Eyes mood="focused" reaction="active" gaze={{ x: 0, y: 0 }} />);
    const root = container.querySelector(".companion-eyes") as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.dataset.shape).toBe("squint"); // focused → squint
    expect(root.querySelectorAll(".companion-eye")).toHaveLength(2);
  });

  it("closes the eyes when sleeping or asleep", () => {
    for (const reaction of ["sleeping", "asleep"] as const) {
      const { container } = render(<Eyes mood="calm" reaction={reaction} gaze={{ x: 0, y: 0 }} />);
      expect((container.querySelector(".companion-eyes") as HTMLElement).dataset.shape).toBe("closed");
    }
  });

  it("offsets the eyes toward the gaze vector", () => {
    const { container } = render(<Eyes mood="calm" reaction="active" gaze={{ x: 1, y: -1 }} />);
    const root = container.querySelector(".companion-eyes") as HTMLElement;
    expect(root.style.getPropertyValue("--gx")).not.toBe("");
    expect(root.style.getPropertyValue("--gy")).not.toBe("");
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/components/companion/eyes.test.tsx`.

- [ ] **Step 3: Implement**

```tsx
// eyes.tsx
import type { CSSProperties } from "react";
import type { Mood } from "@/lib/narration/types";
import type { Reaction } from "./reaction-state";
import { moodParams } from "./moods";

export type Gaze = { x: number; y: number }; // each component ~[-1, 1]

/** Resolve the eye shape: reaction wins over mood where it matters. */
export function eyeShape(mood: Mood, reaction: Reaction): "open" | "happy" | "squint" | "closed" | "angry" {
  if (reaction === "sleeping" || reaction === "asleep") return "closed";
  if (reaction === "angry") return "angry";
  if (reaction === "annoyed") return "squint";
  return moodParams(mood).eye;
}

const MAX_OFFSET = 3; // px the pupils travel toward the gaze

export function Eyes({ mood, reaction, gaze }: { mood: Mood; reaction: Reaction; gaze: Gaze }) {
  const shape = eyeShape(mood, reaction);
  const style = {
    "--gx": `${Math.max(-1, Math.min(1, gaze.x)) * MAX_OFFSET}px`,
    "--gy": `${Math.max(-1, Math.min(1, gaze.y)) * MAX_OFFSET}px`,
  } as CSSProperties;
  return (
    <div className="companion-eyes" data-shape={shape} style={style} aria-hidden="true">
      <span className="companion-eye" />
      <span className="companion-eye" />
    </div>
  );
}
```

- [ ] **Step 4: Run → PASS** — `npx vitest run src/components/companion/eyes.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/eyes.tsx src/components/companion/eyes.test.tsx
git commit -m "feat(companion): eyes component (shape per mood/reaction, gaze offset)"
```

---

## Task 5: Liquid-lens material — CSS + `orb.tsx`

**Files:**
- Modify: `src/app/globals.css` (replace the `.companion-orb` rules)
- Modify: `src/components/companion/orb.tsx`
- Modify: `src/components/companion/orb.test.tsx`

> Visual task: the CSS below is lifted from the approved "liquid energy" mockup. Logic is test-gated (Step 5 unit test); the *look* is verified in-browser (Step 6).

- [ ] **Step 1: Replace the `.companion-orb` block in `globals.css`** (the current `.companion-orb { … }` rule) with the liquid-lens material + eyes + state CSS:

```css
/* ── Companion: liquid-energy lens ─────────────────────────────── */
.companion-orb {
  width: 92px; height: 92px; border-radius: 50%; position: relative; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.14);
  box-shadow: inset 7px 9px 20px rgba(255,255,255,0.5),
              inset -8px -11px 24px rgba(40,55,75,0.20),
              0 14px 28px rgba(0,0,0,0.15);
}
.companion-orb__blob {
  position: absolute; border-radius: 50%; filter: blur(8px); mix-blend-mode: screen; opacity: 0.9;
  background: radial-gradient(circle, var(--subject-accent), transparent 70%);
}
.companion-orb__blob.b1 { width: 64px; height: 64px; left: 14px; top: 36px; }
.companion-orb__blob.b2 { width: 56px; height: 56px; left: 42px; top: 10px; }
.companion-orb__blob.b3 { width: 50px; height: 50px; left: 30px; top: 48px; }
.companion-orb__spec {
  position: absolute; left: 24%; top: 15%; width: 24%; height: 18%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,255,255,0.95), transparent 70%); filter: blur(1px); z-index: 4;
}
.companion-eyes {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 16px; z-index: 5;
}
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

/* Glassmorphism + motion only when allowed */
@media (prefers-reduced-motion: no-preference) {
  .companion-orb {
    -webkit-backdrop-filter: blur(6px) saturate(1.4); backdrop-filter: blur(6px) saturate(1.4);
    animation: orb-breathe 5s ease-in-out infinite, orb-wobble 6s ease-in-out infinite;
  }
  .companion-orb__blob.b1 { animation: orb-flow1 4.5s ease-in-out infinite; }
  .companion-orb__blob.b2 { animation: orb-flow2 5.5s ease-in-out infinite; }
  .companion-orb__blob.b3 { animation: orb-flow3 4s ease-in-out infinite; }
  .companion-orb[data-reaction="angry"] { animation-duration: 2.5s, 3s; }
  .companion-orb[data-reaction="sleepy"] .companion-orb__blob,
  .companion-orb[data-reaction="asleep"] .companion-orb__blob { animation-duration: 12s; opacity: 0.5; }
  @keyframes orb-breathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes orb-wobble { 0%,100%{border-radius:50%} 33%{border-radius:54% 46% 52% 48%} 66%{border-radius:47% 53% 48% 52%} }
  @keyframes orb-flow1 { 0%,100%{transform:translate(-10px,8px) scale(1)} 50%{transform:translate(14px,-9px) scale(1.3)} }
  @keyframes orb-flow2 { 0%,100%{transform:translate(9px,-6px) scale(1.1)} 50%{transform:translate(-11px,13px) scale(.8)} }
  @keyframes orb-flow3 { 0%,100%{transform:translate(6px,8px) scale(.85)} 50%{transform:translate(-9px,-11px) scale(1.25)} }
}
/* Reduced motion: static tinted glass, no backdrop animation. */
@media (prefers-reduced-motion: reduce) {
  .companion-orb__blob.b2, .companion-orb__blob.b3 { display: none; }
}
/* Asleep dream bubble + muted dim handled by the existing speech-bubble slot / muted styles. */
.companion-orb[data-reaction="sleeping"], .companion-orb[data-reaction="asleep"] { opacity: 0.7; }
```

- [ ] **Step 2: Rewrite `orb.tsx`**

```tsx
import type { CSSProperties } from "react";
import type { Mood } from "@/lib/narration/types";
import type { Reaction } from "./reaction-state";
import { Eyes, type Gaze } from "./eyes";

export function Orb({
  mood,
  reaction,
  gaze,
  style,
}: {
  mood: Mood;
  reaction: Reaction;
  gaze: Gaze;
  style?: CSSProperties;
}) {
  return (
    <div className="companion-orb" data-mood={mood} data-reaction={reaction} aria-hidden="true" style={style}>
      <span className="companion-orb__blob b1" />
      <span className="companion-orb__blob b2" />
      <span className="companion-orb__blob b3" />
      <span className="companion-orb__spec" />
      <Eyes mood={mood} reaction={reaction} gaze={gaze} />
    </div>
  );
}
```

- [ ] **Step 3: Replace `orb.test.tsx`**

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Orb } from "./orb";

describe("Orb", () => {
  it("renders mood + reaction as data attributes and contains eyes", () => {
    const { container } = render(<Orb mood="warm" reaction="active" gaze={{ x: 0, y: 0 }} />);
    const orb = container.querySelector(".companion-orb") as HTMLElement;
    expect(orb).toBeInTheDocument();
    expect(orb.dataset.mood).toBe("warm");
    expect(orb.dataset.reaction).toBe("active");
    expect(container.querySelector(".companion-eyes")).toBeInTheDocument();
  });

  it("is decorative (aria-hidden)", () => {
    const { container } = render(<Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} />);
    expect(container.querySelector(".companion-orb")).toHaveAttribute("aria-hidden", "true");
  });

  it("applies a caller style override (size/position)", () => {
    const { container } = render(
      <Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} style={{ width: 200, height: 200 }} />,
    );
    expect((container.querySelector(".companion-orb") as HTMLElement).style.width).toBe("200px");
  });
});
```

- [ ] **Step 4: Run the unit tests → PASS** — `npx vitest run src/components/companion/` (orb + eyes + moods + reaction-state all green).

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit`. Expected: FAILS in `companion.tsx` (still passes old `<Orb mood muted>` props). That's expected and fixed in Task 6 — do NOT edit companion.tsx here beyond what Task 6 specifies. If you want a green tree before Task 6, you may do Tasks 5 and 6 back-to-back before committing; otherwise commit the component+CSS now and fix the call site in Task 6.

- [ ] **Step 6: In-browser visual check** — `npm run dev`; open a project page; confirm the orb is a translucent wobbling lens with flowing subject-colored light, a highlight, and eyes; it refracts content behind it. Tune blob sizes/blur/durations in `globals.css` to taste.

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/components/companion/orb.tsx src/components/companion/orb.test.tsx
git commit -m "feat(companion): liquid-energy lens orb + eyes rendering"
```

---

## Task 6: Wire events — gaze, idle, poke, mood, reaction

**Files:**
- Create: `src/components/companion/use-reaction.ts`
- Modify: `src/components/companion/companion.tsx`

> Integration task. The hook owns the reaction machine + timers; `companion.tsx` feeds it events and renders. Verified by the suite staying green + in-browser.

- [ ] **Step 1: Create the hook**

```ts
// use-reaction.ts
import { useEffect, useReducer, useRef } from "react";
import { initialReactionState, reduceReaction, type Reaction, type ReactionEvent } from "./reaction-state";

const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export function useReaction(muted: boolean): { reaction: Reaction; poke: () => void } {
  const [state, dispatch] = useReducer(reduceReaction, undefined, () => initialReactionState(now()));
  const send = (e: ReactionEvent) => dispatch(e);
  const sendRef = useRef(send);
  sendRef.current = send;

  // mute/unmute
  useEffect(() => {
    sendRef.current(muted ? { type: "mute" } : { type: "unmute", now: now() });
  }, [muted]);

  // activity (pointer move / scroll / key) + idle ticks
  useEffect(() => {
    const onActivity = () => sendRef.current({ type: "activity", now: now() });
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);
    const tick = window.setInterval(() => sendRef.current({ type: "tick", now: now() }), 1000);
    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("scroll", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.clearInterval(tick);
    };
  }, []);

  return { reaction: state.reaction, poke: () => sendRef.current({ type: "poke", now: now() }) };
}
```

- [ ] **Step 2: Wire `companion.tsx`** — make these specific edits (keep ALL existing placement/hero/mute/i18n/narration code):

  1. Add imports near the other companion imports:
     ```tsx
     import { useReaction } from "./use-reaction";
     import type { Gaze } from "./eyes";
     ```
  2. Inside the component, after `const muted = useSyncExternalStore(...)`, add:
     ```tsx
     const { reaction, poke } = useReaction(muted);
     const [gaze, setGaze] = useState<Gaze>({ x: 0, y: 0 });
     ```
  3. Add a cursor-gaze effect (eyes follow the pointer relative to viewport center; reduced-motion → no gaze):
     ```tsx
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
     ```
  4. Replace the `<Orb mood={activeLine.mood} muted={muted} style={orbStyle} />` call with the new props, and attach the poke handler on a wrapping interactive layer. Change the `<Orb .../>` usage to:
     ```tsx
     <Orb mood={activeLine.mood} reaction={reaction} gaze={gaze} style={orbStyle} />
     ```
  5. Make the orb pokeable: on the element that wraps the orb (the `dockClass` container currently has `pointer-events: none`), add a pointer-events-enabled hit area. Simplest: wrap `<Orb>` in a span that re-enables pointer events and handles the click:
     ```tsx
     <span
       style={{ pointerEvents: "auto", display: "contents" }}
       onPointerDown={poke}
     >
       <Orb mood={activeLine.mood} reaction={reaction} gaze={gaze} style={orbStyle} />
     </span>
     ```
     (Note: `display:contents` keeps layout identical; the orb itself remains the visual. If poke doesn't register because the parent sets `pointer-events:none`, set `pointer-events:auto` directly on the orb via `orbStyle` instead.)

- [ ] **Step 3: Typecheck + tests + build**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass (companion test + companion deps; the old `muted`/`moodStyle` references are gone).

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 4: In-browser check** — `npm run dev`:
  - Move the cursor → eyes follow.
  - Click the orb repeatedly fast → it escalates (annoyed → angry: hotter/faster), then calms after a few seconds.
  - Leave it idle ~20–30s → it slows, then closes its eyes (sleepy → asleep). Move → wakes.
  - Mute (× button) → eyes close, dims.
  - Navigate brand → systems → AI: the orb's light recolors to the page.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/use-reaction.ts src/components/companion/companion.tsx
git commit -m "feat(companion): wire gaze, idle sleep, and poke reactions"
```

---

## Task 7: Idle "fighting sleep" + dream bubble, disturbance slosh, reduced-motion polish

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/companion/companion.tsx`
- Modify: `src/components/companion/speech-bubble.tsx` (dream content) — optional per below

> The `sleepy`/`asleep`/poke states already toggle via data-attributes (Task 5/6). This task adds the *motion character*: the randomized nod-fight while `sleepy`, the Zzz dream bubble while `asleep`, and the slosh/bump on poke.

- [ ] **Step 1: Add the fight/dream/slosh CSS** to the companion section of `globals.css`, inside the existing `@media (prefers-reduced-motion: no-preference)` block:

```css
  /* fighting sleep: a nodding droop that the wrapper applies while sleepy */
  .companion-orb[data-reaction="sleepy"] { animation: orb-breathe 5s ease-in-out infinite, orb-nod 3.2s ease-in-out infinite; }
  @keyframes orb-nod { 0%{transform:translateY(0) rotate(0)} 18%{transform:translateY(8px) rotate(3deg)} 22%{transform:translateY(-3px)} 55%{transform:translateY(11px) rotate(4deg)} 60%{transform:translateY(-1px)} 100%{transform:translateY(9px) rotate(3deg)} }
  /* poke slosh: a one-shot class toggled by JS */
  .companion-orb.is-sloshing { animation: orb-slosh 0.6s cubic-bezier(.34,1.3,.64,1); }
  @keyframes orb-slosh { 0%{transform:translateX(0) scale(1)} 18%{transform:translateX(9px) scale(1.06,.94)} 40%{transform:translateX(-4px) scale(.97,1.04)} 70%{transform:translateX(2px)} 100%{transform:translateX(0) scale(1)} }
  /* Zzz dream */
  @keyframes zzz-rise { 0%{transform:translateY(6px) scale(.7);opacity:0} 30%{opacity:1} 100%{transform:translateY(-18px) scale(1.1);opacity:0} }
  .companion-dream span { position:absolute; color: var(--subject-accent); font-weight:700; animation: zzz-rise 2.4s ease-in infinite; }
  .companion-dream span:nth-child(2){ animation-delay:.8s; font-size:1.1em; }
```

Add the static dream marker outside the media query so it shows under reduced-motion too:

```css
.companion-dream { position:absolute; top:-26px; right:-6px; width:34px; height:24px; }
```

- [ ] **Step 2: Render the dream bubble + apply the slosh** in `companion.tsx`:
  - When `reaction === "asleep"`, render a small dream element near the orb (reuse the bubble slot area):
    ```tsx
    {reaction === "asleep" && (
      <div className="companion-dream" aria-hidden="true"><span>z</span><span>z</span></div>
    )}
    ```
  - Randomize the nod so it isn't mechanical: vary the orb's `animationDuration` for the nod each time it enters `sleepy`, via a ref + a small effect:
    ```tsx
    const nodDur = useRef(3.2);
    useEffect(() => {
      if (reaction === "sleepy") nodDur.current = 2.6 + ((Date.now() % 10) / 10) * 1.6; // 2.6–4.2s, varies per entry
    }, [reaction]);
    ```
    and merge `animationDuration` into `orbStyle` only while sleepy (so the random value applies). (If finer randomness is wanted later, drive it from the state machine; for now this is enough and stays reduced-motion-safe because the whole block is gated.)
  - Slosh on poke: toggle `is-sloshing` for 600ms on pointer-down (in addition to `poke()`):
    ```tsx
    const [slosh, setSlosh] = useState(false);
    const onPoke = () => { poke(); setSlosh(true); window.setTimeout(() => setSlosh(false), 600); };
    ```
    Use `onPoke` as the handler and add `is-sloshing` to the orb's className via a wrapper or by passing a prop. Simplest: pass `className` through `Orb` — add an optional `className?: string` prop to `Orb` and append it to `.companion-orb`. Update `orb.tsx` signature accordingly and apply `{`companion-orb ${className ?? ""}`}`.

- [ ] **Step 3: Typecheck + tests + build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: all green.

- [ ] **Step 4: In-browser check**
  - Idle until sleepy → it nods/fights, the rhythm differs each time; then asleep → Zzz rises.
  - Poke → it sloshes/recoils once.
  - Toggle OS reduced-motion → no wobble/flow/nod/slosh; orb is a static tinted glass with eyes; asleep still shows a (static) Zzz; mute still closes eyes.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/companion/companion.tsx src/components/companion/orb.tsx
git commit -m "feat(companion): fighting-sleep nod, Zzz dream, poke slosh, reduced-motion"
```

---

## Self-review notes (against the spec)

- Material (liquid lens: glass + backdrop-blur + flowing subject-colored light + wobble + sheen + eyes) → Tasks 5 (CSS/orb) + 1 (subject color). ✓
- Page colors the orb via `:has()` `--subject-accent` → Task 1; consumed in Task 5 blob/Zzz. ✓
- State model (mood × reaction; precedence mute>anger>idle>active; one-shot disturbance) → Task 2 (pure machine) + Task 6 (wiring) + Task 7 (slosh). ✓
- Gaze (cursor + via existing section tracking) → Task 6 (cursor); section-glance rides the existing active-section logic already in companion.tsx. ✓
- Fighting-sleep (randomized) + dream Zzz → Task 7. ✓
- Click → direction-aware bump + slosh; spam → annoyed→angry, time cooldown → Tasks 2, 6, 7. (Direction-aware recoil uses the slosh + gaze-toward-poke; precise click-point vector is a visual refinement notable in Task 7's verify.) ✓
- Mute = sleeping (eyes closed, dim) → Tasks 2, 5. ✓
- Pure CSS/SVG, no new deps, no canvas → all tasks. ✓
- `moods.ts` reads tokens not hardcoded colors → Task 3 (params) + Task 5 (color via --subject-accent). ✓
- Reduced-motion fallback (static tinted glass; state still shown) → Tasks 5, 7. ✓
- Keeps placement/hero/mute/i18n/narration → Task 6 preserves them. ✓
- Tests: reaction-state, moods, eyes, orb; existing companion/placement tests stay green → Tasks 2–7. ✓
- Type consistency: `Reaction` (reaction-state), `Gaze`/`eyeShape` (eyes), `MoodParams`/`moodParams` (moods), `<Orb mood reaction gaze style className?>` — used identically across eyes.tsx, orb.tsx, companion.tsx, use-reaction.ts. ✓
- Visual/motion tuning is explicitly browser-verified (Tasks 5–7), not unit-tested — stated, per the spec.
```
