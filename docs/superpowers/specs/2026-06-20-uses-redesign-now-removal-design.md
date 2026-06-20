# Design — `/uses` redesign + `/now` removal

Date: 2026-06-20
Status: Approved (brainstorm) — pending implementation plan

## Summary

One branch, one PR, two parts:

1. **Redesign `/uses`** into an opinionated, fully-localized, typed page — each tool
   carries a one-line *why* (the tradeoff/taste behind the pick), so the page earns
   the site's "systems thinking + design taste" spine instead of reading as a generic
   checklist.
2. **Remove `/now`** end-to-end. Its value proposition is freshness; it is already a
   month stale and is the lowest-leverage item on the roadmap. Cutting it removes a
   recurring maintenance tax and a credibility risk. Reintroduction is explicitly a
   separate, later piece of work (own handoff), not part of this change.

## Decisions (from brainstorm)

- **Voice:** opinionated list — one-line `why` per pick (not a flat list, not a narrative essay).
- **Content source:** typed domain module + Zod schema + test (mirrors `project.ts` / `post.ts`); not a hardcoded page array, not MDX.
- **i18n:** fully localized — category titles and `why` lines exist in both `en` and `fr`.
- **Layout:** aligned `name | why` rows per category, made responsive (stacks to name-over-why on narrow screens so long French `why` lines never cramp).

## Part 1 — `/uses`

### Domain module — new `src/core/domain/uses.ts`

Mirror the structure and validation style of `src/core/domain/project.ts`.

```ts
import { z } from "zod";
import type { Locale } from "@/core/domain/locale";

const usesItemSchema = z.object({
  name: z.string().min(1),
  why: z.string().min(1),
});

const usesCategorySchema = z.object({
  title: z.string().min(1),
  items: z.array(usesItemSchema).min(1),
});

export type UsesItem = z.infer<typeof usesItemSchema>;
export type UsesCategory = z.infer<typeof usesCategorySchema>;

// Fully localized (decision B). Both locales validated at module load.
const rawUses: Record<Locale, unknown[]> = {
  en: [ /* categories: Editor & Terminal, Languages & Tooling, Hardware, Services */ ],
  fr: [ /* same categories, translated titles + why lines */ ],
};

export const uses: Record<Locale, UsesCategory[]> = {
  en: z.array(usesCategorySchema).parse(rawUses.en),
  fr: z.array(usesCategorySchema).parse(rawUses.fr),
};

export function getUses(locale: Locale): UsesCategory[] {
  return uses[locale];
}
```

- `Locale` is imported from `@/core/domain/locale` (already lives in the domain — see PR #22).
- Tool names carry over from today (VS Code, Neovim, Ghostty, zsh + starship, TypeScript, Go, Rust, MacBook Pro, etc.); each gains a `why`. French tool names are identical; only category titles + `why` lines are translated.

### Tests — new `src/core/domain/uses.test.ts`

Follow `project.test.ts`:

- Schema **accepts** a valid category; **rejects** empty `name`, empty `why`, and an empty `items` array.
- **Structural-parity test:** `en` and `fr` have identical category count, identical category order (by position), and identical item count per category. A missing or out-of-sync French translation therefore fails CI.

### Page — `src/app/[lang]/uses/page.tsx`

- Replace the hardcoded `categories` const with `getUses(lang)`.
- Replace the placeholder intro (`"The tools I reach for day to day. (Edit this list.)"`) with a localized `dict.uses.intro`.
- Render **layout C** per category: a `name | why` two-column aligned row grid; responsive — collapses to stacked (name over why) on narrow screens.
- Preserve existing `MorphTitle` wrapper (`PAGE_TITLE`) and `data-narrate` hooks (`intro` on the intro paragraph, `tools` on the list container). The narration `script.ts` `/uses` entries stay unchanged.

### Chrome (i18n) — `src/i18n/dictionaries/en.ts` + `fr.ts`

- Keep existing `uses.title` and `uses.metaDescription`.
- **Add** `uses.intro` (localized) to replace the placeholder line.
- Category titles + `why` lines live in `uses.ts`, not the dictionaries.

## Part 2 — Remove `/now`

Delete every touch point (from the reference map):

| File | Change |
|------|--------|
| `src/app/[lang]/now/page.tsx` | Delete the whole route directory |
| `src/components/footer.tsx` | Remove the `/now` `<Link>` (the `t.now` block, ~lines 17–22) |
| `src/lib/narration/script.ts` | Remove `/now` entries in **both** `en` and `fr` |
| `src/i18n/dictionaries/en.ts` | Remove the entire `now.*` object **and** the `footer.now` label |
| `src/i18n/dictionaries/fr.ts` | Remove the entire `now.*` object **and** the `footer.now` label |
| `src/app/sitemap.ts` | Drop `/now` from `staticPaths` |

After removal, grep the repo for `"/now"`, `footer.now`, `dict.now`, and `now:` to confirm no dangling references remain.

## Testing & verification gate

Tests are part of done. Before opening the PR, all of the following must be green:

- `npx tsc --noEmit`
- `npm test`
- `npm run lint`
- `npm run build`

New/changed test coverage: `uses.test.ts` (schema + locale parity). The narration
resolver and footer tests do not currently assert `/now`, so removal needs no test
deletions there — but re-run the full suite to confirm.

## Out of scope

- Tokens / theming / motion / companion — fixed inputs, not touched.
- `/now` reintroduction — a later, separate piece of work. A copy-pastable handoff
  for reintroducing it correctly (content file + real `updated:` frontmatter date +
  staleness guard) is delivered **after this branch merges to main**, per the owner's
  request.
- No unrelated refactors.

## Risks / notes

- Next 16 conventions: consult `node_modules/next/dist/docs/` before touching routing
  / metadata conventions; respect `src/proxy.ts` locale handling.
- Dictionary edits are per-locale — `en` and `fr` must stay in lockstep (the parity
  test enforces this for `uses` content; the `now.*` removal must be mirrored manually).
```
