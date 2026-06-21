# /now Reintroduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reintroduce the `/now` page with a two-part anti-rot mechanism — a visible, localized "updated N ago" line plus a weekly CI job that maintains a single persistent GitHub issue when the page goes stale.

**Architecture:** A typed domain module (`src/core/domain/now.ts`) is the single source of truth for the `updated` date, the localized focus bullets, the staleness threshold, and the freshness helpers. The server-rendered page reads relative time + focus from it. A standalone scheduled GitHub Actions workflow imports the same helpers to open/update/close one issue — it never touches `main`'s CI.

**Tech Stack:** Next.js 16 (App Router, server components), TypeScript, Zod ^4.4.3, Vitest, `Intl.RelativeTimeFormat`, GitHub Actions (`actions/github-script`), `tsx` (new devDependency).

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-06-21-now-reintroduction-design.md` (authoritative).
- **Anti-rot:** A (visible relative time) + B (scheduled single-issue nag). Do **not** add a staleness unit test that fails CI (option C is rejected).
- **Staleness threshold:** `STALE_AFTER_DAYS = 45`, defined once in `now.ts`.
- **Layout:** minimal restore — muted relative-time line, plain focus `<ul>`. No badges.
- **Localization:** `en` and `fr` dictionaries must stay **key-identical** (`fr.ts` is typed `Dictionary`; `tsc` enforces it). Focus bullets exist in both locales (parity test enforces equal counts).
- **Relative time:** always computed from the ISO `updated` date via `Intl.RelativeTimeFormat`. Never a hardcoded date string.
- **Next 16:** consult `node_modules/next/dist/docs/` before relying on segment config (`revalidate`); respect `src/proxy.ts` locale handling. This is NOT the Next.js in training data.
- **Zod 4:** use `z.iso.date()`; if the installed API differs, the deprecated `z.string().date()` is the fallback.
- **Commits:** conventional, imperative, scoped. Each task ends with a commit.

## File Structure

- **Create** `src/core/domain/now.ts` — domain: schema, content (date + localized focus), threshold, freshness helpers (`getNowFocus`, `getNowUpdated`, `daysSinceUpdate`, `isStale`, `relativeUpdated`).
- **Create** `src/core/domain/now.test.ts` — schema, parity, staleness, relative-time tests.
- **Create** `src/app/[lang]/now/page.tsx` — the route (metadata + render).
- **Create** `scripts/check-now-freshness.ts` — CI glue: prints `stale`/`days`/`updated`/`threshold` to `$GITHUB_OUTPUT`.
- **Create** `.github/workflows/now-freshness.yml` — weekly schedule → single-issue management.
- **Modify** `src/i18n/dictionaries/en.ts` — add `now.*` object + `footer.now`.
- **Modify** `src/i18n/dictionaries/fr.ts` — mirror the same keys.
- **Modify** `src/components/footer.tsx` — add the `/now` `<Link>`.
- **Modify** `src/lib/narration/script.ts` — add `/now` entries (en + fr).
- **Modify** `src/app/sitemap.ts` — add `/now` to `staticPaths`.
- **Modify** `package.json` / `package-lock.json` — add `tsx` devDependency.

---

### Task 1: Domain module + tests

**Files:**
- Create: `src/core/domain/now.ts`
- Test: `src/core/domain/now.test.ts`

**Interfaces:**
- Consumes: `{ type Locale, locales }` from `@/core/domain/locale`.
- Produces:
  - `STALE_AFTER_DAYS: number` (= 45)
  - `nowSchema` (Zod object)
  - `type NowContent`
  - `now: NowContent`
  - `getNowFocus(locale: Locale): string[]`
  - `getNowUpdated(): string`
  - `daysSinceUpdate(ref?: Date): number`
  - `isStale(ref?: Date): boolean`
  - `relativeUpdated(locale: Locale, ref?: Date): string`

- [ ] **Step 1: Write the failing tests**

Create `src/core/domain/now.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  now,
  nowSchema,
  getNowFocus,
  getNowUpdated,
  daysSinceUpdate,
  isStale,
  relativeUpdated,
  STALE_AFTER_DAYS,
} from "./now";
import { locales } from "@/core/domain/locale";

const DAY = 86_400_000;
const refAfter = (days: number) => new Date(new Date(`${getNowUpdated()}T00:00:00Z`).getTime() + days * DAY);

describe("nowSchema", () => {
  const valid = { updated: "2026-06-21", focus: { en: ["a"], fr: ["b"] } };

  it("accepts a well-formed object", () => {
    expect(() => nowSchema.parse(valid)).not.toThrow();
  });
  it("rejects a non-ISO updated date", () => {
    expect(() => nowSchema.parse({ ...valid, updated: "May 2026" })).toThrow();
  });
  it("rejects an empty focus array", () => {
    expect(() => nowSchema.parse({ ...valid, focus: { en: [], fr: ["b"] } })).toThrow();
  });
  it("rejects an empty focus string", () => {
    expect(() => nowSchema.parse({ ...valid, focus: { en: [""], fr: ["b"] } })).toThrow();
  });
});

describe("now content", () => {
  it("parses for the real content", () => {
    expect(() => nowSchema.parse(now)).not.toThrow();
  });
  it("getNowFocus returns the locale array", () => {
    for (const locale of locales) expect(getNowFocus(locale)).toBe(now.focus[locale]);
  });
});

describe("locale parity", () => {
  it("en and fr focus have identical length", () => {
    expect(now.focus.fr.length).toBe(now.focus.en.length);
  });
});

describe("staleness", () => {
  it("daysSinceUpdate counts whole days", () => {
    expect(daysSinceUpdate(refAfter(10))).toBe(10);
  });
  it("is not stale at exactly the threshold", () => {
    expect(isStale(refAfter(STALE_AFTER_DAYS))).toBe(false);
  });
  it("is stale one day past the threshold", () => {
    expect(isStale(refAfter(STALE_AFTER_DAYS + 1))).toBe(true);
  });
});

describe("relativeUpdated", () => {
  it("formats months in English", () => {
    expect(relativeUpdated("en", refAfter(60))).toBe("2 months ago");
  });
  it("formats months in French", () => {
    expect(relativeUpdated("fr", refAfter(60))).toBe("il y a 2 mois");
  });
  it("formats days for recent updates", () => {
    expect(relativeUpdated("en", refAfter(10))).toBe("10 days ago");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/core/domain/now.test.ts`
Expected: FAIL — `Cannot find module './now'` (the module does not exist yet).

- [ ] **Step 3: Write the domain module**

Create `src/core/domain/now.ts`:

```ts
import { z } from "zod";
import { type Locale, locales } from "@/core/domain/locale";

/** Open the stale-nag issue once the page is older than this many days. Single
 *  source of truth — the CI workflow reads it from here (see Task 5). */
export const STALE_AFTER_DAYS = 45;

const focusSchema = z.array(z.string().min(1)).min(1);

export const nowSchema = z.object({
  // ISO calendar date, e.g. "2026-06-21". If z.iso.date() is unavailable in the
  // installed zod, fall back to z.string().date().
  updated: z.iso.date(),
  focus: z.object({
    en: focusSchema,
    fr: focusSchema,
  }),
});

export type NowContent = z.infer<typeof nowSchema>;

const raw = {
  updated: "2026-06-21", // ← bump this whenever the focus list changes; it drives A and B
  focus: {
    en: [
      "Building this portfolio — and writing about where systems thinking meets interface craft.",
      "Going deeper on distributed-systems reliability.",
      "Exploring the edges of polished, accessible web UI.",
    ],
    fr: [
      "Je construis ce portfolio — et j'écris sur la rencontre entre la pensée systèmes et le soin de l'interface.",
      "J'approfondis la fiabilité des systèmes distribués.",
      "J'explore les limites d'une UI web soignée et accessible.",
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

/** True once the page is older than STALE_AFTER_DAYS. */
export function isStale(ref: Date = new Date()): boolean {
  return daysSinceUpdate(ref) > STALE_AFTER_DAYS;
}

/** Localized "2 months ago" / "il y a 2 mois" (the dictionary supplies the prefix). */
export function relativeUpdated(locale: Locale, ref: Date = new Date()): string {
  const days = daysSinceUpdate(ref);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (days < 30) return rtf.format(-days, "day");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}

// `locales` is imported so the parity test and future iterations share the canonical list.
void locales;
```

> Note: if `void locales;` reads as awkward to the implementer, instead import only `type Locale` here and import `locales` directly in the test from `@/core/domain/locale` (the test already does). Either is fine; do not leave an unused-import lint error.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/core/domain/now.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Typecheck + lint the new files**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors. (If `z.iso.date()` errors, switch to `z.string().date()`. If `locales` is flagged unused, apply the note in Step 3.)

- [ ] **Step 6: Commit**

```bash
git add src/core/domain/now.ts src/core/domain/now.test.ts
git commit -m "feat(now): add typed domain module with freshness helpers"
```

---

### Task 2: Dictionary entries (en + fr)

**Files:**
- Modify: `src/i18n/dictionaries/en.ts` (add `now.*` after the `uses` block ~line 167; add `footer.now`)
- Modify: `src/i18n/dictionaries/fr.ts` (mirror both)

**Interfaces:**
- Produces (consumed by Tasks 3 & 4): `dict.now.{title,metaDescription,updatedPrefix,focusedOn,nowPageLabel}` and `dict.footer.now`.

- [ ] **Step 1: Add `footer.now` to `en.ts`**

In `src/i18n/dictionaries/en.ts`, the `footer` block (lines 12–17) becomes:

```ts
  footer: {
    uses: "Uses",
    now: "Now",
    designSystem: "Design system",
    github: "GitHub",
    linkedin: "LinkedIn",
  },
```

- [ ] **Step 2: Add the `now` object to `en.ts`**

Immediately **after** the `uses: { … },` block (closes ~line 167) and **before** `designSystem: {`, insert:

```ts
  now: {
    title: "Now",
    metaDescription: "What I'm focused on right now.",
    updatedPrefix: "Updated",
    focusedOn: "What I'm focused on at the moment:",
    nowPageLabel: "/now page",
  },
```

- [ ] **Step 3: Mirror `footer.now` in `fr.ts`**

In `src/i18n/dictionaries/fr.ts`, the `footer` block (lines 14–19) becomes:

```ts
  footer: {
    uses: "Outils",
    now: "Maintenant",
    designSystem: "Système de design",
    github: "GitHub",
    linkedin: "LinkedIn",
  },
```

- [ ] **Step 4: Mirror the `now` object in `fr.ts`**

After the `uses: { … },` block and before `designSystem: {`, insert:

```ts
  now: {
    title: "Maintenant",
    metaDescription: "Ce sur quoi je me concentre en ce moment.",
    updatedPrefix: "Mis à jour",
    focusedOn: "Ce sur quoi je me concentre en ce moment :",
    nowPageLabel: "page /now",
  },
```

- [ ] **Step 5: Typecheck to verify locale parity**

Run: `npx tsc --noEmit`
Expected: PASS. (Because `fr.ts` is typed `Dictionary = Widen<typeof en>`, any missing or extra key on either side fails here — this is the parity guard for chrome strings.)

- [ ] **Step 6: Commit**

```bash
git add src/i18n/dictionaries/en.ts src/i18n/dictionaries/fr.ts
git commit -m "feat(now): add now.* and footer.now dictionary keys (en + fr)"
```

---

### Task 3: The `/now` route

**Files:**
- Create: `src/app/[lang]/now/page.tsx`

**Interfaces:**
- Consumes: `getNowFocus`, `relativeUpdated` from `@/core/domain/now`; `dict.now.*` from Task 2; `isLocale`, `defaultLocale` from locale; `getDictionary`; `site`; `MorphTitle`; `PAGE_TITLE`.

- [ ] **Step 1: Create the page**

Create `src/app/[lang]/now/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/core/domain/locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
import { getNowFocus, relativeUpdated } from "@/core/domain/now";

// Refresh the "N months ago" string daily so it tracks real time even when
// statically generated. The cron in .github/workflows/now-freshness.yml is the
// real freshness guard. Verify this segment-config key in node_modules/next/dist/docs/.
export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/now";

  return {
    title: dict.now.title,
    description: dict.now.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.now.title,
      description: dict.now.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function NowPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const focus = getNowFocus(lang);

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{dict.now.title}</h1>
      </MorphTitle>
      <p className="mt-2 text-sm text-muted">
        {dict.now.updatedPrefix} {relativeUpdated(lang)}
      </p>
      <p className="mt-6 max-w-2xl text-muted" data-narrate="intro">
        {dict.now.focusedOn}
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted" data-narrate="focus">
        {focus.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-muted">
        This is a{" "}
        <a
          href="https://nownownow.com/about"
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          {dict.now.nowPageLabel}
        </a>
        .
      </p>
    </section>
  );
}
```

> This restores the pre-removal page (`git show 102c925~1:src/app/[lang]/now/page.tsx`) with the hardcoded `lastUpdated`/`focus` replaced by domain calls. The "This is a … ." wrapper stays English exactly as in the original (out of scope to localize further).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. (If `revalidate` is rejected by Next 16's segment-config types, check `node_modules/next/dist/docs/` for the current export name and adjust; if unsupported, drop the export — the cron still guards freshness.)

- [ ] **Step 3: Verify the page renders in both locales**

Run: `npm run dev`, then load `http://localhost:3000/en/now` and `http://localhost:3000/fr/now`.
Expected: title renders; muted line shows "Updated 0 days ago" / "Mis à jour il y a 0 jour"; the localized focus bullets render; the nownownow link is present. Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/[lang]/now/page.tsx
git commit -m "feat(now): restore /now route reading from the domain module"
```

---

### Task 4: Wire navigation, narration, and sitemap

**Files:**
- Modify: `src/components/footer.tsx` (add `/now` link)
- Modify: `src/lib/narration/script.ts` (add `/now` entries to `en` and `fr`)
- Modify: `src/app/sitemap.ts` (add `/now` to `staticPaths`)

**Interfaces:**
- Consumes: `t.now` (Task 2), `localizedHref`, `NarrationMap`.

- [ ] **Step 1: Add the footer link**

In `src/components/footer.tsx`, insert a `/now` `<Link>` between the `/uses` and `/design-system` links (after line 19):

```tsx
        <Link href={localizedHref(lang, "/uses")} className="transition-colors hover:text-foreground">
          {t.uses}
        </Link>
        <Link href={localizedHref(lang, "/now")} className="transition-colors hover:text-foreground">
          {t.now}
        </Link>
        <Link href={localizedHref(lang, "/design-system")} className="transition-colors hover:text-foreground">
          {t.designSystem}
        </Link>
```

- [ ] **Step 2: Add narration entries (en)**

In `src/lib/narration/script.ts`, inside the `en` map, add a `/now` entry (place it after the `/uses` block):

```ts
  "/now": [
    { id: "intro", mood: "warm", text: "What I'm giving my attention to, right now." },
    { id: "focus", mood: "focused", text: "A short list — kept honest by a date." },
  ],
```

- [ ] **Step 3: Add narration entries (fr)**

In the `fr` map, after its `/uses` block:

```ts
  "/now": [
    { id: "intro", mood: "warm", text: "Ce à quoi je consacre mon attention, en ce moment." },
    { id: "focus", mood: "focused", text: "Une courte liste — tenue honnête par une date." },
  ],
```

- [ ] **Step 4: Add `/now` to the sitemap**

In `src/app/sitemap.ts` line 9:

```ts
  const staticPaths = ["", "/blog", "/work", "/about", "/uses", "/now"];
```

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/footer.tsx src/lib/narration/script.ts src/app/sitemap.ts
git commit -m "feat(now): wire /now into footer, narration, and sitemap"
```

---

### Task 5: Scheduled freshness nag (CI)

**Files:**
- Modify: `package.json` + `package-lock.json` (add `tsx` devDependency)
- Create: `scripts/check-now-freshness.ts`
- Create: `.github/workflows/now-freshness.yml`

**Interfaces:**
- Consumes: `isStale`, `daysSinceUpdate`, `getNowUpdated`, `STALE_AFTER_DAYS` from the domain module (Task 1).
- Produces: `$GITHUB_OUTPUT` keys `stale`, `days`, `updated`, `threshold` consumed by the `github-script` step.

- [ ] **Step 1: Add the `tsx` devDependency**

Run: `npm install --save-dev tsx`
Expected: `tsx` appears under `devDependencies` in `package.json`; lockfile updates.

- [ ] **Step 2: Create the check script**

Create `scripts/check-now-freshness.ts`:

```ts
import { appendFileSync } from "node:fs";
import {
  isStale,
  daysSinceUpdate,
  getNowUpdated,
  STALE_AFTER_DAYS,
} from "@/core/domain/now";

const days = daysSinceUpdate();
const stale = isStale();

const lines =
  [
    `stale=${stale}`,
    `days=${days}`,
    `updated=${getNowUpdated()}`,
    `threshold=${STALE_AFTER_DAYS}`,
  ].join("\n") + "\n";

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, lines);
console.log(lines.trimEnd());
```

> `tsx` resolves the `@/*` alias from `tsconfig.json`'s `paths`. If CI reports it cannot resolve `@/core/domain/now`, either (a) change this import to the relative `../src/core/domain/now`, or (b) add `import "tsconfig-paths/register";` — prefer (a), it adds no dependency.

- [ ] **Step 3: Run the script locally to verify import + output**

Run: `npx tsx scripts/check-now-freshness.ts`
Expected: prints `stale=false`, `days=0` (or small), `updated=2026-06-21`, `threshold=45`. Confirms the alias resolves and the helpers execute outside Vitest.

- [ ] **Step 4: Create the workflow**

Create `.github/workflows/now-freshness.yml`:

```yaml
name: /now freshness

on:
  schedule:
    - cron: "0 8 * * 1" # Mondays 08:00 UTC
  workflow_dispatch: {}

permissions:
  contents: read
  issues: write

concurrency:
  group: now-freshness
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - id: freshness
        run: npx tsx scripts/check-now-freshness.ts
      - uses: actions/github-script@v7
        env:
          STALE: ${{ steps.freshness.outputs.stale }}
          DAYS: ${{ steps.freshness.outputs.days }}
          UPDATED: ${{ steps.freshness.outputs.updated }}
          THRESHOLD: ${{ steps.freshness.outputs.threshold }}
        with:
          script: |
            const LABEL = "now-stale";
            const TITLE = "/now is going stale";
            const stale = process.env.STALE === "true";
            const { owner, repo } = context.repo;

            // Ensure the label exists (one-time).
            try {
              await github.rest.issues.getLabel({ owner, repo, name: LABEL });
            } catch {
              await github.rest.issues.createLabel({
                owner, repo, name: LABEL, color: "fbca04",
                description: "The /now page is past its freshness window",
              });
            }

            const open = await github.rest.issues.listForRepo({
              owner, repo, state: "open", labels: LABEL,
            });
            const issue = open.data[0];
            const body =
              `The \`/now\` page was last updated **${process.env.UPDATED}** — ` +
              `that's **${process.env.DAYS} days** ago (threshold ${process.env.THRESHOLD}).\n\n` +
              `Bump \`updated\` and refresh the focus list in ` +
              `\`src/core/domain/now.ts\`. This issue closes itself on the next run.`;

            if (stale) {
              if (issue) {
                await github.rest.issues.update({ owner, repo, issue_number: issue.number, body });
              } else {
                await github.rest.issues.create({ owner, repo, title: TITLE, labels: [LABEL], body });
              }
            } else if (issue) {
              await github.rest.issues.createComment({
                owner, repo, issue_number: issue.number,
                body: `Fresh again — \`/now\` updated ${process.env.UPDATED}. Closing.`,
              });
              await github.rest.issues.update({
                owner, repo, issue_number: issue.number, state: "closed",
              });
            }
```

> Single-issue guarantee: it only ever acts on the first open issue carrying the `now-stale` label — updating it while stale, closing it when fresh, creating exactly one when none is open. No duplicates can stack.

- [ ] **Step 5: Lint the YAML / typecheck the script**

Run: `npx tsc --noEmit` (the script is under `@/` so it's covered by the project tsconfig if `scripts/` is included; if tsconfig excludes `scripts/`, this is a no-op and that's fine).
Expected: PASS. Also visually confirm the workflow is valid YAML.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/check-now-freshness.ts .github/workflows/now-freshness.yml
git commit -m "feat(now): add weekly freshness check that nags via a single GitHub issue"
```

---

### Task 6: Full verification gate

**Files:** none (verification only).

- [ ] **Step 1: Run the full gate**

Run each, in order:

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
```

Expected: all four green. `npm test` includes `now.test.ts` (schema + parity + staleness + relative time).

- [ ] **Step 2: Confirm wiring, no dangling refs**

Run: `git grep -n '"/now"\|footer\.now\|dict\.now\|getNowFocus\|now-stale'`
Expected: references appear in `page.tsx`, `footer.tsx`, `sitemap.ts`, `script.ts`, dictionaries, `now.ts`, the workflow, and the check script — and nowhere unexpected.

- [ ] **Step 3: Manual smoke (if not done in Task 3)**

Load `/en/now` and `/fr/now` in `npm run dev`; verify relative-time line, localized bullets, footer link present on every page.

- [ ] **Step 4: No commit needed** (verification only). If the build surfaced fixes, commit them with an appropriate `fix(now): …` message.

---

## Self-Review

**1. Spec coverage:**
- A (visible relative time) → Task 1 `relativeUpdated` + Task 3 render. ✅
- B (scheduled single-issue nag, 45 days) → Task 1 `isStale`/`STALE_AFTER_DAYS` + Task 5 workflow. ✅
- Layout A (minimal restore) → Task 3 page (no badges). ✅
- Typed module + Zod + test → Tasks 1. ✅
- Localized focus + parity test → Task 1 content + parity test; Task 2 chrome parity via tsc. ✅
- Restore map (route, footer, narration, dict, sitemap) → Tasks 2–4. ✅
- Verification gate (tsc/test/lint/build) → Task 6. ✅
- Rejected option C → no staleness unit test added (Task 1 tests use injected `ref`, never the wall clock). ✅

**2. Placeholder scan:** Focus copy and dict copy are real (owner may revise later, but the plan ships valid, buildable content). No "TBD"/"add error handling"/"similar to Task N". ✅

**3. Type consistency:** `getNowFocus`/`getNowUpdated`/`daysSinceUpdate`/`isStale`/`relativeUpdated`/`STALE_AFTER_DAYS`/`nowSchema` names are identical across the module (Task 1), the test (Task 1), the page (Task 3), and the check script (Task 5). Dict keys (`now.title|metaDescription|updatedPrefix|focusedOn|nowPageLabel`, `footer.now`) are identical across Tasks 2/3/4. ✅
```
