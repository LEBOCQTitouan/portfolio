# Companion Placement Rework — Design Spec

**Status:** Approved design, ready for implementation planning
**Date:** 2026-06-01

## 1. Goal

Give the companion orb a **dedicated, non-overlapping place** in every part of the UI. Today it's a `position: fixed` overlay that travels to authored viewport-% anchors and can visually sit on top of the reading column (it's `pointer-events:none`, so it never *blocks* clicks, but it does *overlap*). This rework moves it into reserved space so it never covers content — while keeping the "moves with you" feel.

## 2. Two placement modes

The companion picks one of two modes by available horizontal space (the content is a centered `max-w-3xl` column with empty side gutters on wider screens):

- **Gutter lane — wide viewports (`≥ 1200px`).** The orb is fixed in the **right gutter** (the empty margin beside the reading column). Its vertical position **tracks the active section**: the orb's `top` equals the active section's vertical center, **clamped** to keep it fully on-screen. So it sits *beside* whatever it's narrating, in space the layout already wastes — **never over the reading column**. The speech bubble opens within the gutter (toward the column edge but not over it).
- **Reserved bottom dock — below `1200px`.** A slim bar pinned to the bottom of the viewport holds the orb + bubble. It is **reserved**: while the companion is active, the page carries a matching `padding-bottom` (equal to the dock height) so the dock **never covers content**. This covers tablets and phones, where the gutter is too thin for a lane.

The `1200px` threshold is where the gutter (`(100vw − 768px)/2 − px-6`) is comfortably wider than the orb + bubble (~250px). Final value tunable in build; it's a single constant.

## 3. Section tracking replaces authored anchors

Today each narration line carries `anchor: { x, y, side }` (viewport %), hand-authored per section. With the gutter lane, the orb's position is **derived** from the active section's live DOM position — so the authored anchors are obsolete.

- **Simplify `NarrationLine`** to `{ id: string; mood: Mood; text: string }` — drop `anchor`.
- Update `src/lib/narration/script.ts` (the `en` and `fr` maps) and `types.ts` accordingly.
- The orb's gutter `top` comes from a pure helper (see §5), not from data.

## 4. Landing hero stays the exception

The landing keeps its **aura-behind-the-headline** hero moment (an intentional, designed overlap — not the clutter this rework targets). As the hero scrolls out, the existing hero-phase interpolation **re-targets the gutter lane** (wide) or **bottom dock** (narrow) as the orb's destination, instead of the old viewport-% travel anchor. Everywhere else, no-overlap governs.

## 5. Architecture

Contained within `src/components/companion/`:

- **`Companion` controller** swaps its positioning logic:
  - Determines mode from a `matchMedia("(min-width: 1200px)")` listener (replacing the current `640px` desktop check).
  - **Gutter mode:** reads the active section's `getBoundingClientRect()` and computes the orb's gutter `top` via a pure helper; the orb is fixed at `right: <gutter offset>` with that `top`.
  - **Dock mode:** the orb + bubble render in the fixed bottom dock; the controller toggles a class on a layout element (or sets a CSS variable) so the page reserves `padding-bottom`.
- **Pure helper** `gutterTop(sectionRect, viewportHeight, orbSize)` → the clamped `top` (section center, clamped to `[margin, viewportHeight − orbSize − margin]`). Unit-tested.
- **Hero-phase** (`hero-phase.ts` / the controller's interpolation): the travel-target geometry becomes the gutter/dock position instead of an authored anchor.
- **Styles** (`globals.css`): replace the current `.companion-dock` viewport-% model with `.companion-gutter` (fixed right-gutter) and `.companion-bottom-dock` (reserved bar) variants; keep motion gated behind `prefers-reduced-motion`.
- **Remove** the `anchor` field across the type, both narration maps, and the hero-phase interpolation.

Boundaries unchanged: the `Orb`/`SpeechBubble` presentational components and the narration resolver are reused; only positioning changes.

## 6. Behavior preserved

- **Mute** control (now positioned with the gutter/dock) still hides the bubble + shrinks the orb; persists via `localStorage`.
- **`prefers-reduced-motion`:** no glide — the orb **jumps** to the section's gutter `top` (or the dock) with no transition; reduced-motion already collapses the hero aura.
- **`/blog*` exclusion** unchanged (no narration → renders nothing).
- Orb + bubble stay `aria-hidden`; the mute button stays a labeled, keyboard-focusable control.

## 7. Scope & testing

- **In scope:** the positioning rework (gutter/dock), the `min-width:1200px` mode switch, section-`top` tracking, the reserved bottom-dock padding, the hero-phase re-target, removing the `anchor` field, and the CSS.
- **Out of scope (YAGNI):** what the orb says, the 3 moods/colors, the aura visual, left-gutter option, and any non-companion UI.
- **Testing:**
  - `gutterTop` pure helper: section-center math + clamping at both extremes.
  - Controller selects gutter vs dock by a mocked `matchMedia("(min-width:1200px)")`.
  - Active-section change updates the orb's `top` (gutter) — via a mocked section rect.
  - Reduced-motion → no transition class; mute toggles + persists; `/blog` renders nothing.
  - Narration resolver + `NarrationLine` type compile and pass with `anchor` removed (existing companion/resolver tests updated).

## 8. Success criteria

- On `≥1200px`, the orb rides the right gutter beside the active section and **never overlaps the reading column**; the bubble stays in the gutter.
- Below `1200px`, a reserved bottom dock holds it and content is never covered (page reserves space).
- The landing aura hero still plays and settles into the gutter/dock.
- Mute + reduced-motion + `/blog` exclusion intact; tests green; build clean; Worker unaffected (CSS/positioning only, no new deps).
