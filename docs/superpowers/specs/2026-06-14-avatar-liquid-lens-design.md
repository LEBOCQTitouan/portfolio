# Avatar (Phase 2) — the liquid-energy lens companion

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Refines:** `2026-06-14-avatar-and-design-system-design.md` (Part 2). Behaviors
there are the approved baseline; this spec **supersedes the orb's form/material**
(now "liquid-energy lens") and details how the behaviors render on it. Builds on
the shipped semantic palette + page aura (`…subject-palette-and-page-aura…`).

## Concept

The companion is **the page's light made into a living lens.** It carries no
inherent color: it refracts the page content behind it (glassmorphism) and picks
up the **active subject color** in its flowing liquid — teal on a systems page,
pink on interface, violet on AI, blue on brand. It is alive: the surface gently
wobbles and light flows inside like a tide. Eyes (the only "face", per the locked
direction) float in front.

Replaces today's solid gradient orb (`orb.tsx` + hardcoded `moods.ts`).

## The material — "liquid-energy lens"

- **Glass body:** translucent; `backdrop-filter: blur(~6px) saturate(1.4)` so the
  page behind reads softly refracted. A bright specular highlight + thin rim give
  it form.
- **Living light inside:** soft blobs of the subject color flow/morph slowly
  (tide-like), clipped to the circle. This is the "energy".
- **Wobble:** a subtle `border-radius` morph (surface tension) — never a hard
  shape change.
- **Color from the page:** the liquid + sheen are tinted by the **active subject
  accent**, and the backdrop blur naturally carries the page color through.
- **Eyes:** two dark, soft eyes in front, carrying all expression.
- **Breathe + blink** at rest.

### Getting the active subject color to the orb

The companion renders in the layout (outside the content `[data-subject]` scope),
so — exactly like the page aura — it can't inherit the subject via normal
cascade. Use the same `:has()` lift: set a **`--subject-accent`** (and
`--subject-accent-soft`) custom property on `body` per active subject, which the
fixed orb inherits:

```css
:root { --subject-accent: var(--accent); --subject-accent-soft: var(--accent-soft); } /* brand default */
body:has([data-subject="systems"]) { --subject-accent: #0b7268; --subject-accent-soft: rgba(11,114,104,0.16); }
/* …interface, ai; + .dark variants … mirror src/design/tokens.ts */
```

The orb's liquid/sheen read `var(--subject-accent)`. Values mirror `tokens.ts`
(single source of truth) and are AA-irrelevant here (decorative), but stay
on-palette.

## State model

Two layers, owned by a **pure, unit-tested state machine** (`reaction-state.ts`);
the React component renders geometry/color from `(mood, reaction)`.

- **Mood** (resting, content-driven — unchanged): `calm | warm | focused`, from
  the active narration line. Sets eye shape + a tonal/temperature shift of the
  flowing light (calm = slow tide; focused = squint eyes, tighter flow; warm =
  curved "happy" eyes, warmer flow).
- **Reaction** (transient overlay): `active | sleepy | asleep | annoyed | angry |
  sleeping`. Precedence + transitions:
  - **`sleeping`** — when muted. Eyes closed, dimmed, flow nearly still. Overrides
    all. (Existing mute wiring drives it.)
  - **`annoyed` / `angry`** — from **spam-clicking the orb only**. Each poke fires
    a one-shot disturbance (below) and increments a counter within a short window:
    a few fast pokes → `annoyed` (eyes narrow); continued → `angry` (color heats
    within hue, eye-slant, faster/turbulent flow, sharper recoil). **Cools by time
    only** back to `active`.
  - **`sleepy` → `asleep`** — from inactivity (no scroll/pointer). After ~t1 →
    `sleepy` = **"fighting it"**: randomized nod-off → jerk-awake (variable droop
    depth, snap strength, count) so it never loops mechanically; the liquid slows
    and settles; eventually loses the fight → `asleep` = eyes closed + a **dream
    bubble with floating Zzz**. Any activity → `active`.
  - **`active`** (default) — eyes do **gaze**: track the cursor and glance toward
    the active section (rides the existing IntersectionObserver).
- **One-shot disturbance** (independent of reaction): each click on the orb →
  **direction-aware bump** (recoil away from the click point, eyes dart toward it)
  **+ the liquid sloshes/ripples from the poke point**, then a damped settle.
  Restrained (per the approved v3 feel).

## Architecture & boundaries

- **No new dependencies.** Pure CSS/SVG: `backdrop-filter`, animated radial
  gradients (flow), `border-radius` morph (wobble), transforms (bump/nod/breathe),
  clip via `overflow:hidden`. Canvas/WebGL explicitly **out of scope**.
- Lives in `src/components/companion/` (already a client component):
  - `orb.tsx` — renders the liquid-lens material + eyes from `(mood, reaction,
    geometry)`. CSS moves to the companion section of `globals.css`.
  - `eyes.tsx` (new) — eye geometry per `(mood, reaction, gaze)`.
  - `reaction-state.ts` (new, **pure**) — reducer over events (`tick`, `poke`,
    `activity`, `mute`, `unmute`) → `reaction`, with the anger counter + cooldown
    and the idle→fighting→asleep timeline (randomness injected, not internal, so
    it's testable).
  - `moods.ts` — refactor: stop hardcoding rgba; derive from
    `var(--subject-accent)` + mood (tonal shift). 
  - `companion.tsx` — wire pointer/scroll activity, poke handler (with click
    coordinates for direction), idle timers, and pass `(mood, reaction)` down.
    Keep all existing placement/hero/mute/i18n/narration logic.
- **`:has()` `--subject-accent`** block added to `globals.css` (mirrors tokens).
- Dependencies point inward: `reaction-state.ts` is pure (no DOM); the component
  feeds it events and renders results.

## Accessibility & motion

- **`prefers-reduced-motion`:** disables wobble, flow, idle fighting-sleep,
  disturbance slosh, and bump. Falls back to a **static** tinted glass orb with
  eyes; state is still conveyed statically (e.g., closed eyes when muted/asleep).
- Orb is decorative (`aria-hidden`), as today; mute control keeps its label.
- The orb must never trap pointer events except where it intentionally accepts the
  poke; keep it from blocking content interaction.

## Testing

- `reaction-state.ts` (pure): poke→annoyed→angry thresholds + time cooldown;
  idle→sleepy→asleep timeline; activity resets; mute=sleeping precedence.
- `moods.ts`: returns subject-derived styling per mood (no hardcoded palette).
- Reduced-motion: animations/idle/disturbance gated off.
- Existing companion/placement/narration tests stay green.
- (Visual polish — wobble/flow/blur tuning — verified in-browser, not unit-tested;
  say so explicitly.)

## Out of scope (deferred)

- Mouth/eyebrows (eyes-only stays).
- Canvas/WebGL/shaders.
- Micro-reactions (squint on code blocks, look-up at top) — optional follow-up.
- Page-transition choreography (separate feature/handoff).
- Anger triggers beyond spam-click; hover-to-forgive.

## Implementation note

Build after the palette+aura revision (done). Sequence within: tokens/`:has()`
color plumbing → pure state machine → eyes → liquid-lens material/CSS → wire
events (gaze, idle, poke) → reduced-motion + tests.
