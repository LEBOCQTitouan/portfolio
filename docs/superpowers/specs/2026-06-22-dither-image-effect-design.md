# DitherImage — design spec

**Date:** 2026-06-22
**Branch:** `rasterization-hover-images`
**Status:** Approved design, ready for implementation plan
**Workstream:** #2 of the rasterization initiative (see memory `raster-initiative-decomposition`)

## 1. Summary

A reusable component, `<DitherImage>`, that renders images and animated media
(GIF/video) as a **real-time 1-bit ordered (Bayer) dither** — converting continuous
image content into a discrete black/white dot grid. The dithered look is the resting
identity of the media (it never resolves to the raw photo); its **precision animates
between coarse and fine** (ambient breathing at rest, a stronger shift on hover). The
effect is rendered at the element's true on-screen resolution so it stays crisp at any
frame size, and falls back to a static dither under `prefers-reduced-motion`.

The reference aesthetic is the Aceternity "Dither Shader": pure black & white, Bayer
grid, on real photographs.

## 2. Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| Family | Which effect | **Dither** (not pixelation / ASCII / glitch / geometric tiling) |
| Variant | Pattern & tone | **1-bit Bayer** default; blue-noise and multi-tone available as props |
| Shape | Fixed vs configurable | **Configurable component** with props; defaults reproduce the reference look |
| Interaction | Resting vs hover | **Always dithered** (never resolves to raw photo) |
| Animation | Motion | **Precision animates coarse⇄fine** — ambient breathing at rest **and** stronger shift on hover |
| Color | Source of color | **Inherited from the page scheme** (`--foreground`/`--background`, optionally `--accent`); default monochrome |
| Rendering | Resolution strategy | **Dither at on-screen size × devicePixelRatio**, re-dither on resize, cell fixed in device px |
| Tech | Implementation | **WebGL fragment shader** (per-output-pixel), **Canvas 2D fallback** |
| A11y | Reduced motion | `prefers-reduced-motion` ⇒ static dither, no animation |
| Substrate | What feeds it | **Option A** — ship the component content-agnostic now; activates when real media is added |

## 3. Background & constraints

- **Modified Next.js.** This repo runs a modified Next.js; per `AGENTS.md`, read the
  relevant guide in `node_modules/next/dist/docs/` before writing component/runtime code.
- **No existing WebGL/Three.js** in the codebase. We add a minimal, dependency-light
  WebGL layer (raw WebGL2, no Three.js) plus a Canvas 2D fallback. No heavy 3D stack.
- **Workstream A (blueprint grid) does not exist** (its branch is empty). The handoff
  said to import A's grid tokens; since A is unbuilt, this component is **self-contained**
  and depends only on existing design tokens. No coupling to A.
- **Color tokens** already exist: `--foreground`, `--background`, `--accent` (the last
  set per-subject via `[data-subject="…"]` and per-mode via `.dark`). The effect reads
  these so it adapts to light/dark and subject automatically.
- **Reduced motion**: reuse `useReducedMotion()` (`src/components/companion/use-reduced-motion.ts`).
- **Taste**: subtle/senior, not gimmicky. Validate live (automation screenshots mislead
  for fluid effects).
- **No real media in the repo yet** — every `<Figure>` is an empty placeholder; cards are
  text-only; `public/` has no photos. Hence Option A.

## 4. The "crisp at any size" rule (core technical requirement)

A 1-bit dither **must not be downscaled** — shrinking a finished dither smooth-resamples
the dots into gray mush. Therefore:

1. Compute the dither at the element's **actual rendered size × `devicePixelRatio`**.
2. **Re-render on resize** (`ResizeObserver`) and on DPR change.
3. Keep the **Bayer cell a fixed size in device pixels** so dot density is constant
   across frame sizes.

A WebGL fragment shader satisfies (1) and (2) for free — it runs once per output pixel at
the framebuffer resolution, so resizing the canvas re-dithers automatically with no
`getImageData` cost. This is the primary reason for the shader over Canvas 2D.

References: `as-dithered-image` (andrewstephens75), sheep.horse "Pixel-Accurate Atkinson
Dithering", MDN `image-rendering` / crisp pixel-art.

## 5. Architecture

Three small units with clear boundaries:

### 5.1 `dither-core` (pure, framework-agnostic)
- The GLSL fragment shader: luminance (BT.601) → contrast curve → ordered-dither
  threshold (Bayer matrix, or blue-noise via interleaved-gradient-noise) → quantize to
  `levels` → map to `ink`/`paper` colors.
- A **Canvas 2D fallback** implementing the same pipeline (for no-WebGL environments / SSR
  safety / tests).
- Pure functions, no React. Inputs: source frame (texture/ImageData), uniforms/params.
  Output: dithered frame. Independently testable.

### 5.2 `dither-renderer` (imperative engine)
- Owns a `<canvas>`, a WebGL2 context (or Canvas2D fallback), the source (`HTMLImageElement`
  / `HTMLVideoElement` / `ImageBitmap`), and a render loop.
- Sizes the backing store to `clientWidth/Height × dpr`; observes resize; clamps DPR
  (e.g. ≤2) for perf.
- Drives the **precision animation** (a single normalized `precision ∈ [0,1]` → mapped to
  effective `cellSize`/`levels`): ambient oscillation + eased hover target; honors a
  `motion` flag (off ⇒ fixed precision, no rAF).
- For animated sources (video/animated GIF via `<img>`), samples the current frame each
  tick; for still images, only re-renders when params/size change (no idle rAF).
- Lifecycle: `start()`, `stop()`, `destroy()`; pauses via `IntersectionObserver` when
  offscreen.

### 5.3 `<DitherImage>` (React component)
- Thin adapter: resolves props + CSS-var colors + `useReducedMotion()`, mounts a renderer,
  forwards hover state. Renders `<figure><canvas/></figure>` with an accessible `alt`.
- No domain logic; purely presentational.

```
<DitherImage> ──uses──> dither-renderer ──uses──> dither-core (shader + canvas2d)
     │
     └── reads CSS vars (--foreground/--background/--accent), useReducedMotion()
```

## 6. Component API

```tsx
type DitherPattern = "bayer" | "blue-noise";

interface DitherImageProps {
  src: string;                 // image, gif, or video URL
  alt: string;                 // required for a11y
  kind?: "image" | "video";    // default inferred from extension
  pattern?: DitherPattern;     // default "bayer"
  levels?: 2 | 3 | 4 | 6;      // default 2 (1-bit B&W)
  cellSize?: number;           // dot size in CSS px; default 2
  threshold?: number;          // 0..1; default 0.5
  contrast?: number;           // default 1.25
  ink?: string;                // default "var(--foreground)"
  paper?: string;              // default "var(--background)"
  animate?: {                  // precision animation
    ambient?: number;          // 0..1 amplitude at rest; default ~0.15
    hover?: number;            // 0..1 amplitude added on hover; default ~0.5
    speed?: number;            // breathing speed; default 1
  } | false;                   // false ⇒ static
  className?: string;
}
```

**Defaults reproduce the approved reference look** (`bayer`, `levels=2`, `cellSize=2`,
`threshold=0.5`, `contrast=1.25`, monochrome from page scheme). Earlier explorations
(blue-noise, 6-tone) are reachable via `pattern="blue-noise"` / `levels={6}`.

### Color inheritance
`ink`/`paper` default to `var(--foreground)` / `var(--background)`, resolved at mount
(and on theme/subject change via a `MutationObserver` or re-read on hover). This makes the
effect adapt to light/dark and per-subject context with no per-call config. Duotone is
achieved by passing `ink="var(--accent)"`.

## 7. Interaction & animation

- **Resting:** always dithered. A single `precision` value oscillates gently
  (`animate.ambient`) → effective cell size / level count breathes coarse⇄fine.
- **Hover:** `precision` eases toward a stronger target (`animate.hover`) — a more
  pronounced coarse→fine shift (and/or a cursor-proximity ripple, tunable in build).
- **Never resolves** to the raw photo; the dither is the identity at all times.
- **Reduced motion:** `animate=false` behavior — a single fixed precision, no rAF.
- Transition feel: animate **cell size** (and optionally level count), since that reads as
  genuine "rasterizing"; exact easing tuned live during build.

## 8. Accessibility & performance

- `prefers-reduced-motion: reduce` ⇒ static dither (verified via `useReducedMotion`).
- `alt` required; the `<canvas>` carries `role="img"` + `aria-label={alt}`.
- DPR clamp (≤2), `IntersectionObserver` pause offscreen, no idle rAF for still images,
  single shared WebGL context strategy considered if many instances on one page.
- Graceful degradation: no WebGL ⇒ Canvas 2D; canvas/JS disabled ⇒ render a plain
  `<img>`/`<video>` (progressive enhancement).
- Cross-origin: document that live pixel sampling needs CORS-clean media; local/same-origin
  assets are fine (the portfolio's will be).

## 9. Integration

- **`src/components/case-study/figure.tsx`** — when `src` is present, render
  `<DitherImage>` instead of the bare `<img>`; keep the dashed placeholder when `src` is
  empty. This is the first and primary wiring point.
- **Later (not this pass):** project/post cards and case-study hero media can adopt
  `<DitherImage>` once they carry real imagery.
- **Storybook**: stories covering pattern × levels × cellSize, still vs video source,
  small/large/responsive frames, reduced-motion, light/dark/subject color inheritance.
  Stock images live in Storybook assets only (not shipped site content).

## 10. Substrate handling (Option A)

The component ships fully working and demoed (Storybook + stock images), wired into
`<Figure>` so it activates automatically when real media is added. No site content is
fabricated in this pass. When real project/case-study imagery exists, adoption is just
passing `src`. This unblocks shipping the effect without depending on assets that don't
exist yet.

## 11. Scope

**In scope:** the `dither-core` (shader + canvas2d), `dither-renderer`, `<DitherImage>`,
Figure integration, Storybook stories, reduced-motion + responsive + color-inheritance
behavior, tests.

**Out of scope (YAGNI / later):** applying to cards/heroes (no media yet), sourcing or
creating real site imagery, blue-noise texture baking beyond the IGN approximation,
non-Bayer ordered matrices beyond 2×2/4×4/8×8, video controls/poster logic, the other two
rasterization workstreams (blueprint grid, mascot).

## 12. Testing

- **dither-core (unit):** deterministic Canvas2D path on a known small input → assert exact
  black/white output for given Bayer matrix + threshold; luminance + contrast math;
  level-quantization boundaries.
- **renderer (integration, jsdom + canvas mock or headless WebGL):** backing-store sizing =
  `clientSize × dpr`; re-render fires on `ResizeObserver`; rAF stopped when `motion=false`
  and when offscreen.
- **component:** renders `<img>` fallback without WebGL; `alt`/aria present; reduced-motion
  path static; CSS-var colors resolved.
- **Visual:** Storybook + **live manual validation** (taste rule — automation screenshots
  mislead for fluid effects). Cross-check crispness at 120/200/300/responsive widths and
  the wrong-way (downscaled) regression.

## 13. Risks / open notes

- **Modified Next.js**: confirm client-component + canvas/WebGL patterns against
  `node_modules/next/dist/docs/` before coding (SSR guard the WebGL mount).
- **Many instances / GPU cost** on low-end devices: mitigate via DPR clamp, offscreen
  pause, and (if needed) a shared context or a Canvas2D tier for >N instances.
- **Color re-read** on theme/subject change needs a defined trigger (observer vs re-read on
  interaction) — finalize in build.
- **Live validation required** before merge; do not trust screenshots for the animation.
```
