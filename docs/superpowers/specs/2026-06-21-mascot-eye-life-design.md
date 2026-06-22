# Mascot eye life — design

**Date:** 2026-06-21
**Status:** Approved (pending implementation plan)
**Area:** `src/components/companion/`

## Problem

The companion's eyes are functional but read as "dead." Three signals real eyes
have that the current implementation lacks:

1. **Believable motion** — gaze is a perfectly smooth pointer-follow; the blink is
   a metronomic 5.5s CSS loop. Clockwork motion reads as robotic.
2. **Reactivity** — the eyes never respond to interaction beyond the existing
   reaction-shape swaps (squint/angry/closed).
3. **A lifelike blink** — the current blink is a symmetric `scaleY` collapse to a
   flat line. It violates how real blinks move.

Out of scope / explicitly rejected: a catchlight glint + gradient pupil ("depth").
Evaluated and rejected as looking cheap. **The eyes stay clean solid dark ovals.**
Life comes from behavior, not cosmetics.

## Decisions locked during brainstorming

- **Idle intensity: "Curious."** Natural saccades + occasional glance-away + human
  blink cadence. Calm enough to ignore in peripheral vision while reading, awake
  enough to feel present. (Rejected: "Calm" too inert, "Restless" too distracting.)
- **Both eyes blink synchronized** off one shared clock. No per-eye desync.
- **The blink follows the researched spec** (Disney Research + ILM/Bloop animators),
  numbers below.

## The blink spec (the centerpiece)

A real blink is temporally and spatially **asymmetric**: it slams shut fast
(accelerating) and opens slower (decelerating, settling). Symmetric/linear timing
is the amateur tell. Total duration must stay snappy — slower than ~350ms reads as
drowsy.

Total ≈ **260ms**, driven on `scaleY`/`scaleX` with `transform-origin: center`:

| t (offset) | scaleY | scaleX | phase | easing into next stop |
| --- | --- | --- | --- | --- |
| 0.00 | 1.00 | 1.00 | open | `cubic-bezier(.7,0,.84,0)` (ease-in, close) |
| 0.327 (~85ms) | 0.10 | 1.08 | shut (slit) | `linear` (hold) |
| 0.500 (~130ms) | 0.10 | 1.08 | held shut | `cubic-bezier(.16,1,.3,1)` (ease-out, open) |
| 0.94 (~245ms) | 1.05 | 0.99 | overshoot | (settle) |
| 1.00 (~260ms) | 1.00 | 1.00 | settled | — |

Key details that separate it from the current blink:

- **Close:open ≈ 1:1.5.** The close is ~85ms, the open ~130ms.
- **Slit, not a line.** Minimum height is ~10% (`scaleY 0.10`), keeping the rounded
  ends — never a dead-flat 1px bar.
- **Squash + overshoot.** Width bulges to 1.08 at closure (volume preservation),
  height overshoots to 1.05 on reopen then settles.

Implemented via the Web Animations API (`element.animate`) so the per-phase easing
and the randomized firing are driven from JS, not a fixed CSS keyframe.

## Behavioral rules

- **Idle cadence:** randomized, **one blink every 3–6s** with jitter (never a fixed
  interval). ~10% chance of a **double-blink** (second blink ~200ms after the first).
- **Blink on gaze re-target:** when the gaze target jumps to a new section/point,
  fire a blink with the move ("blink for a reason"). If this coupling proves
  distracting it can fall back to idle-cadence-only — but ship with it on.
- **Blink suppression by reaction/shape** — blink runs only when the eyes are
  alertly open:
  - `asleep` / `sleeping` (shape `closed`): no blink.
  - `angry` (shape `angry`) / `annoyed` (shape `squint`): no blink.
  - `active` / `sleepy` with an open resting shape (`calm`→open, `warm`→happy,
    `focused`→squint): blink runs. (For `focused`/squint the blink is a smaller
    collapse since the eye is already narrowed.)
- **Saccades:** small darts added on top of the existing pointer-follow gaze.
  Amplitude is **reduced while the scroll listener is actively firing** (reading)
  and **raised when idle** (wander/glance-away). Curious calibration.
- **Reactivity:**
  - **Hover** the orb → eyes scale toward ~0.72 (a focused narrowing on the user).
  - **Poke** → a startle-widen pop, reusing the existing `onPoke` path that already
    drives the orb slosh.

## Architecture

The blink (WAAPI), saccades (rAF), and focus/startle scale all compose on the eyes'
`transform` and must run **off React's render cycle** — the same pattern
`companion.tsx` already uses for its spring/position loop (refs + rAF, bypassing
re-renders).

### Markup change — `eyes.tsx`

Each eye becomes a **wrapper** (owns the gaze + saccade `translate`) containing an
**inner element** (owns the blink `scaleY/scaleX` and the focus/startle `scale`).
This separates the two transforms that currently fight inside the `eye-blink`
keyframe (which re-declares the gaze `translate` on every keyframe to avoid being
overwritten).

```
<div class="companion-eyes" data-shape={shape} aria-hidden>
  <span class="companion-eye">      <!-- gaze + saccade translate -->
    <span class="companion-eye__lid"/>  <!-- blink scale + focus scale -->
  </span>
  <span class="companion-eye"><span class="companion-eye__lid"/></span>
</div>
```

The `data-shape` resting styles (`squint`/`happy`/`closed`/`angry`) move to the
`__lid` element so blink scaling composes on top of the shape.

### New `eye-life.ts` (pure) + `use-eye-life.ts` (hook)

Following the existing split (`orb-motion.ts` pure math + loop in `companion.tsx`,
`reaction-state.ts` pure reducer + `use-reaction.ts` hook):

**`eye-life.ts` — pure, unit-tested:**
- `blinkKeyframes(shape)` → the WAAPI keyframe array + timing options for the spec
  blink (smaller collapse for `squint`).
- `nextBlinkDelay(rand)` → randomized 3–6s; exposes the double-blink decision.
- `saccadeTarget(rand, intensity)` → next micro-dart offset; `intensity` lowers
  amplitude while reading, raises it idle.
- `blinkAllowed(reaction, shape)` → boolean suppression rule (table above).
- `focusScale(reaction, hovering)` → resting / focus(0.72) / startle scale target.

**`use-eye-life.ts` — the hook:**
- Inputs: refs to the two eye wrappers + lids, current `reaction`, the gaze target,
  a hover flag, a "poke" pulse, and `reducedMotion`.
- Owns one rAF loop that eases the saccade offset toward `gaze + saccadeTarget` and
  the focus/startle scale toward `focusScale(...)`, writing transforms imperatively.
- Owns the blink scheduler (timeout-driven, randomized) that calls `element.animate`
  on both lids from one call (synced), gated by `blinkAllowed`.
- Fires a blink when the gaze target changes (effect on the gaze-target identity).

`companion.tsx` wires the hook with the refs and the existing `gaze` / `reaction` /
`onPoke` plumbing; it does **not** grow significantly. The hook and `eye-life.ts`
hold the new logic so each file stays focused.

### CSS — `globals.css`

- Remove the `eye-blink` keyframe and its `data-shape="open"` animation rule (blink
  now JS-driven).
- Add `.companion-eye__lid` base style; move the per-shape sizing onto it.
- Keep all of it under the existing `prefers-reduced-motion: no-preference` gate so
  reduced motion gets none of the new motion.

## Reduced motion & accessibility

Under `prefers-reduced-motion: reduce`:

- No blink animation, no saccades, no focus/startle scaling — eyes hold their static
  resting shape, exactly as today.
- The hook early-returns when `reducedMotion` is true (the existing gaze effect
  already does this), so no rAF loop or blink scheduler starts.
- Eyes remain `aria-hidden="true"`; this is purely decorative motion.

## Testing

Pure functions in `eye-life.ts` are unit-tested with an injected `rand` (seedable),
matching the existing test style (`orb-motion.test.ts`, `reaction-state` tests,
`eyes.test.tsx`):

- `blinkAllowed` truth table across every reaction × shape.
- `nextBlinkDelay` bounds (3–6s) and double-blink probability with a stubbed `rand`.
- `saccadeTarget` amplitude responds to `intensity` (reading < idle).
- `focusScale` returns resting/focus/startle for the right inputs.
- `blinkKeyframes` returns the spec values and a smaller collapse for `squint`.

The rAF loop and WAAPI scheduling in `use-eye-life.ts` are imperative/animation glue
— not unit-tested in isolation (consistent with the untested spring loop in
`companion.tsx`); they are verified by running the app.

## Files touched

- `src/components/companion/eyes.tsx` — wrapper/lid markup, drop the `--gx/--gy`-only
  transform in favor of hook-driven transforms.
- `src/components/companion/eye-life.ts` — **new**, pure logic.
- `src/components/companion/eye-life.test.ts` — **new**, unit tests.
- `src/components/companion/use-eye-life.ts` — **new**, the imperative hook.
- `src/components/companion/companion.tsx` — wire the hook with refs + hover flag.
- `src/app/globals.css` — remove `eye-blink`, add `.companion-eye__lid`, move shape
  sizing.

## Non-goals

- No catchlight/glint/gradient pupils (rejected).
- No change to orb material, position/spring motion, narration, or mute behavior.
- No eye recoloring/subject-tinting (deferred per the liquid-lens spec).
