# Design — Subject-color policy & surface coherence

**Date:** 2026-06-21
**Status:** Approved (design); pending implementation plan
**Governing principle:** *Color is earned, not ambient.*

## Problem

The portfolio has strong foundations (semantic tokens, 4-subject skins, contrast
tests, motion/radius/type scales) but two coherence gaps remain:

1. **The default page never reads as brand.** `globals.css` recolors the page
   aura with `body:has([data-subject="X"])`. `:has()` matches *any* descendant,
   so on list/home pages — where every card sets its own `data-subject` for its
   hover glow — the whole-page aura (and the companion's `--subject-accent`) gets
   hijacked by whatever card mix is present (last matching rule wins: ai >
   interface > systems). The result is a pink/teal/violet ambient field on pages
   that should be brand-blue. The recolor was only ever correct on **detail
   pages**, which set a single `data-subject` on their `<article>`.

2. **Subject color is always-on and polychrome at rest**, which fights the
   otherwise sober, near-monochrome, single-accent aesthetic. The work/blog row
   badges are filled tinted pills (teal/pink) that shout against a grayscale
   page, and they use a *different* pill language than the hairline stack pills
   directly below them (two treatments for one role).

3. **Surfaces lack a shared vocabulary.** "Card" means four different things —
   borderless rows, and filled boxes at `rounded-lg`/`xl`/`2xl` with varying
   padding. Case-study blocks (`Figure`, `PullQuote`, `MetricStrip`) are each
   bespoke and don't read as the same family as the rest of the site.

## Goals

- List/home pages rest in **brand**; subject color appears only on **hover** (a
  row) and on **commit** (opening a case study / post).
- One pill language; one surface family (Row / Card / Panel).
- Preserve every existing *effect* — cursor-tracking glow, edge-light,
  view-transition aura recolor, the 4-subject palette and its contrast contract.

## Non-goals

- Changing the subject palette values or the contrast tests' thresholds.
- Touching the companion orb's internal animation/personality.
- Reworking typography/motion/radius scales (already shipped).

## Governing principle: three color states

| State | Where | Color |
|---|---|---|
| **Rest** | home + all list/index pages | monochrome + **brand** only |
| **Hover** | a single row | *that row's* subject blooms (cursor glow, edge-light, badge dot/border, pills), recedes on leave |
| **Commit** | a case study / blog post detail page | the whole page adopts the subject (aura recolor via view-transition, accent text/links) |

At rest you can no longer distinguish subjects by *color* on lists (only by the
badge text). This is the deliberate sobriety the design buys.

---

## Area A — Aura & companion default-to-brand

**Root fix: split one attribute into two jobs.**

- `data-subject` (on cards) → drives **only** that card's local accent cascade,
  i.e. the cursor-glow / edge-light color (`color-mix(--accent)`). It must no
  longer reach the page aura. **Unchanged on the card components.**
- **New `data-page-subject`** (on a *detail page's* content root) → drives the
  **page aura** and the body-level `--subject-accent` (companion). List/home set
  nothing → brand default.

**Changes:**

1. `src/app/globals.css` — in the aura block (currently ~lines 221–227) and the
   `--subject-accent` lift block (~lines 231–236), change every
   `body:has([data-subject="X"])` selector to
   `body:has([data-page-subject="X"])`. The default `.page-aura` (brand light) and
   `.dark .page-aura` (brand dark) and `:root { --subject-accent: var(--accent) }`
   defaults are kept — they become the resting state for all non-detail pages.
2. `src/app/[lang]/work/[slug]/page.tsx` (~line 59) and
   `src/app/[lang]/blog/[slug]/page.tsx` (~line 68) — add `data-page-subject={s}`
   to the `<article>` *alongside* the existing `data-subject={s}`. (`data-subject`
   still drives the in-article `--accent` cascade for accent links/text;
   `data-page-subject` lifts the subject to the aura + companion.)
3. Card components (`project-card.tsx`, `post-card.tsx`) — **no change**; they
   keep `data-subject` only and therefore stop affecting the aura.

**Why two attributes, not "set body per route":** the App-Router `<body>` lives
in the root layout and a server page cannot mutate it without a hydration flash.
`:has([data-page-subject])` lets a server-rendered detail page declare its
subject in markup, SSR-correct, no client JS.

---

## Area B — Row & pill coherence

**One pill language, neutral at rest, blooms on row-hover.**

1. `CategoryBadge` (`category-badge.tsx`) — render as a **neutral hairline pill +
   a small dot**, not an accent-filled pill. Use `pillClass("muted", …)` plus a
   `<span class="dot">` (grey at rest). Tag it with a `card-subject` class so the
   row-hover rule can find it.
2. In-card pills go neutral at rest and bloom on row hover:
   - `project-card` stack pills already use `pillClass("muted")` inside
     `.card-pills` — already bloom via the existing
     `.card-glow:hover .card-pills > *` rule. **Kept.**
   - `post-card` tags via `TagPill` — change the in-card rendering to the
     **muted** pill treatment so post tags are neutral at rest and bloom on hover
     (consistent with project stack pills), rather than always-accent.
3. `globals.css` — extend the existing hover-tint rule so the subject badge + its
   dot colorize alongside the pills:
   ```css
   .card-glow:hover .card-subject,
   .card-glow:focus-within .card-subject { border-color: var(--accent); color: var(--accent); }
   .card-glow:hover .card-subject .dot,
   .card-glow:focus-within .card-subject .dot { background: var(--accent); }
   ```
4. Cursor-tracking glow + edge-light (`--mx/--my` via `GlowGroup`) — **unchanged.**

**Note:** `TagPill` used *standalone* (e.g. a tag-page header) keeps its own
accent treatment; only its in-card usage goes muted. The plan should make this an
explicit prop/variant rather than a global change to `TagPill`.

---

## Area C — Surface taxonomy (Row / Card / Panel)

Three tiers; article blocks fold into Panel. Add recipe helpers in
`src/components/ui/styles.ts` (mirroring `buttonClass`/`pillClass`):

| Tier | Recipe | Adopters |
|---|---|---|
| **Row** | no fill · `border-b border-border` · `py-6` · cursor-glow | `ProjectCard`, `PostCard`, uses rows (already this shape) |
| **Card** | `rounded-card border border-border bg-card p-5` · hover: lift + `border-accent` | `PillarCard` |
| **Panel** | `rounded-panel border border-border bg-card p-6` (+ `accent-soft` variant) | `Newsletter`, `ContactCta`, `CaseHero` (accent-soft), `Figure`, `PullQuote`, `MetricStrip`, `Metric` |

- Add `cardClass(opts?)` and `panelClass({ variant?: "default" | "accent-soft" })`.
- Migrate the adopters above; case-study blocks move from `rounded-lg`/bespoke to
  the `panelClass` recipe (radius `--radius-panel`, `border-border`) so articles
  match the site. Row stays as-is (optionally documented; no new component
  required).

---

## Testing

- **Aura sync:** extend `tokens-css-sync.test.ts` (or add a sibling) to assert
  the aura + `--subject-accent` selectors in `globals.css` key off
  `data-page-subject`, not `data-subject` — so the leak can't silently return.
- **Detail pages:** assert `work/[slug]` and `blog/[slug]` render
  `data-page-subject` on the article (extend existing page tests if present).
- **Cards:** update `project-card.test.tsx` / `post-card.test.tsx` for the new
  neutral-at-rest badge/pill classes; assert `data-subject` is still present
  (cursor-glow contract) and that no `data-page-subject` leaks onto cards.
- **Contrast:** unchanged palette → existing `tokens-contrast.test.ts` stays
  green. Add an assertion that muted badge text (`--muted`) meets AA on the page
  background, since the badge is no longer accent-on-accent-soft.
- Full `vitest run` + `eslint` must stay green; smoke all routes return 200.

## Risks & tradeoffs

- **Loss of at-rest color wayfinding** on lists — accepted, deliberate (badge
  text still conveys category).
- **`:has()` support** — already relied upon; no regression.
- **Two-attribute discipline** — a future detail page that forgets
  `data-page-subject` will render a brand aura (safe, sober failure) rather than a
  broken one. The sync test guards the CSS side.

## Rollout order (for the plan)

1. Area A (aura/companion brand-default) — isolated, high-impact, reversible.
2. Area B (row/pill bloom) — depends on nothing in A.
3. Area C (surface recipes + migration) — largest; do last.
