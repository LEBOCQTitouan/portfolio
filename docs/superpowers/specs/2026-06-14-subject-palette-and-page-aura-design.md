# Subject palette pivot + global page aura

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Refines:** `2026-06-14-avatar-and-design-system-design.md` (Part 1) and the shipped
Phase 1 foundation. This **supersedes the palette** (the "everything is a
declension of the brand blue" principle) and **adds** a global page aura.

## Why this changes

Phase 1 shipped four blue-family subjects. In review they read as
indistinguishable — too close in hue. Two decisions came out of re-brainstorming:

1. **Semantic palette.** Each subject gets its **own distinct color chosen for
   its meaning**, not a variant of blue. Brand stays blue (the identity anchor);
   the others span the wheel.
2. **Global page aura.** The subject should be felt **subtly but everywhere** —
   "as if the page's aura changed" — not just on a couple of links. The page is
   the source of light; **the companion orb is a lens that diffracts that
   light** (it is not a light source).

The Phase 1 *architecture* is unchanged and validated by this: swapping subject
colors is a one-place token edit, and the WCAG contrast contract re-validates
whatever we pick. Only token **values**, the philosophy doc, and a new aura
layer change.

---

## Part A — The semantic palette

Colors chosen with UI/UX best practices applied:

- **Reserve red / green / amber for feedback** (success / error / warning) — keep
  subject hues clear of them so a subject never competes with state UI.
- **No red↔green primary distinction** — color-blind safety (~8% of men).
- **Vetted scale steps**, consistent tone, harmonious.
- **WCAG AA** enforced by the existing contract test.
- **Color is never the only signal** — the category badge label and the orb also
  carry the subject.

### Subjects

| Subject | Hue | Meaning |
|---|---|---|
| **Brand** (default) | azure **blue** | trust, clarity, identity — the anchor |
| **Systems** | **teal** | infrastructure, reliability, "devops" — green-*family* but blue-green, so clear of success-green |
| **Interface** | **pink/coral** | craft, warmth, the human/expressive pole — distinctly pink, clear of error-red |
| **AI** | **violet→cyan** animated gradient | intelligence, spectral/futuristic — the only multi-hue subject; purple has no functional-state meaning |

### Token values (targets — the AA contract may nudge a shade)

`onAccent = #ffffff` for every subject. `BACKGROUND` unchanged
(light `#fbfbfd`, dark `#0f1115`). All values mirror into `globals.css`.

**Brand** (unchanged from Phase 1)
- accent: light `#0071e3`, dark `#2997ff`
- accentFill `#0a66c2` · gradientStops `["#0a66c2"]`
- accentSoft: light `rgba(0,113,227,0.10)`, dark `rgba(41,151,255,0.16)`

**Systems (teal)**
- accent: light `#0b7268`, dark `#20c8b8`
- accentFill `#0a6b63` · gradientStops `["#0a6b63"]`
- accentSoft: light `rgba(13,127,118,0.10)`, dark `rgba(32,200,184,0.16)`

**Interface (pink/coral)**
- accent: light `#c42d63`, dark `#f06595`
- accentFill `#c42d63` · gradientStops `["#c42d63"]`
- accentSoft: light `rgba(196,45,99,0.10)`, dark `rgba(240,101,149,0.16)`

**AI (violet→cyan gradient)**
- accent (solid fallback): light `#6d28d9`, dark `#a78bfa`
- accentFill (flat fallback for borders) `#6d28d9`
- **fill gradient** (`--accent-gradient`, white-safe, mode-stable):
  `linear-gradient(110deg, #7c3aed, #4f63d8, #0e7d96)`
- **text gradient light** (`--accent-text-gradient`, dark stops for light bg):
  `linear-gradient(110deg, #6d28d9, #4f46e5, #0e7490)`
- **text gradient dark** (bright stops for dark bg):
  `linear-gradient(110deg, #a78bfa, #8ab4ff, #5ad1e0)`
- accentSoft: light `rgba(124,58,237,0.10)`, dark `rgba(167,139,250,0.18)`

The fill-vs-text gradient split (and its per-mode text stops) already exists from
Phase 1's contrast fix — only the stop values change.

### Contrast contract additions

The existing `tokens-contrast.test.ts` already checks: `onAccent` vs fill, vs
every gradient stop, and accent vs background per mode; plus AI text-gradient
stops vs background per mode. These cover the new palette unchanged — only the
hex inputs change. Acceptance: all assertions still pass at AA (≥4.5).

---

## Part B — The global page aura

### Concept

- **Every page is always lit** (decision: scope = all pages). The aura is an
  ambient property of the page; the active subject sets its color. Brand pages
  carry a faint blue aura; a systems page shifts teal; etc.
- **Form = tint + glow** (chosen from 4 options): a faint global background
  **tint** (always-lit base) plus a soft **radial glow** anchored top-right,
  where the orb lives — giving the orb light to diffract.
- **The orb is a lens.** It does not emit color; it **diffracts the page's
  underlying light**. Its appearance derives from the active subject's
  aura/accent. (Material/behavior is Phase 2; captured here as the binding
  principle: subject → page aura → orb-as-refraction.)

### Tokens (per subject, per mode)

Two new semantic tokens, set in each `[data-subject]` skin block:

- `--aura-tint` — very low-alpha accent wash for the page background.
  Light ≈ `rgba(<accent>, 0.06–0.07)`, dark ≈ `rgba(<accent>, 0.10)`.
- `--aura-glow` — low-alpha accent for the radial glow.
  Light ≈ `rgba(<accent>, 0.14–0.16)`, dark ≈ `rgba(<accent>, 0.20–0.22)`.

(Exact alphas are the intensity dial — default is the "gentle" values above.)

### Rendering

- A single **page-level aura layer**: a `position: fixed; inset: 0; z-index: -1;
  pointer-events: none` element behind all content, set on the app wrapper in
  `layout.tsx`. Its background is:
  `radial-gradient(120% 90% at 85% -10%, var(--aura-glow), transparent 55%)`
  over `var(--aura-tint)` (or a `color-mix` of accent into `--background`).
- It inherits `--aura-tint`/`--aura-glow` from the active `[data-subject]` scope,
  so it recolors automatically per page.
- **Static** (no animation) — the AI subject's accent gradient still animates
  where used as text/fill, but the aura itself is calm.
- **Contrast-safe:** the aura sits behind content at low alpha; body text uses
  `--foreground` over `--background`. Acceptance: with the aura applied,
  `--foreground` vs the effective tinted background still meets AA. Because the
  tint is ≤ ~7% (light) / ~10% (dark), this holds; verify in implementation.
- **Reduced-motion:** unaffected (the aura is static).

### Orb-as-lens (forward note for Phase 2)

The avatar plan (Phase 2) must treat the orb as a **glass/refractive lens** that
diffracts the page aura, not a solid glowing ball:
- Its color derives from the active subject accent/gradient (already planned —
  `moods.ts` reads the tokens).
- Material reads as glassy/prismatic: it concentrates and bends the glow it sits
  in (top-right). Moods become tonal shifts of the refracted light.
This is recorded here so Phase 2 designs the orb material accordingly; it is not
implemented in this spec.

---

## Architecture & boundaries

- **Token values:** `src/design/tokens.ts` (source of truth) + `globals.css`
  (mirror) — replace the four subjects' values; add `--aura-tint` / `--aura-glow`
  to each skin block.
- **Aura layer:** one element + CSS in `globals.css`, mounted in
  `src/app/[lang]/layout.tsx`. No new dependency, no JS.
- **No change** to `resolveSubject`, the layering, or the `data-subject` wiring —
  they already drive everything.
- **Philosophy doc** `docs/design-system.md`: update the principle from
  "declension of the brand blue" to "**brand-anchored, semantic per-subject
  palette**", document the best-practice rules, the aura tokens, and update the
  add-a-subject recipe (pick a meaningful hue clear of feedback colors; declare
  `--aura-tint`/`--aura-glow`).

## Testing

- Contrast contract (`tokens-contrast.test.ts`) stays green with the new hexes
  (tune any shade that fails — do not weaken thresholds).
- Add an assertion that `--foreground` vs each subject's effective tinted
  background (foreground vs `auraTint` composited over `BACKGROUND`) meets AA, in
  both modes.
- Existing suite stays green; `tsc` clean; `next build` succeeds.
- Visual check: each subject page shows a distinct, gentle aura; brand pages are
  faint blue; dark mode aura legible.

## Out of scope (deferred)

- Orb material/lens implementation and moods-from-tokens (Phase 2).
- Animated aura (kept static).
- Live site-wide theme switcher.
- Per-subject aura *shape* variation (all subjects share the tint+glow form).

## Implementation note

This is best executed as a **revision to the Phase 1 foundation** (it edits the
same token files + doc) plus the **new aura layer**. It should land before Phase 2
so the avatar is built against the final palette and the aura it diffracts.
