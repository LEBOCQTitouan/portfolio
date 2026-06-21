# Companion narrative depth — case-study section narration

**Date:** 2026-06-21
**Status:** Approved (design); ready for implementation plan
**Branch:** `companion-section-narration`
**Roadmap:** Portfolio augmentation #3 (Phase 2). Builds on #1 (case-study template, PR #25).

## 1. Problem & goal

The companion orb is a well-tested, expensive mascot with thin per-context
narration. On a case study it has exactly two anchors — `project-header` and
`project-body` — so the entire `## problem / ## approach / ## outcome` argument is
narrated by a single vague line ("And here's how it actually came together.").

Goal: make narration **section-aware on case studies** so the orb guides a reader
through the problem→approach→outcome arc — turning decoration into a wayfinding
feature — **without** resurrecting a locked `<Section>` template (which #1
deliberately rejected) and **without** re-physics-ing the orb (its motion/spring
engine is a fixed input).

## 2. Decisions (locked during brainstorm)

1. **Anchors come from a rehype "sectionize" plugin** (not a wrapper component, not
   bare `<h2>` anchors). MDX authoring stays plain markdown.
2. **Keying is first/last, not pure ordinal:** first section → `section-1`, last
   section → `section-last`, middles → `section-2`, `section-3`, … This keeps the
   closing "outcome" line landing on the last beat whether a study has 3 beats
   (problem/approach/outcome) or 4 (situation/decision/tradeoff/outcome). Robust to
   heading *wording* drift (the editorial guide and the current MDX already
   disagree on heading names).
3. **Content is a hybrid (voice C over voice B):** per-project narration authored in
   MDX frontmatter (`narrate:`), falling back to a rewritten generic arc when a
   project omits it. No per-project authoring is *required*; every project narrates
   something.
4. **One technical path, two editorial flavors.** "Simplified" (text) vs "advanced"
   (demos/UI) is purely what an author places under each `##` heading — no `kind`
   flag, no second template, no branching. Documented as authoring guidance only.
5. **Text only.** "Narration" is rendered text in the existing `SpeechBubble`. No
   audio/TTS. Existing mute / reduced-motion / dock behavior is untouched.

## 3. Architecture — two channels meeting at the active section

Per-project **text** rides the DOM on the anchors the orb already observes;
**mood + generic fallback text** stay centralized in `script.ts`. They meet at a
single merge point in the companion's render.

```
BUILD/SERVER (RSC)
  ledger-engine.mdx (frontmatter: narrate.header + narrate.beats[])
     │ MdxContentRepository.parseProject → Project.narrate
     ▼
  page.tsx ─┬─ <CaseHero narrateHeader> ───────────────► <header data-narrate="project-header"
            │                                                     data-narrate-text="…">
            └─ <Mdx narrateBeats> → rehypeNarrateSections(options.texts)
                                          │
                                          ▼
               <section data-narrate="section-1"  data-narrate-text="…">…</section>
               <section data-narrate="section-2"  data-narrate-text="…">…</section>
               <section data-narrate="section-last" data-narrate-text="…">…</section>
                  (data-narrate-text omitted on any beat the author didn't write)
                                          │  serialized HTML → DOM
   ══════════ CHANNEL 1: per-project TEXT on the DOM ══════════
                                          ▼
CLIENT RUNTIME — companion.tsx
   getNarration(pathname, lang)  ◄══ CHANNEL 2: MOOD + generic fallback (script.ts "/work/[slug]")
   IntersectionObserver over [data-narrate] → pickActiveSection → id
   on active change: setActive({ route, id, text: el.dataset.narrateText })
   render:  text = resolveLineText(active.text, line.text)   // ch.1 wins when present
            mood = line.mood                                  // always ch.2
```

**Division of labor:** `script.ts "/work/[slug]"` defines moods + fallback text for
`project-header / section-1 / section-2 / section-3 / section-last`. Frontmatter
overrides **text** only, **positionally** (`beats[i]` → i-th section). Authors never
pick moods. The resolver signature is unchanged.

## 4. Components & contracts

### 4.1 Domain — `src/core/domain/project.ts`
```ts
type ProjectNarration = { header?: string; beats?: string[] };
type Project = { /* …existing… */ narrate?: ProjectNarration };
```
Parsed in `src/adapters/content/mdx-content-repository.ts` (`parseProject`).
Validation is forgiving: a malformed/absent `narrate` block → `undefined` (never
throws); `header` must be a string or it's dropped; `beats` must be an array of
strings (non-string entries dropped). Frontmatter lives in `content/en/projects/*`
(projects are EN-only today; FR falls back to the EN file — see §7).

### 4.2 Rehype plugin — `src/lib/mdx/rehype-narrate-sections.ts` (NEW)
```ts
rehypeNarrateSections(options?: { texts?: string[] }): (tree: Root) => void;
```
- Walks **top-level** `tree.children`. Each `element` with `tagName === "h2"` opens
  a new group collecting itself + all following siblings until the next `h2`.
- Nodes before the first `h2` are "lead" — left outside any section (rendered
  normally, unnarrated).
- No `h2` → tree untouched (returns early).
- Each group becomes `<section>` with `data-narrate` keyed first/last/ordinal
  (§2.2). If `options.texts[i]?.trim()` is non-empty, also set `data-narrate-text`.
- Only special-cases `h2`; every other node type (including `mdxJsxFlowElement`
  custom components, code blocks, text) is moved verbatim into its group. **The
  plugin never inspects or transforms section contents.**
- Single-section edge: index 0 is both first and last → `section-1` wins (first
  check). Acceptable (degenerate study).

Registered in `src/components/mdx.tsx` between `rehypeSlug` and Shiki:
```ts
rehypePlugins: [rehypeSlug, [rehypeNarrateSections, { texts: narrateBeats ?? [] }],
  [rehypeShikiFromHighlighter, hl, { /* … */ }]]
```
(Shiki recurses, so wrapping `<pre>` in `<section>` does not affect highlighting.)

### 4.3 Pure helper — `src/lib/narration/resolve-line-text.ts` (NEW)
```ts
resolveLineText(datasetText: string | undefined, fallback: string): string;
// returns datasetText when it is a non-empty trimmed string, else fallback
```

### 4.4 Component prop changes
- `Mdx({ source, narrateBeats?: string[] })` — passes `narrateBeats` to the plugin.
- `CaseHero({ project, labels, narrateHeader?: string })` — spreads
  `data-narrate-text={narrateHeader}` onto the existing `project-header` header when
  present.

### 4.5 Page — `src/app/[lang]/work/[slug]/page.tsx`
- **Drop** `data-narrate="project-body"` from the body wrapper (per-section anchors
  replace it; keeping it would always out-rank inner sections in
  `pickActiveSection`). Keep the `mt-8` wrapper div otherwise.
- Pass `narrateHeader={project.narrate?.header}` to `CaseHero` and
  `narrateBeats={project.narrate?.beats}` to `Mdx`.

### 4.6 Companion — `src/components/companion/companion.tsx`
- Extend active state to `{ route, id, text? }`. In the IntersectionObserver
  callback where the active id is chosen, capture
  `text: document.querySelector('[data-narrate="<id>"]')?.dataset.narrateText`.
- At render: `text = resolveLineText(active?.text, activeLine.text)`; pass `text` to
  `SpeechBubble`; `mood` stays `activeLine.mood`. No change to motion, mute, dock,
  or reduced-motion paths.

### 4.7 Script — `src/lib/narration/script.ts`
Replace the two-line `"/work/[slug]"` entry (EN **and** FR) with the voice-B
generic arc + moods:

| key | mood | EN (fallback) |
|---|---|---|
| `project-header` | warm | "Pull up a chair — every project here is a small story." |
| `section-1` | focused | "It always starts with something quietly broken." |
| `section-2` | calm | "So I made a bet on how to fix it. Here's the bet." |
| `section-3` | focused | "Every bet costs something. Here's what this one cost." |
| `section-last` | warm | "And here's how it paid off." |

FR equivalents written in the same arc (kept in sync — both locales required).
Final EN/FR copy may be polished during implementation; moods + keys are fixed.

## 5. Authoring contract (for `docs/writing-guide.md`)

A finished, narrated case study is **one MDX file**. Authors write:
- existing frontmatter + an optional `narrate:` block:
  ```yaml
  narrate:
    header: "Realtime Sync. The promise: your edits never collide, never vanish."
    beats:
      - "Last-write-wins quietly ate people's work…"
      - "So I bet on CRDTs: merge by construction…"
      - "Now it's zero lost edits in prod, and it just works on a plane."
  ```
- plain `## headings` + prose, plus any components under the relevant heading.

Rules that fall out:
- **Headings define beats; everything else rides inside its beat.** Content before
  the first `##` is unnarrated lead.
- **Want a demo to be its own beat?** Give it its own `## heading`.
- **`beats` map positionally, top-to-bottom, onto `##` sections.** Fewer beats than
  sections → the first N override, the rest fall back. More → extras ignored.
- **Omit `narrate` (or any field)** → generic voice-B arc. Existing projects keep
  working untouched.
- **Two editorial flavors** (text-led vs demo-led) are guidance only — same file
  shape, same narration; flavor = how much you put under each `##`.

## 6. Custom elements support

Code snippets, custom MDX components (live widgets, playgrounds), and animations
(baked `<video>`/GIF or computed components) are fully supported with **no special
narration syntax** — they are ordinary nodes swept into their section untouched.
New interactive components are registered once in `mdx.tsx`'s `components` map (as
`Pre`/`Metric`/`PullQuote`/`Figure` already are) and ship JS only on pages that use
them. Building such components is per-article author work, **out of scope for this
branch**.

## 7. Locale handling

Projects are EN-only today; `/fr/work/*` renders the EN file (existing fallback).
Consequently the orb speaks the EN frontmatter lines on `/fr` case studies —
matching the EN page content. The FR voice-B fallback (from `script.fr`) appears
only when a project has no `narrate` block. When FR project translations are added
later they carry their own `narrate`. This is consistent and intentional.

## 8. Out of scope (flag, don't build)

- **Full-bleed / wide layout** for large demos breaking the prose column — a
  component/CSS layout concern, not narration. Note for a future branch.
- **Copy refresh of other routes** (landing/about/uses/now) — independent
  copy-editing, its own pass. This branch is case-study narration only.
- **Per-slug narration in the resolver** — frontmatter override makes it
  unnecessary; YAGNI.

## 9. Test plan

All tests are part of done. Local gate (must all pass):
`npx tsc --noEmit` **and** `npm test` **and** `npm run lint` **and** `npm run build`
(build alone misses test-file type errors).

- **`rehype-narrate-sections.test.ts`** (pure, on a hast fixture):
  - 3 sections → keys `section-1`, `section-2`, `section-last`.
  - 4 sections → `section-1`, `section-2`, `section-3`, `section-last`.
  - 1 section → `section-1`.
  - 0 `h2` → tree unchanged.
  - lead content before first `h2` stays outside sections.
  - `options.texts` → `data-narrate-text` set positionally; empty/missing entry →
    attribute absent; extra texts ignored.
- **MDX nesting render test (the one real risk):** render an MDX fixture containing
  a `<PullQuote>`, a fenced code block, and a custom component through the real
  `Mdx` pipeline; assert it **compiles** and the components render **inside** their
  `<section data-narrate>` wrappers. Catches any `next-mdx-remote` quirk with
  `mdxJsxFlowElement` re-parented under a plugin-injected hast element.
- **`resolve-line-text.test.ts`** (pure): override wins when non-empty/trimmed;
  fallback used for `undefined`/empty/whitespace.
- **Content repo test:** `parseProject` reads a valid `narrate`; missing block →
  `undefined`; malformed block (non-string header, non-array/non-string beats) →
  gracefully dropped, never throws.
- **Resolver test:** `getNarration` still resolves `/work/<slug>` to the
  `"/work/[slug]"` entry; updated lines/keys present for EN and FR.
- **Companion:** the new behavior is a one-line merge via the pure helper (covered
  by `resolve-line-text.test.ts`); avoid brittle IO/DOM tests in the orb.

## 10. Don't re-trip (project gotchas)

- Next 16 proxy rule lives in `src/proxy.ts`, not root `middleware.ts`.
- Read `node_modules/next/dist/docs/` before touching Next conventions (AGENTS.md).
- New narration lines required for **both** `en` and `fr`.
- Respect `prefers-reduced-motion` (companion already handles it; we add no motion).
- Treat the orb motion/spring engine as fixed input — content + anchors only.
```
