# Blueprint dot-grid + cursor field — design

- **Date:** 2026-06-22
- **Status:** Approved (brainstorm complete; ready for implementation plan)
- **Workstream:** A — *foundation* of the rasterization initiative. Owns the shared
  raster-grid module + tokens that workstream B (global rasterization system) and
  workstream C (mascot rethink) import. See `[[raster-initiative-decomposition]]`.
- **Supersedes:** the never-committed `2026-06-22-raster-field-coherence` spec/plan
  drafts referenced in earlier notes (no such files exist in this branch).

## 1. Context

The portfolio already ships two ambient systems behind content:

- `.page-aura` — a fixed `z-index:-1` subject-coloured radial glow (recoloured per page
  via `:has([data-page-subject])`, exposing `--subject-accent` / `--subject-accent-soft`
  on `<body>`). See `src/app/globals.css`.
- `glow-group` (`src/components/glow-group.tsx`) — a per-card cursor spotlight that sets
  `--mx/--my` + `data-hot` on `[data-glow-row]` cards (wraps the work/writing lists).

This workstream adds a **technical-blueprint dotted grid** as a site-wide ambient layer,
plus a restrained cursor interaction. The look was converged through live prototyping
(prototypes in `.superpowers/brainstorm/.../content/`, gitignored). Two external research
sweeps informed it: the blueprint design language (Vercel Geist grid, dimension/registration
marks, "geometry + label + motion, never texture") and interaction mechanics (2D-canvas
viability, damped lerp, clip/mask reveals, cursor-follow tuning).

## 2. Goals / non-goals

**Goals**
- A calm, senior, *discernible-but-subtle* blueprint grid that reads as the schematic the
  site is drawn on — its structure aligns to the design system's spacing (768px column,
  24px gutters land on grid lines).
- A restrained cursor interaction: the whole scheme warps subtly toward the cursor (mono);
  **colour appears only as interaction feedback on action elements**.
- A distinctive but quiet hover reveal for project/article entries (image hidden at rest,
  floats to the cursor and develops grayscale→colour while rasterising).
- Full `prefers-reduced-motion` and touch fallbacks; benchmarked perf.
- A reusable module + tokens for workstreams B and C.

**Non-goals**
- The actual rasterisation pipeline for project/article imagery — workstream **B** owns it.
  This spec defines the reveal *mechanic* and the integration *contract*; it ships a basic
  canvas raster-resolve as the default treatment B can later replace.
- Redesigning the companion orb — workstream **C**. The companion is unchanged here and
  confirmed to coexist with the grid as-is.

## 3. The model

### 3.1 Layering (bottom → top, all behind content)
1. `.page-aura` — existing, kept (broad subject ambient light).
2. **Blueprint canvas** — new; fixed full-bleed, between the aura and content,
   `pointer-events:none`, `aria-hidden`.
3. Content (the 768px column sits above the canvas).
4. Companion orb — existing, unchanged.
5. **Cursor-float reveal** — new; a single floating preview element for project/article rows.

### 3.2 Substrate (calm, mono)
- **Dot grid**, pitch **24px** (design-system base unit). `+` registration marks at major
  intersections every **8 cells (192px)** — so the centred 768px column's edges land on
  major lines.
- **Mono ink only.** Starting tokens (to fine-tune): light `rgb(18,38,66)` @ ~`0.12`;
  dark `rgb(140,175,215)` @ ~`0.15`. No colour in the resting grid.
- **Structure lives in the gutters.** Column-edge guide lines + a *whisper* of mirrored
  diagonal section-hatch confined to the 24px gutters. No lines cross the content column.
- **Clearings (occlusion).** The dot field **fades out around every text block and control**
  (per-element keep-out margin), so the grid frames content instead of running under it.
- **Renderer: 2D canvas** (not WebGL — a few-thousand-point subtle grid sits well within
  canvas2D; WebGL's cost/maintenance isn't justified). Perf disciplines: prerendered dot
  sprite via `drawImage` (not per-dot `arc`), proximity-cull physics to the cursor
  neighbourhood, batch by colour, **DPR capped at 2**, and the canvas **must** set CSS
  `width/height:100%` in addition to `inset:0` (retina mis-scale gotcha).

### 3.3 Interaction (colour only on action elements)
- **Ambient warp** — very subtle, **mono**, the whole scheme (dots, `+` marks, gutter lines
  & hatch) gently flexes toward the cursor and settles smoothly on leave. Starting values:
  max displacement ~`2.6px`, reach ~`230px`, pointer-smoothing lerp `0.2`, amplitude lerp `0.08`.
- **Action elements** — buttons, the "What I do" pillars, and the contact CTA are attractors.
  On approach/hover, nearby dots converge gently toward the cursor and **tint to the
  element's subject accent** (no bounce). Starting values: radius ~`108px`, pull factor
  ~`0.24`, tint via lerp toward `--subject-accent`. **This is the only place colour appears.**
- Buttons additionally read as the **top layer**: real elevation (shadow), a generous
  keep-out clearing, and an accent ring on hover.

### 3.4 Project/article rows — cursor-float reveal
Rows are **excluded from blueprint attractors** (reserved for the reveal, to avoid two hover
effects on one element).

- **Image hidden at rest.** Rows are catalogue entries (index `01`, title, meta, classifier
  `PROJ`/`NOTE`).
- On hover (or `:focus-within`), a **single reused preview** floats to the cursor:
  - damped follow **lerp `0.11`** (visibly trails ~1–2 frames, settles fast),
  - **scale `0.92 → 1`**, **no rotation / no skew**,
  - offset up-right of the pointer (~`+26, -96`) so the cursor never covers it,
  - **develops grayscale → colour** (`grayscale(1-prog)`) **as it rasterises coarse→sharp**
    (block size ~`18 → 1`, reveal progress lerp ~`0.12`),
  - optional mono `FIG.0x` caption.
- The grayscale-at-rest is deliberate: full-colour previews fight the mono grid; colour
  resolving in is the "developing print" moment.

### 3.5 Colour policy
The grid is mono. Subject accent enters **only** through interaction (the convergence tint on
action elements, and the reveal's colour resolve), reading the existing `--subject-accent`
(and per-subject `--systems/--interface/--ai/--brand`) tokens so it stays in sync with the
active page subject and theme.

## 4. Architecture

- **`BlueprintField`** — a client component under a new `src/components/blueprint/` module,
  mounted **once** in `src/app/[lang]/layout.tsx` as a sibling immediately after the
  `.page-aura` div. Owns the canvas, the single rAF loop, pointer tracking, and the
  floating reveal preview.
- **DOM contract (data attributes), mirroring the existing `glow-group` pattern:**
  - `[data-bp-attract]` + `data-subject="…"` — an action element (button/pillar/CTA) that
    triggers convergence + tint.
  - `[data-bp-clear="<px>"]` — an element whose footprint clears the grid (keep-out margin);
    text blocks use a default margin.
  - `[data-bp-reveal]` with `data-reveal-src` (+ optional `data-reveal-cap`) — a
    project/article row that drives the cursor-float reveal.
  The field measures rects on mount, on `scroll`, and on `resize` (a `MutationObserver`
  may be added if list contents change), exactly as `glow-group` does today.
- **Tokens (shared, the part B and C import):**
  - CSS custom properties in `globals.css` for grid ink + alpha (light/dark) so theming
    flows through the existing mechanism.
  - A TS module (e.g. `src/design/blueprint.ts`) exporting the geometry + motion constants
    (pitch, major step, warp/convergence/reveal parameters) as the single source of truth.
- **Reconcile `glow-group`.** The per-card visible spotlight is superseded by this field's
  interaction model. Plan options (decide in the implementation plan): retire the visible
  spotlight on the work/writing lists (rows now use the reveal), and either fold any still
  needed pointer plumbing into `BlueprintField` or keep `glow-group` only where it's still
  used. No drive-by removal beyond what this feature requires.

## 5. Accessibility & performance

- **`prefers-reduced-motion: reduce`** → render the grid **once, static** (no rAF loop, no
  warp, no convergence); reveal shows an **instant static thumb** (no follow, no resolve).
  Subscribe to the media query's `change` event (no reload needed).
- **Touch / `pointer: coarse`** → static grid; project/article rows show a **static thumb**
  (no cursor-float). Gate the float behind `@media (hover:hover) and (pointer:fine)` /
  `matchMedia`.
- The canvas is `aria-hidden` and non-focusable; list links remain fully usable without it.
- **Benchmark** on real hardware (don't trust cheap-perf claims): single composited rAF,
  transform/opacity/clip only, `will-change` only while active, single reused preview image
  (`decoding="async"`, lazy), proximity-cull. Validate fluid motion **live in a driven
  browser** — automation screenshots mislead.

## 6. Integration boundaries

- **Workstream B (rasterisation):** owns the project/article image rasterisation. This spec
  defines the reveal mechanic + contract (`[data-bp-reveal]`, rows excluded from blueprint
  hover). A ships a basic canvas raster-resolve as the default; B swaps in the richer
  treatment behind the same contract.
- **Workstream C (mascot):** imports the shared grid module/tokens. Companion unchanged here.
- **`.page-aura`:** kept; the grid is additive and reads the same `--subject-accent`.
- **`glow-group`:** visible spotlight superseded (see §4).

## 7. Testing

- Unit: geometry helpers (grid origin/alignment so 768 column + 24 gutters land on lines;
  `distRect`/suppression; warp/convergence math) are pure and testable.
- Behaviour: reduced-motion renders static (no rAF scheduled); coarse-pointer disables the
  float; `data-bp-*` contract wiring.
- Manual/live: drive a real browser to validate the warp, convergence, and reveal feel; check
  light/dark and each subject accent; perf profile at large viewport.

## 8. Risks / open questions (resolve in the plan)

- Exact `glow-group` disposition (retire vs fold in) — confirm against current usages.
- Final tuning of the starting constants in §3 (subtle-vs-visible balance) — tune live.
- Reveal source assets: rows need a `data-reveal-src`; coordinate with B on asset sizing
  (~760–1000px source shown ~320px) and lazy-loading.
- Whether the floating preview lives in `BlueprintField` or a small dedicated component.

## 9. Decisions captured (for the record)

Renderer = 2D canvas. Vocabulary = dot field + `+` majors, structure in gutters, mono ink.
Coherence = grid aligned to layout + clearings (figure-ground). Presence tuned to "Present".
Colour = action-elements-only. Buttons = elevated above the grid. Gutter = subtle section
hatch. Reveal = cursor-float, grayscale→colour raster, hidden at rest. Companion = coexists
unchanged. These were each validated live during the brainstorm.

## 10. Blueprint frame — peripheral annotations (added 2026-06-22)

A second, separate brainstorm (after the field shipped) decided how to use the *drafting
annotations* (dimensions, title block, drafting marks). The discipline: **use them like a real
blueprint — a sparse peripheral frame, never scattered through the content.** The drawing is
framed and dimensioned at its edges; the content column stays undimensioned. (Earlier attempts
that tagged individual components / pinned a sticky top dimension were rejected as "too much".)

**Rendering decision: the frame is DOM/SVG, NOT canvas.** These elements are static, sparse,
and text-heavy — DOM/CSS gives crisp type, precise layout-driven placement (no hand-computed
canvas coordinates, which proved bug-prone), and is genuinely more "designed". So:
**frame = DOM/SVG components; interactive grid = the canvas `BlueprintField` (§1–§9).**

### 10.1 Elements (all mono except one sanctioned accent)
- **Overall dimension (top).** A horizontal dimension of the content column — value `768`
  (computed from the real column box) — drawn with a dimension line, end **arrowheads**, and the
  value **breaking the line**; plus a small `24` **gutter sub-dimension** at the left. Lives in
  the first content section's top padding (below the nav, above the eyebrow); scrolls with the
  page. Stated **once**.
- **Title block (bottom-right of the footer "sheet" strip).** A designed plate: a header row
  (name + `01 / 04` sheet index), a **single subject-accent hairline** across the top (the *one*
  sanctioned colour deviation from mono — toggleable), then a **ledger** of label/value pairs:
  `TITLE · REV · SHEET · LANG · SCALE · STATUS` (small uppercase mono labels over mono values).
  ("Ledger" is the chosen variant; a compact "Stamp" variant exists but is not used by default.)
- **Drafting marks (bottom-left of the footer strip).** A **registration crosshair** + a
  **scale bar** (`0–96px`). Tasteful, sparse.
- Content stays clean; the calm dot grid / column guides / gutter hatch (canvas) remain behind.

### 10.2 Architecture
A small `BlueprintFrame` group of focused components (e.g. `Dimension`, `TitleBlock`,
`DraftingMarks`), rendered once in the layout (dimension near the top of the content; title block
+ marks inside the footer). The overall dimension derives its value from the column width; the
title-block fields come from a small config object (name, rev, sheet, lang, scale, status). All
`aria-hidden` / decorative. Static — unaffected by `prefers-reduced-motion`. Mono via the same
`--bp-ink` tokens; the title-block accent hairline uses `--subject-accent`.

### 10.3 Decisions
Frame, not content annotations. DOM/SVG, not canvas. Title block = Ledger, accent hairline ON.
Drafting marks (registration + scale bar) included. One overall dimension (`768` + `24`), once,
top. Validated live via the `reco-dom` companion mock.
