# Design system

> The whole system has one rule: **everything is a declension of the brand.**
> One blue, expressed through a small set of subjects, applied through three
> layers of tokens. Nothing is a one-off.

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
| `--accent-soft` | low-alpha tint for beds/badges/hovers |
| `--on-accent` | foreground guaranteed **WCAG AA** on the fill/gradient |
| `--ring` | focus ring (= `--accent`) |

Utilities: `.accent-text` (colored or gradient-clipped text) and `.accent-fill`
(filled surface with `--on-accent` text). Gradient subjects animate a slow flow,
disabled under `prefers-reduced-motion`.

## Subjects

| Subject | Trigger | Character |
|---|---|---|
| `brand` | default / untagged | the blue · solid |
| `systems` | `category: systems`, tags architecture/backend/… | deep indigo · solid |
| `interface` | `category: interface`, tags design/frontend/ui/… | cobalt · solid |
| `ai` | tags ai/ml/llm/… | blue→indigo · **animated gradient** |

`category: both` falls back to `brand` (blend deferred). Subjects are chosen by
`resolveSubject()` (`src/core/domain/subject.ts`) and applied as `data-subject`.

## Source of truth

Color values live once in **`src/design/tokens.ts`** (also consumed by the
companion and the contrast tests). `globals.css` mirrors them. The contrast
contract (`src/design/tokens-contrast.test.ts`) fails CI if any subject breaks
WCAG AA.

## Recipe: add a new subject

1. Pick a **blue-family** accent (keep the declension principle).
2. In `src/design/tokens.ts`: add the id to `SUBJECTS` and a `TOKENS` entry —
   `accent` (light+dark), `accentFill`, `gradientStops`, `onAccent`,
   `accentSoft` (light+dark). (`SubjectId`/`SUBJECTS` are defined in
   `src/core/domain/subject.ts` and re-exported from `tokens.ts`.)
3. Run `npx vitest run src/design/tokens-contrast.test.ts`. Adjust hexes until
   AA passes — do not weaken thresholds.
4. Mirror the values into `globals.css` as a `[data-subject="<id>"]` block plus a
   `.dark [data-subject="<id>"]` block. If gradient, add the `[data-subject="<id>"]
   .accent-fill/.accent-text` rules (copy the `ai` pattern).
5. Add the trigger to `src/core/domain/subject.ts` (category map and/or
   `TAG_GROUPS`), with a test in `subject.test.ts`.
6. (Phase 2+) The companion picks it up automatically via the active subject.
