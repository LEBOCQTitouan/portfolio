# Subject-recolor Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make client-side navigation between subject-colored pages perform the recolor as a deliberate gesture — the page aura settles into the new color while the page heading morphs position/size and recolors.

**Architecture:** Native View Transitions via React's `<ViewTransition>` (enabled by `experimental.viewTransition`). Pure name-helper strings drive a single defensive React wrapper (`MorphTitle`) applied to page headings; a `work-title-${slug}` shared name pairs each work card with its detail hero. The `.page-aura` layer is named so its color crossfade can be tuned longer than the content. CSS in `globals.css` tunes durations and provides the reduced-motion fallback.

**Tech Stack:** Next.js 16.2.6 (App Router), React 19.2 (Next-vendored `ViewTransition`), TypeScript, Tailwind v4, Vitest + React Testing Library.

---

## Background the engineer must know

- **The React export split (critical).** The app's standalone `react@19.2.4`
  does NOT export `ViewTransition`; Next's vendored compiled React (used by the
  App Router bundle) DOES. Vitest and `tsc` resolve the standalone react. So the
  `MorphTitle` wrapper must use a namespace import and fall back to a passthrough
  when `React.ViewTransition` is `undefined`. Never write
  `import { ViewTransition } from "react"` — it breaks tests and typecheck.
- **`<ViewTransition>` applies its `name` to its child DOM element.** Wrap whole
  heading elements (`<h1>`, `<h2>`), not raw text.
- **`view-transition-name` must be unique among elements rendered during a
  transition.** Each page renders exactly one `PAGE_TITLE`; work cards use
  per-slug names, so they never collide.
- **The aura** is a persistent layout element whose background changes via
  `body:has([data-subject]) .page-aura`. Naming it lets the browser crossfade its
  color; we tune that crossfade.
- Existing test patterns: see `src/components/companion/orb.test.tsx` for the RTL
  `render(...)` + `container.querySelector` style. Run a single test with
  `npx vitest run <path>`.

## File structure

- Create: `src/lib/transitions/names.ts` — pure name constants + `workTitleName`.
- Create: `src/lib/transitions/names.test.ts` — unit tests for the above.
- Create: `src/components/transitions/morph-title.tsx` — the defensive wrapper.
- Create: `src/components/transitions/morph-title.test.tsx` — wrapper test.
- Modify: `next.config.ts` — add `experimental.viewTransition`.
- Modify: `src/app/globals.css` — view-transition CSS rules + reduced-motion.
- Modify: `src/app/[lang]/layout.tsx` — name the `.page-aura`.
- Modify headings (wrap with `MorphTitle`):
  - `src/components/landing/hero.tsx:16`
  - `src/app/[lang]/work/page.tsx:46`
  - `src/app/[lang]/about/page.tsx:67`
  - `src/app/[lang]/now/page.tsx:52`
  - `src/app/[lang]/uses/page.tsx:62`
  - `src/app/[lang]/blog/page.tsx:48`
  - `src/app/[lang]/blog/tags/[tag]/page.tsx:53`
  - `src/app/[lang]/blog/[slug]/page.tsx:85`
  - `src/components/project-card.tsx:11` (card title → `workTitleName`)
  - `src/app/[lang]/work/[slug]/page.tsx:64` (hero → `workTitleName`)

---

## Task 1: Pure transition-name helpers

**Files:**
- Create: `src/lib/transitions/names.ts`
- Test: `src/lib/transitions/names.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/transitions/names.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { PAGE_TITLE, PAGE_AURA, workTitleName } from "./names";

describe("transition names", () => {
  it("exposes stable through-line names", () => {
    expect(PAGE_TITLE).toBe("page-title");
    expect(PAGE_AURA).toBe("page-aura");
  });

  it("derives a unique, slug-scoped name for the work card<->hero pair", () => {
    expect(workTitleName("atlas-design-system")).toBe("work-title-atlas-design-system");
    expect(workTitleName("pulse")).not.toBe(workTitleName("relay"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/transitions/names.test.ts`
Expected: FAIL — cannot find module `./names`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/transitions/names.ts`:

```ts
/** view-transition-name applied to each page's primary heading. One per page;
 *  navigating between pages morphs the heading (position + size + color). */
export const PAGE_TITLE = "page-title";

/** view-transition-name on the .page-aura layer so its color crossfade can be
 *  tuned independently as the deliberate recolor beat. */
export const PAGE_AURA = "page-aura";

/** Per-slug shared name pairing a work card title with its detail hero. Unique
 *  per project so names never collide within a rendered page. */
export function workTitleName(slug: string): string {
  return `work-title-${slug}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/transitions/names.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/transitions/names.ts src/lib/transitions/names.test.ts
git commit -m "feat(transitions): pure view-transition name helpers"
```

---

## Task 2: The `MorphTitle` defensive wrapper

**Files:**
- Create: `src/components/transitions/morph-title.tsx`
- Test: `src/components/transitions/morph-title.test.tsx`

- [ ] **Step 1: Write the failing test**

The test runs under Vitest, where `React.ViewTransition` is `undefined`, so it
exercises the passthrough path: children must render and no error/warning is
thrown for the unknown `name`/`share` props (proving we did NOT use
`React.Fragment`, which warns on extra props).

`src/components/transitions/morph-title.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MorphTitle } from "./morph-title";

describe("MorphTitle", () => {
  it("renders its child heading (passthrough when ViewTransition is absent)", () => {
    render(
      <MorphTitle name="page-title">
        <h1>Selected work</h1>
      </MorphTitle>,
    );
    expect(screen.getByRole("heading", { name: "Selected work" })).toBeInTheDocument();
  });

  it("does not emit a React warning about invalid props on the fallback", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MorphTitle name="work-title-x">
        <h1>X</h1>
      </MorphTitle>,
    );
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/transitions/morph-title.test.tsx`
Expected: FAIL — cannot find module `./morph-title`.

- [ ] **Step 3: Write minimal implementation**

`src/components/transitions/morph-title.tsx`:

```tsx
import * as React from "react";

type VTProps = { name?: string; share?: string; children: React.ReactNode };

/** Next's vendored React (App Router bundle) exports ViewTransition; the
 *  standalone react used by Vitest/tsc does not. Resolve it defensively. */
const NativeViewTransition = (
  React as unknown as { ViewTransition?: React.ComponentType<VTProps> }
).ViewTransition;

/** Fallback for environments without ViewTransition. A plain function (NOT
 *  React.Fragment, which warns on extra props) that just renders children. */
function Passthrough({ children }: VTProps) {
  return <>{children}</>;
}

const VT = NativeViewTransition ?? Passthrough;

/** Wrap a page's primary heading. In the Next bundle the browser morphs the
 *  named element (position + size + color) across navigations; elsewhere it
 *  renders children unchanged. `share="morph"` assigns the `.morph` class for
 *  the CSS in globals.css. */
export function MorphTitle({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <VT name={name} share="morph">
      {children}
    </VT>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/transitions/morph-title.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/transitions/morph-title.tsx src/components/transitions/morph-title.test.tsx
git commit -m "feat(transitions): defensive MorphTitle ViewTransition wrapper"
```

---

## Task 3: Enable the View Transitions config flag

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Edit the config**

Replace the body of `next.config.ts` (keep the OpenNext import + dev hook) so it
reads:

```ts
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;

// Enable Cloudflare bindings during `next dev` (OpenNext adapter)
initOpenNextCloudflareForDev();
```

- [ ] **Step 2: Verify typecheck still passes**

Run: `npx tsc --noEmit`
Expected: no errors (the `viewTransition` key is in Next's config schema).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat(transitions): enable experimental.viewTransition"
```

---

## Task 4: View-transition CSS + name the aura

**Files:**
- Modify: `src/app/globals.css` (append a new block at end of file)
- Modify: `src/app/[lang]/layout.tsx` (the `.page-aura` div)

- [ ] **Step 1: Name the aura layer**

In `src/app/[lang]/layout.tsx`, add the import and apply the name. Add to the
import block near the other `@/` imports:

```tsx
import { PAGE_AURA } from "@/lib/transitions/names";
```

Change line 63 from:

```tsx
        <div className="page-aura" aria-hidden="true" />
```

to:

```tsx
        <div
          className="page-aura"
          aria-hidden="true"
          style={{ viewTransitionName: PAGE_AURA }}
        />
```

- [ ] **Step 2: Append the view-transition rules to `globals.css`**

Append at the END of `src/app/globals.css`:

```css
/* ── Page transitions — the recolor as a deliberate gesture ─────── */
/* The aura's color crossfade is tuned LONGER than content so the ambient
   field visibly settles into the new subject — the authored beat. */
::view-transition-group(page-aura) {
  animation-duration: 550ms;
}
::view-transition-old(page-aura),
::view-transition-new(page-aura) {
  animation-timing-function: cubic-bezier(0.6, 0.02, 0.2, 1);
}

/* The heading morph: softened with a brief blur to hide pixel interpolation. */
::view-transition-group(.morph) {
  animation-duration: 420ms;
}
::view-transition-image-pair(.morph) {
  animation-name: via-blur;
}
@keyframes via-blur {
  30% {
    filter: blur(3px);
  }
}

/* Reduced motion: instant recolor, no movement. */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

- [ ] **Step 3: Verify nothing broke**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all existing tests pass; no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css "src/app/[lang]/layout.tsx"
git commit -m "feat(transitions): tune aura crossfade + morph CSS; name the aura"
```

---

## Task 5: Wrap page headings with `MorphTitle`

No new tests (headings are server-rendered JSX; the morph itself is not
jsdom-testable per the spec). Each sub-step is one file edit. After all edits,
typecheck and build verify correctness.

**Files & edits:**

- [ ] **Step 1: Generic `PAGE_TITLE` headings**

For EACH of the following files, add the imports and wrap the heading element.

Add these imports (adjust if a `MorphTitle`/`PAGE_TITLE` import already exists):

```tsx
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
```

Wrap each heading. The pattern is identical — wrap the whole `<h1>`:

`src/components/landing/hero.tsx` — wrap the `<h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">…</h1>` (line 16) so:

```tsx
<MorphTitle name={PAGE_TITLE}>
  <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
    {/* existing heading children unchanged */}
  </h1>
</MorphTitle>
```

Apply the SAME wrap (`<MorphTitle name={PAGE_TITLE}>…</MorphTitle>` around the
existing `<h1>`, children unchanged) to:
- `src/app/[lang]/about/page.tsx:67`
- `src/app/[lang]/now/page.tsx:52`
- `src/app/[lang]/uses/page.tsx:62`
- `src/app/[lang]/blog/page.tsx:48`
- `src/app/[lang]/blog/tags/[tag]/page.tsx:53`
- `src/app/[lang]/blog/[slug]/page.tsx:85`
- `src/app/[lang]/work/page.tsx:46`

- [ ] **Step 2: Work card title → `workTitleName`**

In `src/components/project-card.tsx`, add imports:

```tsx
import { MorphTitle } from "@/components/transitions/morph-title";
import { workTitleName } from "@/lib/transitions/names";
```

Wrap the `<h2>` (lines 11–15) with the per-slug name:

```tsx
<MorphTitle name={workTitleName(project.slug)}>
  <h2 className="text-xl font-semibold tracking-tight">
    <Link href={localizedHref(lang, `/work/${project.slug}`)} className="hover:text-accent">
      {project.title}
    </Link>
  </h2>
</MorphTitle>
```

- [ ] **Step 3: Work detail hero → `workTitleName` (NOT `PAGE_TITLE`)**

In `src/app/[lang]/work/[slug]/page.tsx`, add imports:

```tsx
import { MorphTitle } from "@/components/transitions/morph-title";
import { workTitleName } from "@/lib/transitions/names";
```

Wrap the hero `<h1>` (lines 64–66) so the hero morphs from the clicked card:

```tsx
<MorphTitle name={workTitleName(project.slug)}>
  <h1 className="mt-3 text-4xl font-bold tracking-tight">
    {project.title}
  </h1>
</MorphTitle>
```

Note: the work detail hero uses `workTitleName`, NOT `PAGE_TITLE` — the per-slug
name takes precedence so the morph connects card→hero.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If a page already imported `MorphTitle`/name helpers,
ensure there are no duplicate imports.)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass (no behavioral change to tested units).

- [ ] **Step 6: Commit**

```bash
git add src/components/landing/hero.tsx src/components/project-card.tsx "src/app/[lang]"
git commit -m "feat(transitions): morph page headings; pair work card with hero"
```

---

## Task 6: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Tests**

Run: `npx vitest run`
Expected: all suites green (includes the two new test files).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Production build (verifies OpenNext/Cloudflare + the flag)**

Run: `npm run build`
Expected: build completes successfully. If the build rejects
`experimental.viewTransition`, STOP and report — do not work around silently.

- [ ] **Step 4: Visual review (not unit-testable)**

Using the visual companion / headless-Chrome screenshots, navigate
brand→systems→interface→ai and confirm: the aura settles into the new color, the
heading morphs + recolors, and the work index→detail card→hero morph plays. With
`prefers-reduced-motion: reduce` the recolor is instant and motion-free.

- [ ] **Step 5: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "chore(transitions): verification pass"
```

Leave the work on the branch — do NOT merge.

---

## Self-review notes

- **Spec coverage:** config flag (Task 3), pure helpers + tests (Task 1),
  MorphTitle + test (Task 2), heading wrapping incl. card↔hero override (Task 5),
  aura naming + CSS + reduced-motion (Task 4), build/tsc/test verification
  (Task 6). All spec sections map to a task.
- **No placeholders:** every code step shows complete code; every run step shows
  the command + expected result.
- **Type/name consistency:** `PAGE_TITLE`, `PAGE_AURA`, `workTitleName` defined in
  Task 1 and used verbatim in Tasks 4–5; `MorphTitle({ name, children })` defined
  in Task 2 and called with `name=` only in Tasks 4–5.
- **Stated non-testable:** the actual View Transition animation is not asserted in
  jsdom; verified via build + visual review (Task 6 steps 3–4), per the spec.
```
