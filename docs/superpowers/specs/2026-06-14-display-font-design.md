# Display font (Dragonsteel) — design

**Date:** 2026-06-14
**Branch:** `add-dragonstell-font`
**Status:** approved (design), pending implementation plan

## Goal

Give the site a second typeface for *personality* without disturbing its clean,
Inter-based reading experience. Inter keeps the **text role**; a licensed display
face (SimpleBits **Dragonsteel**, https://simplebits.shop/products/dragonsteel)
takes a single **signature role** — the brand wordmark.

## Decisions (locked during brainstorming)

- **Dose: signature only.** Dragonsteel appears on the nav wordmark and nowhere
  else. All headings, body, and the footer copyright stay Inter. (Larger doses —
  eyebrows/labels, or headlines — were rejected as too much identity for the
  restrained aesthetic.)
- **Cut: Regular.** Rough and Sharp are licensed and on disk but not shipped.
- **Token name: `--font-display`.** Role-accurate, conventional, leaves room to
  grow if the display role later expands.
- **Coordination: option A.** Build a self-contained, shippable typography token
  layer on this branch. Do **not** couple to the unmerged `avatar-mascot-design-
  system` (token system) or `origin/feat/storybook-stories` (Storybook) branches.

## Why a typography layer (the "augment")

The `avatar-mascot-design-system` branch defines a three-layer token system
(primitives → semantic → subject skins) for **color only** — it has no typography
layer. This work adds the first typography token (`--font-display`) shaped so that
branch can absorb it later with no rework.

## Scope

### In scope
1. **Font loading.** Load Dragonsteel Regular via `next/font/local` (woff2 only —
   `next/font` self-hosts and woff2 covers all modern targets) exposing CSS var
   `--font-display`. Inter's existing
   `next/font/google` setup (`--font-inter` → `--font-sans`) is untouched.
2. **Token registration.** Add `--font-display` to the `@theme inline` block in
   `src/app/globals.css` so Tailwind v4 emits a `font-display` utility, mirroring
   the existing `--font-sans` mapping.
3. **Apply.** Add the `font-display` utility to the `"Titouan Lebocq"` wordmark
   text in `src/components/nav.tsx` (the text node beside the `<Logo>` SVG). One
   line. Nothing else changes.
4. **License.** Store the SimpleBits Dragonsteel license text alongside the font
   files in the repo.

### Out of scope (deferred follow-ups, per option A)
- Mirroring `--font-display` into `avatar-mascot-design-system`'s `tokens.ts` and
  `docs/design-system.md` typography section.
- A `typography.stories.tsx` in the `origin/feat/storybook-stories` idiom.
- Shipping the Rough / Sharp cuts.
- Applying the display face anywhere beyond the wordmark.

## Files

| File | Change |
|---|---|
| `src/app/fonts/Dragonsteel-Regular.woff2` | new — shipped font (Regular only; woff2 only — `next/font` self-hosts and woff2 covers all modern targets) |
| `src/app/fonts/LICENSE.txt` | new — SimpleBits license / purchase note |
| `src/app/[lang]/layout.tsx` | add `localFont` loader beside `inter`; add `--font-display` var to `<html>` className |
| `src/app/globals.css` | add `--font-display: var(--font-dragonsteel), ...` to `@theme inline` |
| `src/components/nav.tsx` | wordmark text gets `font-display` utility |

(Exact var wiring — whether the loader's `variable` is `--font-dragonsteel`
feeding `--font-display`, or the loader sets `--font-display` directly — is an
implementation detail for the plan. The consumed token is `--font-display`.)

## Constraints

- **No drive-by refactor.** Inter's setup stays as-is; the local font is added
  beside it. No restructuring of `layout.tsx` font handling beyond the addition.
- **This is breaking-Next.js territory** (per `AGENTS.md`): consult
  `node_modules/next/dist/docs/` for the current `next/font/local` API before
  writing the loader — APIs may differ from training data.
- **Performance:** ship one cut only; `font-display: swap`; rely on `next/font`'s
  self-hosting + preload. No FOUT regression vs. the current single-font state.

## Testing & verification

This branch **does** have a test harness — `vitest` + `@testing-library/react` +
`jsdom` (`vitest.config.ts`), with an existing `src/components/nav.test.tsx`. The
wordmark *wiring* is unit-testable; the *font rendering* (does the glyph file
actually load) is not, and is verified manually.

- **Unit (TDD):** extend `nav.test.tsx` — the wordmark element carries the
  `font-display` class. (Asserts the wiring, not the rendered glyphs.)
- **Manual:** app builds (`npm run build`) and runs; wordmark renders in
  Dragonsteel while everything else stays Inter (light + dark); the woff2 loads
  (no 404), is self-hosted by `next/font`, no layout-shift/FOUT regression.

## Risks

- **Wrong `next/font/local` API** from stale training data → mitigated by reading
  the bundled Next docs first.
- **Token drift** if/when the design-system branch merges → mitigated by naming
  and shaping the token to match that system now; reconciliation is a tracked
  follow-up.
