# Card hover micro-interactions — design

**Date:** 2026-06-21
**Branch:** `card-hover-microinteractions`
**Status:** Approved design, ready for implementation plan
**Roadmap item:** #2 of the portfolio augmentation roadmap (pairs with #1 case-study template, PR #25)

## 1. Goal

Give the project- and post-card lists a "crafted," alive hover layer that reuses
the existing per-subject `--accent` color grammar — without turning the lists into
boxed cards. The cards stay **divider rows** (`border-b`, no panel surface); the
interaction adds light, not chrome.

## 2. The interaction (locked via visual brainstorm)

A **cursor-driven light** that treats each row as a lit surface:

1. **Interior glow** — a soft radial centered on the cursor, behind the row's
   content. Continuous across the whole list: every row draws its glow from the
   **same un-clamped cursor point**, so the field is geometrically seam-aligned —
   only the *color* changes at a divider, never the position.
2. **Per-card color, gray elsewhere** — the row the cursor is in ("hot") glows in
   **its own subject color** (`resolveSubject` → `data-subject` → `--accent`). Every
   other row that catches the spill renders the glow in a **neutral gray**. The
   cursor "brings a card to life" as it enters.
3. **Top + bottom edge light** — the same radial light source, masked to the row's
   **top and bottom 2px lines only** (left/right stay clean — suits the list).
   Brightest directly under the cursor. Because a row's bottom line is the next
   row's top line, the light reads as bleeding along the shared divider.
4. **Text cues on the hot row only** — title shifts to `--accent` (already present),
   tech/tag pills and the category badge tint to `--accent`.

Restraint matches the site's existing motion family (page aura, AI `accent-flow`,
`fade-in-up`, view-transition morphs): no lift, no box, no scale, no autoplay — the
motion is purely pointer-driven.

### Rationale (from research + brainstorm)
- NN/G & Material: text-only, scannable items with few attributes belong in a
  **list**, not boxed cards ("rounded edges and shadows only clutter"). Drop-shadow
  elevation falsely signals "discrete object." So: no boxing, light instead.
- Motion a11y consensus: honor `prefers-reduced-motion`, pair `:hover` with
  `:focus-within` for keyboard parity, keep transitions ~120–220ms, prefer
  compositor-friendly properties.
- The per-subject color is the one thing this portfolio has that references can't
  copy — so the hover **uses the subject palette as the light source**.

## 3. Architecture

Dependencies point inward; this is all presentation-layer. `resolveSubject`
(`src/core/domain/subject.ts`) is a fixed input, already tested.

### 3.1 `GlowGroup` — new client component
`src/components/glow-group.tsx` (`"use client"`). Wraps a card list and owns the
pointer interaction so the cards themselves carry no event logic.

Responsibilities:
- Render `<div data-glow-group>{children}</div>` (children may be server-rendered
  cards — a client wrapper around server children is fine).
- On `pointermove` (guarded to `event.pointerType === "mouse"`): add `data-on` to
  the root; for each `[data-glow-row]` descendant set `--mx`/`--my` to the cursor
  position in that row's local space (**un-clamped** — `clientX - rect.left`,
  `clientY - rect.top`), and toggle `data-hot` on the row whose vertical band
  contains the cursor.
- On `pointerleave`: remove `data-on` and all `data-hot`.

Performance:
- Cache each row's `getBoundingClientRect()` in a ref; rebuild the cache on
  `scroll` (passive) and `resize`. Avoid calling `getBoundingClientRect` per row
  per move.
- Coalesce DOM writes into a single `requestAnimationFrame` per move (store latest
  client coords, flush once per frame).
- Remove all listeners and cancel any pending frame on unmount.

Touch/keyboard:
- Touch: the `pointerType` guard means no sticky hover state. Tapping navigates
  normally (the title link).
- Keyboard: handled by CSS `:focus-within` (see 3.3) — no JS needed.

### 3.2 Card changes (minimal)
- `src/components/project-card.tsx` (stays a **server** component): on the
  `<article>` add `className="… card-glow"`, `data-glow-row`,
  `data-subject={resolveSubject({ category: project.category })}`, and insert
  `<span className="card-edge-light" aria-hidden />` as the first child.
- `src/components/post-card.tsx` (already `"use client"`): same additions with
  `data-subject={resolveSubject({ tags: post.tags })}`.
- No padding/margin/layout changes — the card stays `border-b py-6`; the divider
  remains the bottom edge the light rides on. Only `position:relative` +
  `isolation:isolate` are added (via the `.card-glow` class) so the negative
  z-index layers stay scoped to the card.

### 3.3 CSS (`src/app/globals.css`)
Reuse the accent grammar with `color-mix` (already used in this file) — **no new
per-subject tokens**.

New root tokens (with `.dark` variants where noted):
- `--glow-r: 240px;` — shared radius for interior glow *and* edge light (so the lit
  edge coincides exactly with where the interior glow meets the border).
- `--card-edge: 2px;` — thickness of the lit top/bottom line.
- `--glow-neutral` — the gray spill color; light + dark values
  (e.g. `rgba(80,86,100,…)` / `rgba(225,230,242,…)`), or
  `color-mix(in srgb, var(--muted) …%, transparent)`.

Layers (all behind content via negative z-index inside the card's stacking context):
- `.card-glow::before` — interior radial at `var(--mx) var(--my)`, radius
  `--glow-r`. Default color = `--glow-neutral`; under `[data-hot]` / `:focus-within`
  the color becomes `color-mix(in srgb, var(--accent) 20%, transparent)`. Opacity 0
  at rest → 1 while `[data-glow-group][data-on]` (and always under `:focus-within`).
- `.card-edge-light` — the same radial (subject color, ~0.9 strength via
  `color-mix`), `background-origin: border-box`, masked to top + bottom lines:
  ```
  mask: linear-gradient(#000,#000) top    / 100% var(--card-edge) no-repeat,
        linear-gradient(#000,#000) bottom / 100% var(--card-edge) no-repeat;
  ```
  Shown on `:hover, :focus-within`.
- Text cues: `:hover/:focus-within` → title `--accent` (existing), pills + category
  badge `border/color: var(--accent)`.
- `:focus-within` fallback: no cursor, so `--mx/--my` default to `50%`; the focused
  row shows a static centered subject glow + edge light + accent ring on the link
  (mirrors the existing `:focus-visible` outline).

Reduced motion:
```
@media (prefers-reduced-motion: reduce) {
  .card-glow::before, .card-edge-light, /* + tinted text/pills */ { transition: none !important; }
}
```
There is no autoplaying animation (the effect is pointer-driven), so reduced-motion
only removes the fade transitions; hover/focus still reveal the glow instantly.

### 3.4 Application sites
Wrap each existing card-list `.map` in `<GlowGroup>`:
- `src/app/[lang]/work/page.tsx` — the `data-narrate="projects"` list.
- `src/components/blog-explorer.tsx` — the filtered post list.
- `src/app/[lang]/blog/tags/[tag]/page.tsx` — the tag-filtered post list.
- `src/app/[lang]/page.tsx` — the landing featured project + post lists.

## 4. Testing

- `src/components/glow-group.test.tsx` (jsdom):
  - `pointermove` (mouse) sets `--mx`/`--my` on each `[data-glow-row]` and adds
    `data-hot` to the row under the cursor + `data-on` to the group.
  - non-mouse `pointerType` is ignored (no state set).
  - `pointerleave` clears `data-hot` and `data-on`.
  - rect cache rebuilds on `resize`.
  - listeners removed / frame cancelled on unmount (no leak).
- `project-card.test.tsx` / `post-card.test.tsx`: assert resolved `data-subject`,
  presence of `data-glow-row`, and the `aria-hidden` `.card-edge-light` span.
- **Explicit limitation:** the visual glow/edge rendering is pure CSS driven by CSS
  variables; jsdom cannot assert painted output. Tests cover the DOM contract
  (vars, attributes, cleanup), not the visual result. Visual confirmation is manual
  / Storybook.
- Stories (`*.stories.tsx`): wrap card stories in a `GlowGroup` so the hover is
  demonstrable; keep existing stories green.

## 5. Verification gate

Local, before PR (CI runs tsc over test files too — `npm run build` alone misses
test-literal type errors):
```
npx tsc --noEmit && npm test && npm run lint && npm run build
```

## 6. Out of scope (YAGNI)

- No boxed-card redesign, lift, scale, or shadow.
- No autoplaying/breathing animation, no sheen, no border-orbit (explored and
  rejected during brainstorm).
- No new design tokens beyond the three glow knobs; subject colors come from the
  existing `data-subject` blocks via `color-mix`.
- `both`-category projects already resolve to `brand` (blue) via the existing
  `CATEGORY_MAP`; no blend work here.

## 7. Calibration knobs (final tuning during implementation)

All single values, centralized in `:root`: `--glow-r` (spread), `--card-edge`
(line thickness), the interior subject mix % (~20), the edge subject mix % (~90),
and `--glow-neutral` alpha. Tune against the locked mockup
(`.superpowers/brainstorm/**/pattern2-edges.html`).
