# Design — Reintroduce `/now` (with anti-rot)

Date: 2026-06-21
Status: Approved (brainstorm) — pending implementation plan

## Summary

Bring back the `/now` page that was removed in PR #26 (squash `102c925`), but only
with a freshness mechanism that makes staleness either visible or self-policing — the
original was cut precisely because it went stale with a hardcoded `"May 2026"` date.

Two-part anti-rot (**A + B**, decided in brainstorm):

- **A — Visible relative time.** The page renders "Updated N months ago" computed from a
  real ISO `updated` date via `Intl.RelativeTimeFormat`, localized to en/fr. Visitors
  (and the owner) see the rot. Never a hardcoded string.
- **B — Scheduled CI nag, single persistent issue.** A weekly GitHub Actions workflow
  checks whether `updated` is older than **45 days**; if so it opens *or updates* one
  persistent GitHub issue (never stacks duplicates), and closes it again once the page
  is fresh. It runs on its own schedule and **never touches `main`'s CI**.

Rejected: option **C** (a unit test that fails when stale) — it's a time-bomb that would
block unrelated PRs and pressure a mid-PR delete, the exact spiral that got `/now` cut.

Layout: **minimal restore** (mockup option A) — quiet muted relative-time line under the
title, then a focus list, then the nownownow.com link. No badges.

Content source: **typed domain module** `src/core/domain/now.ts` (Zod + test), mirroring
`uses.ts`. Focus bullets are **fully localized** (en + fr), enforced by a parity test —
the old page cheated by hardcoding English bullets even on the French route.

## Decisions (from brainstorm)

| Decision | Choice |
|---|---|
| Anti-rot mechanism | **A + B** (visible relative time + scheduled single-issue nag) |
| Staleness threshold | **45 days** |
| CI issue behaviour | **one persistent issue** — open/update if stale, close when fresh; never stack |
| Layout | **A — minimal restore** (muted relative-time line, plain focus list) |
| Content source | **typed module** `src/core/domain/now.ts` (Zod, mirrors `uses.ts`) |
| Localization | focus bullets in **both en + fr**, parity-tested |
| Relative-time render | `Intl.RelativeTimeFormat`, localized; computed from ISO `updated` |

## Part 1 — Domain module: new `src/core/domain/now.ts`

Mirror the structure/validation style of `src/core/domain/uses.ts`.

```ts
import { z } from "zod";
import { type Locale, locales } from "@/core/domain/locale";

/** Open the stale-nag issue once the page is older than this many days. Single
 *  source of truth — the CI workflow reads it from here (see Part 4). */
export const STALE_AFTER_DAYS = 45;

const focusSchema = z.array(z.string().min(1)).min(1);

const nowSchema = z.object({
  // ISO calendar date, e.g. "2026-06-21". Use z.iso.date() (Zod 4); verify the
  // exact API at implementation time against the installed zod (^4.4.3).
  updated: z.iso.date(),
  focus: z.object({
    en: focusSchema,
    fr: focusSchema,
  }),
});

export type NowContent = z.infer<typeof nowSchema>;

const raw = {
  updated: "2026-06-21", // ← bump this whenever focus changes; it drives A and B
  focus: {
    en: [
      "…", // owner-supplied; 2–4 lines, present tense
    ],
    fr: [
      "…", // same count as en (parity test enforces this)
    ],
  },
};

export const now: NowContent = nowSchema.parse(raw);

export function getNowFocus(locale: Locale): string[] {
  return now.focus[locale];
}

export function getNowUpdated(): string {
  return now.updated;
}

/** Whole-day difference between `updated` and a reference instant (default now). */
export function daysSinceUpdate(ref: Date = new Date()): number {
  const updatedMs = new Date(`${now.updated}T00:00:00Z`).getTime();
  return Math.floor((ref.getTime() - updatedMs) / 86_400_000);
}

/** True once the page is older than STALE_AFTER_DAYS. Used by Part 4. */
export function isStale(ref: Date = new Date()): boolean {
  return daysSinceUpdate(ref) > STALE_AFTER_DAYS;
}

/** Localized "2 months ago" / "il y a 2 mois", prefixed in the dictionary. */
export function relativeUpdated(locale: Locale, ref: Date = new Date()): string {
  const days = daysSinceUpdate(ref);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}
```

Notes:
- `updated` is a **single shared date**, not per-locale (the date is language-independent).
- Keep all freshness logic (`STALE_AFTER_DAYS`, `daysSinceUpdate`, `isStale`,
  `relativeUpdated`) in this module so the page and the CI workflow share one source.
- Functions take an injectable `ref` so tests are deterministic (no clock dependency).

## Part 2 — Tests: new `src/core/domain/now.test.ts`

Follow `uses.test.ts` / `project.test.ts`. Cover:

- **Schema:** accepts a well-formed object; rejects a non-ISO `updated`
  (e.g. `"May 2026"`); rejects an empty focus array; rejects an empty focus string.
- **Locale parity:** `now.focus.en` and `now.focus.fr` have identical length. (A missing
  French line therefore fails CI — same guard `uses.test.ts` provides.)
- **`isStale` / `daysSinceUpdate`:** with an injected `ref`, returns `false` just under
  the threshold and `true` just over it (construct `ref` from `updated` + N days).
- **`relativeUpdated`:** deterministic output for a fixed `updated` + injected `ref`, in
  both `en` ("… ago") and `fr` ("il y a …"). Assert the localized strings.

## Part 3 — Restore the route + chrome (everything PR #26 deleted)

| File | Change |
|------|--------|
| `src/app/[lang]/now/page.tsx` | **Recreate** the route (see below) |
| `src/components/footer.tsx` | Add back a `/now` `<Link>` using `localizedHref(lang, "/now")` and `t.now`, alongside the existing `/uses` and `/design-system` links |
| `src/lib/narration/script.ts` | Add `/now` entries to **both** `en` and `fr` maps (ids `intro` + `focus`) |
| `src/i18n/dictionaries/en.ts` | Add the `now.*` object **and** the `footer.now` label |
| `src/i18n/dictionaries/fr.ts` | Mirror the same keys (fr is typed `Dictionary` — must stay key-identical to en) |
| `src/app/sitemap.ts` | Add `"/now"` to `staticPaths` (currently `["", "/blog", "/work", "/about", "/uses"]`) |

### Page — `src/app/[lang]/now/page.tsx`

Recreate from the pre-removal version (`git show 102c925~1:src/app/[lang]/now/page.tsx`),
with these changes:

- Drop the hardcoded `lastUpdated = "May 2026"` and the hardcoded English `focus` array.
- Relative-time line (layout A): `{dict.now.updatedPrefix} {relativeUpdated(lang)}` →
  renders "Updated 2 months ago" / "Mis à jour il y a 2 mois", as muted text under the
  title (the old `<p class="mt-2 text-sm text-muted">` slot).
- Focus list from `getNowFocus(lang)` (localized), same `<ul data-narrate="focus">`.
- Keep `MorphTitle` (`PAGE_TITLE`), the `data-narrate="intro"` intro paragraph
  (`dict.now.focusedOn`), and the nownownow.com link (`dict.now.nowPageLabel`).
- Keep the existing `generateMetadata` (title/description/canonical/alternates) verbatim.
- **Freshness of the rendered relative string:** if the route is statically generated, the
  "N months ago" text reflects build time. Add a daily revalidate
  (`export const revalidate = 86400`) so it tracks real time without per-request cost.
  Verify the exact Next 16 segment-config API in `node_modules/next/dist/docs/` before
  using it; the cron (Part 4) is the real freshness guard regardless.

### Dictionary keys (`now.*`) — both locales

| Key | en | fr |
|---|---|---|
| `now.title` | "Now" | "Maintenant" |
| `now.metaDescription` | "What I'm focused on right now." | (translate) |
| `now.updatedPrefix` | "Updated" | "Mis à jour" |
| `now.focusedOn` | "What I'm focused on at the moment:" | (translate) |
| `now.nowPageLabel` | "/now page" | "page /now" |
| `footer.now` | "Now" | "Maintenant" |

(Final copy is owner's to confirm; the table fixes the key set + structure.)

### Narration entries (both `en` and `fr` in `script.ts`)

Mirror the `/uses` shape — two beats keyed to the `data-narrate` ids:

```ts
"/now": [
  { id: "intro", mood: "warm",   text: "…" }, // en + fr variants
  { id: "focus", mood: "focused", text: "…" },
],
```

## Part 4 — Scheduled staleness nag: new `.github/workflows/now-freshness.yml`

A **separate** workflow from `ci.yml`. It never gates PRs or `main`.

- **Triggers:** `schedule` (weekly, e.g. `cron: "0 8 * * 1"`) + `workflow_dispatch` (manual).
- **Permissions:** `issues: write`, `contents: read`.
- **Steps:**
  1. `actions/checkout` → `actions/setup-node` (node 22) → `npm ci`.
  2. Compute staleness from the domain module's single source of truth. Add **`tsx`** as a
     devDependency and run a tiny `scripts/check-now-freshness.ts` that imports
     `{ isStale, daysSinceUpdate, STALE_AFTER_DAYS }` and writes `stale=<bool>` /
     `days=<n>` to `$GITHUB_OUTPUT`. (Importing the module — not regex-scraping the file —
     keeps the 45-day threshold single-sourced and lets `now.test.ts` cover the logic.)
  3. `actions/github-script` enforces the **single persistent issue**:
     - Identify the issue by a fixed label, e.g. `now-stale` (create the label if absent).
     - **If stale:** find an open issue with that label → if found, update its body (days
       since update, the `updated` date, link to `now.ts`); if none, create one.
     - **If fresh:** if an open `now-stale` issue exists, close it with a short comment.
  - Net effect: at most one open issue at any time, auto-opened/updated/closed. No stacking.

## Testing & verification gate

Tests are part of done. Before opening the PR, all green:

- `npx tsc --noEmit`
- `npm test`  (adds `now.test.ts`: schema + parity + staleness + relative-time)
- `npm run lint`
- `npm run build`

After implementation, grep to confirm there are no *dangling* refs and all six touch
points are wired: `"/now"`, `footer.now`, `dict.now`, `now:` (narration), `getNowFocus`.

## Out of scope

- Tokens / theming / motion / companion — fixed inputs, not touched.
- Any redesign beyond the minimal restore (no badges — option B/C mockups were rejected).
- Changes to `ci.yml` — the freshness check is its own workflow.
- No unrelated refactors.

## Risks / notes

- **Next 16 conventions:** consult `node_modules/next/dist/docs/` before touching routing,
  metadata, or segment config (`revalidate`); respect `src/proxy.ts` locale handling.
- **Dictionary parity:** `en.ts` and `fr.ts` must stay key-identical (`fr` is typed
  `Dictionary`); `tsc` enforces this for the chrome, the parity test for focus content.
- **Zod 4 API:** confirm `z.iso.date()` against the installed `zod ^4.4.3` (the older
  `z.string().date()` is deprecated but may still work).
- **Maintenance pact:** this page only earns its place if `updated` is bumped roughly
  monthly. A+B make rot visible (page) and nagging (issue); if neither is honored, recut.
```
