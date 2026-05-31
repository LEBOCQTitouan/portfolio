# Companion Orb (V0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal "companion orb" that narrates non-blog pages in the author's voice via scroll-driven text, changes color across three moods, and glides to an anchor beside each active section.

**Architecture:** A single client controller (`Companion`) mounts once in the root layout and no-ops on `/blog*`. It runs one `IntersectionObserver` over `[data-narrate]` sections, looks up the active section's line via a pure `getNarration(route)` resolver reading a central narration map, and drives a presentational `Orb` (mood color) + `SpeechBubble` (typed text) positioned via inline style. Motion is CSS-only and gated by `prefers-reduced-motion`; a persisted mute control tucks the orb away. No WebGL, soundwaves, or refraction (out of scope).

**Tech Stack:** Next.js 16 (App Router, client component), React 19, TypeScript, Tailwind v4 + CSS variables, Vitest + Testing Library (jsdom). Spec: `docs/superpowers/specs/2026-05-31-companion-orb-design.md`.

---

## File Structure

**Create:**
- `src/lib/narration/types.ts` — `Mood`, `Anchor`, `NarrationLine`, `NarrationMap`.
- `src/lib/narration/script.ts` — the central narration map (author's copy), keyed by route.
- `src/lib/narration/resolver.ts` — `getNarration(route)`.
- `src/lib/narration/resolver.test.ts`
- `src/components/companion/moods.ts` — mood → color + `moodStyle()`.
- `src/components/companion/moods.test.ts`
- `src/components/companion/active-section.ts` — `pickActiveSection(ratios)`.
- `src/components/companion/active-section.test.ts`
- `src/components/companion/mute-storage.ts` — localStorage get/set.
- `src/components/companion/mute-storage.test.ts`
- `src/components/companion/use-reduced-motion.ts` — reduced-motion hook.
- `src/components/companion/use-reduced-motion.test.tsx`
- `src/components/companion/use-typewriter.ts` — typewriter hook.
- `src/components/companion/use-typewriter.test.tsx`
- `src/components/companion/orb.tsx` — presentational orb.
- `src/components/companion/orb.test.tsx`
- `src/components/companion/speech-bubble.tsx` — bubble.
- `src/components/companion/speech-bubble.test.tsx`
- `src/components/companion/companion.tsx` — controller.
- `src/components/companion/companion.test.tsx`

**Modify:**
- `vitest.setup.ts` — add `IntersectionObserver` + default `matchMedia` mocks.
- `src/app/globals.css` — companion styles + motion-gated transitions.
- `src/app/layout.tsx` — mount `<Companion />`.
- `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/uses/page.tsx`, `src/app/now/page.tsx`, `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx` — add `data-narrate` ids.

---

## Task 1: Narration types, script & resolver

**Files:**
- Create: `src/lib/narration/types.ts`, `src/lib/narration/script.ts`, `src/lib/narration/resolver.ts`, `src/lib/narration/resolver.test.ts`

- [ ] **Step 1: Write the types**

Create `src/lib/narration/types.ts`:

```ts
export type Mood = "calm" | "warm" | "focused";

export type Anchor = {
  /** horizontal position as a percent of the viewport width (0–100) */
  x: number;
  /** vertical position as a percent of the viewport height (0–100) */
  y: number;
  /** which side of the orb the bubble sits on */
  side: "left" | "right";
};

export type NarrationLine = {
  id: string;
  mood: Mood;
  text: string;
  anchor: Anchor;
};

export type NarrationMap = Record<string, NarrationLine[]>;
```

- [ ] **Step 2: Write the script (seed copy — author rewrites later)**

Create `src/lib/narration/script.ts`. The `id`s here MUST match the `data-narrate` attributes added in Task 11.

```ts
import type { NarrationMap } from "./types";

export const script: NarrationMap = {
  "/": [
    { id: "hero", mood: "warm", text: "Hey — I'm Titouan. Let me show you around.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "pillars", mood: "focused", text: "I live where systems thinking meets interface craft.", anchor: { x: 30, y: 50, side: "right" } },
    { id: "work", mood: "calm", text: "A few things I'm genuinely proud of.", anchor: { x: 74, y: 46, side: "left" } },
    { id: "writing", mood: "focused", text: "And I write about how it all fits together.", anchor: { x: 30, y: 58, side: "right" } },
  ],
  "/about": [
    { id: "intro", mood: "warm", text: "A bit about how I think about this craft.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "experience", mood: "calm", text: "Where I've built things, and what I learned.", anchor: { x: 30, y: 48, side: "right" } },
    { id: "skills", mood: "focused", text: "The tools I reach for across the stack.", anchor: { x: 74, y: 52, side: "left" } },
  ],
  "/uses": [
    { id: "intro", mood: "warm", text: "The kit I actually use every day.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "tools", mood: "focused", text: "Editor, languages, hardware, services.", anchor: { x: 30, y: 50, side: "right" } },
  ],
  "/now": [
    { id: "intro", mood: "warm", text: "Here's what has my attention right now.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "focus", mood: "calm", text: "A few things I'm focused on at the moment.", anchor: { x: 30, y: 52, side: "right" } },
  ],
  "/work": [
    { id: "intro", mood: "warm", text: "Selected work, across systems and interfaces.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "projects", mood: "calm", text: "Take a look — each one tells its own story.", anchor: { x: 30, y: 50, side: "right" } },
  ],
  "/work/[slug]": [
    { id: "project-header", mood: "focused", text: "Here's the shape of this one.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "project-body", mood: "calm", text: "And here's how it actually came together.", anchor: { x: 30, y: 50, side: "right" } },
  ],
};
```

- [ ] **Step 3: Write the failing resolver test**

Create `src/lib/narration/resolver.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getNarration } from "./resolver";

describe("getNarration", () => {
  it("returns the lines for an exact static route", () => {
    const lines = getNarration("/about");
    expect(lines.map((l) => l.id)).toEqual(["intro", "experience", "skills"]);
  });

  it("resolves any /work/<slug> to the project template", () => {
    const lines = getNarration("/work/ledger-engine");
    expect(lines.map((l) => l.id)).toEqual(["project-header", "project-body"]);
  });

  it("treats /work (index) as its own route, not a slug", () => {
    expect(getNarration("/work").map((l) => l.id)).toEqual(["intro", "projects"]);
  });

  it("returns an empty array for routes with no narration", () => {
    expect(getNarration("/blog/some-post")).toEqual([]);
  });
});
```

- [ ] **Step 4: Run it to verify it fails**

Run: `npx vitest run src/lib/narration/resolver.test.ts`
Expected: FAIL — cannot find module `./resolver`.

- [ ] **Step 5: Implement the resolver**

Create `src/lib/narration/resolver.ts`:

```ts
import { script } from "./script";
import type { NarrationLine } from "./types";

/** Returns the ordered narration lines for a route, or [] if none. */
export function getNarration(route: string): NarrationLine[] {
  if (script[route]) return script[route];
  if (route.startsWith("/work/") && route !== "/work") {
    return script["/work/[slug]"] ?? [];
  }
  return [];
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `npx vitest run src/lib/narration/resolver.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/narration
git commit -m "feat(companion): narration types, script, and route resolver"
```

---

## Task 2: Mood → color mapping

**Files:**
- Create: `src/components/companion/moods.ts`, `src/components/companion/moods.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/moods.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { MOOD_COLORS, moodStyle } from "./moods";
import type { Mood } from "@/lib/narration/types";

describe("moodStyle", () => {
  const moods: Mood[] = ["calm", "warm", "focused"];

  it("defines colors for every mood", () => {
    for (const mood of moods) {
      expect(MOOD_COLORS[mood]).toBeDefined();
    }
  });

  it("builds a gradient background and glow for a mood", () => {
    const style = moodStyle("warm");
    expect(style.background).toContain(MOOD_COLORS.warm.mid);
    expect(style.background).toContain("radial-gradient");
    expect(style.boxShadow).toContain(MOOD_COLORS.warm.glow);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/moods.test.ts`
Expected: FAIL — cannot find module `./moods`.

- [ ] **Step 3: Implement**

Create `src/components/companion/moods.ts`:

```ts
import type { CSSProperties } from "react";
import type { Mood } from "@/lib/narration/types";

type MoodColors = { mid: string; edge: string; glow: string };

export const MOOD_COLORS: Record<Mood, MoodColors> = {
  calm: { mid: "rgba(41,151,255,.55)", edge: "rgba(111,125,255,.32)", glow: "rgba(74,157,255,.45)" },
  warm: { mid: "rgba(255,143,166,.55)", edge: "rgba(255,122,122,.32)", glow: "rgba(255,154,176,.45)" },
  focused: { mid: "rgba(139,120,255,.55)", edge: "rgba(95,118,255,.32)", glow: "rgba(151,133,255,.45)" },
};

/** Inline style (background + glow) for the orb in a given mood. */
export function moodStyle(mood: Mood): Pick<CSSProperties, "background" | "boxShadow"> {
  const c = MOOD_COLORS[mood];
  return {
    background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.34), ${c.mid} 56%, ${c.edge})`,
    boxShadow: `inset 0 0 18px rgba(255,255,255,.22), 0 0 30px 6px ${c.glow}`,
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/moods.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/moods.ts src/components/companion/moods.test.ts
git commit -m "feat(companion): mood color palette and orb style helper"
```

---

## Task 3: Active-section picker

**Files:**
- Create: `src/components/companion/active-section.ts`, `src/components/companion/active-section.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/active-section.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { pickActiveSection } from "./active-section";

describe("pickActiveSection", () => {
  it("returns the id with the highest visibility ratio", () => {
    expect(pickActiveSection({ a: 0.1, b: 0.8, c: 0.3 })).toBe("b");
  });

  it("returns null when nothing is visible", () => {
    expect(pickActiveSection({ a: 0, b: 0 })).toBeNull();
  });

  it("returns null for an empty map", () => {
    expect(pickActiveSection({})).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/active-section.test.ts`
Expected: FAIL — cannot find module `./active-section`.

- [ ] **Step 3: Implement**

Create `src/components/companion/active-section.ts`:

```ts
/** Given section id → intersection ratio, return the most-visible id (or null). */
export function pickActiveSection(ratios: Record<string, number>): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [id, ratio] of Object.entries(ratios)) {
    if (ratio > max) {
      max = ratio;
      best = id;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/active-section.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/active-section.ts src/components/companion/active-section.test.ts
git commit -m "feat(companion): most-visible section picker"
```

---

## Task 4: Mute persistence

**Files:**
- Create: `src/components/companion/mute-storage.ts`, `src/components/companion/mute-storage.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/mute-storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getMuted, setMuted } from "./mute-storage";

describe("mute-storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to not muted (companion on)", () => {
    expect(getMuted()).toBe(false);
  });

  it("persists and reads back the muted flag", () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/mute-storage.test.ts`
Expected: FAIL — cannot find module `./mute-storage`.

- [ ] **Step 3: Implement**

Create `src/components/companion/mute-storage.ts`:

```ts
const KEY = "companion-muted";

export function getMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function setMuted(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(value));
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/mute-storage.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/mute-storage.ts src/components/companion/mute-storage.test.ts
git commit -m "feat(companion): persist mute preference in localStorage"
```

---

## Task 5: Reduced-motion hook + test setup mocks

**Files:**
- Modify: `vitest.setup.ts`
- Create: `src/components/companion/use-reduced-motion.ts`, `src/components/companion/use-reduced-motion.test.tsx`

- [ ] **Step 1: Add global mocks to the test setup**

Replace the entire contents of `vitest.setup.ts` with:

```ts
import "@testing-library/jest-dom/vitest";
import { beforeEach } from "vitest";

/** Controllable matchMedia mock. Default: desktop = true, reduced-motion = false. */
type MqState = { matches: boolean };
const mqRegistry = new Map<string, MqState>();

export function setMatchMedia(query: string, matches: boolean) {
  mqRegistry.set(query, { matches });
}

window.matchMedia = ((query: string) => {
  const state = mqRegistry.get(query) ?? {
    matches: query.includes("min-width"), // desktop true by default, reduced false
  };
  return {
    get matches() {
      return state.matches;
    },
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}) as typeof window.matchMedia;

/** Manually-driveable IntersectionObserver mock. */
export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  callback: IntersectionObserverCallback;
  elements: Element[] = [];

  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe(el: Element) {
    this.elements.push(el);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  /** Test helper: fire the callback with given entries. */
  trigger(entries: Array<Partial<IntersectionObserverEntry>>) {
    this.callback(entries as IntersectionObserverEntry[], this);
  }
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

beforeEach(() => {
  mqRegistry.clear();
  MockIntersectionObserver.instances = [];
});
```

- [ ] **Step 2: Write the failing test**

Create `src/components/companion/use-reduced-motion.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";
import { setMatchMedia } from "../../../vitest.setup";

describe("useReducedMotion", () => {
  it("is false when the user has no motion preference", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("is true when prefers-reduced-motion: reduce matches", () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/components/companion/use-reduced-motion.test.tsx`
Expected: FAIL — cannot find module `./use-reduced-motion`.

- [ ] **Step 4: Implement**

Create `src/components/companion/use-reduced-motion.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/components/companion/use-reduced-motion.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add vitest.setup.ts src/components/companion/use-reduced-motion.ts src/components/companion/use-reduced-motion.test.tsx
git commit -m "test(companion): IO + matchMedia mocks; add useReducedMotion hook"
```

---

## Task 6: Typewriter hook

**Files:**
- Create: `src/components/companion/use-typewriter.ts`, `src/components/companion/use-typewriter.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/use-typewriter.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

afterEach(() => vi.useRealTimers());

describe("useTypewriter", () => {
  it("returns the full text immediately when disabled", () => {
    const { result } = renderHook(() => useTypewriter("hello", false));
    expect(result.current).toBe("hello");
  });

  it("reveals the text one character at a time when enabled", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypewriter("hi", true, 10));
    expect(result.current).toBe("");
    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe("h");
    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe("hi");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/use-typewriter.test.tsx`
Expected: FAIL — cannot find module `./use-typewriter`.

- [ ] **Step 3: Implement**

Create `src/components/companion/use-typewriter.ts`:

```ts
"use client";

import { useEffect, useState } from "react";

/** Reveals `text` one char at a time when enabled; full text immediately otherwise. */
export function useTypewriter(text: string, enabled: boolean, speedMs = 22): string {
  const [shown, setShown] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      return;
    }
    setShown("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, enabled, speedMs]);

  return shown;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/use-typewriter.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/use-typewriter.ts src/components/companion/use-typewriter.test.tsx
git commit -m "feat(companion): typewriter reveal hook"
```

---

## Task 7: Orb component

**Files:**
- Create: `src/components/companion/orb.tsx`, `src/components/companion/orb.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/orb.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Orb } from "./orb";

describe("Orb", () => {
  it("renders with the mood as a data attribute and a gradient background", () => {
    const { container } = render(<Orb mood="warm" muted={false} />);
    const orb = container.querySelector(".companion-orb") as HTMLElement;
    expect(orb).toBeInTheDocument();
    expect(orb.dataset.mood).toBe("warm");
    expect(orb.style.background).toContain("radial-gradient");
  });

  it("is decorative (aria-hidden) so it doesn't reach screen readers", () => {
    const { container } = render(<Orb mood="calm" muted={false} />);
    expect(container.querySelector(".companion-orb")).toHaveAttribute("aria-hidden", "true");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/orb.test.tsx`
Expected: FAIL — cannot find module `./orb`.

- [ ] **Step 3: Implement**

Create `src/components/companion/orb.tsx`:

```tsx
import type { Mood } from "@/lib/narration/types";
import { moodStyle } from "./moods";

export function Orb({ mood, muted }: { mood: Mood; muted: boolean }) {
  return (
    <div
      className="companion-orb"
      data-mood={mood}
      aria-hidden="true"
      style={{
        ...moodStyle(mood),
        ...(muted ? { transform: "scale(0.6)", filter: "saturate(.7) opacity(.8)" } : null),
      }}
    />
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/orb.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/orb.tsx src/components/companion/orb.test.tsx
git commit -m "feat(companion): presentational orb component"
```

---

## Task 8: Speech bubble component

**Files:**
- Create: `src/components/companion/speech-bubble.tsx`, `src/components/companion/speech-bubble.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/speech-bubble.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpeechBubble } from "./speech-bubble";

describe("SpeechBubble", () => {
  it("shows the full text immediately when motion is reduced", () => {
    render(<SpeechBubble text="Hello there" reducedMotion={true} />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/speech-bubble.test.tsx`
Expected: FAIL — cannot find module `./speech-bubble`.

- [ ] **Step 3: Implement**

Create `src/components/companion/speech-bubble.tsx`:

```tsx
import { useTypewriter } from "./use-typewriter";

export function SpeechBubble({
  text,
  reducedMotion,
}: {
  text: string;
  reducedMotion: boolean;
}) {
  const shown = useTypewriter(text, !reducedMotion);
  return <div className="companion-bubble">{shown}</div>;
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/speech-bubble.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/speech-bubble.tsx src/components/companion/speech-bubble.test.tsx
git commit -m "feat(companion): speech bubble with typewriter text"
```

---

## Task 9: Companion controller

**Files:**
- Create: `src/components/companion/companion.tsx`, `src/components/companion/companion.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/companion.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Companion } from "./companion";
import { MockIntersectionObserver } from "../../../vitest.setup";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

beforeEach(() => {
  pathname = "/";
  window.localStorage.clear();
  document.body.innerHTML = "";
});

/** Render the companion alongside DOM sections it can observe. */
function renderWithSections(ids: string[]) {
  document.body.innerHTML = ids
    .map((id) => `<div data-narrate="${id}" style="height:200px"></div>`)
    .join("");
  return render(<Companion />);
}

describe("Companion", () => {
  it("renders nothing on blog routes", () => {
    pathname = "/blog/designing-for-failure";
    const { container } = render(<Companion />);
    expect(container.querySelector(".companion-orb")).toBeNull();
  });

  it("shows the active section's line and mood as it becomes visible", () => {
    renderWithSections(["hero", "pillars", "work", "writing"]);
    const io = MockIntersectionObserver.instances[0];
    act(() => {
      io.trigger([
        { target: document.querySelector('[data-narrate="pillars"]')!, isIntersecting: true, intersectionRatio: 0.9 },
        { target: document.querySelector('[data-narrate="hero"]')!, isIntersecting: true, intersectionRatio: 0.1 },
      ]);
    });
    expect(screen.getByText("I live where systems thinking meets interface craft.")).toBeInTheDocument();
    expect(document.querySelector(".companion-orb")?.getAttribute("data-mood")).toBe("focused");
  });

  it("mutes and persists when the control is clicked", async () => {
    renderWithSections(["hero"]);
    await userEvent.click(screen.getByRole("button", { name: /mute site companion/i }));
    expect(window.localStorage.getItem("companion-muted")).toBe("true");
    expect(screen.getByRole("button", { name: /unmute site companion/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/companion.test.tsx`
Expected: FAIL — cannot find module `./companion`.

- [ ] **Step 3: Implement**

Create `src/components/companion/companion.tsx`:

```tsx
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

  const [muted, setMutedState] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const ratios = useRef<Record<string, number>>({});

  // restore mute preference
  useEffect(() => setMutedState(getMuted()), []);

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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/companion.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/companion.tsx src/components/companion/companion.test.tsx
git commit -m "feat(companion): scroll-driven controller with mute + mobile dock"
```

---

## Task 10: Companion styles

**Files:**
- Modify: `src/app/globals.css` (append at end of file)

- [ ] **Step 1: Append the companion styles**

Add to the end of `src/app/globals.css`:

```css
/* ── Companion orb ─────────────────────────────────────────── */
.companion-dock {
  position: fixed;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 12px;
  transform: translate(-50%, -50%);
  pointer-events: none; /* decorative; never blocks the page */
}
.companion-dock.side-left {
  flex-direction: row-reverse;
}
.companion-orb {
  width: 92px;
  height: 92px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(2px) saturate(1.3);
  -webkit-backdrop-filter: blur(2px) saturate(1.3);
}
.companion-bubble {
  max-width: 220px;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  background: var(--card);
  color: var(--foreground);
  border: 1px solid var(--border);
  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.1);
}
.companion-dock.side-right .companion-bubble {
  border-bottom-left-radius: 4px;
}
.companion-dock.side-left .companion-bubble {
  border-bottom-right-radius: 4px;
}
.companion-mute {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 41;
  width: 30px;
  height: 30px;
  border-radius: 9999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

/* Motion only when the user allows it. */
@media (prefers-reduced-motion: no-preference) {
  .companion-dock {
    transition:
      left 0.9s cubic-bezier(0.6, 0.02, 0.2, 1),
      top 0.9s cubic-bezier(0.6, 0.02, 0.2, 1);
  }
  .companion-orb {
    transition:
      background 0.7s ease,
      box-shadow 0.7s ease,
      transform 0.3s ease;
  }
}
```

- [ ] **Step 2: Verify the suite still passes (no regressions)**

Run: `npx vitest run`
Expected: PASS (all suites).

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style(companion): orb, bubble, mute, and motion-gated transitions"
```

---

## Task 11: Mount in layout & wire up page sections

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/uses/page.tsx`, `src/app/now/page.tsx`, `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx`

- [ ] **Step 1: Mount the Companion in the layout**

In `src/app/layout.tsx`, add the import after the existing `Analytics` import (line 8):

```tsx
import { Companion } from "@/components/companion/companion";
```

Then add `<Companion />` as a sibling of the container `div`, still inside `ThemeProvider` (between the closing `</div>` on line 53 and `</ThemeProvider>` on line 54):

```tsx
          </div>
          <Companion />
        </ThemeProvider>
```

- [ ] **Step 2: Add `data-narrate` ids on the home page**

In `src/app/page.tsx`, wrap `<Hero />` and tag the three sections. Replace the `return (...)` block's relevant lines:

- Wrap the hero: change `<Hero />` (line 19) to:

```tsx
        <div data-narrate="hero">
          <Hero />
        </div>
```

- Add `data-narrate="pillars"` to the `What I do` section opening tag:

```tsx
      <section className="py-8" aria-label="What I do" data-narrate="pillars">
```

- Add `data-narrate="work"` to the Selected work section opening tag:

```tsx
        <section className="py-8" data-narrate="work">
```

- Add `data-narrate="writing"` to the Latest writing section opening tag:

```tsx
        <section className="py-8" data-narrate="writing">
```

- [ ] **Step 3: Add `data-narrate` ids on the about page**

In `src/app/about/page.tsx`:

- Add `data-narrate="intro"` to the bio wrapper (line 36):

```tsx
      <div className="prose-content mt-6 max-w-2xl" data-narrate="intro">
```

- Add `data-narrate="experience"` to the experience `<ol>` (line 50):

```tsx
      <ol className="mt-4 space-y-6 border-l border-border pl-6" data-narrate="experience">
```

- Add `data-narrate="skills"` to the skills grid `<div>` (line 69):

```tsx
      <div className="mt-4 grid gap-4 sm:grid-cols-2" data-narrate="skills">
```

- [ ] **Step 4: Add `data-narrate` ids on the uses page**

In `src/app/uses/page.tsx`:

- Add `data-narrate="intro"` to the intro `<p>` (line 31):

```tsx
      <p className="mt-2 text-muted" data-narrate="intro">
```

- Add `data-narrate="tools"` to the categories container (line 34):

```tsx
      <div className="mt-8 space-y-8" data-narrate="tools">
```

- [ ] **Step 5: Add `data-narrate` ids on the now page**

In `src/app/now/page.tsx`:

- Add `data-narrate="intro"` to the "What I'm focused on" `<p>` (line 22):

```tsx
      <p className="mt-6 max-w-2xl text-muted" data-narrate="intro">
```

- Add `data-narrate="focus"` to the focus `<ul>` (line 25):

```tsx
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" data-narrate="focus">
```

- [ ] **Step 6: Add `data-narrate` ids on the work index page**

In `src/app/work/page.tsx`:

- Add `data-narrate="intro"` to the intro `<p>` (line 15):

```tsx
      <p className="mt-2 text-muted" data-narrate="intro">
```

- Add `data-narrate="projects"` to the projects container (line 18):

```tsx
      <div className="mt-8" data-narrate="projects">
```

- [ ] **Step 7: Add `data-narrate` ids on the project detail page**

In `src/app/work/[slug]/page.tsx`:

- Add `data-narrate="project-header"` to the `<header>` (line 45):

```tsx
      <header className="mb-8" data-narrate="project-header">
```

- Wrap `<Mdx source={project.content} />` (line 91) so the body is narratable:

```tsx
      <div data-narrate="project-body">
        <Mdx source={project.content} />
      </div>
```

- [ ] **Step 8: Typecheck, test, and lint**

Run: `npx tsc --noEmit && npx vitest run && npm run lint`
Expected: no type errors, all tests pass, no lint errors.

- [ ] **Step 9: Commit**

```bash
git add src/app
git commit -m "feat(companion): mount in layout and wire data-narrate sections"
```

---

## Task 12: Full verification & PR

**Files:** none (verification only)

- [ ] **Step 1: Run the full local gate**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: all pass; build completes.

- [ ] **Step 2: Manual check on the real Cloudflare runtime**

Run: `npm run preview`
Then in a browser, on a non-blog page (e.g. `/` and `/about`):
- Scroll and confirm the orb glides between sections, color shifts per mood, and the bubble text updates.
- Click the mute control (bottom-right `×`) → orb shrinks to the corner, bubble hides, refresh → still muted.
- Confirm the orb does NOT appear on any `/blog` page.
- In OS settings enable "reduce motion" → confirm the orb repositions instantly (no glide) and text appears without typewriter.
Expected: all behaviors as described. Stop the preview when done.

- [ ] **Step 3: Push and open a PR**

```bash
git push -u origin feat/companion-orb
gh pr create --title "feat: companion orb (V0) — scroll-driven narrator" --body "Implements docs/superpowers/specs/2026-05-31-companion-orb-design.md. Minimal companion: scroll-driven narration, 3-mood color, section-anchored movement. Excludes /blog; reduced-motion safe; dismissible + remembered."
```

Expected: PR created on `feat/companion-orb`.

---

## Self-Review Notes

- **Spec coverage:** narration (Tasks 1, 9, 11) · 3-mood color (Tasks 2, 7) · section-anchored movement (Tasks 9, 10, 11) · scroll/IntersectionObserver (Task 9) · central map + resolver (Task 1) · on-by-default/dismiss/persist (Tasks 4, 9) · reduced-motion (Tasks 5, 6, 8, 9, 10) · `aria-hidden` + labeled mute button (Tasks 7, 9) · `/blog` exclusion (Task 9) · mobile corner dock (Task 9) · testing (every task) · no worker-bundle impact (client-only, no new server deps). All covered.
- **Type consistency:** `Mood`, `Anchor`, `NarrationLine` defined in Task 1 and reused verbatim; `moodStyle`, `pickActiveSection`, `getMuted/setMuted`, `useReducedMotion`, `useTypewriter`, `Orb`, `SpeechBubble`, `getNarration` signatures match across tasks.
- **Out of scope (unchanged):** no soundwaves/refraction/WebGL/audio; `Orb` is a swap point if a richer renderer is wanted later.
