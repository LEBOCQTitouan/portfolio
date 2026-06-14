# Design system

> The system has one rule: **brand-anchored, semantic subjects.** One blue is the
> identity; each subject carries its own meaningful color, applied through three
> layers of tokens, and felt globally through a subtle page aura. Nothing is a
> one-off.

## Three layers

1. **Primitives** — raw neutral + blue values (in `globals.css`). Never used directly.
2. **Semantic tokens** — what the UI consumes: `--background, --surface,
   --foreground, --muted, --border, --ring`, and the accent group. Mapped to
   Tailwind utilities via `@theme inline`.
3. **Subject skins** — `[data-subject="…"]` blocks that override only the accent
   group. The cascade does the rest.

## The accent group

| Token | Use |
|---|---|
| `--accent` | accent **text/borders** on the page background (per mode) |
| `--accent-fill` | solid accent **fill** — white-safe; gradient fallback |
| `--accent-gradient` | the fill/text background-image (a gradient for gradient subjects, else a color) |
| `--accent-text-gradient` | gradient used for clipped **text**; flips per mode so it stays legible on the background |
| `--accent-soft` | low-alpha tint for beds/badges/hovers |
| `--on-accent` | foreground guaranteed **WCAG AA** on the fill/gradient |
| `--ring` | focus ring (= `--accent`) |

Utilities: `.accent-text` (colored or gradient-clipped text) and `.accent-fill`
(filled surface with `--on-accent` text). Gradient subjects animate a slow flow,
disabled under `prefers-reduced-motion`.

## Subjects

| Subject | Trigger | Color · meaning |
|---|---|---|
| `brand` | default / untagged | azure **blue** · trust, identity, the anchor |
| `systems` | `category: systems`, tags architecture/backend/… | **teal** · infrastructure, reliability (blue-green, clear of success-green) |
| `interface` | `category: interface`, tags design/frontend/ui/… | **pink/coral** · craft, warmth (clear of error-red) |
| `ai` | tags ai/ml/llm/… | **violet→cyan** · intelligence, the only animated multi-hue subject |

`category: both` falls back to `brand` (blend deferred). Subjects are chosen by
`resolveSubject()` (`src/core/domain/subject.ts`) and applied as `data-subject`.

### Color best practices (why these hues)

- Subject hues stay **clear of the reserved feedback colors** (success green,
  error red, warning amber) so a subject never competes with state UI.
- **No red↔green** primary distinction (color-blind safety).
- Consistent tonal step; **WCAG AA enforced** by `tokens-contrast.test.ts`.
- Color is **never the only signal** — the badge label and the orb carry the
  subject too.

## Page aura

Every page is **always lit**: a subtle global background **tint** plus a soft
radial **glow** (top-right, where the companion sits), colored by the active
subject. The page is the light source; the companion orb is a **lens** that
diffracts it (see the avatar plan). Tokens: `--aura-tint` and `--aura-glow`
(per subject, per mode, in `tokens.ts` as `aura.tint` / `aura.glow`). It renders
as one fixed `.page-aura` layer in the root layout, recolored per page via
`body:has([data-subject="…"]) .page-aura`. Static and contrast-safe (the tint is
low-alpha; body text over it is AA-verified).

## Source of truth

Color values live once in **`src/design/tokens.ts`** (also consumed by the
companion and the contrast tests). `globals.css` mirrors them. The contrast
contract (`src/design/tokens-contrast.test.ts`) fails CI if any subject breaks
WCAG AA.

## Recipe: add a new subject

1. Pick a **meaningful** hue that is **clear of the feedback colors** (success
   green / error red / warning amber) and doesn't rely on a red↔green contrast.
2. In `src/design/tokens.ts`: add the id to `SUBJECTS` (in
   `src/core/domain/subject.ts`, re-exported from `tokens.ts`) and a `TOKENS`
   entry — `accent` (light+dark), `accentFill`, `gradientStops`, `onAccent`,
   `accentSoft` (light+dark), and `aura` (`tint` + `glow`, light+dark). Gradient
   subjects also add `textGradient` (light+dark).
3. Run `npx vitest run src/design/tokens-contrast.test.ts`. Adjust hexes until
   AA passes — do not weaken thresholds.
4. Mirror the values into `globals.css` as a `[data-subject="<id>"]` block plus a
   `.dark [data-subject="<id>"]` block. If gradient, add the `[data-subject="<id>"]
   .accent-fill/.accent-text` rules (copy the `ai` pattern).
5. Add the trigger to `src/core/domain/subject.ts` (category map and/or
   `TAG_GROUPS`), with a test in `subject.test.ts`.
6. (Phase 2+) The companion picks it up automatically via the active subject.
7. Add the subject's `--aura-tint`/`--aura-glow` to `globals.css`: a
   `body:has([data-subject="<id>"]) .page-aura` rule (and a `.dark` variant).
