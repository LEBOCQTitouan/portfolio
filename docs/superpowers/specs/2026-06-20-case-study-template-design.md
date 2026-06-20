# Case-study template — design spec

- **Date:** 2026-06-20
- **Status:** Approved (brainstorm complete) — pending spec review
- **Scope:** Augmentation opportunity #1 (work/case-study pages) only. Opportunities #2–#5 (card micro-interactions, companion narrative depth, /uses & /now, hero+contact) are separate spec→plan→implement cycles.

## Context

`src/app/[lang]/work/[slug]/page.tsx` renders a project as a header (category badge, role, morphing title, summary, stack pills, repo/demo links) followed by a raw MDX dump inside `.prose-content`. The three project files (`content/en/projects/*.mdx`) are ~10 body lines each — an `## Overview` paragraph plus a `## Highlights` bullet list. There is no visual storytelling: no narrative spine, no result metrics, no figures, no emphasis. A portfolio's case-study page is the artifact that justifies the whole site, and today it is the weakest surface.

The foundation is strong and is treated as a **fixed input**, not something to redesign:
- Subject theming via `data-subject` driving `--accent / --accent-fill / --accent-soft` (already set on the `<article>` from `resolveSubject({ category })`).
- View Transitions, page auras, reduced-motion + WCAG contrast handling, the companion orb.
- Content pipeline: `gray-matter` parses frontmatter, `parseProject` (Zod) validates it, `next-mdx-remote/rsc` renders the body with a components map (`mdx.tsx`, currently maps only `pre`), Shiki for code.

## Goals

1. Turn the case-study page into a scannable, subject-themed narrative: aura hero, result metrics, a problem→approach→outcome arc, and emphasis (quotes, figures, inline metrics) where it earns its place.
2. Survive a 30-second skim — the chrome (hero + metric strip) carries the load.
3. Keep authoring ergonomic: prose stays MDX prose; structure stays in headings; only emphasis is componentized.
4. No new runtime dependency; no JSON/array block engine; no locked section template.

## Non-goals

- No headless CMS, no Velite/Contentlayer/Content-Collections migration (existing `gray-matter` + Zod already is the recommended typed-frontmatter pattern; Contentlayer is unmaintained and App-Router-incompatible).
- No image-dependent "cinematic" layout — we have no real assets; figures degrade to themed placeholders.
- No French content (i18n structure is ready; translation is a separate content task).
- No changes to tokens, theming, the motion/transition engine, or the companion (its `data-narrate` hooks are preserved for opportunity #3).

## Architecture decision & rationale

A deep-research audit (22 sources, 25 claims adversarially verified) tested the originally proposed "block-hybrid." Verdict: keep two instincts, drop a third.

- **Keep — schema-validated chrome in frontmatter.** MDX docs: frontmatter is the right home for structured metadata because it is extractable from the filesystem before compilation (needed for listing/index pages). It is also the part that survives a skim.
- **Keep — a small set of inline MDX components** for emphasis that can appear mid-narrative (pull-quote, figure, inline metric).
- **Drop — a rigid `<Section kind="problem|approach|outcome">` spine.** "Fixed section order / fixed narrative sequence" claims were refuted 0–3 three separate times. The arc is a guideline framed around decisions and trade-offs, not a locked template. The spine is therefore plain MDX headings the author can reorder, rename, or omit.
- **Drop — a JSON/array block model and any new content-layer tool.** Over-engineering for 3–5 hand-authored documents; reintroduces the prose-in-YAML pain the ecosystem designed against.

Position on the spectrum: between minimalist cards (e.g. Brittany Chiang, no case-study routes) and a full block-array CMS. We sit at **typed chrome + light inline MDX + prose narrative**.

### Resolved open questions (defaulted; adjustable at spec review)
- **Depth:** Allow moderate depth — the audience includes peers and clients, not only recruiters — but keep every section scannable (headings, short paragraphs). No hard length cap.
- **Inline component set:** `PullQuote`, `Figure`, `Metric`. Starting set; can grow later.

## Data model changes

`src/core/domain/project.ts` — add a metric type and one field; all existing fields unchanged.

```ts
const metricSchema = z.object({
  value: z.string().min(1),   // "12ms" · "42%" · "10k/s" · "0"
  label: z.string().min(1),   // "p99 write latency"
});

// inside frontmatterSchema, alongside current fields:
metrics: z.array(metricSchema).max(4).default([]),
```

```ts
// add to the Project type:
metrics: { value: string; label: string }[];
```

`max(4)` keeps the strip scannable; `default([])` means existing files without metrics still parse and the strip renders nothing.

## Components

New folder `src/components/case-study/`. Chrome components are driven by frontmatter and composed by the page; inline components are registered in the MDX components map.

```ts
// chrome — composed by page.tsx
CaseHero({ title, summary, role, stack, category, links })   // aura header
MetricStrip({ metrics })                                     // returns null when metrics is empty

// inline — registered in mdx.tsx, placed by the author in the body
Metric({ value, label })                 // emphasis stat callout mid-narrative
PullQuote({ children, cite? })           // quote breaking the column
Figure({ src?, alt?, caption? })         // image/diagram slot; no src → themed placeholder
```

Behavior notes:
- `CaseHero` absorbs the existing header markup (badge, role, `MorphTitle`, summary, stack pills, repo/demo links) so the page composes hero + strip + body. It keeps the `data-narrate="project-header"` hook.
- `MetricStrip` renders a responsive row of up to 4 stat callouts using `--accent` / `--accent-soft`; collapses to wrap on small screens.
- `Metric` is the same visual unit as one strip cell, usable inline.
- `Figure` with no `src` renders a labelled, subject-tinted placeholder (caption shown) so pages look intentional before assets exist; with `src` it renders the asset from `public/` with the caption.
- `PullQuote` uses the accent as a left rule; optional `cite`.

## Page composition

`src/app/[lang]/work/[slug]/page.tsx`:
- Keep `generateStaticParams`, `generateMetadata`, locale handling, `data-subject` on the `<article>`, and both `data-narrate` hooks.
- Replace the inline header JSX with `<CaseHero …>`.
- Insert `<MetricStrip metrics={project.metrics} />` between hero and body.
- Keep `<div data-narrate="project-body"><Mdx source={project.content} /></div>`.

`src/components/mdx.tsx`: extend the `components` map with `Metric`, `PullQuote`, `Figure` (alongside `pre`). No pipeline changes.

> AGENTS.md: `page.tsx` is a normal RSC route, not a framework-convention file (proxy/middleware), so no special-case reading is required — but the implementation plan must still confirm against `node_modules/next/dist/docs/` before touching any convention-bound file.

## Layout

Single-column editorial spine (the recommended direction), max content width consistent with the rest of the site:
1. **Aura hero** — subject-tinted, badge + role, morphing title, summary (reused as the hero thesis line; no new field), stack pills, links.
2. **Metric strip** — up to 4 result callouts directly under the hero (the skim payload).
3. **Narrative** — MDX prose with `##`/`###` headings (problem → approach → outcome as a guideline), broken by `PullQuote`, `Figure`, and inline `Metric` where useful.

Upgrade path (not in scope): the same data supports a later cinematic/scrolly layout (#3 companion narration per section) with zero schema rework.

## Styling

`src/app/globals.css` — additive only, reusing existing CSS variables:
- `.case-hero` aura treatment (lean on existing aura/`--accent-soft` patterns).
- `.metric-strip` / `.metric` — accent-bordered callouts, responsive wrap.
- `.pull-quote` — accent left rule, emphasis type.
- `.figure` / `.figure-placeholder` — dashed subject-tinted frame + caption.
- Tighten `.prose-content` heading rhythm only if needed for the spine; otherwise reuse as-is.

## Accessibility & motion

- All new color pairings go through the existing contrast handling; metric/figure text meets WCAG AA on `--accent-soft` backgrounds (verify with the existing `contrast.ts` approach).
- Any hover/entrance motion respects `prefers-reduced-motion` (consistent with the existing engine). The template itself needs no new motion — that is opportunity #2/#3 territory.
- `Figure` requires `alt` when `src` is present; placeholder figures are decorative/labelled by caption.

## Content changes

Rewrite the three files in `content/en/projects/` to exercise the template with real narrative:
- Add `metrics:` frontmatter (drawn from each project's existing highlight numbers — e.g. ledger's `p99 < 12ms`, `10k/s`).
- Expand the body from Overview+Highlights into a scannable problem → approach → outcome narrative with at least one `PullQuote` and one `Figure` placeholder per study, and inline `Metric` where a number lands.
- Keep each section short and skimmable; moderate depth allowed.

## Testing

- **Domain:** extend `src/core/domain/project.test.ts` — `metrics` parses, defaults to `[]`, rejects malformed entries, enforces `max(4)`.
- **Components:** unit tests for `MetricStrip` (renders n cells, returns null when empty), `Figure` (placeholder vs. asset branch, alt requirement), `PullQuote`, `Metric`. Follow the existing `*.test.tsx` patterns (see `project-card.test.tsx`).
- **Stories:** Storybook stories for the new components, matching existing `*.stories.tsx` conventions (CI lints these).
- **Render:** the existing project page should build for all three slugs via `generateStaticParams`; confirm no MDX runtime errors with the new components registered.

## File-by-file change list

| File | Change |
|---|---|
| `src/core/domain/project.ts` | Add `metricSchema`, `metrics` field on schema + `Project` type |
| `src/core/domain/project.test.ts` | Tests for `metrics` parsing/defaults/limits |
| `src/components/case-study/case-hero.tsx` | New — hero chrome (absorbs current header) |
| `src/components/case-study/metric-strip.tsx` | New — result callouts from frontmatter |
| `src/components/case-study/metric.tsx` | New — inline stat callout |
| `src/components/case-study/pull-quote.tsx` | New — emphasis quote |
| `src/components/case-study/figure.tsx` | New — figure/placeholder slot |
| `src/components/case-study/*.test.tsx` / `*.stories.tsx` | New — tests + stories per component |
| `src/components/mdx.tsx` | Register `Metric`, `PullQuote`, `Figure` |
| `src/app/[lang]/work/[slug]/page.tsx` | Compose hero + strip + body; preserve `data-subject` and `data-narrate` |
| `src/app/globals.css` | Additive `.case-hero/.metric-strip/.metric/.pull-quote/.figure*` styles |
| `content/en/projects/*.mdx` | Add `metrics`, expand narrative with components |

## Out of scope (tracked for later)

- #2 Card micro-interactions (Phase 1 pairing, separate spec).
- #3 Companion narrative depth (depends on this; `data-narrate` hooks preserved).
- #4 /uses & /now (design-vs-cut decision deferred to Phase 3).
- #5 Hero dimensionality + contact moment.
- French translations.
