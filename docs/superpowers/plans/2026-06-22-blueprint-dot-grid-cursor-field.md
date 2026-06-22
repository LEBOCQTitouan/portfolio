# Blueprint dot-grid + cursor field — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a site-wide technical-blueprint dotted-grid background with a restrained cursor interaction (mono ambient warp, colour-only-on-action-elements convergence) and a cursor-float grayscale→colour raster reveal on project/article rows.

**Architecture:** One client component, `BlueprintField`, mounted once in the root layout as a sibling after `.page-aura`. It owns a single full-bleed 2D-canvas, one `requestAnimationFrame` loop, pointer tracking, and a single reused floating preview element. Pure geometry/motion math lives in a tested module; tunable constants live in a tokens module; ink colours are CSS variables so theming flows through the existing light/dark mechanism. The component discovers interactive elements via `data-bp-*` attributes (same pattern as the existing `glow-group`).

**Tech Stack:** Next.js (modified fork — see Global Constraints), React client component, 2D Canvas API, TypeScript, Vitest + jsdom.

## Global Constraints

- **This is a modified Next.js.** Before writing any framework-touching code (layout, client components, `"use client"`), read the relevant guide in `node_modules/next/dist/docs/`. APIs may differ from upstream.
- **No new runtime dependencies.** 2D canvas only — no WebGL, no animation libs.
- **Colour policy:** the resting grid and ambient warp are **mono only**. Subject accent appears **only** as interaction feedback (convergence tint on action elements; the reveal's colour resolve). Read existing `--subject-accent` / per-subject vars.
- **Canvas DPR gotcha:** the canvas MUST set CSS `width:100%;height:100%` in addition to `position:fixed;inset:0`, and cap `devicePixelRatio` at **2**, or it renders at 2× on retina and pointer math lands wrong.
- **Accessibility:** `prefers-reduced-motion: reduce` → static grid (draw once, no rAF), no warp/convergence/reveal motion, instant static thumbs; subscribe to the query's `change` event. `(hover:hover) and (pointer:fine)` gates the cursor-float; coarse pointers → static grid + static thumbs. Canvas is `aria-hidden`.
- **Grid alignment invariant:** pitch `24`, major every `8` cells (192px); the centred 768px column's edges must land on major grid lines.
- **Tests are part of done.** Pure math is unit-tested (Vitest); rendering/feel is validated live in a driven browser (automation screenshots mislead for fluid motion).
- **Commits:** Conventional Commits, imperative, scoped. Commit after each task.
- Test commands: single file `npx vitest run <path>`; single test `npx vitest run <path> -t "<name>"`.

---

### Task 1: Blueprint tokens (constants + CSS ink variables)

**Files:**
- Create: `src/design/blueprint.ts`
- Modify: `src/app/globals.css` (add ink vars near the `.page-aura` block, ~line 200–236)

**Interfaces:**
- Produces: `BP` constant object — `{ PITCH:24, MAJOR:8, COLUMN:768, GUTTER:24, warp:{strength:2.6, reach:230}, converge:{radius:108, pull:0.24}, reveal:{follow:0.11, coarse:18, scaleMin:0.92, offset:{x:26,y:-96}}, clear:{text:16, pillar:18, button:28, row:14} }`. Imported by every later task.
- Produces (CSS): `--bp-ink`, `--bp-ink-a` (light + dark).

- [ ] **Step 1: Create the tokens module**

```ts
// src/design/blueprint.ts
// Single source of truth for blueprint-field geometry + motion.
// Mono colour policy: ink colours live in CSS (--bp-ink / --bp-ink-a) so they
// follow light/dark; only geometry + motion numbers live here.
export const BP = {
  PITCH: 24, // px — design-system base unit
  MAJOR: 8, // cells between major intersections → 192px; 768 column edges land on majors
  COLUMN: 768, // max-w-3xl content column
  GUTTER: 24, // px-6 side gutter
  warp: { strength: 2.6, reach: 230 }, // ambient whole-scheme flex (mono)
  converge: { radius: 108, pull: 0.24 }, // action-element convergence (tinted)
  reveal: { follow: 0.11, coarse: 18, scaleMin: 0.92, offset: { x: 26, y: -96 } },
  clear: { text: 16, pillar: 18, button: 28, row: 14 }, // keep-out margins
} as const;
```

- [ ] **Step 2: Add CSS ink variables**

Add to `src/app/globals.css` immediately after the `.page-aura` rules (the `:root` already defines theme tokens; mirror that light/dark split):

```css
/* ── Blueprint field ink (mono; subject colour enters only via interaction) ── */
:root { --bp-ink: 18, 38, 66; --bp-ink-a: 0.12; }
.dark { --bp-ink: 140, 175, 215; --bp-ink-a: 0.15; }
```

- [ ] **Step 3: Commit**

```bash
git add src/design/blueprint.ts src/app/globals.css
git commit -m "feat(blueprint): add grid tokens and mono ink variables"
```

---

### Task 2: Pure geometry + motion math (TDD)

**Files:**
- Create: `src/components/blueprint/geometry.ts`
- Test: `src/components/blueprint/geometry.test.ts`

**Interfaces:**
- Consumes: `BP` from `src/design/blueprint.ts`.
- Produces:
  - `DPR_CAP = 2`
  - `alignedOriginX(viewportW: number, pitch: number): number`
  - `distToRect(px:number, py:number, r:{l:number;t:number;r:number;b:number}): number`
  - `suppression(x:number, y:number, clears:Array<{l:number;t:number;r:number;b:number;m:number}>): number` // 0..1
  - `warpOffset(px:number, py:number, sx:number, sy:number, amp:number, cfg:{strength:number;reach:number}): {dx:number;dy:number}`
  - `convergeOffset(px:number, py:number, sx:number, sy:number, over:number, cfg:{radius:number;pull:number}): {dx:number;dy:number;infl:number}`
  - `rasterBlock(prog:number, coarse:number): number`

- [ ] **Step 1: Write the failing tests**

```ts
// src/components/blueprint/geometry.test.ts
import { describe, it, expect } from "vitest";
import {
  alignedOriginX, distToRect, suppression, warpOffset, convergeOffset, rasterBlock, DPR_CAP,
} from "./geometry";
import { BP } from "@/design/blueprint";

describe("alignedOriginX", () => {
  it("places a grid line at the viewport centre", () => {
    const ox = alignedOriginX(1440, BP.PITCH);
    expect((720 - ox) % BP.PITCH).toBeCloseTo(0, 6); // centre is on a line
  });
  it("makes the 768 column edges land on MAJOR lines", () => {
    const ox = alignedOriginX(1440, BP.PITCH);
    const major = BP.PITCH * BP.MAJOR; // 192
    for (const edge of [720 - 384, 720 + 384]) {
      expect((edge - ox) % major).toBeCloseTo(0, 6);
    }
  });
});

describe("distToRect", () => {
  const r = { l: 100, t: 100, r: 200, b: 200 };
  it("is 0 inside", () => expect(distToRect(150, 150, r)).toBe(0));
  it("measures orthogonal distance outside", () => expect(distToRect(100, 80, r)).toBeCloseTo(20, 6));
  it("measures corner distance", () => expect(distToRect(97, 96, r)).toBeCloseTo(5, 6));
});

describe("suppression", () => {
  const clears = [{ l: 100, t: 100, r: 200, b: 200, m: 20 }];
  it("is 1 inside the rect", () => expect(suppression(150, 150, clears)).toBe(1));
  it("is 0 beyond the margin", () => expect(suppression(150, 70, clears)).toBe(0));
  it("ramps linearly across the margin", () => expect(suppression(150, 90, clears)).toBeCloseTo(0.5, 6));
});

describe("warpOffset", () => {
  it("is zero when amplitude is zero", () => {
    expect(warpOffset(0, 0, 100, 0, 0, BP.warp)).toEqual({ dx: 0, dy: 0 });
  });
  it("points toward the cursor and stays within strength", () => {
    const w = warpOffset(0, 0, 100, 0, 1, BP.warp);
    expect(w.dx).toBeGreaterThan(0);
    expect(Math.abs(w.dx)).toBeLessThanOrEqual(BP.warp.strength + 1e-9);
  });
  it("is zero beyond reach", () => {
    expect(warpOffset(0, 0, BP.warp.reach + 50, 0, 1, BP.warp)).toEqual({ dx: 0, dy: 0 });
  });
});

describe("convergeOffset", () => {
  it("has no influence beyond the radius", () => {
    const c = convergeOffset(0, 0, BP.converge.radius + 10, 0, 1, BP.converge);
    expect(c.infl).toBe(0);
  });
  it("influence rises toward the cursor", () => {
    const c = convergeOffset(0, 0, 10, 0, 1, BP.converge);
    expect(c.infl).toBeGreaterThan(0);
    expect(c.infl).toBeLessThanOrEqual(1);
    expect(c.dx).toBeGreaterThan(0);
  });
  it("is inert when over=0", () => {
    expect(convergeOffset(0, 0, 10, 0, 0, BP.converge)).toEqual({ dx: 0, dy: 0, infl: 0 });
  });
});

describe("rasterBlock", () => {
  it("is sharp (1) when fully resolved", () => expect(rasterBlock(1, 18)).toBeCloseTo(1, 6));
  it("is coarsest at progress 0", () => expect(rasterBlock(0, 18)).toBeCloseTo(18, 6));
  it("caps DPR sanity", () => expect(DPR_CAP).toBe(2));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/blueprint/geometry.test.ts`
Expected: FAIL — `Cannot find module './geometry'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/components/blueprint/geometry.ts
// Pure geometry + motion math for the blueprint field. No DOM, no canvas — testable.
export const DPR_CAP = 2;

export interface Rect { l: number; t: number; r: number; b: number; }

// Origin so a grid line sits on the viewport centre (→ centred column edges land on lines).
export function alignedOriginX(viewportW: number, pitch: number): number {
  const cx = viewportW / 2;
  return cx - Math.round(cx / pitch) * pitch;
}

export function distToRect(px: number, py: number, r: Rect): number {
  const dx = Math.max(r.l - px, 0, px - r.r);
  const dy = Math.max(r.t - py, 0, py - r.b);
  return Math.hypot(dx, dy);
}

export function suppression(
  x: number, y: number, clears: Array<Rect & { m: number }>,
): number {
  let s = 0;
  for (const c of clears) {
    const d = distToRect(x, y, c);
    if (d < c.m) {
      const v = 1 - d / c.m;
      if (v > s) s = v;
      if (s >= 1) return 1;
    }
  }
  return s;
}

export function warpOffset(
  px: number, py: number, sx: number, sy: number, amp: number,
  cfg: { strength: number; reach: number },
): { dx: number; dy: number } {
  if (amp <= 0) return { dx: 0, dy: 0 };
  const vx = sx - px, vy = sy - py;
  const d = Math.hypot(vx, vy) || 1e-4;
  const ai = Math.max(0, 1 - d / cfg.reach);
  const m = ai * ai * cfg.strength * amp;
  return { dx: (vx / d) * m, dy: (vy / d) * m };
}

export function convergeOffset(
  px: number, py: number, sx: number, sy: number, over: number,
  cfg: { radius: number; pull: number },
): { dx: number; dy: number; infl: number } {
  if (over <= 0) return { dx: 0, dy: 0, infl: 0 };
  const vx = sx - px, vy = sy - py;
  const d = Math.hypot(vx, vy);
  if (d >= cfg.radius) return { dx: 0, dy: 0, infl: 0 };
  const infl = 1 - d / cfg.radius;
  const pull = infl * infl * cfg.pull * over;
  return { dx: vx * pull, dy: vy * pull, infl: infl * over };
}

export function rasterBlock(prog: number, coarse: number): number {
  return 1 + (1 - Math.min(1, Math.max(0, prog))) * (coarse - 1);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/blueprint/geometry.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add src/components/blueprint/geometry.ts src/components/blueprint/geometry.test.ts
git commit -m "feat(blueprint): add tested geometry and motion math"
```

---

### Task 3: BlueprintField component — substrate, clearings, ambient warp, reduced-motion

**Files:**
- Create: `src/components/blueprint/blueprint-field.tsx`
- Modify: `src/app/[lang]/layout.tsx` (mount it after `.page-aura`)
- Reuse: `src/components/companion/use-reduced-motion.ts` (existing hook)

**Interfaces:**
- Consumes: `BP` (Task 1), geometry helpers (Task 2), `useReducedMotion()` (existing).
- Produces: default-exported `BlueprintField` React component; reads `[data-bp-clear]` rects from the DOM. Later tasks extend its render loop (convergence in Task 4, reveal in Task 5) and add `data-bp-*` producers.
- DOM contract introduced here: `[data-bp-clear="<px>"]` clears the grid around an element.

- [ ] **Step 1: Confirm the framework docs + reduced-motion hook**

Read `node_modules/next/dist/docs/` for the current client-component guidance, and open `src/components/companion/use-reduced-motion.ts` to confirm the hook's exported name/signature (used below as `useReducedMotion(): boolean`). If the name differs, adjust the import in Step 2.

- [ ] **Step 2: Create the component (substrate + clearings + ambient warp)**

```tsx
// src/components/blueprint/blueprint-field.tsx
"use client";

import { useEffect, useRef } from "react";
import { BP } from "@/design/blueprint";
import { useReducedMotion } from "@/components/companion/use-reduced-motion";
import {
  DPR_CAP, alignedOriginX, suppression, warpOffset, type Rect,
} from "./geometry";

// Reads a CSS custom property off <body> (theme-aware).
function cssVar(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}
function ink(): [number, number, number] {
  return cssVar("--bp-ink").split(",").map((s) => parseInt(s.trim(), 10)) as [number, number, number];
}
function inkA(): number { return parseFloat(cssVar("--bp-ink-a")); }
function rgba(k: number[], a: number): string { return `rgba(${k[0] | 0},${k[1] | 0},${k[2] | 0},${a})`; }

export default function BlueprintField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1, ox = 0, oy = 0, cols = 0, rows = 0;
    let clears: Array<Rect & { m: number }> = [];
    let col = { l: 0, r: 0 }, inner = { l: 0, r: 0 };
    const ptr = { x: -9999, y: -9999, on: false };
    let sx = -9999, sy = -9999, amp = 0;
    let raf = 0;

    const measure = () => {
      const el = document.querySelector("[data-bp-column]") ?? document.querySelector("main");
      const r = el?.getBoundingClientRect();
      const cx = W / 2;
      col = r ? { l: r.left, r: r.right } : { l: cx - BP.COLUMN / 2, r: cx + BP.COLUMN / 2 };
      inner = { l: col.l + BP.GUTTER, r: col.r - BP.GUTTER };
      clears = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-clear]")).map((e) => {
        const b = e.getBoundingClientRect();
        return { l: b.left, t: b.top, r: b.right, b: b.bottom, m: Number(e.dataset.bpClear) || BP.clear.text };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ox = alignedOriginX(W, BP.PITCH) - BP.PITCH; oy = -BP.PITCH;
      cols = Math.ceil((W - ox) / BP.PITCH) + 2; rows = Math.ceil((H - oy) / BP.PITCH) + 2;
      measure();
      if (reduced) draw(false);
    };

    const warpAt = (px: number, py: number) => warpOffset(px, py, sx, sy, amp, BP.warp);

    const vline = (x: number, a: number, k: number[]) => {
      ctx.beginPath();
      let started = false;
      for (let y = 0; y <= H; y += 14) {
        const w = warpAt(x, y); const lx = x + w.dx, ly = y + w.dy;
        if (!started) { ctx.moveTo(lx, ly); started = true; } else ctx.lineTo(lx, ly);
      }
      ctx.strokeStyle = rgba(k, a); ctx.lineWidth = 1; ctx.stroke();
    };

    const hatch = (outerX: number, innerX: number, dir: number, k: number[], a: number) => {
      const lo = Math.min(outerX, innerX), hi = Math.max(outerX, innerX), bw = hi - lo, S = 11;
      ctx.save(); ctx.beginPath(); ctx.rect(lo - 1, 0, bw + 2, H); ctx.clip();
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(k, Math.min(0.09, a * 0.3));
      for (let y = -bw; y < H + bw; y += S) {
        const [x1, y1, x2, y2] = dir > 0 ? [lo - 2, y, hi + 2, y - bw] : [lo - 2, y - bw, hi + 2, y];
        const w1 = warpAt(x1, y1), w2 = warpAt(x2, y2);
        ctx.beginPath(); ctx.moveTo(x1 + w1.dx, y1 + w1.dy); ctx.lineTo(x2 + w2.dx, y2 + w2.dy); ctx.stroke();
      }
      ctx.restore();
    };

    function draw(animate: boolean) {
      const k = ink(), a = inkA();
      ctx.clearRect(0, 0, W, H);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const hx = ox + c * BP.PITCH, hy = oy + r * BP.PITCH;
        const sup = suppression(hx, hy, clears);
        if (sup >= 0.98) continue;
        const isMajor = c % BP.MAJOR === 0 && r % BP.MAJOR === 0;
        const al = Math.min(0.85, a * (isMajor ? 1.5 : 1) * (1 - sup));
        if (al <= 0.004) continue;
        const w = animate ? warpAt(hx, hy) : { dx: 0, dy: 0 };
        const x = hx + w.dx, y = hy + w.dy;
        if (isMajor) {
          ctx.strokeStyle = rgba(k, Math.min(1, al * 1.5)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.fillStyle = rgba(k, al); ctx.arc(x, y, 1, 0, 6.283); ctx.fill();
        }
      }
      vline(col.l, Math.min(0.45, a * 1.5), k); vline(col.r, Math.min(0.45, a * 1.5), k);
      hatch(col.l, inner.l, +1, k, a); hatch(col.r, inner.r, -1, k, a);
    }

    const frame = () => {
      if (ptr.on) { if (sx < -9000) { sx = ptr.x; sy = ptr.y; } sx += (ptr.x - sx) * 0.2; sy += (ptr.y - sy) * 0.2; }
      amp += ((ptr.on ? 1 : 0) - amp) * 0.08;
      draw(true);
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true;
    };
    const onLeave = () => { ptr.on = false; };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", measure, { passive: true });
    if (!reduced) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      draw(false);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
```

- [ ] **Step 3: Mount it in the layout after `.page-aura`**

In `src/app/[lang]/layout.tsx`, import and render the field right after the `page-aura` div. Also tag the content column so `measure()` can find it.

```tsx
// near the other imports
import BlueprintField from "@/components/blueprint/blueprint-field";
```
```tsx
// inside <body>, replace the page-aura line region:
<div className="page-aura" aria-hidden="true" />
<BlueprintField />
```
```tsx
// add the column marker to the existing wrapper div:
<div data-bp-column className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
```

> Note: `.page-aura` is `z-index:-1`; the canvas is `z-index:0`; the content wrapper is in normal flow above both. Confirm the grid sits above the aura and behind content in the browser.

- [ ] **Step 4: Verify build + lint**

Run: `npx tsc --noEmit` then `npm run lint`
Expected: no type errors, no lint errors in the new files.

- [ ] **Step 5: Validate live (manual — screenshots mislead for motion)**

Run `npm run dev`, open the homepage in a real browser:
- Resting grid is a faint mono dot field with `+` marks at majors; column edges have faint vertical guides; gutters show a whisper of diagonal hatch.
- Moving the cursor makes the whole scheme flex *subtly* toward it and settle on leave.
- Toggle OS "Reduce motion": grid renders static, no flexing.
- DevTools device-pixel-ratio 2: dots stay crisp and aligned (no 2× mis-scale).

- [ ] **Step 6: Commit**

```bash
git add src/components/blueprint/blueprint-field.tsx src/app/[lang]/layout.tsx
git commit -m "feat(blueprint): render ambient grid substrate with clearings and warp"
```

---

### Task 4: Action-element convergence + tint

**Files:**
- Modify: `src/components/blueprint/blueprint-field.tsx`
- Modify: `src/components/landing/hero.tsx`, `src/components/landing/contact-cta.tsx`, `src/components/landing/pillar-card.tsx`, `src/app/[lang]/page.tsx`

**Interfaces:**
- Consumes: `convergeOffset` (Task 2), `BP.converge`.
- DOM contract added: `[data-bp-attract] data-subject="brand|systems|interface|ai"` marks an action element; the field converges + tints nearby dots toward that subject.

- [ ] **Step 1: Extend the field to read attractors and tint on convergence**

In `blueprint-field.tsx`, add attractor tracking + tint to the existing render. Add helpers and state inside the effect:

```tsx
// add near the other helpers
function hexRgb(h: string): [number, number, number] {
  h = h.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp3(k: number[], c: number[], t: number): number[] {
  t = Math.min(1, Math.max(0, t));
  return [k[0] + (c[0] - k[0]) * t, k[1] + (c[1] - k[1]) * t, k[2] + (c[2] - k[2]) * t];
}
```
```tsx
// add to the effect's mutable state (next to `clears`)
let attract: Array<Rect & { rgb: [number, number, number] }> = [];
let actRgb: [number, number, number] = [0, 113, 227];
let over = 0;
```
```tsx
// in measure(), after building `clears`:
attract = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-attract]")).map((e) => {
  const b = e.getBoundingClientRect();
  return { l: b.left, t: b.top, r: b.right, b: b.bottom, rgb: hexRgb(cssVar("--" + (e.dataset.subject || "brand"))) };
});
```
```tsx
// in frame(), after the amp line, compute hover state:
let hot: typeof attract[number] | null = null;
for (const r of attract) {
  if (sx >= r.l && sx < r.r && sy >= r.t && sy < r.b) hot = r;
}
if (hot) actRgb = hot.rgb;
over += ((hot ? 1 : 0) - over) * 0.12;
```

Then import `convergeOffset` and apply it per-dot inside `draw(animate)` (replace the dot/major branch body):

```tsx
import { DPR_CAP, alignedOriginX, suppression, warpOffset, convergeOffset, type Rect } from "./geometry";
```
```tsx
// inside the dot loop, after computing `sup` and `isMajor`, replace the position/colour calc:
const w = animate ? warpAt(hx, hy) : { dx: 0, dy: 0 };
const cv = animate ? convergeOffset(hx, hy, sx, sy, over, BP.converge) : { dx: 0, dy: 0, infl: 0 };
const x = hx + w.dx + cv.dx, y = hy + w.dy + cv.dy;
let cc = k as number[]; let al = a * (isMajor ? 1.5 : 1) * (1 - sup);
if (cv.infl > 0) {
  const t = Math.min(1, cv.infl * 1.4);
  cc = lerp3(k, actRgb, t);
  al = Math.max(al, (a + (0.8 - a) * t) * (1 - sup));
}
al = Math.min(al, 0.85);
if (al <= 0.004) continue;
if (isMajor) {
  const s = 3 + cv.infl * 1.6;
  ctx.strokeStyle = rgba(cc, Math.min(1, al * 1.5)); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
} else {
  ctx.beginPath(); ctx.fillStyle = rgba(cc, al); ctx.arc(x, y, 1 + cv.infl * 1.5, 0, 6.283); ctx.fill();
}
```

(Remove the now-duplicated old position/colour lines so each dot is drawn once.)

- [ ] **Step 2: Mark the action elements**

In `src/components/landing/hero.tsx`, add `data-bp-attract data-subject="brand"` to both `<Link className={buttonClass(...)}>` CTAs.
In `src/components/landing/contact-cta.tsx`, add the same to its primary button.
In `src/components/landing/pillar-card.tsx`, accept a `subject` prop and set the attributes on the root `<Link>`:

```tsx
export function PillarCard({ label, description, href, subject = "brand" }: {
  label: string; description: string; href: string; subject?: string;
}) {
  return (
    <Link href={href} className={cn("group", cardClass())} data-bp-attract data-subject={subject}>
```
In `src/app/[lang]/page.tsx`, pass subjects to the two pillars: `subject="systems"` and `subject="interface"`.

- [ ] **Step 3: Verify build + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Validate live (manual)**

`npm run dev`: hovering each button / pillar / CTA makes nearby dots converge and tint to that subject's accent (systems-teal / interface-pink / ai-violet / brand-blue), with no bounce; non-action areas stay pure mono; colour never bleeds into empty space.

- [ ] **Step 5: Commit**

```bash
git add src/components/blueprint/blueprint-field.tsx src/components/landing/ src/app/[lang]/page.tsx
git commit -m "feat(blueprint): converge and tint dots on action-element hover"
```

---

### Task 5: Cursor-float raster reveal on project/article rows

**Files:**
- Modify: `src/components/blueprint/blueprint-field.tsx`
- Modify: `src/components/project-card.tsx`, `src/components/post-card.tsx`
- Check: `src/core/domain/project.ts` (and the post type) for an existing cover-image field

**Interfaces:**
- Consumes: `rasterBlock` (Task 2), `BP.reveal`.
- DOM contract added: `[data-bp-reveal] data-reveal-src="<url>"` (+ optional `data-reveal-cap`) on a project/article row. The field shows a single reused floating preview that follows the cursor, scales `0.92→1`, and develops grayscale→colour as it rasterises. Rows without a `data-reveal-src` are inert (graceful — pending workstream B assets).

- [ ] **Step 1: Add the floating preview element + reveal loop**

In `blueprint-field.tsx`, add a second canvas ref for the floating preview and render it only on fine pointers.

```tsx
// component body: add a ref
const floatRef = useRef<HTMLCanvasElement>(null);
```
```tsx
// inside the effect, near the top:
const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const fcanvas = floatRef.current;
const fctx = fcanvas?.getContext("2d") ?? null;
const off = document.createElement("canvas");
let reveal: { img: HTMLImageElement; cap: string } | null = null;
let fprog = 0, fx = -9999, fy = -9999;

const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-reveal]"));
const imgCache = new Map<string, HTMLImageElement>();
const rowHandlers: Array<[HTMLElement, () => void, () => void]> = [];
if (!reduced && fineHover && fcanvas && fctx) {
  for (const row of rows) {
    const src = row.dataset.revealSrc; if (!src) continue;
    let img = imgCache.get(src);
    if (!img) { img = new Image(); img.decoding = "async"; img.src = src; imgCache.set(src, img); }
    const cap = row.dataset.revealCap ?? "";
    const enter = () => { reveal = { img: img!, cap }; };
    const leave = () => { if (reveal?.img === img) reveal = null; };
    row.addEventListener("pointerenter", enter);
    row.addEventListener("pointerleave", leave);
    rowHandlers.push([row, enter, leave]);
  }
}
```
```tsx
// drawCover + raster render helper (place beside the other helpers in the effect)
const drawCover = (octx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
  const ir = img.width / img.height, rr = w / h; let sw, sh, ix, iy;
  if (ir > rr) { sh = img.height; sw = sh * rr; ix = (img.width - sw) / 2; iy = 0; }
  else { sw = img.width; sh = sw / rr; ix = 0; iy = (img.height - sh) / 2; }
  octx.drawImage(img, ix, iy, sw, sh, 0, 0, w, h);
};
```
```tsx
// at the END of frame(), after draw(true), drive the floating preview:
if (!reduced && fineHover && fcanvas && fctx) {
  const active = !!reveal && reveal.img.complete && reveal.img.naturalWidth > 0;
  fprog += ((active ? 1 : 0) - fprog) * 0.12;
  if (fx < -9000) { fx = ptr.x; fy = ptr.y; }
  fx += (ptr.x - fx) * BP.reveal.follow; fy += (ptr.y - fy) * BP.reveal.follow;
  const sc = BP.reveal.scaleMin + (1 - BP.reveal.scaleMin) * fprog;
  fcanvas.style.transform = `translate(${fx + BP.reveal.offset.x}px,${fy + BP.reveal.offset.y}px) scale(${sc})`;
  fcanvas.style.filter = `grayscale(${(1 - fprog).toFixed(2)})`;
  fcanvas.style.opacity = active || fprog > 0.02 ? "1" : "0";
  if (reveal) {
    const w = fcanvas.clientWidth, h = fcanvas.clientHeight;
    if (w >= 2) {
      if (fcanvas.width !== Math.round(w * dpr)) { fcanvas.width = Math.round(w * dpr); fcanvas.height = Math.round(h * dpr); }
      const block = rasterBlock(fprog, BP.reveal.coarse);
      const sw = Math.max(1, Math.round(w / block)), sh = Math.max(1, Math.round(h / block));
      off.width = sw; off.height = sh;
      const octx = off.getContext("2d")!; octx.imageSmoothingEnabled = true; drawCover(octx, reveal.img, sw, sh);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.imageSmoothingEnabled = false;
      fctx.clearRect(0, 0, w, h); fctx.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);
    }
  }
}
```
```tsx
// import rasterBlock
import { DPR_CAP, alignedOriginX, suppression, warpOffset, convergeOffset, rasterBlock, type Rect } from "./geometry";
```
```tsx
// in the cleanup return, also detach row handlers:
for (const [row, enter, leave] of rowHandlers) {
  row.removeEventListener("pointerenter", enter); row.removeEventListener("pointerleave", leave);
}
```

Add the floating canvas to the returned JSX (fixed, sized, above the grid, below the panel/companion):

```tsx
return (
  <>
    <canvas ref={canvasRef} aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }} />
    <canvas ref={floatRef} aria-hidden="true"
      style={{ position: "fixed", left: 0, top: 0, width: 320, height: 200, borderRadius: 10,
        zIndex: 6, pointerEvents: "none", opacity: 0, transition: "opacity .2s ease",
        boxShadow: "0 14px 34px rgba(16,32,64,0.18)" }} />
  </>
);
```

- [ ] **Step 2: Mark the rows + provide a source**

Check `src/core/domain/project.ts` and the post type for a cover-image field.
- If a cover field exists, set `data-bp-reveal data-reveal-src={project.cover} data-reveal-cap={…}` on the `<article>` in `project-card.tsx` (it already has `data-glow-row`) and the post `<article>` in `post-card.tsx`.
- If **no** image field exists yet, add `data-bp-reveal` with **no** `data-reveal-src` (the reveal is inert) and leave a `// TODO(workstream-B): supply data-reveal-src cover asset` — do not invent assets. Coordinate asset sizing (~760–1000px source) with workstream B.

- [ ] **Step 3: Verify build + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Validate live (manual)**

With at least one row carrying a `data-reveal-src`: hovering it shows a single preview that floats to the cursor (damped, ~1–2 frame trail), scales in, and develops grayscale→colour/coarse→sharp; it never sits under the cursor; the grid stays calm behind it. On a coarse pointer (DevTools touch emulation) or with Reduce-motion on, no float appears. Rows without a source do nothing on hover.

- [ ] **Step 5: Commit**

```bash
git add src/components/blueprint/blueprint-field.tsx src/components/project-card.tsx src/components/post-card.tsx
git commit -m "feat(blueprint): add cursor-float raster reveal for project and article rows"
```

---

### Task 6: Occlusion wiring, glow-group reconciliation, a11y/perf pass

**Files:**
- Modify: `src/components/landing/hero.tsx` (occlude the headline block), section labels on `src/app/[lang]/page.tsx`, `src/components/footer.tsx`
- Modify: `src/app/[lang]/page.tsx` (the `GlowGroup` usages) and/or `src/components/glow-group.tsx`
- Modify: `src/components/blueprint/blueprint-field.tsx` (final perf guard)

**Interfaces:**
- Consumes: the `[data-bp-clear]` contract (Task 3).
- Produces: no new exports; finalises behaviour.

- [ ] **Step 1: Add clearings to text blocks**

Add `data-bp-clear` to the elements whose legibility the grid must not disturb:
- Hero headline wrapper in `hero.tsx`: `data-bp-clear` (default text margin).
- The section label `<h2 className="text-xs ...">` headings in `page.tsx`: `data-bp-clear`.
- Footer container in `footer.tsx`: `data-bp-clear`.

- [ ] **Step 2: Reconcile glow-group**

The field now provides the cursor feedback. In `src/app/[lang]/page.tsx`, the work/writing lists are wrapped in `<GlowGroup>` whose per-card spotlight is superseded by the reveal. Choose the minimal change:
- Preferred: stop the visible spotlight on those lists — remove the `<GlowGroup>` wrapper from the work/writing sections in `page.tsx` (rows now reveal instead). Leave `glow-group.tsx` in place if used elsewhere; if it has no remaining consumers, delete `glow-group.tsx` and its tests/stories.
Run `grep -rn "GlowGroup\|glow-group\|data-glow-row\|card-glow" src` first and act on the actual usages — do not remove anything still referenced.

- [ ] **Step 3: Final perf guard in the field**

Confirm `will-change` is not left on permanently and the rAF loop is the only ongoing cost. Add `canvas.style.willChange = "transform"` to the float canvas only while `fprog > 0.02`, clearing it otherwise (inside the reveal block):

```tsx
fcanvas.style.willChange = fprog > 0.02 ? "transform" : "auto";
```

- [ ] **Step 4: Verify build, lint, and full test run**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean; all tests pass (including `geometry.test.ts`).

- [ ] **Step 5: Validate live (manual checklist)**

`npm run dev`, exercise the whole homepage:
- Grid is calm and discernible; text blocks (hero, section labels, footer) sit in clean cleared halos.
- Buttons read clearly above the grid; convergence tint only on action elements.
- Project/article rows reveal the floating raster preview; no double spotlight remains.
- Companion orb coexists (eyes track cursor) over the grid.
- Reduce-motion: fully static grid, instant/no reveal. Touch emulation: static grid, no float.
- Subjects: visit pages with each `data-page-subject` and confirm tints match (teal/pink/violet/blue), light + dark.
- Profile a few seconds at a large viewport: one rAF, no long frames.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(blueprint): wire clearings, retire glow-group spotlight, finalize a11y/perf"
```

---

## Self-Review

**Spec coverage:** §3.2 substrate → Tasks 1,3; §3.3 ambient warp + action convergence → Tasks 3,4; §3.4 reveal → Task 5; §3.5 colour policy → Tasks 1,4 (mono tokens + tint-only-on-attract); §4 architecture/tokens/data-contract → Tasks 1–5; §4 glow-group reconciliation → Task 6; §5 a11y/perf → Tasks 3 (reduced-motion), 5 (hover/pointer gate), 6 (perf guard, checklist); §6 boundaries → Task 5 (inert without src; B owns rasterisation) + module/tokens in Tasks 1–2; §7 testing → Task 2 unit tests + per-task live validation. No gaps.

**Placeholder scan:** the only deliberate TODO is `TODO(workstream-B)` in Task 5 Step 2, which is a real cross-workstream contract boundary (assets owned by B), not a hidden implementation gap — the reveal degrades gracefully without it.

**Type consistency:** `Rect`, `alignedOriginX`, `distToRect`, `suppression`, `warpOffset`, `convergeOffset`, `rasterBlock`, `DPR_CAP`, and `BP.*` names are defined in Tasks 1–2 and used verbatim in Tasks 3–6. The field's `[data-bp-column|clear|attract|reveal]` / `data-subject|reveal-src|reveal-cap` attributes are introduced and consumed consistently.
