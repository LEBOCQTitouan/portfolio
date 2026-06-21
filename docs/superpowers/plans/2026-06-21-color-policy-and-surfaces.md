# Color Policy & Surface Coherence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make subject color "earned, not ambient" — list/home pages rest in brand, color blooms on hover and on case-study commit — and unify surfaces into a Row/Card/Panel family.

**Architecture:** Three independent areas. (A) Split the page-aura signal from the per-card glow signal by introducing a `data-page-subject` attribute that only detail pages set; the aura/companion read it via `:has()`, cards keep `data-subject` for their local glow only. (B) Make the work/blog row badges + pills neutral at rest and bloom to the row's subject on hover. (C) Add `cardClass`/`panelClass` recipes and migrate the boxed surfaces + case-study blocks onto them.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind v4 (CSS-first `@theme`), Vitest + Testing Library. Tests run with `npx vitest run`. No `tailwind.config.*` — design tokens live in `src/app/globals.css` and `src/design/tokens.ts`.

## Global Constraints

- Do **not** change subject palette values or the WCAG thresholds in `src/design/tokens-contrast.test.ts`.
- Motion that moves/scales must stay gated behind `motion-safe:` / `prefers-reduced-motion`.
- Colors come from semantic tokens (`--accent`, `--muted`, `--border`, `bg-card`, `--accent-soft`), never raw hex in components.
- Radii come from the radius scale utilities (`rounded-card` = 12px, `rounded-panel` = 16px, `rounded-pill`); no raw px.
- `npx vitest run` and `npx eslint <changed files>` must be green before each commit.
- Conventional-commit messages, imperative mood.

---

### Task 1: Aura & companion default to brand (Area A)

**Files:**
- Modify: `src/app/globals.css` (aura recolor rules lines 221–227; `--subject-accent` lift rules lines 231–236)
- Modify: `src/app/[lang]/work/[slug]/page.tsx:59` (the `<article>`)
- Modify: `src/app/[lang]/blog/[slug]/page.tsx:68` (the `<article>`)
- Test: `src/design/aura-scope.test.ts` (new)

**Interfaces:**
- Consumes: nothing.
- Produces: the invariant "aura + `--subject-accent` are driven by `data-page-subject`; cards' `data-subject` no longer affects them." Later tasks rely on cards being safe to leave `data-subject`-only.

- [ ] **Step 1: Write the failing test**

Create `src/design/aura-scope.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("aura/companion subject is page-scoped, not card-scoped", () => {
  it("every .page-aura recolor rule keys off data-page-subject", () => {
    const auraRules = css.match(/^.*\.page-aura\s*\{[^}]*\}\s*$/gm) ?? [];
    const recolor = auraRules.filter((r) => r.includes("has("));
    expect(recolor.length).toBeGreaterThanOrEqual(3); // systems/interface/ai per mode
    for (const r of recolor) {
      expect(r).toContain("data-page-subject");
      expect(r).not.toContain("[data-subject");
    }
  });

  it("every --subject-accent lift rule keys off data-page-subject", () => {
    const lift = (css.match(/^body:has\([^)]*\)\s*\{[^}]*--subject-accent[^}]*\}/gm) ?? [])
      .concat(css.match(/^\.dark body:has\([^)]*\)\s*\{[^}]*--subject-accent[^}]*\}/gm) ?? []);
    expect(lift.length).toBeGreaterThanOrEqual(3);
    for (const r of lift) {
      expect(r).toContain("data-page-subject");
      expect(r).not.toContain("[data-subject");
    }
  });

  it("detail pages set data-page-subject; cards do not", () => {
    expect(read("src/app/[lang]/work/[slug]/page.tsx")).toContain("data-page-subject");
    expect(read("src/app/[lang]/blog/[slug]/page.tsx")).toContain("data-page-subject");
    expect(read("src/components/project-card.tsx")).not.toContain("data-page-subject");
    expect(read("src/components/post-card.tsx")).not.toContain("data-page-subject");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/design/aura-scope.test.ts`
Expected: FAIL — current CSS uses `[data-subject` and pages lack `data-page-subject`.

- [ ] **Step 3: Rewrite the aura recolor rules in `globals.css`**

Replace lines 221–227 (the six `body:has([data-subject=…]) .page-aura` rules) with the same rules using `data-page-subject`:

```css
body:has([data-page-subject="systems"]) .page-aura { --aura-tint: rgba(11,114,104,0.07); --aura-glow: rgba(11,114,104,0.16); }
body:has([data-page-subject="interface"]) .page-aura { --aura-tint: rgba(196,45,99,0.07); --aura-glow: rgba(196,45,99,0.16); }
body:has([data-page-subject="ai"]) .page-aura { --aura-tint: rgba(124,58,237,0.07); --aura-glow: rgba(124,58,237,0.18); }

.dark body:has([data-page-subject="systems"]) .page-aura { --aura-tint: rgba(32,200,184,0.10); --aura-glow: rgba(32,200,184,0.20); }
.dark body:has([data-page-subject="interface"]) .page-aura { --aura-tint: rgba(240,101,149,0.10); --aura-glow: rgba(240,101,149,0.20); }
.dark body:has([data-page-subject="ai"]) .page-aura { --aura-tint: rgba(167,139,250,0.10); --aura-glow: rgba(167,139,250,0.22); }
```

- [ ] **Step 4: Rewrite the `--subject-accent` lift rules in `globals.css`**

Replace lines 231–236 (six `body:has([data-subject=…])` rules) with `data-page-subject`:

```css
body:has([data-page-subject="systems"]) { --subject-accent: #0b7268; --subject-accent-soft: rgba(11,114,104,0.16); }
body:has([data-page-subject="interface"]) { --subject-accent: #c42d63; --subject-accent-soft: rgba(196,45,99,0.16); }
body:has([data-page-subject="ai"]) { --subject-accent: #6d28d9; --subject-accent-soft: rgba(124,58,237,0.16); }
.dark body:has([data-page-subject="systems"]) { --subject-accent: #20c8b8; --subject-accent-soft: rgba(32,200,184,0.20); }
.dark body:has([data-page-subject="interface"]) { --subject-accent: #f06595; --subject-accent-soft: rgba(240,101,149,0.20); }
.dark body:has([data-page-subject="ai"]) { --subject-accent: #a78bfa; --subject-accent-soft: rgba(167,139,250,0.22); }
```

(Leave the `:root { --subject-accent: var(--accent); … }` default and the `.page-aura` / `.dark .page-aura` brand defaults untouched — they are now the resting state for all non-detail pages.)

- [ ] **Step 5: Add `data-page-subject` to the two detail-page `<article>`s**

In `src/app/[lang]/work/[slug]/page.tsx:59`, change:
```tsx
<article className="py-8" data-subject={resolveSubject({ category: project.category })}>
```
to:
```tsx
<article
  className="py-8"
  data-subject={resolveSubject({ category: project.category })}
  data-page-subject={resolveSubject({ category: project.category })}
>
```

In `src/app/[lang]/blog/[slug]/page.tsx:68`, change:
```tsx
<article className="py-8" data-subject={resolveSubject({ tags: post.tags })}>
```
to:
```tsx
<article
  className="py-8"
  data-subject={resolveSubject({ tags: post.tags })}
  data-page-subject={resolveSubject({ tags: post.tags })}
>
```

- [ ] **Step 6: Run tests + lint**

Run: `npx vitest run src/design/aura-scope.test.ts && npx eslint "src/app/[lang]/work/[slug]/page.tsx" "src/app/[lang]/blog/[slug]/page.tsx"`
Expected: PASS, no lint errors.

- [ ] **Step 7: Verify in the browser (manual)**

Restart dev server (`npm run dev`), open `http://localhost:3000/en` and `/en/work` — ambient aura + companion orb should read **brand blue**. Open a case study `/en/work/<slug>` — aura should recolor to that project's subject.

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css "src/app/[lang]/work/[slug]/page.tsx" "src/app/[lang]/blog/[slug]/page.tsx" src/design/aura-scope.test.ts
git commit -m "fix(theme): scope page aura+companion to data-page-subject so lists rest in brand"
```

---

### Task 2: Row badge + pills neutral at rest, bloom on hover (Area B)

**Files:**
- Modify: `src/components/category-badge.tsx`
- Modify: `src/components/tag-pill.tsx`
- Modify: `src/components/post-card.tsx:39` (pass muted variant)
- Modify: `src/app/globals.css` (add `.card-subject` hover-tint rule near line 402; add to the reduced-motion block near line 411)
- Test: `src/components/category-badge.test.tsx` (new), and update `src/components/case-study/case-hero.test.tsx` if it asserts badge classes

**Interfaces:**
- Consumes: `pillClass(tone, opts)` and `cn(...)` from `src/components/ui/styles.ts` (already exist).
- Produces: `CategoryBadge({ category, accent? })` — `accent` (default `false`) renders the committed accent badge for detail pages; default renders the neutral-hairline + `.card-dot` badge used in list cards. `TagPill({ tag, lang, tone? })` — `tone` default `"accent"`, in-card callers pass `"muted"`.

- [ ] **Step 1: Write the failing test**

Create `src/components/category-badge.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryBadge } from "./category-badge";

describe("CategoryBadge", () => {
  it("is neutral-at-rest by default: muted pill + card-subject hook + a dot", () => {
    const { container } = render(<CategoryBadge category="systems" />);
    const badge = container.querySelector("span.card-subject")!;
    expect(badge).toBeTruthy();
    expect(badge.className).toContain("text-muted");
    expect(badge.className).not.toContain("text-accent");
    expect(container.querySelector(".card-dot")).toBeTruthy();
  });

  it("renders an accent badge for committed detail pages", () => {
    const { container } = render(<CategoryBadge category="systems" accent />);
    const badge = container.querySelector("span")!;
    expect(badge.className).toContain("text-accent");
    expect(container.querySelector(".card-dot")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/category-badge.test.tsx`
Expected: FAIL — current badge always uses the accent pill and has no dot/`card-subject`.

- [ ] **Step 3: Rewrite `CategoryBadge`**

Replace `src/components/category-badge.tsx` body with:

```tsx
import type { ProjectCategory } from "@/core/domain/project";
import { cn, pillClass } from "@/components/ui/styles";

const LABELS: Record<ProjectCategory, string> = {
  systems: "Systems",
  interface: "Interface",
  both: "Systems · Interface",
};

// In list cards (default) the badge rests neutral and blooms to the row's
// subject on hover via the .card-subject rule in globals.css. On a committed
// detail page (`accent`) it shows the subject color at rest.
export function CategoryBadge({
  category,
  accent = false,
}: {
  category: ProjectCategory;
  accent?: boolean;
}) {
  if (accent) {
    return (
      <span className={pillClass("accent", { extra: "shrink-0 font-medium" })}>
        {LABELS[category]}
      </span>
    );
  }
  return (
    <span className={cn(pillClass("muted", { extra: "shrink-0 gap-1.5" }), "card-subject")}>
      <span className="card-dot inline-block h-1.5 w-1.5 rounded-pill bg-muted transition-colors" aria-hidden="true" />
      {LABELS[category]}
    </span>
  );
}
```

- [ ] **Step 4: Add the `.card-subject` hover-tint rule to `globals.css`**

Immediately after the existing `.card-glow:focus-within .card-pills > *` rule (the block ending at line ~407), add:

```css
/* subject badge on the hovered/focused row — blooms with the pills */
.card-glow:hover .card-subject,
.card-glow:focus-within .card-subject {
  border-color: var(--accent);
  color: var(--accent);
}
.card-glow:hover .card-subject .card-dot,
.card-glow:focus-within .card-subject .card-dot {
  background: var(--accent);
}
```

Then in the `@media (prefers-reduced-motion: reduce)` block (currently lines ~410–415) add `.card-subject` and `.card-dot` to the `transition: none` selector list so it reads:

```css
@media (prefers-reduced-motion: reduce) {
  .card-glow::before,
  .card-edge-light,
  .card-glow:hover .card-pills > *,
  .card-glow:focus-within .card-pills > *,
  .card-glow:hover .card-subject,
  .card-glow:hover .card-subject .card-dot {
    transition: none !important;
  }
}
```

- [ ] **Step 5: Add a `tone` variant to `TagPill` and use muted in post cards**

Replace `src/components/tag-pill.tsx` body with:

```tsx
import Link from "next/link";
import type { Locale } from "@/core/domain/locale";
import { localizedHref } from "@/i18n/localized-href";
import { pillClass, type PillTone } from "@/components/ui/styles";

// Standalone (tag-page header) stays accent; inside a card row pass tone="muted"
// so it rests neutral and blooms via the row's .card-pills hover rule.
export function TagPill({
  tag,
  lang,
  tone = "accent",
}: {
  tag: string;
  lang: Locale;
  tone?: PillTone;
}) {
  return (
    <Link
      href={localizedHref(lang, `/blog/tags/${encodeURIComponent(tag)}`)}
      className={pillClass(tone, { interactive: true })}
    >
      {tag}
    </Link>
  );
}
```

In `src/components/post-card.tsx:39`, change:
```tsx
<TagPill key={tag} tag={tag} lang={lang} />
```
to:
```tsx
<TagPill key={tag} tag={tag} lang={lang} tone="muted" />
```

- [ ] **Step 6: Update the case-study header to use the committed accent badge**

In `src/components/case-study/case-hero.tsx:22`, change:
```tsx
<CategoryBadge category={project.category} />
```
to:
```tsx
<CategoryBadge category={project.category} accent />
```

- [ ] **Step 7: Run the affected tests (update any that assert old classes)**

Run: `npx vitest run src/components/category-badge.test.tsx src/components/post-card.test.tsx src/components/project-card.test.tsx src/components/case-study/case-hero.test.tsx`
Expected: PASS. If `case-hero.test.tsx` or `post-card.test.tsx` assert the old always-accent badge/pill classes, update those assertions to the new ones (accent badge for case-hero; muted tag pills containing `border-border`/`text-muted` for post-card). Re-run until green.

- [ ] **Step 8: Verify in the browser (manual)**

`/en/work` and `/en/blog`: rows are monochrome at rest; hovering a row blooms the badge dot/border + pills to the row's subject. `/en/work/<slug>`: the header badge shows the subject color at rest.

- [ ] **Step 9: Commit**

```bash
git add src/components/category-badge.tsx src/components/category-badge.test.tsx src/components/tag-pill.tsx src/components/post-card.tsx src/components/case-study/case-hero.tsx src/app/globals.css
git commit -m "feat(cards): subject badge/pills rest neutral, bloom on row hover"
```

---

### Task 3: Surface recipes (Card / Panel) + migration (Area C)

**Files:**
- Modify: `src/components/ui/styles.ts` (add `cardClass`, `panelClass`)
- Modify: `src/components/landing/pillar-card.tsx`, `src/components/newsletter.tsx:39`, `src/components/landing/contact-cta.tsx:8`, `src/components/case-study/case-hero.tsx:17`, `src/components/case-study/figure.tsx`, `src/components/case-study/pull-quote.tsx`, `src/components/case-study/metric.tsx`
- Test: `src/components/ui/styles.test.ts` (new)

**Interfaces:**
- Consumes: `cn(...)` from `src/components/ui/styles.ts`.
- Produces:
  - `cardClass(extra?: string): string` — `rounded-card border border-border bg-card p-5` + hover lift + `hover:border-accent/50`.
  - `panelClass(opts?: { variant?: "default" | "accent-soft"; padding?: string; extra?: string }): string` — `rounded-panel border` + `bg-card`/`accent-soft`, default `padding` `"p-6"`.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/styles.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { cardClass, panelClass } from "./styles";

describe("surface recipes", () => {
  it("cardClass is a rounded-card bg-card box with a hover lift", () => {
    const c = cardClass();
    expect(c).toContain("rounded-card");
    expect(c).toContain("bg-card");
    expect(c).toContain("border-border");
    expect(c).toContain("motion-safe:hover:-translate-y-0.5");
  });

  it("panelClass defaults to rounded-panel/bg-card/p-6", () => {
    const p = panelClass();
    expect(p).toContain("rounded-panel");
    expect(p).toContain("bg-card");
    expect(p).toContain("border-border");
    expect(p).toContain("p-6");
  });

  it("panelClass accent-soft variant drops bg-card for the accent-soft bed", () => {
    const p = panelClass({ variant: "accent-soft" });
    expect(p).toContain("border-accent/15");
    expect(p).toContain("var(--accent-soft)");
    expect(p).not.toContain("bg-card");
  });

  it("panelClass padding override replaces the default p-6", () => {
    const p = panelClass({ padding: "px-6 py-12" });
    expect(p).toContain("px-6 py-12");
    expect(p).not.toContain(" p-6");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui/styles.test.ts`
Expected: FAIL — `cardClass`/`panelClass` are not exported.

- [ ] **Step 3: Add the recipes to `src/components/ui/styles.ts`**

Append:

```ts
/* ── Surfaces: Card (interactive box) / Panel (static container) ──── */

const cardBase = cn(
  "block rounded-card border border-border bg-card p-5",
  "transition-[transform,border-color] duration-[var(--dur-ui)] ease-[var(--ease-standard)]",
  "hover:border-accent/50 motion-safe:hover:-translate-y-0.5",
);

export function cardClass(extra?: string): string {
  return cn(cardBase, extra);
}

export function panelClass(opts?: {
  variant?: "default" | "accent-soft";
  padding?: string;
  extra?: string;
}): string {
  const variant = opts?.variant ?? "default";
  const padding = opts?.padding ?? "p-6";
  return cn(
    "rounded-panel border",
    variant === "accent-soft" ? "border-accent/15 bg-[var(--accent-soft)]" : "border-border bg-card",
    padding,
    opts?.extra,
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui/styles.test.ts`
Expected: PASS.

- [ ] **Step 5: Migrate `PillarCard` to `cardClass`**

In `src/components/landing/pillar-card.tsx`, add `import { cn, cardClass } from "@/components/ui/styles";` and replace the `<Link …>` className with:
```tsx
className={cn("group", cardClass())}
```

- [ ] **Step 6: Migrate `Newsletter` and `ContactCta` to `panelClass`**

`src/components/newsletter.tsx`: change the import line `import { buttonClass } from "@/components/ui/styles";` to `import { buttonClass, panelClass } from "@/components/ui/styles";`, and change the `<form>` className (line 39) from `"rounded-card border border-border bg-card p-5"` to `{panelClass()}`.

`src/components/landing/contact-cta.tsx`: change the import to `import { buttonClass, panelClass } from "@/components/ui/styles";`, and change the `<section>` className (line 8) from `"my-8 rounded-panel border border-border bg-card px-6 py-12 text-center"` to:
```tsx
className={panelClass({ padding: "px-6 py-12", extra: "my-8 text-center" })}
```

- [ ] **Step 7: Migrate `CaseHero` to the accent-soft `panelClass` and its stack pills to `pillClass`**

In `src/components/case-study/case-hero.tsx`: import `import { panelClass, pillClass } from "@/components/ui/styles";`. Change the `<header>` className (line 17) from `"mb-8 rounded-2xl border border-accent/15 bg-[var(--accent-soft)] p-6"` to:
```tsx
className={panelClass({ variant: "accent-soft", extra: "mb-8" })}
```
Change the stack `<li>` className (line 34) from `"rounded-full border border-border px-2 py-0.5 text-xs text-muted"` to `{pillClass("muted")}`.

- [ ] **Step 8: Migrate the article blocks to surface tokens**

`src/components/case-study/figure.tsx`: replace both `rounded-lg` occurrences (lines 17 and 20) with `rounded-panel`.

`src/components/case-study/metric.tsx`: change line 3 `rounded-lg` to `rounded-card` (small tiles read better at card radius; deliberate refinement of the spec's "blocks=Panel" — flag at review if a single radius is preferred).

`src/components/case-study/pull-quote.tsx`: wrap the quote in a panel with an accent left edge. Replace the `<figure>` body with:
```tsx
import type { ReactNode } from "react";
import { panelClass } from "@/components/ui/styles";

export function PullQuote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <figure className={panelClass({ extra: "my-6 border-l-2 border-l-accent" })}>
      <blockquote className="text-lg font-medium italic text-accent">{children}</blockquote>
      {cite && <figcaption className="mt-2 text-sm text-muted">— {cite}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 9: Run the full suite + lint (update any block tests asserting old radii)**

Run: `npx vitest run && npx eslint src/components`
Expected: PASS. If `figure.test.tsx`, `metric.test.tsx`, `pull-quote.test.tsx`, or `case-hero.test.tsx` assert the old `rounded-lg`/`rounded-2xl` classes, update them to `rounded-panel`/`rounded-card` and re-run.

- [ ] **Step 10: Verify in the browser (manual)**

Open a case study `/en/work/<slug>`: header, metric strip, pull-quote, and figure should share one bordered surface language (16px panels, 12px metric tiles) matching the newsletter/CTA boxes on the home page. Pillars on `/en` lift on hover.

- [ ] **Step 11: Commit**

```bash
git add src/components/ui/styles.ts src/components/ui/styles.test.ts src/components/landing/pillar-card.tsx src/components/newsletter.tsx src/components/landing/contact-cta.tsx src/components/case-study/
git commit -m "refactor(ui): add Card/Panel recipes and migrate surfaces onto them"
```

---

## Self-Review

**Spec coverage:**
- §Area A (aura/companion brand-default) → Task 1. ✓
- §Area B (row/pill neutral-at-rest + hover bloom; TagPill in-card variant; committed badge) → Task 2. ✓
- §Area C (Card/Panel recipes; migrate Newsletter/ContactCta/CaseHero/Figure/PullQuote/Metric; Row unchanged) → Task 3. ✓
- §Testing (aura sync guard, detail-page assertion, card class tests, contrast untouched, full suite green) → covered across Tasks 1–3. ✓
- §Governing principle (rest/hover/commit) → realized by Tasks 1 (rest+commit aura) and 2 (hover bloom + committed badge). ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; test code is concrete. The two "update existing test if it asserts old classes" steps name the exact old→new classes to change. ✓

**Type/name consistency:** `cardClass(extra?)`, `panelClass({variant,padding,extra})`, `CategoryBadge({category, accent?})`, `TagPill({tag,lang,tone?})`, `.card-subject` / `.card-dot` used consistently across tasks and tests. ✓

**Deliberate spec deviation flagged:** Metric tiles use `rounded-card` (12px) rather than `rounded-panel` (16px) — noted in Task 3 Step 8 for review.
