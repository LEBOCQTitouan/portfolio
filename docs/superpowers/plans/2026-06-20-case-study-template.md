# Case-study template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/work/[slug]` from a raw-MDX dump into a scannable, subject-themed case study: aura hero, a result-metric strip, and a prose narrative enriched with inline pull-quote / figure / metric components.

**Architecture:** One new Zod field (`metrics`) on the project frontmatter feeds two frontmatter-driven "chrome" components (`CaseHero`, `MetricStrip`) composed by the page. Three small inline components (`PullQuote`, `Figure`, `Metric`) are registered in the MDX components map so authors place them in the body. Narrative structure stays as plain MDX headings — no locked template, no JSON blocks, no new dependency.

**Tech Stack:** Next.js 16 (App Router, RSC), `next-mdx-remote/rsc`, `gray-matter` + Zod (existing), Tailwind v4 (utility classes, no config file), Vitest + `@testing-library/react`, Storybook (`@storybook/nextjs-vite`).

## Global Constraints

- **No new runtime dependencies.** Reuse `gray-matter` + Zod; do not add Velite/Contentlayer/CMS.
- **Styling = Tailwind utility classes + `var(--accent)` / `var(--accent-soft)` / `var(--on-accent)` / `var(--border)` / `var(--muted)` tokens**, matching `category-badge.tsx` and `project-card.tsx`. Do not introduce custom `globals.css` classes unless a style is impossible in utilities.
- **Preserve fixed inputs:** `data-subject` on the page `<article>`, both `data-narrate` hooks (`project-header`, `project-body`), tokens, theming, and the motion/transition engine. Do not touch them.
- **AGENTS.md rule:** before editing any framework-convention file, read the relevant guide in `node_modules/next/dist/docs/`. (The files in this plan are normal RSC/components, but honor the rule if a convention file comes up.)
- **Commits:** Conventional Commits, imperative, scoped. End every commit message with the trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` (omitted from the examples below for brevity — add it).
- **Test/build commands:** `npm test` (vitest run), `npm run lint`, `npm run build`, `npm run build-storybook`.

## File Structure

| File | Responsibility |
|---|---|
| `src/core/domain/project.ts` | Add `metricSchema` + `metrics` field to schema and `Project` type |
| `src/core/domain/project.test.ts` | Tests for `metrics` parse/default/limit; update `make` helper |
| `src/components/project-card.test.tsx` | Update existing `Project` literal (add `metrics: []`) |
| `src/components/project-card.stories.tsx` | Update existing `Project` literal (add `metrics: []`) |
| `src/components/case-study/metric.tsx` | Inline stat callout (also used as a strip cell) |
| `src/components/case-study/metric-strip.tsx` | Row of result metrics from frontmatter; null when empty |
| `src/components/case-study/pull-quote.tsx` | Emphasis quote with optional citation |
| `src/components/case-study/figure.tsx` | Image slot; themed placeholder when no `src` |
| `src/components/case-study/case-hero.tsx` | Subject-tinted hero (absorbs current page header) |
| `src/components/case-study/*.test.tsx` | Unit tests per component |
| `src/components/case-study/*.stories.tsx` | Storybook stories per component |
| `src/components/mdx.tsx` | Register `Metric`, `PullQuote`, `Figure` in the components map |
| `src/app/[lang]/work/[slug]/page.tsx` | Compose `CaseHero` + `MetricStrip` + MDX body |
| `content/en/projects/*.mdx` | Add `metrics`; expand narrative using the components |

---

### Task 1: Add `metrics` to the project domain

**Files:**
- Modify: `src/core/domain/project.ts`
- Test: `src/core/domain/project.test.ts`
- Modify (typecheck fix): `src/components/project-card.test.tsx`, `src/components/project-card.stories.tsx`

**Interfaces:**
- Produces: `type Project` now includes `metrics: { value: string; label: string }[]`; frontmatter accepts an optional `metrics` array (max 4, defaults to `[]`).

- [ ] **Step 1: Write the failing tests**

Add to `src/core/domain/project.test.ts` inside the `describe("parseProject", …)` block:

```ts
  it("parses metrics", () => {
    const p = parseProject(
      { title: "T", summary: "S", role: "R", category: "systems",
        metrics: [{ value: "12ms", label: "p99 latency" }] },
      "b", "x",
    );
    expect(p.metrics).toEqual([{ value: "12ms", label: "p99 latency" }]);
  });
  it("defaults metrics to an empty array", () => {
    const p = parseProject({ title: "T", summary: "S", role: "R", category: "systems" }, "b", "x");
    expect(p.metrics).toEqual([]);
  });
  it("rejects more than four metrics", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ value: `${i}`, label: `l${i}` }));
    expect(() =>
      parseProject({ title: "T", summary: "S", role: "R", category: "systems", metrics: five }, "b", "x"),
    ).toThrow(/project "x"/);
  });
```

Also update the `make` helper at the top of the same file so the `Project` literal stays valid:

```ts
const make = (over: Partial<Project> = {}): Project => ({
  slug: "s", title: "T", summary: "S", role: "R", stack: [], category: "systems",
  links: {}, metrics: [], featured: false, order: 0, content: "b", ...over,
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/core/domain/project.test.ts`
Expected: FAIL — the two `metrics` value tests fail (property missing / not defaulted), and `make` may already typecheck-fail until the type is updated.

- [ ] **Step 3: Implement the schema + type change**

In `src/core/domain/project.ts`, add the metric schema above `frontmatterSchema`:

```ts
const metricSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});
```

Add the field inside `frontmatterSchema` (after `stack`):

```ts
  metrics: z.array(metricSchema).max(4).default([]),
```

Add to the `Project` type (after `stack`):

```ts
  metrics: { value: string; label: string }[];
```

- [ ] **Step 4: Fix the two existing `Project` literals**

The `Project` type is now stricter. Run `grep -rn "category:" src --include=*.tsx -l` to confirm the literals, then add `metrics: [],` to the objects in:
- `src/components/project-card.test.tsx` (the `const project: Project = { … }`)
- `src/components/project-card.stories.tsx` (the `const sample: Project = { … }`)

Example (project-card.test.tsx):

```ts
  category: "systems",
  links: { repo: "https://github.com/example/ledger" },
  metrics: [],
  featured: true,
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npm test -- src/core/domain/project.test.ts` → Expected: PASS
Run: `npm run lint` → Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/core/domain/project.ts src/core/domain/project.test.ts src/components/project-card.test.tsx src/components/project-card.stories.tsx
git commit -m "feat(domain): add metrics field to project frontmatter"
```

---

### Task 2: `Metric` + `MetricStrip` components

**Files:**
- Create: `src/components/case-study/metric.tsx`, `src/components/case-study/metric-strip.tsx`
- Test: `src/components/case-study/metric.test.tsx`, `src/components/case-study/metric-strip.test.tsx`
- Create: `src/components/case-study/metric-strip.stories.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `Metric({ value: string; label: string })`; `MetricStrip({ metrics: { value: string; label: string }[] })` — returns `null` when `metrics` is empty.

- [ ] **Step 1: Write the failing tests**

`src/components/case-study/metric.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Metric } from "@/components/case-study/metric";

describe("Metric", () => {
  it("renders value and label", () => {
    render(<Metric value="42%" label="faster builds" />);
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText(/faster builds/i)).toBeInTheDocument();
  });
});
```

`src/components/case-study/metric-strip.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricStrip } from "@/components/case-study/metric-strip";

describe("MetricStrip", () => {
  it("renders a cell per metric", () => {
    render(
      <MetricStrip
        metrics={[
          { value: "12ms", label: "p99 latency" },
          { value: "10k/s", label: "throughput" },
        ]}
      />,
    );
    expect(screen.getByText("12ms")).toBeInTheDocument();
    expect(screen.getByText(/p99 latency/i)).toBeInTheDocument();
    expect(screen.getByText("10k/s")).toBeInTheDocument();
  });

  it("renders nothing when there are no metrics", () => {
    const { container } = render(<MetricStrip metrics={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/components/case-study/metric.test.tsx src/components/case-study/metric-strip.test.tsx`
Expected: FAIL with "Cannot find module .../metric" (and metric-strip).

- [ ] **Step 3: Implement the components**

`src/components/case-study/metric.tsx`:

```tsx
export function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-accent/25 bg-[var(--accent-soft)] px-4 py-3 text-center">
      <div className="text-2xl font-bold tracking-tight text-accent">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}
```

`src/components/case-study/metric-strip.tsx`:

```tsx
import { Metric } from "./metric";

export function MetricStrip({
  metrics,
}: {
  metrics: { value: string; label: string }[];
}) {
  if (metrics.length === 0) return null;
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => (
        <Metric key={m.label} value={m.value} label={m.label} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/components/case-study/metric.test.tsx src/components/case-study/metric-strip.test.tsx`
Expected: PASS

- [ ] **Step 5: Add a story**

`src/components/case-study/metric-strip.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetricStrip } from "./metric-strip";

const meta = {
  title: "CaseStudy/MetricStrip",
  component: MetricStrip,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
  args: {
    metrics: [
      { value: "12ms", label: "p99 write latency" },
      { value: "10k/s", label: "sustained throughput" },
      { value: "0", label: "double-counts in prod" },
    ],
  },
} satisfies Meta<typeof MetricStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { metrics: [] } };
```

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/metric.tsx src/components/case-study/metric-strip.tsx src/components/case-study/metric.test.tsx src/components/case-study/metric-strip.test.tsx src/components/case-study/metric-strip.stories.tsx
git commit -m "feat(case-study): add Metric and MetricStrip components"
```

---

### Task 3: `PullQuote` component

**Files:**
- Create: `src/components/case-study/pull-quote.tsx`
- Test: `src/components/case-study/pull-quote.test.tsx`
- Create: `src/components/case-study/pull-quote.stories.tsx`

**Interfaces:**
- Produces: `PullQuote({ children: ReactNode; cite?: string })`.

- [ ] **Step 1: Write the failing test**

`src/components/case-study/pull-quote.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PullQuote } from "@/components/case-study/pull-quote";

describe("PullQuote", () => {
  it("renders the quote and citation", () => {
    render(<PullQuote cite="Lead engineer">Stay correct under load.</PullQuote>);
    expect(screen.getByText(/stay correct under load/i)).toBeInTheDocument();
    expect(screen.getByText(/lead engineer/i)).toBeInTheDocument();
  });

  it("omits the citation when not provided", () => {
    render(<PullQuote>No cite here.</PullQuote>);
    expect(screen.queryByText(/^—/)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/case-study/pull-quote.test.tsx`
Expected: FAIL with "Cannot find module .../pull-quote".

- [ ] **Step 3: Implement the component**

`src/components/case-study/pull-quote.tsx`:

```tsx
import type { ReactNode } from "react";

export function PullQuote({
  children,
  cite,
}: {
  children: ReactNode;
  cite?: string;
}) {
  return (
    <figure className="my-6 border-l-2 border-accent pl-4">
      <blockquote className="text-lg font-medium italic text-accent">
        {children}
      </blockquote>
      {cite && <figcaption className="mt-1 text-sm text-muted">— {cite}</figcaption>}
    </figure>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/case-study/pull-quote.test.tsx`
Expected: PASS

- [ ] **Step 5: Add a story**

`src/components/case-study/pull-quote.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PullQuote } from "./pull-quote";

const meta = {
  title: "CaseStudy/PullQuote",
  component: PullQuote,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
  args: { children: "The hard part wasn't scale — it was staying correct under it." },
} satisfies Meta<typeof PullQuote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithCitation: Story = { args: { cite: "Lead backend engineer" } };
```

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/pull-quote.tsx src/components/case-study/pull-quote.test.tsx src/components/case-study/pull-quote.stories.tsx
git commit -m "feat(case-study): add PullQuote component"
```

---

### Task 4: `Figure` component

**Files:**
- Create: `src/components/case-study/figure.tsx`
- Test: `src/components/case-study/figure.test.tsx`
- Create: `src/components/case-study/figure.stories.tsx`

**Interfaces:**
- Produces: `Figure({ src?: string; alt?: string; caption?: string })` — renders an `<img>` when `src` is set, otherwise a themed placeholder showing the caption.

- [ ] **Step 1: Write the failing test**

`src/components/case-study/figure.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Figure } from "@/components/case-study/figure";

describe("Figure", () => {
  it("renders an image when src is provided", () => {
    render(<Figure src="/work/arch.svg" alt="architecture" caption="Write path" />);
    const img = screen.getByRole("img", { name: /architecture/i });
    expect(img).toHaveAttribute("src", "/work/arch.svg");
    expect(screen.getByText(/write path/i)).toBeInTheDocument();
  });

  it("renders a placeholder with the caption when src is absent", () => {
    render(<Figure caption="Event-sourced write path" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText(/event-sourced write path/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/case-study/figure.test.tsx`
Expected: FAIL with "Cannot find module .../figure".

- [ ] **Step 3: Implement the component**

`src/components/case-study/figure.tsx` (plain `<img>` with an eslint-disable: figures have no known dimensions and are usually placeholders, so `next/image` would force width/height we don't have):

```tsx
export function Figure({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? ""}
          className="w-full rounded-lg border border-border"
        />
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-accent/40 bg-[var(--accent-soft)] p-6 text-center text-sm text-muted">
          {caption ?? "Figure"}
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/case-study/figure.test.tsx`
Expected: PASS

- [ ] **Step 5: Run lint (verify the eslint-disable is correct)**

Run: `npm run lint`
Expected: no errors (the `no-img-element` warning is suppressed on the one line).

- [ ] **Step 6: Add a story**

`src/components/case-study/figure.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Figure } from "./figure";

const meta = {
  title: "CaseStudy/Figure",
  component: Figure,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  args: { caption: "Event-sourced write path with periodic snapshots" },
};
```

- [ ] **Step 7: Commit**

```bash
git add src/components/case-study/figure.tsx src/components/case-study/figure.test.tsx src/components/case-study/figure.stories.tsx
git commit -m "feat(case-study): add Figure component with graceful placeholder"
```

---

### Task 5: `CaseHero` component

**Files:**
- Create: `src/components/case-study/case-hero.tsx`
- Test: `src/components/case-study/case-hero.test.tsx`
- Create: `src/components/case-study/case-hero.stories.tsx`

**Interfaces:**
- Consumes: `Project` (from `@/core/domain/project`), `CategoryBadge`, `MorphTitle`, `workTitleName`.
- Produces: `CaseHero({ project: Project; labels: { source: string; liveDemo: string } })`. Wraps everything in `<header data-narrate="project-header">`. (Takes the whole `project` because it needs `slug` for `workTitleName`; `labels` are passed in so the component stays free of the i18n dictionary import.)

- [ ] **Step 1: Write the failing test**

`src/components/case-study/case-hero.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CaseHero } from "@/components/case-study/case-hero";
import type { Project } from "@/core/domain/project";

const project: Project = {
  slug: "ledger-engine",
  title: "Ledger Engine",
  summary: "A distributed double-entry ledger.",
  role: "Lead backend engineer",
  stack: ["Go", "Postgres"],
  category: "systems",
  links: { repo: "https://github.com/example/ledger", demo: "https://demo.example.com" },
  metrics: [],
  featured: true,
  order: 1,
  content: "",
};
const labels = { source: "Source", liveDemo: "Live demo" };

describe("CaseHero", () => {
  it("renders title, role, summary, stack, and links", () => {
    render(<CaseHero project={project} labels={labels} />);
    expect(screen.getByRole("heading", { name: /ledger engine/i })).toBeInTheDocument();
    expect(screen.getByText(/lead backend engineer/i)).toBeInTheDocument();
    expect(screen.getByText(/distributed double-entry/i)).toBeInTheDocument();
    expect(screen.getByText("Go")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /source/i })).toHaveAttribute(
      "href",
      "https://github.com/example/ledger",
    );
    expect(screen.getByRole("link", { name: /live demo/i })).toHaveAttribute(
      "href",
      "https://demo.example.com",
    );
  });

  it("exposes the narration hook", () => {
    const { container } = render(<CaseHero project={project} labels={labels} />);
    expect(container.querySelector('[data-narrate="project-header"]')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/case-study/case-hero.test.tsx`
Expected: FAIL with "Cannot find module .../case-hero".

- [ ] **Step 3: Implement the component**

`src/components/case-study/case-hero.tsx` (moves the header markup out of the page; adds a subtle subject-tinted panel via tokens):

```tsx
import type { Project } from "@/core/domain/project";
import { CategoryBadge } from "@/components/category-badge";
import { MorphTitle } from "@/components/transitions/morph-title";
import { workTitleName } from "@/lib/transitions/names";

export function CaseHero({
  project,
  labels,
}: {
  project: Project;
  labels: { source: string; liveDemo: string };
}) {
  return (
    <header
      className="mb-8 rounded-2xl border border-accent/15 bg-[var(--accent-soft)] p-6"
      data-narrate="project-header"
    >
      <div className="flex items-center gap-3">
        <CategoryBadge category={project.category} />
        <span className="text-sm text-muted">{project.role}</span>
      </div>
      <MorphTitle name={workTitleName(project.slug)}>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{project.title}</h1>
      </MorphTitle>
      <p className="mt-2 text-muted">{project.summary}</p>
      {project.stack.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>
      )}
      {(project.links.repo || project.links.demo) && (
        <div className="mt-4 flex gap-4 text-sm">
          {project.links.repo && (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {labels.source}
            </a>
          )}
          {project.links.demo && (
            <a
              href={project.links.demo}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline"
            >
              {labels.liveDemo}
            </a>
          )}
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/case-study/case-hero.test.tsx`
Expected: PASS

- [ ] **Step 5: Add a story**

`src/components/case-study/case-hero.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { Project } from "@/core/domain/project";
import { CaseHero } from "./case-hero";

const project: Project = {
  slug: "ledger-engine",
  title: "Ledger Engine",
  summary: "A distributed double-entry ledger that stays correct and fast under load.",
  role: "Lead backend engineer",
  stack: ["Go", "Postgres", "Kafka", "gRPC"],
  category: "systems",
  links: { repo: "#", demo: "#" },
  metrics: [],
  featured: true,
  order: 1,
  content: "",
};

const meta = {
  title: "CaseStudy/CaseHero",
  component: CaseHero,
  decorators: [
    (Story) => (
      <div data-subject="systems">
        <Story />
      </div>
    ),
  ],
  args: { project, labels: { source: "Source", liveDemo: "Live demo" } },
} satisfies Meta<typeof CaseHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
```

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/case-hero.tsx src/components/case-study/case-hero.test.tsx src/components/case-study/case-hero.stories.tsx
git commit -m "feat(case-study): add CaseHero component"
```

---

### Task 6: Wire components into MDX and the page

**Files:**
- Modify: `src/components/mdx.tsx`
- Modify: `src/app/[lang]/work/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Metric`, `PullQuote`, `Figure` (Tasks 2–4), `CaseHero`, `MetricStrip` (Tasks 2, 5).
- Produces: `<Metric>`, `<PullQuote>`, `<Figure>` usable inside any MDX body; the project page renders hero + strip + body.

- [ ] **Step 1: Register the inline components in `mdx.tsx`**

In `src/components/mdx.tsx`, add imports and extend the `components` map:

```tsx
import { Pre } from "@/components/pre";
import { Metric } from "@/components/case-study/metric";
import { PullQuote } from "@/components/case-study/pull-quote";
import { Figure } from "@/components/case-study/figure";

const components: MDXComponents = {
  pre: Pre,
  Metric,
  PullQuote,
  Figure,
};
```

- [ ] **Step 2: Recompose the page**

In `src/app/[lang]/work/[slug]/page.tsx`:

Remove the now-unused imports `CategoryBadge`, `MorphTitle`, `workTitleName` and add:

```tsx
import { CaseHero } from "@/components/case-study/case-hero";
import { MetricStrip } from "@/components/case-study/metric-strip";
```

Replace the entire returned JSX (the `<article>…</article>`) with:

```tsx
  return (
    <article className="py-8" data-subject={resolveSubject({ category: project.category })}>
      <CaseHero
        project={project}
        labels={{ source: dict.work.source, liveDemo: dict.work.liveDemo }}
      />
      <MetricStrip metrics={project.metrics} />
      <div className="mt-8" data-narrate="project-body">
        <Mdx source={project.content} />
      </div>
    </article>
  );
```

- [ ] **Step 3: Verify the full test suite + lint + build**

Run: `npm test` → Expected: PASS (all suites)
Run: `npm run lint` → Expected: no errors (confirm no unused-import warnings remain in `page.tsx`)
Run: `npm run build` → Expected: build succeeds; `/work/[slug]` is generated for all three slugs via `generateStaticParams`.

- [ ] **Step 4: Commit**

```bash
git add src/components/mdx.tsx src/app/[lang]/work/[slug]/page.tsx
git commit -m "feat(case-study): compose hero, metric strip, and MDX blocks on the project page"
```

---

### Task 7: Rewrite project content to exercise the template

**Files:**
- Modify: `content/en/projects/ledger-engine.mdx`, `content/en/projects/atlas-design-system.mdx`, `content/en/projects/pulse-dashboard.mdx`

**Interfaces:**
- Consumes: the `metrics` frontmatter field and the registered `<PullQuote>`, `<Figure>`, `<Metric>` components.

- [ ] **Step 1: Rewrite `ledger-engine.mdx`**

Replace the file with (keep existing frontmatter values; add `metrics`; expand the body):

```mdx
---
title: Ledger Engine
summary: A distributed double-entry ledger that stays correct and fast under load.
role: Lead backend engineer
stack: [Go, Postgres, Kafka, gRPC]
category: systems
featured: true
order: 1
metrics:
  - { value: "12ms", label: "p99 write latency" }
  - { value: "10k/s", label: "sustained throughput" }
  - { value: "0", label: "double-counts in prod" }
links:
  repo: https://github.com/titouanlebocq/ledger-engine
---

## The problem

Money systems can't lose or double-count a transaction — ever. The batch
reconciler we inherited drifted under load and surfaced errors hours late,
which is exactly when a ledger is least trustworthy.

<PullQuote cite="Lead backend engineer">
  The hard part wasn't scale — it was staying correct under it.
</PullQuote>

## Approach

I rebuilt the write path around three guarantees: idempotent writes keyed by
client-supplied transaction IDs, an append-only event log as the source of
truth, and periodic balance snapshots so reads stay fast without replaying
history.

<Figure caption="Event-sourced write path with periodic balance snapshots" />

## Outcome

<Metric value="10k/s" label="sustained writes at p99 < 12ms" />

The ledger is horizontally scalable, idempotent by construction, and has not
recorded a single double-count in production.
```

- [ ] **Step 2: Rewrite `atlas-design-system.mdx`**

```mdx
---
title: Atlas Design System
summary: A themeable component library and design tokens that keep a product visually coherent.
role: Design engineer
stack: [React, TypeScript, Tailwind, Storybook]
category: interface
featured: true
order: 2
metrics:
  - { value: "60+", label: "components shipped" }
  - { value: "100%", label: "keyboard navigable" }
  - { value: "2", label: "first-class themes" }
links:
  demo: https://atlas.example.com
---

## The problem

Teams were rebuilding the same buttons, inputs, and modals with subtly
different spacing, color, and focus behavior. Accessibility was bolted on at
review time — if at all.

## Approach

I made the right thing the default: token-driven theming with first-class
light and dark modes, every component keyboard-navigable and screen-reader
tested out of the box, and Storybook docs with usage and do/don't guidance.

<PullQuote>
  Accessibility and visual consistency should be the default, not an afterthought.
</PullQuote>

<Figure caption="Token pipeline feeding light and dark themes" />

## Outcome

<Metric value="100%" label="components keyboard navigable & SR-tested" />

Product teams compose screens from a single source of truth, and visual drift
between surfaces effectively disappeared.
```

- [ ] **Step 3: Rewrite `pulse-dashboard.mdx`**

```mdx
---
title: Pulse Dashboard
summary: A real-time analytics dashboard — streaming backend and a polished, fast UI.
role: Full-stack engineer
stack: [Next.js, WebSockets, Rust, ClickHouse]
category: both
featured: false
order: 3
metrics:
  - { value: "<1s", label: "event-to-render latency" }
  - { value: "Rust", label: "ingestion service" }
  - { value: "24/7", label: "wall-display ready" }
links:
  repo: https://github.com/titouanlebocq/pulse
  demo: https://pulse.example.com
---

## The problem

Operators needed to see what was happening *now*, not on a 30-second refresh —
and the UI had to stay readable on a wall display from across the room.

## Approach

I owned it end to end: a Rust ingestion service feeding a ClickHouse store,
surfaced through a Next.js UI over WebSockets, with backpressure handling so
the interface degrades gracefully under spikes instead of falling over.

<Figure caption="Ingestion → ClickHouse → WebSocket UI pipeline" />

## Outcome

<Metric value="<1s" label="end-to-end, event to rendered chart" />

The dashboard reads at a glance on large displays and holds sub-second latency
even when event volume spikes.
```

- [ ] **Step 4: Verify the pages render**

Run: `npm run build` → Expected: build succeeds for all three slugs, no MDX runtime errors.
(Optional manual check: `npm run dev`, visit `/en/work/ledger-engine`, `/en/work/atlas-design-system`, `/en/work/pulse-dashboard` — confirm hero panel, metric strip, pull-quotes, figure placeholders, and inline metrics render with the correct subject accent.)

- [ ] **Step 5: Commit**

```bash
git add content/en/projects/ledger-engine.mdx content/en/projects/atlas-design-system.mdx content/en/projects/pulse-dashboard.mdx
git commit -m "content: expand project case studies with metrics and narrative blocks"
```

---

## Self-Review

**Spec coverage:**
- Data model (`metrics`) → Task 1 ✓
- `CaseHero`, `MetricStrip`, `Metric`, `PullQuote`, `Figure` → Tasks 2–5 ✓
- Register inline components + recompose page (preserve `data-subject`, both `data-narrate`) → Task 6 ✓
- Content rewrite with metrics + components → Task 7 ✓
- Tests + stories per component → Tasks 1–5 ✓
- Styling via Tailwind tokens (no custom globals.css needed) → folded into component tasks ✓
- Fixed inputs preserved (theming/motion/companion hooks untouched) → Global Constraints + Task 6 ✓
- Non-goals (no CMS/dep, no JSON blocks, no locked sections, no images required, no FR) → honored throughout ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✓

**Type consistency:** `metrics: { value: string; label: string }[]` is identical in the schema, `Project` type, `MetricStrip`/`Metric` props, and all test literals. `CaseHero({ project, labels })` signature matches its test, story, and the page call site. `MetricStrip({ metrics })` matches the page call (`project.metrics`). ✓
