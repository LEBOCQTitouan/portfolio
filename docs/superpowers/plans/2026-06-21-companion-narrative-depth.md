# Companion Narrative Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the companion orb narrate a case study section-by-section (problem→approach→outcome), with per-project lines authored in MDX frontmatter and a generic fallback arc.

**Architecture:** A rehype plugin wraps each `## h2` + its content in `<section data-narrate="section-N">` (first→`section-1`, last→`section-last`, middles ordinal). Per-project **text** rides the DOM via `data-narrate-text` attributes (set from `narrate:` frontmatter); **mood + generic fallback text** stay in `script.ts`. The companion merges them at one point: `text = override ?? scriptLine.text`, `mood = scriptLine.mood`.

**Tech Stack:** Next 16 (App Router, RSC), `next-mdx-remote/rsc`, rehype, zod, Vitest + Testing Library (jsdom), TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-21-companion-narrative-depth-design.md`

## Global Constraints

- Local gate — ALL must pass before a task is done: `npx tsc --noEmit` AND `npm test` AND `npm run lint` AND `npm run build`. (Build alone misses test-file type errors.)
- Run a single test file: `npx vitest run <path>`. Tests live at `src/**/*.test.{ts,tsx}`.
- `@types/hast` is NOT installed — do NOT `import ... from "hast"`. Use the local minimal node types defined in Task 2. Do not add new dependencies.
- New narration lines MUST be added for BOTH `en` and `fr` in `src/lib/narration/script.ts`.
- Do not modify the orb motion/spring engine. This work is content + anchors + one merge point only.
- Respect `prefers-reduced-motion` — add no new motion (the companion already handles it).
- Conventional commits, imperative, scoped. Commit at the end of each task.
- Frontmatter parsing must be forgiving: a malformed `narrate` block yields `undefined`, never throws.

---

### Task 1: `resolveLineText` pure helper

**Files:**
- Create: `src/lib/narration/resolve-line-text.ts`
- Test: `src/lib/narration/resolve-line-text.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `resolveLineText(datasetText: string | undefined, fallback: string): string` — returns `datasetText` when it is a non-empty string after trimming, else `fallback`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/narration/resolve-line-text.test.ts
import { describe, it, expect } from "vitest";
import { resolveLineText } from "./resolve-line-text";

describe("resolveLineText", () => {
  it("uses the override when it is a non-empty string", () => {
    expect(resolveLineText("Custom line", "Fallback")).toBe("Custom line");
  });
  it("falls back when override is undefined", () => {
    expect(resolveLineText(undefined, "Fallback")).toBe("Fallback");
  });
  it("falls back when override is empty or whitespace", () => {
    expect(resolveLineText("", "Fallback")).toBe("Fallback");
    expect(resolveLineText("   ", "Fallback")).toBe("Fallback");
  });
  it("preserves the override's own surrounding spaces when it has content", () => {
    expect(resolveLineText(" Custom ", "Fallback")).toBe(" Custom ");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/narration/resolve-line-text.test.ts`
Expected: FAIL — cannot find module `./resolve-line-text`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/narration/resolve-line-text.ts
/** The per-project override (from `data-narrate-text`) wins when present and
 *  non-blank; otherwise the generic script line is used. */
export function resolveLineText(datasetText: string | undefined, fallback: string): string {
  return datasetText && datasetText.trim().length > 0 ? datasetText : fallback;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/narration/resolve-line-text.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/narration/resolve-line-text.ts src/lib/narration/resolve-line-text.test.ts
git commit -m "feat(narration): add resolveLineText override helper"
```

---

### Task 2: `rehypeNarrateSections` plugin

**Files:**
- Create: `src/lib/mdx/rehype-narrate-sections.ts`
- Test: `src/lib/mdx/rehype-narrate-sections.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `rehypeNarrateSections(options?: { texts?: string[] }): (tree: HastRoot) => void` — a unified/rehype transformer. Mutates `tree.children`: groups each top-level `h2`-element + following siblings into a `<section>` element with `data-narrate` keyed first→`section-1`, last→`section-last`, middles `section-2..N`; sets `data-narrate-text` from `texts[i]` when that entry is a non-blank string. Nodes before the first `h2` are kept (lead). No `h2` → tree untouched.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/mdx/rehype-narrate-sections.test.ts
import { describe, it, expect } from "vitest";
import { rehypeNarrateSections } from "./rehype-narrate-sections";

// Minimal hast builders for tests.
const h2 = (text: string) => ({ type: "element", tagName: "h2", properties: {}, children: [{ type: "text", value: text }] });
const p = (text: string) => ({ type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: text }] });
const root = (...children: any[]) => ({ type: "root", children });

const run = (tree: any, texts?: string[]) => {
  rehypeNarrateSections({ texts })(tree);
  return tree;
};
const sections = (tree: any) => tree.children.filter((n: any) => n.tagName === "section");
const keyOf = (s: any) => s.properties["data-narrate"];

describe("rehypeNarrateSections", () => {
  it("keys 3 sections as section-1, section-2, section-last", () => {
    const tree = run(root(h2("Problem"), p("a"), h2("Approach"), p("b"), h2("Outcome"), p("c")));
    expect(sections(tree).map(keyOf)).toEqual(["section-1", "section-2", "section-last"]);
  });
  it("keys 4 sections as section-1, section-2, section-3, section-last", () => {
    const tree = run(root(h2("S"), h2("D"), h2("T"), h2("O")));
    expect(sections(tree).map(keyOf)).toEqual(["section-1", "section-2", "section-3", "section-last"]);
  });
  it("keys a single section as section-1", () => {
    const tree = run(root(h2("Only"), p("x")));
    expect(sections(tree).map(keyOf)).toEqual(["section-1"]);
  });
  it("leaves a tree with no h2 untouched", () => {
    const tree = run(root(p("just prose"), p("more")));
    expect(sections(tree)).toHaveLength(0);
    expect(tree.children).toHaveLength(2);
  });
  it("groups a section's following siblings as its children", () => {
    const tree = run(root(h2("Problem"), p("a"), p("b"), h2("Outcome"), p("c")));
    const [first] = sections(tree);
    expect(first.children.map((n: any) => n.tagName)).toEqual(["h2", "p", "p"]);
  });
  it("keeps content before the first h2 outside any section (lead)", () => {
    const tree = run(root(p("intro"), h2("Problem"), p("a")));
    expect(tree.children[0].tagName).toBe("p");
    expect(tree.children[1].tagName).toBe("section");
  });
  it("sets data-narrate-text positionally and skips blank/missing entries", () => {
    const tree = run(
      root(h2("A"), h2("B"), h2("C")),
      ["first line", "   ", undefined as unknown as string],
    );
    const [a, b, c] = sections(tree);
    expect(a.properties["data-narrate-text"]).toBe("first line");
    expect(b.properties["data-narrate-text"]).toBeUndefined();
    expect(c.properties["data-narrate-text"]).toBeUndefined();
  });
  it("ignores extra texts beyond the section count", () => {
    const tree = run(root(h2("A")), ["one", "two", "three"]);
    expect(sections(tree)).toHaveLength(1);
    expect(sections(tree)[0].properties["data-narrate-text"]).toBe("one");
  });
  it("preserves arbitrary non-h2 node types verbatim inside their section", () => {
    const widget = { type: "mdxJsxFlowElement", name: "CodePlayground", attributes: [], children: [] };
    const tree = run(root(h2("Approach"), widget));
    const [s] = sections(tree);
    expect(s.children[1]).toBe(widget); // moved, not transformed
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/mdx/rehype-narrate-sections.test.ts`
Expected: FAIL — cannot find module `./rehype-narrate-sections`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/mdx/rehype-narrate-sections.ts
// Local minimal hast types — @types/hast is not installed; we only touch a few
// fields, so a structural subset keeps the plugin typed without a new dependency.
type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  [key: string]: unknown;
};
type HastRoot = { type: "root"; children: HastNode[] };

/**
 * Groups each top-level `<h2>` and its following siblings into a
 * `<section data-narrate="...">` so the companion orb can narrate per section.
 * Keys: first → "section-1", last → "section-last", middles → "section-{i+1}".
 * `options.texts[i]` (non-blank) becomes that section's `data-narrate-text`.
 */
export function rehypeNarrateSections(options: { texts?: string[] } = {}) {
  const texts = options.texts ?? [];
  return (tree: HastRoot): void => {
    const lead: HastNode[] = [];
    const groups: HastNode[][] = [];
    let current: HastNode[] | null = null;

    for (const node of tree.children) {
      if (node.type === "element" && node.tagName === "h2") {
        current = [node];
        groups.push(current);
      } else if (current) {
        current.push(node);
      } else {
        lead.push(node);
      }
    }
    if (groups.length === 0) return;

    const n = groups.length;
    const sections: HastNode[] = groups.map((children, i) => {
      const key = i === 0 ? "section-1" : i === n - 1 ? "section-last" : `section-${i + 1}`;
      const properties: Record<string, string> = { "data-narrate": key };
      const text = texts[i];
      if (typeof text === "string" && text.trim().length > 0) {
        properties["data-narrate-text"] = text;
      }
      return { type: "element", tagName: "section", properties, children };
    });

    tree.children = [...lead, ...sections];
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/mdx/rehype-narrate-sections.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mdx/rehype-narrate-sections.ts src/lib/mdx/rehype-narrate-sections.test.ts
git commit -m "feat(mdx): add rehypeNarrateSections plugin"
```

---

### Task 3: `Project.narrate` type + forgiving frontmatter parse

**Files:**
- Modify: `src/core/domain/project.ts`
- Test: `src/core/domain/project.test.ts` (append tests)

**Interfaces:**
- Consumes: nothing.
- Produces: `Project.narrate?: { header?: string; beats?: string[] }`. `parseProject` populates it from frontmatter; a malformed `narrate` block yields `undefined` (never throws); non-string `beats` entries are filtered out.

- [ ] **Step 1: Write the failing tests** (append inside the existing `describe("parseProject", …)` block in `src/core/domain/project.test.ts`)

```ts
  it("parses a narrate block with header and beats", () => {
    const p = parseProject(
      { title: "T", summary: "S", role: "R", category: "systems",
        narrate: { header: "H", beats: ["one", "two"] } },
      "b", "x",
    );
    expect(p.narrate).toEqual({ header: "H", beats: ["one", "two"] });
  });
  it("leaves narrate undefined when absent", () => {
    const p = parseProject({ title: "T", summary: "S", role: "R", category: "systems" }, "b", "x");
    expect(p.narrate).toBeUndefined();
  });
  it("drops non-string beats entries instead of throwing", () => {
    const p = parseProject(
      { title: "T", summary: "S", role: "R", category: "systems",
        narrate: { beats: ["ok", 42, null, "fine"] } },
      "b", "x",
    );
    expect(p.narrate?.beats).toEqual(["ok", "fine"]);
  });
  it("drops a malformed narrate block (not an object) without throwing", () => {
    const p = parseProject(
      { title: "T", summary: "S", role: "R", category: "systems", narrate: "nope" },
      "b", "x",
    );
    expect(p.narrate).toBeUndefined();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/core/domain/project.test.ts`
Expected: FAIL — `p.narrate` is `undefined`/throws (schema doesn't know `narrate`).

- [ ] **Step 3: Implement** — add the schema and type field in `src/core/domain/project.ts`.

Add after `metricSchema` (before `frontmatterSchema`):

```ts
const narrateSchema = z
  .object({
    header: z.string().optional(),
    beats: z
      .preprocess(
        (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : v),
        z.array(z.string()).optional(),
      ),
  })
  .optional()
  .catch(undefined);
```

Add `narrate: narrateSchema,` as a field inside `frontmatterSchema` (e.g. after `order`).

Add to the `Project` type (after `order: number;`):

```ts
  narrate?: { header?: string; beats?: string[] };
```

(No change needed in `parseProject`'s body — it already spreads `parsed.data`.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/core/domain/project.test.ts`
Expected: PASS (all existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/core/domain/project.ts src/core/domain/project.test.ts
git commit -m "feat(domain): parse optional narrate block on projects"
```

---

### Task 4: Voice-B generic arc in `script.ts` + resolver tests

**Files:**
- Modify: `src/lib/narration/script.ts`
- Modify: `src/lib/narration/resolver.test.ts`

**Interfaces:**
- Consumes: `NarrationLine` (`{ id, mood, text }`), `Mood` (`"calm" | "warm" | "focused"`) — unchanged.
- Produces: `script.en["/work/[slug]"]` and `script.fr["/work/[slug]"]` each contain lines with ids `project-header`, `section-1`, `section-2`, `section-3`, `section-last` (in that order), with moods `warm, focused, calm, focused, warm`.

- [ ] **Step 1: Update the failing test** — in `src/lib/narration/resolver.test.ts`, replace the two assertions that expect `["project-header", "project-body"]`:

```ts
  it("resolves any /work/<slug> to the project template", () => {
    const lines = getNarration("/work/ledger-engine", "en");
    expect(lines.map((l) => l.id)).toEqual([
      "project-header", "section-1", "section-2", "section-3", "section-last",
    ]);
  });
```
and the deeper-path FR test:
```ts
  it("strips /fr/ prefix from deeper paths", () => {
    const lines = getNarration("/fr/work/my-project", "fr");
    expect(lines.map((l) => l.id)).toEqual([
      "project-header", "section-1", "section-2", "section-3", "section-last",
    ]);
  });
```

Add a mood-arc assertion:
```ts
  it("gives /work/<slug> the focused→calm→warm mood arc", () => {
    const lines = getNarration("/work/x", "en");
    expect(lines.map((l) => l.mood)).toEqual(["warm", "focused", "calm", "focused", "warm"]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/narration/resolver.test.ts`
Expected: FAIL — current entry only has `project-header`, `project-body`.

- [ ] **Step 3: Implement** — in `src/lib/narration/script.ts`, replace BOTH `"/work/[slug]"` entries.

`en`:
```ts
  "/work/[slug]": [
    { id: "project-header", mood: "warm", text: "Pull up a chair — every project here is a small story." },
    { id: "section-1", mood: "focused", text: "It always starts with something quietly broken." },
    { id: "section-2", mood: "calm", text: "So I made a bet on how to fix it. Here's the bet." },
    { id: "section-3", mood: "focused", text: "Every bet costs something. Here's what this one cost." },
    { id: "section-last", mood: "warm", text: "And here's how it paid off." },
  ],
```

`fr`:
```ts
  "/work/[slug]": [
    { id: "project-header", mood: "warm", text: "Installe-toi — chaque projet ici raconte une petite histoire." },
    { id: "section-1", mood: "focused", text: "Tout commence par quelque chose de discrètement cassé." },
    { id: "section-2", mood: "calm", text: "Alors j'ai fait un pari sur la façon de le réparer. Voici le pari." },
    { id: "section-3", mood: "focused", text: "Tout pari a un coût. Voici ce que celui-ci a coûté." },
    { id: "section-last", mood: "warm", text: "Et voilà comment ça a payé." },
  ],
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/narration/resolver.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/narration/script.ts src/lib/narration/resolver.test.ts
git commit -m "feat(narration): richer generic arc for case-study sections"
```

---

### Task 5: Wire the plugin into `Mdx` (+ verify nested custom components compile)

**Files:**
- Modify: `src/components/mdx.tsx`

**Interfaces:**
- Consumes: `rehypeNarrateSections` (Task 2).
- Produces: `Mdx({ source: string; narrateBeats?: string[] })` — renders the MDX with section anchors and per-beat `data-narrate-text`.

This is a wiring task. There is no unit test: rendering `next-mdx-remote/rsc` (a nested async server component) in Vitest/jsdom is unreliable. The nesting risk (custom `mdxJsxFlowElement` components re-parented under the plugin-injected `<section>`) is covered by `npm run build`, which compiles the real case studies — `ledger-engine`/`pulse-dashboard`/`atlas-design-system` already place `<PullQuote>`, `<Figure>`, `<Metric>`, and code blocks under `##` headings. A compile failure there fails the build.

- [ ] **Step 1: Add the import** at the top of `src/components/mdx.tsx`:

```ts
import { rehypeNarrateSections } from "@/lib/mdx/rehype-narrate-sections";
```

- [ ] **Step 2: Add the prop** — change the signature:

```ts
export async function Mdx({ source, narrateBeats }: { source: string; narrateBeats?: string[] }) {
```

- [ ] **Step 3: Insert the plugin** into `rehypePlugins`, between `rehypeSlug` and the Shiki entry:

```ts
            rehypePlugins: [
              rehypeSlug,
              [rehypeNarrateSections, { texts: narrateBeats ?? [] }],
              [
                rehypeShikiFromHighlighter,
                hl,
                {
                  themes: { light: "github-light", dark: "github-dark" },
                  defaultColor: false,
                },
              ],
            ],
```

- [ ] **Step 4: Verify it compiles over real content**

Run: `npx tsc --noEmit && npm run build`
Expected: build succeeds; case-study pages (which nest custom components under headings) compile. If the build fails inside MDX compilation, that is the nesting risk surfacing — stop and report.

- [ ] **Step 5: Commit**

```bash
git add src/components/mdx.tsx
git commit -m "feat(mdx): wrap case-study sections via rehypeNarrateSections"
```

---

### Task 6: `CaseHero` carries the per-project header line

**Files:**
- Modify: `src/components/case-study/case-hero.tsx`
- Test: `src/components/case-study/case-hero.test.tsx` (append)

**Interfaces:**
- Consumes: nothing.
- Produces: `CaseHero({ project, labels, narrateHeader?: string })` — when `narrateHeader` is set, the `[data-narrate="project-header"]` header also has `data-narrate-text={narrateHeader}`.

- [ ] **Step 1: Write the failing tests** (append to `case-hero.test.tsx`)

```ts
  it("sets data-narrate-text on the header when narrateHeader is provided", () => {
    const { container } = render(
      <CaseHero project={project} labels={labels} narrateHeader="Ledger Engine. Never lie about money." />,
    );
    expect(container.querySelector('[data-narrate="project-header"]'))
      .toHaveAttribute("data-narrate-text", "Ledger Engine. Never lie about money.");
  });
  it("omits data-narrate-text when narrateHeader is absent", () => {
    const { container } = render(<CaseHero project={project} labels={labels} />);
    expect(container.querySelector('[data-narrate="project-header"]'))
      .not.toHaveAttribute("data-narrate-text");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/case-study/case-hero.test.tsx`
Expected: FAIL — `narrateHeader` not a prop; attribute never set.

- [ ] **Step 3: Implement** — in `src/components/case-study/case-hero.tsx`:

Change the signature/destructure to add `narrateHeader`:
```tsx
export function CaseHero({
  project,
  labels,
  narrateHeader,
}: {
  project: Project;
  labels: { source: string; liveDemo: string };
  narrateHeader?: string;
}) {
```

Add the conditional attribute to the `<header>`:
```tsx
    <header
      className="mb-8 rounded-2xl border border-accent/15 bg-[var(--accent-soft)] p-6"
      data-narrate="project-header"
      {...(narrateHeader ? { "data-narrate-text": narrateHeader } : {})}
    >
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/case-study/case-hero.test.tsx`
Expected: PASS (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/case-study/case-hero.tsx src/components/case-study/case-hero.test.tsx
git commit -m "feat(case-study): pass per-project header narration to CaseHero"
```

---

### Task 7: Wire the case-study page

**Files:**
- Modify: `src/app/[lang]/work/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Project.narrate` (Task 3), `CaseHero` `narrateHeader` (Task 6), `Mdx` `narrateBeats` (Task 5).
- Produces: the rendered route — header carries `narrate.header`, sections carry `narrate.beats`, and the old `project-body` anchor is gone.

Wiring task; verified by typecheck + build + a grep assertion (the page is an async server component with `notFound`/`getDictionary`, not a unit-test target).

- [ ] **Step 1: Remove the `project-body` anchor and pass the props.** Replace the return block in `src/app/[lang]/work/[slug]/page.tsx`:

```tsx
  return (
    <article className="py-8" data-subject={resolveSubject({ category: project.category })}>
      <CaseHero
        project={project}
        labels={{ source: dict.work.source, liveDemo: dict.work.liveDemo }}
        narrateHeader={project.narrate?.header}
      />
      <MetricStrip metrics={project.metrics} />
      <div className="mt-8">
        <Mdx source={project.content} narrateBeats={project.narrate?.beats} />
      </div>
    </article>
  );
```

- [ ] **Step 2: Verify the old anchor is gone**

Run: `grep -n 'project-body' src/app/[lang]/work/[slug]/page.tsx`
Expected: no output (exit code 1).

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[lang]/work/[slug]/page.tsx"
git commit -m "feat(work): narrate case studies per section instead of one body block"
```

---

### Task 8: Companion prefers the per-project override text

**Files:**
- Modify: `src/components/companion/companion.tsx`

**Interfaces:**
- Consumes: `resolveLineText` (Task 1); `data-narrate-text` attributes (Tasks 5, 6).
- Produces: the orb shows `resolveLineText(override, scriptLine.text)`; mood stays `scriptLine.mood`.

Wiring task. The merge logic is the pure `resolveLineText` (unit-tested in Task 1); the orb's IntersectionObserver/rAF wiring is not unit-tested (brittle DOM/timing). Verified by typecheck + build + the manual dev check in Task 10.

- [ ] **Step 1: Import the helper** — add to the imports in `src/components/companion/companion.tsx`:

```ts
import { resolveLineText } from "@/lib/narration/resolve-line-text";
```

- [ ] **Step 2: Extend the active state type.** Change:

```ts
  const [active, setActive] = useState<{ route: string; id: string } | null>(null);
```
to:
```ts
  const [active, setActive] = useState<{ route: string; id: string; text?: string } | null>(null);
```

- [ ] **Step 3: Capture the override text when the active section changes.** In the IntersectionObserver callback (the `if (next) { … }` block), replace:

```ts
        if (next) {
          activeIdRef.current = next;
          setActive({ route: pathname, id: next });
          recompute();
        }
```
with:
```ts
        if (next) {
          activeIdRef.current = next;
          const el = document.querySelector<HTMLElement>(`[data-narrate="${next}"]`);
          setActive({ route: pathname, id: next, text: el?.dataset.narrateText });
          recompute();
        }
```

- [ ] **Step 4: Merge at render.** Find:

```ts
  const activeId = active?.route === pathname ? active.id : null;
  const activeLine = lines.find((l) => l.id === activeId) ?? lines[0];
```
and add directly below it:
```ts
  const activeText = resolveLineText(active?.route === pathname ? active.text : undefined, activeLine.text);
```
Then change the `SpeechBubble` usage from:
```tsx
        {showBubble && <SpeechBubble text={activeLine.text} reducedMotion={reducedMotion} />}
```
to:
```tsx
        {showBubble && <SpeechBubble text={activeText} reducedMotion={reducedMotion} />}
```
(Leave `Orb mood={activeLine.mood}` unchanged — mood always comes from the script.)

- [ ] **Step 5: Verify it compiles and the suite is green**

Run: `npx tsc --noEmit && npx vitest run src/components/companion`
Expected: PASS (existing companion tests still green).

- [ ] **Step 6: Commit**

```bash
git add src/components/companion/companion.tsx
git commit -m "feat(companion): prefer per-project narration text over the generic line"
```

---

### Task 9: Add the authoring section to the writing guide

**Files:**
- Modify: `docs/writing-guide.md`

**Interfaces:**
- Consumes: nothing. Documentation only.

- [ ] **Step 1: Append a new section** to `docs/writing-guide.md` (after §7, renumber/extend as fits the file). Use this content:

````markdown
## 8. Companion narration on case studies

The orb narrates a `/work` case study section-by-section. You control it from one
optional frontmatter block — no anchors, no wrappers, no mood-picking.

```yaml
narrate:                                    # entire block optional
  header: "Realtime Sync. The promise: your edits never collide, never vanish."
  beats:                                    # map top-to-bottom onto your ## sections
    - "Last-write-wins quietly ate people's work — nobody noticed until it was gone."
    - "So I bet on CRDTs: merge by construction, no central referee, no lock."
    - "Now it's zero lost edits in prod, and it just works on a plane."
```

Rules:
- **Headings define beats.** Each `## ` section becomes one orb line; `beats` map
  onto them in order. Content before the first `##` is unnarrated lead.
- **Want a demo to be its own beat?** Give it its own `## heading`.
- **Partial is fine.** Fewer beats than sections → the rest fall back to the
  generic arc. Omit `narrate` entirely → fully generic. Moods are assigned
  automatically (focused→calm→warm).

### Two flavors, one file

A case study can be **text-led** (prose under each heading) or **demo-led** (live
components, code blocks, animations placed under the headings). Both are the *same
file shape and the same narration* — the only difference is how much you put under
each `##`. There is no "type" to choose: drop a `<Demo/>` under a heading and it
becomes part of that beat.
````

- [ ] **Step 2: Commit**

```bash
git add docs/writing-guide.md
git commit -m "docs: document companion narration authoring for case studies"
```

---

### Task 10: Full gate + manual verification + sample narration

**Files:**
- Modify: `content/en/projects/ledger-engine.mdx` (add a `narrate:` block to prove the end-to-end path)

- [ ] **Step 1: Add a narrate block** to `content/en/projects/ledger-engine.mdx` frontmatter (its sections are: The problem / Approach / Outcome):

```yaml
narrate:
  header: "Ledger Engine. Its one job: never lie about money."
  beats:
    - "The old reconciler drifted under load — and told us hours too late."
    - "So I rebuilt the write path to be idempotent by construction."
    - "Result: 10k writes a second, and zero double-counts in prod. Ever."
```

- [ ] **Step 2: Run the full local gate**

Run: `npx tsc --noEmit && npm test && npm run lint && npm run build`
Expected: all PASS.

- [ ] **Step 3: Manual check** (`npm run dev`, open `http://localhost:3000/en/work/ledger-engine`):
  - Scroll: the orb floats beside each section and speaks the three Ledger-specific lines, then the warm outcome line.
  - Open `http://localhost:3000/en/work/pulse-dashboard` (no `narrate` block): the orb speaks the generic voice-B arc.
  - Open `http://localhost:3000/fr/work/ledger-engine`: orb speaks the EN frontmatter lines (content is EN-only — expected per spec §7).
  - Enable OS "reduce motion": orb still narrates, no new motion introduced.

- [ ] **Step 4: Commit**

```bash
git add content/en/projects/ledger-engine.mdx
git commit -m "content: add per-section narration to Ledger Engine case study"
```

---

## Self-Review

**Spec coverage:**
- §2.1 plugin / §2.2 first-last keying → Task 2. ✓
- §2.3 hybrid content (voice B fallback) → Task 4; (voice C override) → Tasks 3,5,6,8. ✓
- §2.4 one path / two flavors → Task 9 (docs only; no code branch). ✓
- §2.5 text-only, mute/reduced-motion untouched → Task 8 changes only text source; mood/motion untouched. ✓
- §3 two-channel architecture → Tasks 5/6 (DOM text), 4 (script mood+fallback), 8 (merge). ✓
- §4.1 domain → Task 3; §4.2 plugin → Task 2; §4.3 helper → Task 1; §4.4 props → Tasks 5,6; §4.5 page → Task 7; §4.6 companion → Task 8; §4.7 script → Task 4. ✓
- §5 authoring contract → Task 9; sample exercised in Task 10. ✓
- §6 custom elements → Task 2 (node preservation test) + Task 5 (build over real nested components). ✓
- §7 locale → verified in Task 10 manual check. ✓
- §8 out of scope → not built (correct). ✓
- §9 test plan → Tasks 1,2,3,4,6 carry the unit tests; the MDX-nesting "render test" is realized as build-over-real-content (Task 5) because RSC MDX is not reliably unit-testable in Vitest — noted explicitly. ✓
- §10 gotchas → encoded in Global Constraints. ✓

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to Task N". Every code step shows complete code. ✓

**Type consistency:** `resolveLineText(string|undefined, string): string` used identically in Tasks 1 and 8. `rehypeNarrateSections(options?: { texts?: string[] })` defined in Task 2, called with `{ texts: narrateBeats ?? [] }` in Task 5. `narrateHeader?: string` (Task 6) and `narrateBeats?: string[]` (Task 5) match the page wiring in Task 7. `Project.narrate?: { header?: string; beats?: string[] }` (Task 3) matches `project.narrate?.header` / `project.narrate?.beats` reads in Task 7. Section keys `section-1/2/3/last` consistent across Tasks 2 and 4. ✓
