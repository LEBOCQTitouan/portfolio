# /uses redesign + /now removal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/uses` into an opinionated, fully-localized, typed page (each tool carries a one-line *why*), and remove the stale `/now` page end-to-end.

**Architecture:** `/uses` content moves into a typed, Zod-validated domain module (`src/core/domain/uses.ts`) keyed by locale, mirroring `project.ts`. The page reads it via `getUses(lang)` and renders an aligned, responsive `name | why` description list. `/now` is deleted from every touch point (route, footer, narration, dictionaries, sitemap).

**Tech Stack:** Next.js 16 (App Router, async server components), TypeScript, Zod, Vitest, Tailwind.

## Global Constraints

- **Locales are `["en", "fr"]`**, default `en` — from `src/core/domain/locale.ts`. Every dictionary change is per-locale; `fr.ts` is typed `Dictionary` (derived from `en.ts`), so any key added to or removed from `en.ts` **must** be mirrored in `fr.ts` or the build breaks.
- **`/uses` content is fully localized** (decision B): category titles and every `why` line exist in both `en` and `fr`. Tool *names* are identical across locales.
- **Tests are part of done.** New domain code gets a Vitest spec following `src/core/domain/project.test.ts`.
- **Verification gate before PR:** `npx tsc --noEmit` && `npm test` && `npm run lint` && `npm run build`, all green.
- **Next 16 is not the Next.js you may know** — consult `node_modules/next/dist/docs/` before touching routing/metadata conventions. Respect `src/proxy.ts` locale handling. Do not touch tokens/theming/motion/companion.
- **Editorial note:** the draft `why` copy below is starter content. The owner confirms the tool list + copy reflects reality during review — this is the one editorial step, not a code blocker.

---

### Task 1: `uses` domain module + tests

**Files:**
- Create: `src/core/domain/uses.ts`
- Test: `src/core/domain/uses.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/core/domain/locale`.
- Produces:
  - `type UsesItem = { name: string; why: string }`
  - `type UsesCategory = { title: string; items: UsesItem[] }`
  - `export const uses: Record<Locale, UsesCategory[]>`
  - `export function getUses(locale: Locale): UsesCategory[]`

- [ ] **Step 1: Write the failing test**

Create `src/core/domain/uses.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";
import { uses, getUses, usesCategorySchema } from "./uses";
import { locales } from "@/core/domain/locale";

describe("usesCategorySchema", () => {
  const valid = { title: "T", items: [{ name: "N", why: "W" }] };

  it("accepts a well-formed category", () => {
    expect(() => usesCategorySchema.parse(valid)).not.toThrow();
  });
  it("rejects an empty name", () => {
    expect(() => usesCategorySchema.parse({ title: "T", items: [{ name: "", why: "W" }] })).toThrow();
  });
  it("rejects an empty why", () => {
    expect(() => usesCategorySchema.parse({ title: "T", items: [{ name: "N", why: "" }] })).toThrow();
  });
  it("rejects a category with no items", () => {
    expect(() => usesCategorySchema.parse({ title: "T", items: [] })).toThrow();
  });
});

describe("uses content", () => {
  it("is valid for every locale", () => {
    for (const locale of locales) {
      expect(() => z.array(usesCategorySchema).parse(uses[locale])).not.toThrow();
    }
  });
  it("getUses returns the array for a locale", () => {
    expect(getUses("en")).toBe(uses.en);
  });
});

describe("locale parity", () => {
  it("en and fr have identical structure (category count, order, item counts)", () => {
    expect(uses.fr.length).toBe(uses.en.length);
    uses.en.forEach((cat, i) => {
      expect(uses.fr[i].items.length).toBe(cat.items.length);
      // tool names are identical across locales
      expect(uses.fr[i].items.map((x) => x.name)).toEqual(cat.items.map((x) => x.name));
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/domain/uses.test.ts`
Expected: FAIL — cannot resolve `./uses` (module not found).

- [ ] **Step 3: Write minimal implementation**

Create `src/core/domain/uses.ts`:

```ts
import { z } from "zod";
import type { Locale } from "@/core/domain/locale";

const usesItemSchema = z.object({
  name: z.string().min(1),
  why: z.string().min(1),
});

export const usesCategorySchema = z.object({
  title: z.string().min(1),
  items: z.array(usesItemSchema).min(1),
});

export type UsesItem = z.infer<typeof usesItemSchema>;
export type UsesCategory = z.infer<typeof usesCategorySchema>;

const en: UsesCategory[] = [
  {
    title: "Editor & Terminal",
    items: [
      { name: "VS Code", why: "Daily driver — rich extensions and remote dev where the team lives." },
      { name: "Neovim", why: "Muscle memory that outlives editor trends; fast edits over SSH." },
      { name: "Ghostty", why: "GPU-fast, config-as-code, no Electron tax." },
      { name: "zsh + starship", why: "A prompt that surfaces git and context without noise." },
    ],
  },
  {
    title: "Languages & Tooling",
    items: [
      { name: "TypeScript", why: "Taste at the UI edge, types all the way down." },
      { name: "Go", why: "Small, boring services that just run." },
      { name: "Rust", why: "When correctness has to be load-bearing." },
      { name: "pnpm / npm", why: "Reproducible installs and lockfiles I trust in CI." },
    ],
  },
  {
    title: "Hardware",
    items: [
      { name: "MacBook Pro", why: "Silent, all-day battery, no compromises." },
      { name: "External display", why: "Vertical space for diffs, logs, and docs side by side." },
      { name: "Mechanical keyboard", why: "Tactile feedback that makes long sessions painless." },
    ],
  },
  {
    title: "Services",
    items: [
      { name: "Cloudflare", why: "Edge deploys, DNS, and Workers — fast by default." },
      { name: "GitHub", why: "Where the code, reviews, and CI live." },
      { name: "Linear", why: "Issue tracking that stays out of the way." },
      { name: "Figma", why: "Designing in the same tokens the site ships." },
    ],
  },
];

const fr: UsesCategory[] = [
  {
    title: "Éditeur & Terminal",
    items: [
      { name: "VS Code", why: "Outil principal — extensions riches et dev à distance, là où l'équipe travaille." },
      { name: "Neovim", why: "Une mémoire musculaire qui survit aux modes ; édition rapide en SSH." },
      { name: "Ghostty", why: "Rapide (GPU), config-as-code, sans la taxe Electron." },
      { name: "zsh + starship", why: "Un prompt qui montre le git et le contexte sans bruit." },
    ],
  },
  {
    title: "Langages & Outils",
    items: [
      { name: "TypeScript", why: "Le goût à la lisière de l'UI, des types de bout en bout." },
      { name: "Go", why: "Des services petits, sobres, qui tournent sans surprise." },
      { name: "Rust", why: "Quand la justesse doit être porteuse." },
      { name: "pnpm / npm", why: "Des installs reproductibles et des lockfiles fiables en CI." },
    ],
  },
  {
    title: "Matériel",
    items: [
      { name: "MacBook Pro", why: "Silencieux, autonomie toute la journée, sans compromis." },
      { name: "External display", why: "De la place verticale pour les diffs, logs et docs côte à côte." },
      { name: "Mechanical keyboard", why: "Un retour tactile qui rend les longues sessions indolores." },
    ],
  },
  {
    title: "Services",
    items: [
      { name: "Cloudflare", why: "Déploiements edge, DNS et Workers — rapides par défaut." },
      { name: "GitHub", why: "Là où vivent le code, les revues et la CI." },
      { name: "Linear", why: "Un suivi des tickets qui se fait oublier." },
      { name: "Figma", why: "Concevoir avec les mêmes tokens que le site livre." },
    ],
  },
];

// Validate at module load — same discipline as project.ts.
export const uses: Record<Locale, UsesCategory[]> = {
  en: z.array(usesCategorySchema).parse(en),
  fr: z.array(usesCategorySchema).parse(fr),
};

export function getUses(locale: Locale): UsesCategory[] {
  return uses[locale];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/domain/uses.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add src/core/domain/uses.ts src/core/domain/uses.test.ts
git commit -m "feat(uses): add typed, localized uses domain module with parity test"
```

---

### Task 2: Add localized `uses.intro` to dictionaries

**Files:**
- Modify: `src/i18n/dictionaries/en.ts` (the `uses` object, ~lines 163-166)
- Modify: `src/i18n/dictionaries/fr.ts` (the `uses` object, ~lines 165-168)

**Interfaces:**
- Produces: `dict.uses.intro: string` (consumed by Task 3).

- [ ] **Step 1: Add `intro` to the English `uses` object**

In `src/i18n/dictionaries/en.ts`, change the `uses` block to:

```ts
  uses: {
    title: "Uses",
    metaDescription: "The tools, hardware, and software I use day to day.",
    intro: "The kit I actually reach for — and why each one earns its place.",
  },
```

- [ ] **Step 2: Add `intro` to the French `uses` object**

In `src/i18n/dictionaries/fr.ts`, change the `uses` block to:

```ts
  uses: {
    title: "Outils",
    metaDescription: "Les outils, le matériel et les logiciels que j'utilise au quotidien.",
    intro: "Le matériel que j'utilise vraiment — et pourquoi chacun mérite sa place.",
  },
```

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: PASS (no missing-key error between `en` and `fr`).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/dictionaries/en.ts src/i18n/dictionaries/fr.ts
git commit -m "feat(uses): add localized intro copy to dictionaries"
```

---

### Task 3: Rewrite the `/uses` page

**Files:**
- Modify: `src/app/[lang]/uses/page.tsx` (replace the hardcoded `categories` array and body)

**Interfaces:**
- Consumes: `getUses` from `@/core/domain/uses`; `dict.uses.intro`.

- [ ] **Step 1: Replace the page body**

Replace the entire content of `src/app/[lang]/uses/page.tsx` below the `generateMetadata` function (i.e. remove the `const categories = [...]` block and the default export, and replace with the following). Keep the import block and `generateMetadata` exactly as they are, but add the `getUses` import at the top:

Add to the imports at the top of the file:

```ts
import { getUses } from "@/core/domain/uses";
```

Replace the `const categories = [...]` array and the `UsesPage` component with:

```tsx
export default async function UsesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const categories = getUses(lang);

  return (
    <section className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{dict.uses.title}</h1>
      </MorphTitle>
      <p className="mt-2 max-w-2xl text-muted" data-narrate="intro">
        {dict.uses.intro}
      </p>
      <div className="mt-8 space-y-10" data-narrate="tools">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold tracking-tight">{cat.title}</h2>
            <dl className="mt-3 space-y-2">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="grid gap-x-6 gap-y-0.5 sm:grid-cols-[12rem_1fr]"
                >
                  <dt className="font-medium text-foreground">{item.name}</dt>
                  <dd className="text-muted">{item.why}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
```

This is layout C: a `<dl>` per category where each `name | why` pair is a grid row that aligns into two columns at `sm:` and stacks (name over why) on narrow screens. The `data-narrate` hooks (`intro`, `tools`) are preserved, so `script.ts`'s `/uses` entries need no change.

- [ ] **Step 2: Verify types and build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS — page compiles and statically generates for both locales.

- [ ] **Step 3: Manual check (dev server)**

Run: `npm run dev`, open `http://localhost:3000/en/uses` and `http://localhost:3000/fr/uses`.
Expected: opinionated list with `name — why`, no "(Edit this list.)" placeholder, French content on `/fr/uses`, rows aligned on wide screens and stacked on narrow.

- [ ] **Step 4: Commit**

```bash
git add src/app/[lang]/uses/page.tsx
git commit -m "feat(uses): render opinionated localized list from domain module"
```

---

### Task 4: Remove `/now` end-to-end

**Files:**
- Delete: `src/app/[lang]/now/page.tsx` (and the now-empty `src/app/[lang]/now/` directory)
- Modify: `src/components/footer.tsx` (remove the `/now` `<Link>`)
- Modify: `src/lib/narration/script.ts` (remove `/now` in `en` and `fr`)
- Modify: `src/i18n/dictionaries/en.ts` (remove `now.*` object and `footer.now`)
- Modify: `src/i18n/dictionaries/fr.ts` (remove `now.*` object and `footer.now`)
- Modify: `src/app/sitemap.ts` (drop `/now` from `staticPaths`)

**Interfaces:** None produced. Removes the `now` key from `Dictionary`, so `en` and `fr` must change together.

- [ ] **Step 1: Delete the route**

```bash
git rm src/app/[lang]/now/page.tsx
```

- [ ] **Step 2: Remove the footer link**

In `src/components/footer.tsx`, delete this block (lines ~20-22):

```tsx
        <Link href={localizedHref(lang, "/now")} className="transition-colors hover:text-foreground">
          {t.now}
        </Link>
```

- [ ] **Step 3: Remove the narration entries**

In `src/lib/narration/script.ts`, delete the `"/now"` entry from the `en` map (lines ~20-23) and from the `fr` map (lines ~56-59):

```ts
  "/now": [
    { id: "intro", mood: "warm", text: "..." },
    { id: "focus", mood: "calm", text: "..." },
  ],
```

(Remove both occurrences — one in `en`, one in `fr`.)

- [ ] **Step 4: Remove the dictionary keys**

In `src/i18n/dictionaries/en.ts`: delete the entire `now` object (lines ~167-173) and the `now: "Now",` line inside `footer` (line ~14).

In `src/i18n/dictionaries/fr.ts`: delete the entire `now` object and the `now: "Maintenant",` line inside `footer` (line ~16).

- [ ] **Step 5: Remove `/now` from the sitemap**

In `src/app/sitemap.ts`, line 9, change:

```ts
  const staticPaths = ["", "/blog", "/work", "/about", "/uses", "/now"];
```

to:

```ts
  const staticPaths = ["", "/blog", "/work", "/about", "/uses"];
```

- [ ] **Step 6: Confirm no dangling references**

Run: `git grep -nE '"/now"|footer\.now|\bnow:|dict\.now|t\.now' -- src`
Expected: no output (empty). If anything prints, remove that reference too.

- [ ] **Step 7: Verify types, tests, build**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: PASS — no missing/excess key errors, all tests green, build succeeds with `/now` gone.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: remove stale /now page and all its references"
```

---

### Task 5: Full verification gate

**Files:** None (verification only).

- [ ] **Step 1: Run the complete gate**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: all four green. If any fail, fix before proceeding — do not open the PR on red.

- [ ] **Step 2: Final dangling-reference sweep**

Run: `git grep -nE '/now|focusedOn|nowPageLabel|lastUpdated' -- src`
Expected: no `/now`-related output. (`lastUpdated` should no longer appear in `src` once `now.*` is gone; if it appears elsewhere unrelated, confirm it's not the removed key.)

---

## Self-Review

**Spec coverage:**
- Opinionated list with `why` per pick → Task 1 (content) + Task 3 (render). ✓
- Typed domain module + Zod + test → Task 1. ✓
- Full localization + structural-parity test → Task 1 (`fr` content + parity test). ✓
- Layout C, responsive → Task 3 (`<dl>` grid, `sm:` breakpoint + stack). ✓
- Localized `uses.intro` chrome → Task 2. ✓
- `/now` removal (route, footer, narration ×2, dict ×2 incl. `footer.now`, sitemap) → Task 4. ✓
- Verification gate → Task 5 (and per-task checks). ✓

**Placeholder scan:** No "TBD"/"TODO". `why` copy is concrete draft content with an explicit owner-review note (editorial, not a code placeholder). ✓

**Type consistency:** `UsesItem`/`UsesCategory`/`getUses`/`usesCategorySchema` names match between Task 1's definition and Tasks 1/3's usage. `dict.uses.intro` matches between Task 2 and Task 3. ✓
