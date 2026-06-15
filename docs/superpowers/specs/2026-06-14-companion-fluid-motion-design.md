# Companion fluid motion — design

**Date:** 2026-06-14
**Status:** Approved (pending spec review)
**Area:** `src/components/companion/`

## Problem

The companion mascot moves in a way that reads as static and mechanical:

- **Hero phase** (scrolling past the landing hero): position is a **direct linear lerp** of `scrollY / heroHeight`. It is glued 1:1 to the scrollbar — no weight, no follow-through.
- **Travel phase** (rest of the page): position is set as discrete `left/top` percentages from the active section's rect, smoothed by a **fixed 0.6s CSS `transition`**. Because the transition chases a target that itself jumps when the active section switches, the orb **sits still, then lurches**, and rubber-bands when scrolling fast.

Neither phase has any notion of **velocity** or **weight**, so the motion never feels alive.

## Goal

Make the mascot feel like it has inertia and life, continuously reacting to scroll velocity rather than snapping between discrete positions — without becoming cartoony, and while respecting `prefers-reduced-motion`.

Validated interactively via `.context/mascot-motion-demo.html`. The approved feel is the demo's **Playful** preset plus **idle hover**.

## Approach

Replace discrete-position-plus-CSS-transition with a **single `requestAnimationFrame` spring loop** that:

1. holds a **target** position (where the orb wants to be) and a **current** position + velocity,
2. integrates current → target each frame with a damped spring,
3. layers **secondary motion** (velocity squash + idle hover) on top,
4. writes the result straight to the orb's DOM node via `transform` (a ref), bypassing React re-renders.

This is Approach A from brainstorming: no animation-library dependency (the project is deliberately native CSS + React), genuine velocity-reactive physics, and one mechanism that fixes both phases.

### Why transform, not left/top

Position is driven by `transform: translate(xpx, ypx)` written imperatively each frame. The existing `.companion-gutter` CSS `transition` on `left/top` is **removed** — the spring loop is now the sole source of smoothing. `left/top` percentages are converted to pixel targets for the spring; on resize the target is recomputed.

## Motion model (final constants)

Unit-mass spring, semi-implicit (symplectic) Euler, `dt` clamped to 0.032s:

```
a   = (target - cur) * k  - vel * c
vel += a * dt
cur += vel * dt
```

**Approved values (Playful):**

| Param | Value | Meaning |
|-------|-------|---------|
| `k` (stiffness) | `180` | how hard it pulls toward target |
| `c` (damping) | `14` | under-damped → slight overshoot + settle |
| `squash` | `0.08` | max stretch fraction (≤8%), volume-preserving |
| `lean` | `0.05` | max tilt fraction |
| `hoverAmp` | `9` px | idle-drift amplitude |
| `hoverSpeed` | `1.0` | idle-drift rate |

These live as named constants in the motion module, not magic numbers in the component.

### Secondary motion — squash & lean

Driven by the orb's vertical spring velocity `cur.vy`, deliberately constrained so it never deforms badly:

1. **Saturate**: `drive = tanh(cur.vy / 900)` → bounded to (−1, 1); fast scroll can't blow it up.
2. **Low-pass smooth**: ease `smoothSquash`/`smoothLean` toward `drive * param` at rate `min(1, dt * 12)` — no per-frame jitter.
3. **Volume-preserving**: `scaleY = 1 + s`, `scaleX = 1 / (1 + s)` — the orb squishes but its area never grows, so it can't balloon into a blob.
4. **Center origin**: deform anchored at `center center` (symmetric squish), not `bottom` (which read as bouncing off a floor).

Applied to the orb **skin** element, separately from the position transform on the wrapper.

### Idle hover

So the orb never parks dead-still, a slow organic drift is added on top of the spring position:

```
ts     = (now_ms / 1000) * hoverSpeed
hoverX = (sin(ts*0.9) + sin(ts*0.37 + 1.7)*0.5) * hoverAmp * 0.6
hoverY = (sin(ts*1.3 + 0.6) + sin(ts*0.53)*0.5)  * hoverAmp
```

Two non-harmonic sine waves per axis → an orbit that looks organic and doesn't visibly repeat. Layered as an offset on the final `translate`, so the spring still tracks sections precisely while the orb breathes around the settle point. During fast scroll the spring dominates; on settle the hover takes over.

## Components & boundaries

Follow the existing per-module + per-module-test pattern.

- **`hero-phase.ts`** — keep existing pure helpers (`scrollProgress`, `interpolateOrb`, `gutterTargetPercent`). `interpolateOrb` continues to drive `size`/`blur`/`opacity`/`bubble`/`front` directly from progress (these stay React-state-driven; they are not sprung — only **position** is sprung).
- **New: `orb-motion.ts`** — pure, testable motion math:
  - `MOTION` constants (the table above).
  - `stepSpring(cur, target, dt)` → next `{ pos, vel }`.
  - `squashTransform(vy, smoothPrev, dt)` → `{ scaleX, scaleY, tilt, smoothSquash, smoothLean }`.
  - `hoverOffset(timeMs)` → `{ x, y }`.
  - All bounded/volume-preserving guarantees live here and are unit-tested.
- **`companion.tsx`** — the imperative glue:
  - A `ref` to the gutter wrapper (position transform) and to the orb skin (squash).
  - A target `ref` updated by the existing `recompute()` (scroll + active section), converted to px.
  - One `requestAnimationFrame` loop that reads target, steps the spring, computes hover + squash, and writes transforms. Started/stopped in an effect; cancelled on unmount.
  - Position state (`progress`/`target`) stops driving inline `left/top`; it feeds the target ref instead. `size`/`blur`/`opacity`/`bubble`/`front` stay as today.

## Reduced motion & non-applicable modes

- **`prefers-reduced-motion`**: no spring, no hover, no squash. Orb is placed directly at its target (instant, or the prior simple positioning). The rAF loop does not run.
- **Dock mode (mobile, `!isWide`)**: the orb lives in the bottom dock, not the gutter. Spring/hover/squash do **not** apply there — dock behavior is unchanged.
- The hero aura phase only runs when `heroPhase` is true (landing, wide, not muted, not reduced-motion) exactly as today.

## Testing

Part of done:

- **`orb-motion.test.ts`** (pure, deterministic):
  - spring converges to target and settles (velocity → ~0) within N steps; under-damped preset overshoots at least once.
  - `squashTransform` is volume-preserving: `scaleX * scaleY ≈ 1`; output bounded by `squash`/`lean` even for extreme `vy`.
  - `hoverOffset` stays within `±hoverAmp` bounds; `x`/`y` differ (not a degenerate line).
- **`hero-phase.test.ts`** — unchanged helpers keep their existing tests.
- **Not unit-testable** (state explicitly): the rAF loop wiring and DOM transform writes in `companion.tsx`. Verified by manual review against the approved demo, and existing `companion.test.tsx` continues to assert render/structure.

## Out of scope

- No change to the orb's art (gradient, eyes, breathe/wobble/flow keyframes, gaze, poke/slosh, mood, speech bubble).
- No change to section detection (`active-section.ts`), narration, mute, or dock layout.
- No new animation-library dependency.
