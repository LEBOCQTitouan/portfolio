# Companion Orb — Design Spec (V0)

**Status:** Approved design, ready for implementation planning
**Date:** 2026-05-31
**Scope:** V0 — deliberately minimal. Ship it, live with it on the real site, decide later if it earns more.

## 1. Concept

A persistent, translucent **companion orb** that represents the author ("me") and guides visitors through the **non-blog** pages. As the visitor scrolls, the orb **narrates each section in the author's voice** via a short text speech bubble, **changes color** to reflect one of three moods, and **travels across the page** to park beside whatever it is narrating — appearing to "look at" and "point to" the content.

It is **on by default**, easily **muted/dismissed** (remembered across pages and visits), and **respects `prefers-reduced-motion`**.

### V0 includes exactly three things
1. **Scroll-driven text narration** — a per-section line, streamed into a speech bubble.
2. **Mood color change** — each line carries a mood (calm / warm / focused) that sets the orb's color, transitioning smoothly.
3. **Section-anchored movement** — the orb glides to a declared anchor next to the active section.

### Explicitly NOT in V0 (removed by decision)
Soundwaves inside the orb, surface warping / refraction / "liquid glass" displacement, breathing/pulsing, WebGL, audio/voice. These were prototyped and cut. They remain clean future seams but are out of scope.

## 2. Visual design

- **Orb:** a translucent circular gradient (Direction "C" iridescent, see colors below), soft outer glow, subtle inner highlight and 1px light rim. **Static** — no intrinsic animation. The only motion is (a) gliding between anchors and (b) smooth color transition between moods.
- **Size:** ~92px on desktop (tunable during build).
- **Theme-aware:** colors are defined so they read well on both light (`--background: #fbfbfd`) and dark (`#0f1115`) themes; the orb uses translucency + glow rather than theme-swapped fills.
- **Speech bubble:** small rounded card with a slight blur backdrop, positioned on the side of the orb that faces the narrated content (flips left/right per anchor). Text is streamed in with a light typewriter effect (disabled under reduced-motion — full text shown immediately).

### Mood → color (RGBA, translucent)
| Mood | Use | Mid color | Edge color | Glow |
|------|-----|-----------|------------|------|
| **calm** (resting) | neutral / calm lines | `rgba(41,151,255,.55)` | `rgba(111,125,255,.32)` | `rgba(74,157,255,.45)` |
| **warm** | welcoming / personal lines | `rgba(255,143,166,.55)` | `rgba(255,122,122,.32)` | `rgba(255,154,176,.45)` |
| **focused** | serious / technical lines | `rgba(139,120,255,.55)` | `rgba(95,118,255,.32)` | `rgba(151,133,255,.45)` |

Orb fill: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.34), <mid> 56%, <edge>)`; transitions are `background .7s, box-shadow .7s`. Final values are tunable in build.

## 3. Architecture & components

New, isolated module. Each unit has one responsibility and a clear interface.

```
src/components/companion/
  companion.tsx        # client controller — mounts once in layout, owns all state
  orb.tsx              # presentational orb (mood, muted) → visual only
  speech-bubble.tsx    # streams/﻿displays the current line, handles bubble side
  companion.css        # or co-located styles (match project's CSS-var + Tailwind conventions)
src/lib/narration/
  script.ts            # the central narration map (the author's copy)
  resolver.ts          # getNarration(route) → ordered lines (single source the orb consumes)
  types.ts             # NarrationLine, NarrationMap, Mood, Anchor
```

- **`Companion`** (`"use client"`): mounted in `src/app/layout.tsx` inside `ThemeProvider`, as a sibling to the main content container (so it can be `position: fixed` and unconstrained by `max-w-3xl`). Owns: active section, current line, mood, position, mute/dismiss state, reduced-motion flag. **No-ops (renders nothing) on `/blog*` routes.**
- **`Orb`**: pure presentational. Props: `{ mood: Mood, muted: boolean }`. Knows nothing about scroll or narration.
- **`SpeechBubble`**: props `{ text: string, side: 'left' | 'right', visible: boolean }`. Owns the typewriter reveal (respecting reduced-motion).
- **`resolver.getNarration(route)`**: the single interface the controller uses. V0 reads from `script.ts`. (Future: project pages could resolve from MDX frontmatter inside this function without touching callers.)

**Boundaries check:** `Orb` doesn't know about scroll; `Companion` doesn't know orb internals; the resolver doesn't know about rendering. Any of the three can change without breaking the others.

## 4. Data flow (scroll → narration → movement)

1. Page sections are marked `data-narrate="<sectionId>"`.
2. `Companion` runs **one `IntersectionObserver`** (root = viewport) over all `[data-narrate]` elements, tracking each section's intersection ratio; the **most-visible** section is "active".
3. On active-section change, the controller calls `getNarration(route)`, finds the matching line, and updates: **mood** (→ orb color), **anchor** (→ orb glides to `{x, y}` with bubble on `side`), and **text** (→ streamed into the bubble).
4. Scrolling back re-activates a section's line (debounced so it isn't chattery).
5. If a route has no narration entry, the orb stays in its calm resting state, silent.

## 5. Content authoring (the author's voice)

One central map; pages only add `data-narrate` ids.

```ts
// src/lib/narration/types.ts
export type Mood = "calm" | "warm" | "focused";
export type Anchor = { x: number; y: number; side: "left" | "right" }; // x,y in viewport %
export type NarrationLine = { id: string; mood: Mood; text: string; anchor: Anchor };
export type NarrationMap = Record<string, NarrationLine[]>;

// src/lib/narration/script.ts
export const script: NarrationMap = {
  "/": [
    { id: "hero",    mood: "warm",    text: "Hey — I'm Titouan. Let me show you around.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "pillars", mood: "focused", text: "I live where systems thinking meets interface craft.", anchor: { x: 30, y: 50, side: "right" } },
    { id: "work",    mood: "calm",    text: "A few things I'm proud of.", anchor: { x: 74, y: 46, side: "left" } },
  ],
  "/about": [ /* … */ ],
  "/uses":  [ /* … */ ],
  "/now":   [ /* … */ ],
  "/work":  [ /* … */ ],
  // "/work/[slug]" resolved by slug inside resolver.ts
};
```

The author writes/edits all copy here. The implementation will **scaffold each in-scope page with `data-narrate` ids and seed placeholder lines** for the author to rewrite.

## 6. Behavior, control & accessibility

- **On by default.** A subtle, labeled **mute/dismiss control** (a real `<button>`, keyboard-focusable) hides the bubble and shrinks the orb to a quiet corner. State persists in `localStorage` and applies across pages and future visits.
- **Decorative:** the orb + bubble are `aria-hidden` (the narration restates already-visible page content), so the auto-changing text does not spam screen readers. The mute control is the one real, labelled interactive element.
- **`prefers-reduced-motion`:** no gliding (instant reposition or stay docked), no typewriter (full text shown), minimal/instant color change. Narration still functions.
- **No scroll-jacking, no focus traps.** The orb never blocks interaction with the page.
- **Mobile (< ~640px):** the orb does **not** travel (movement risks occluding content and feeling janky on small screens); it docks in a fixed corner, still changing mood/color and narrating. Movement is a desktop affordance in V0.

## 7. Performance & integration

- Client-only; pure CSS, no animation libraries or heavy deps — the orb is a styled element (a gradient `div`), positioned and transitioned with CSS. No WebGL. **Negligible impact on the client bundle and zero on the Cloudflare worker.**
- **In scope:** `/`, `/about`, `/uses`, `/now`, `/work`, `/work/[slug]`.
- **Excluded:** all `/blog*` (the orb renders nothing there).
- Mounting in the shared layout + route-gating keeps it a single instance with no per-page wiring beyond `data-narrate` ids.

## 8. Testing

- **Unit (Vitest):**
  - `resolver.getNarration` — route and `/work/[slug]` slug resolution; unknown route → empty/null.
  - mood → color mapping is exhaustive over `Mood`.
  - active-section selection (given a set of intersection ratios, picks the max).
  - mute persistence (reads/writes `localStorage`; default = on).
- **Component (Testing Library + jsdom):**
  - given an active section, bubble shows the right text and orb has the right mood class.
  - reduced-motion (mock `matchMedia`) → no typewriter, no glide transition class.
  - muted state → bubble hidden, orb in corner; persisted.
  - renders nothing on `/blog/...`.
  - `IntersectionObserver` and `matchMedia` are mocked in the test setup.

## 9. Out of scope (YAGNI) — with future seams

- **Audio/voice** — text-only for now. (Seam: bubble text is already line-structured.)
- **More than 3 moods** — `Mood` is a closed union; extend later.
- **Soundwaves / refraction / WebGL / breathing** — removed. (Seam: `Orb` is a swappable presentational component; a richer renderer can replace it without touching the controller.)
- **Element-precise pointing** — V0 anchors are viewport-% positions per section. (Seam: `Anchor` could later resolve to a target element's box.)
- **Interactive concierge / chat, per-visitor personalization** — not now.

## 10. Open tuning items (resolved during build, not blockers)

Glide speed/easing, exact orb size, per-section anchors and bubble sides, typewriter speed, mobile breakpoint, and the final narration copy. All are values, not architecture.
