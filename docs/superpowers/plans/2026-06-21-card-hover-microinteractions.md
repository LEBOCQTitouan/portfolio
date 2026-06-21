# Card Hover Micro-interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cursor-driven, per-subject light layer (interior glow + top/bottom edge light) to the project- and post-card list rows, without turning them into boxed cards.

**Architecture:** A single `"use client"` `GlowGroup` wrapper owns the pointer interaction and sets CSS variables / data-attributes on each card row; the cards stay near-static and opt in with classes + `data-subject`; all visuals are CSS in `globals.css` driven by those variables, reusing the existing `--accent` grammar via `color-mix`.

**Tech Stack:** Next.js 16 (App Router), React, Tailwind v4 (no config file), Vitest + @testing-library/react (jsdom), Storybook.

## Global Constraints

- Cards stay **divider rows** (`border-b border-border py-6`) — no box, lift, scale, or shadow; no padding/margin/layout changes.
- `ProjectCard` stays a **server** component; `PostCard` stays `"use client"`.
- No new design tokens beyond three glow knobs (`--glow-r`, `--card-edge`, `--glow-neutral`). Subject colors come from existing `[data-subject]` blocks via `color-mix(in srgb, var(--accent) N%, transparent)`.
- Every motion/transition guarded by `@media (prefers-reduced-motion: reduce)`. Keyboard parity: every `:hover` cue also fires on `:focus-within`.
- Next 16: do not add a root `middleware.ts` (it's `src/proxy.ts`); irrelevant here but do not touch.
- **Verification gate (run before the final commit / PR):** `npx tsc --noEmit && npm test && npm run lint && npm run build`. `npm run build` alone does NOT typecheck test files — `tsc --noEmit` is mandatory (this gap broke CI on #1).
- Conventional-commit messages, imperative mood. Do not push or open a PR unless explicitly asked.

---

### Task 1: `GlowGroup` client component

**Files:**
- Create: `src/components/glow-group.tsx`
- Test: `src/components/glow-group.test.tsx`

**Interfaces:**
- Consumes: nothing from other tasks. Queries `[data-glow-row]` descendants at runtime (no import coupling).
- Produces: `GlowGroup({ children, className? }): JSX.Element` — renders `<div data-glow-group className?>`. On mouse `pointermove` it sets `--mx`/`--my` (un-clamped, `clientX-rect.left` / `clientY-rect.top`) on every `[data-glow-row]` child, toggles `data-hot` on the row whose vertical band contains the cursor, and sets `data-on` on the root. `pointerleave` clears `data-on` + all `data-hot`. Rect cache rebuilds on `scroll`/`resize`; writes coalesced in one `requestAnimationFrame`.

- [ ] **Step 1: Write the failing test**

Create `src/components/glow-group.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GlowGroup } from "@/components/glow-group";

// jsdom lacks PointerEvent; emulate with a MouseEvent + pointerType.
function pointerMove(
  el: Element,
  { clientX, clientY, pointerType = "mouse" }: { clientX: number; clientY: number; pointerType?: string },
) {
  const ev = new MouseEvent("pointermove", { clientX, clientY, bubbles: true });
  Object.defineProperty(ev, "pointerType", { value: pointerType });
  el.dispatchEvent(ev);
}

function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
  el.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} , ...rect }) as DOMRect;
}

describe("GlowGroup", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sets per-row cursor vars and marks the hovered row on mouse move", () => {
    const { container } = render(
      <GlowGroup>
        <article data-glow-row data-testid="r0" />
        <article data-glow-row data-testid="r1" />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const r0 = container.querySelector('[data-testid="r0"]') as HTMLElement;
    const r1 = container.querySelector('[data-testid="r1"]') as HTMLElement;
    mockRect(r0, { left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 });
    mockRect(r1, { left: 0, top: 100, right: 200, bottom: 200, width: 200, height: 100 });
    window.dispatchEvent(new Event("resize")); // re-measure with mocked rects

    pointerMove(group, { clientX: 50, clientY: 120 });

    expect(group).toHaveAttribute("data-on");
    expect(r1).toHaveAttribute("data-hot"); // y=120 is inside r1
    expect(r0).not.toHaveAttribute("data-hot");
    expect(r0.style.getPropertyValue("--mx")).toBe("50px");
    expect(r0.style.getPropertyValue("--my")).toBe("120px"); // un-clamped
    expect(r1.style.getPropertyValue("--my")).toBe("20px");
  });

  it("ignores non-mouse pointers", () => {
    const { container } = render(
      <GlowGroup>
        <article data-glow-row />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    pointerMove(group, { clientX: 10, clientY: 10, pointerType: "touch" });
    expect(group).not.toHaveAttribute("data-on");
  });

  it("clears state on pointerleave", () => {
    const { container } = render(
      <GlowGroup>
        <article data-glow-row data-testid="r0" />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const r0 = container.querySelector('[data-testid="r0"]') as HTMLElement;
    mockRect(r0, { left: 0, top: 0, right: 200, bottom: 100, width: 200, height: 100 });
    window.dispatchEvent(new Event("resize"));
    pointerMove(group, { clientX: 10, clientY: 10 });
    group.dispatchEvent(new MouseEvent("pointerleave", { bubbles: true }));
    expect(group).not.toHaveAttribute("data-on");
    expect(r0).not.toHaveAttribute("data-hot");
  });

  it("removes listeners on unmount", () => {
    const { container, unmount } = render(
      <GlowGroup>
        <article data-glow-row />
      </GlowGroup>,
    );
    const group = container.querySelector("[data-glow-group]") as HTMLElement;
    const spy = vi.spyOn(group, "removeEventListener");
    unmount();
    expect(spy).toHaveBeenCalledWith("pointermove", expect.any(Function));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/glow-group.test.tsx`
Expected: FAIL — cannot resolve `@/components/glow-group`.

- [ ] **Step 3: Write the component**

Create `src/components/glow-group.tsx`:

```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function GlowGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let rows: HTMLElement[] = [];
    let rects: DOMRect[] = [];
    let frame = 0;
    let last: { x: number; y: number } | null = null;

    const measure = () => {
      rows = Array.from(root.querySelectorAll<HTMLElement>("[data-glow-row]"));
      rects = rows.map((row) => row.getBoundingClientRect());
    };

    const apply = () => {
      frame = 0;
      if (!last) return;
      const { x, y } = last;
      rows.forEach((row, i) => {
        const rect = rects[i];
        if (!rect) return;
        row.style.setProperty("--mx", `${x - rect.left}px`);
        row.style.setProperty("--my", `${y - rect.top}px`);
        row.toggleAttribute("data-hot", y >= rect.top && y <= rect.bottom);
      });
    };

    const onMove = (e: PointerEvent | MouseEvent) => {
      if ("pointerType" in e && e.pointerType !== "mouse") return;
      root.setAttribute("data-on", "");
      last = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      root.removeAttribute("data-on");
      rows.forEach((row) => row.removeAttribute("data-hot"));
    };

    measure();
    root.addEventListener("pointermove", onMove as EventListener);
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      root.removeEventListener("pointermove", onMove as EventListener);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} data-glow-group className={className}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/glow-group.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/glow-group.tsx src/components/glow-group.test.tsx
git commit -m "feat: add GlowGroup pointer-driven hover controller"
```

---

### Task 2: `ProjectCard` glow hooks

**Files:**
- Modify: `src/components/project-card.tsx`
- Test: `src/components/project-card.test.tsx`

**Interfaces:**
- Consumes: `resolveSubject` from `@/core/domain/subject` (existing, tested).
- Produces: a `<article class="card-glow border-b border-border py-6" data-glow-row data-subject="…">` whose first child is `<span class="card-edge-light" aria-hidden="true" />` and whose stack list carries `class="card-pills …"`. Consumed at runtime by `GlowGroup` (Task 1) and styled by CSS (Task 4).

- [ ] **Step 1: Write the failing test**

Append to `src/components/project-card.test.tsx` (inside the `describe("ProjectCard", …)` block):

```tsx
  it("scopes the subject and exposes glow hooks", () => {
    const { container } = render(<ProjectCard project={project} lang="en" />);
    const article = container.querySelector("article")!;
    expect(article).toHaveClass("card-glow");
    expect(article).toHaveAttribute("data-glow-row");
    expect(article).toHaveAttribute("data-subject", "systems"); // category "systems"
    const edge = article.querySelector(".card-edge-light")!;
    expect(edge).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("ul.card-pills")).not.toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/project-card.test.tsx -t "glow hooks"`
Expected: FAIL — no `.card-glow` class / no `.card-edge-light`.

- [ ] **Step 3: Modify the component**

In `src/components/project-card.tsx`:

Add the import near the top (after the existing imports):

```tsx
import { resolveSubject } from "@/core/domain/subject";
```

Replace the opening `<article>` and the start of its body:

```tsx
    <article className="border-b border-border py-6">
      <div className="flex items-start justify-between gap-4">
```

with:

```tsx
    <article
      className="card-glow border-b border-border py-6"
      data-glow-row
      data-subject={resolveSubject({ category: project.category })}
    >
      <span className="card-edge-light" aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
```

Replace the stack list opening tag:

```tsx
        <ul className="mt-3 flex flex-wrap gap-2">
```

with:

```tsx
        <ul className="card-pills mt-3 flex flex-wrap gap-2">
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/project-card.test.tsx`
Expected: PASS (existing tests + the new one).

- [ ] **Step 5: Commit**

```bash
git add src/components/project-card.tsx src/components/project-card.test.tsx
git commit -m "feat: add subject scope and glow hooks to ProjectCard"
```

---

### Task 3: `PostCard` glow hooks

**Files:**
- Modify: `src/components/post-card.tsx`
- Test: `src/components/post-card.test.tsx`

**Interfaces:**
- Consumes: `resolveSubject` from `@/core/domain/subject`.
- Produces: `<article class="card-glow border-b border-border py-6" data-glow-row data-subject="…">` with a leading `<span class="card-edge-light" aria-hidden="true" />` and the tags container carrying `class="card-pills …"`.

- [ ] **Step 1: Write the failing test**

Append to `src/components/post-card.test.tsx` (inside `describe("PostCard", …)`), reusing the existing `renderPostCard()` helper but capturing the container:

```tsx
  it("scopes the subject and exposes glow hooks", () => {
    const { container } = renderPostCard();
    const article = container.querySelector("article")!;
    expect(article).toHaveClass("card-glow");
    expect(article).toHaveAttribute("data-glow-row");
    expect(article).toHaveAttribute("data-subject", "systems"); // tags ["systems"]
    const edge = article.querySelector(".card-edge-light")!;
    expect(edge).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".card-pills")).not.toBeNull();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/post-card.test.tsx -t "glow hooks"`
Expected: FAIL — no `.card-glow`.

- [ ] **Step 3: Modify the component**

In `src/components/post-card.tsx`:

Add the import after the existing imports:

```tsx
import { resolveSubject } from "@/core/domain/subject";
```

Replace the opening `<article>`:

```tsx
    <article className="border-b border-border py-6">
```

with:

```tsx
    <article
      className="card-glow border-b border-border py-6"
      data-glow-row
      data-subject={resolveSubject({ tags: post.tags })}
    >
      <span className="card-edge-light" aria-hidden="true" />
```

Replace the tags container opening tag:

```tsx
        <div className="mt-3 flex flex-wrap gap-2">
```

with:

```tsx
        <div className="card-pills mt-3 flex flex-wrap gap-2">
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/post-card.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/post-card.tsx src/components/post-card.test.tsx
git commit -m "feat: add subject scope and glow hooks to PostCard"
```

---

### Task 4: Card glow CSS

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `data-subject` → `--accent` (existing blocks), and `--mx`/`--my`/`data-hot`/`data-on` set by `GlowGroup` (Task 1), plus `.card-glow`/`.card-edge-light`/`.card-pills` from Tasks 2–3.
- Produces: the rendered glow/edge visuals. No JS interface.

> CSS isn't unit-testable; this task verifies via `npm run build` (Tailwind/Next would fail on a CSS syntax error) and manual check against the locked mockup `.superpowers/brainstorm/**/pattern2-edges.html`.

- [ ] **Step 1: Add the glow tokens**

In `src/app/globals.css`, in the `:root { … }` block (after the `--ring: var(--accent);` line), add:

```css
  /* Card hover glow knobs */
  --glow-r: 240px;
  --card-edge: 2px;
  --glow-neutral: rgba(80, 86, 100, 0.16);
```

In the `.dark { … }` block (after its accent overrides), add:

```css
  --glow-neutral: rgba(225, 230, 242, 0.18);
```

- [ ] **Step 2: Add the card glow rules**

In `src/app/globals.css`, immediately before the `/* ── Companion orb ── */` section, add:

```css
/* ── Card hover glow — cursor-driven light on card-list rows ──── */
/* Rows opt in with .card-glow + data-glow-row; a <GlowGroup> parent sets
   --mx/--my and data-hot / [data-on] on pointer move. Subject color comes
   from the row's own data-subject via color-mix(--accent). */
.card-glow { position: relative; isolation: isolate; }

/* interior glow — neutral by default; subject on the hovered/focused row */
.card-glow::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -3;
  pointer-events: none;
  background: radial-gradient(
    var(--glow-r) circle at var(--mx, 50%) var(--my, 50%),
    var(--glow-neutral),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}
[data-glow-group][data-on] .card-glow::before { opacity: 1; }
.card-glow[data-hot]::before,
.card-glow:focus-within::before {
  background: radial-gradient(
    var(--glow-r) circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in srgb, var(--accent) 20%, transparent),
    transparent 70%
  );
}
.card-glow:focus-within::before { opacity: 1; }

/* edge light — same light source, masked to TOP + BOTTOM lines only */
.card-edge-light {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    var(--glow-r) circle at var(--mx, 50%) var(--my, 50%),
    color-mix(in srgb, var(--accent) 85%, transparent),
    transparent 70%
  );
  -webkit-mask:
    linear-gradient(#000, #000) top / 100% var(--card-edge) no-repeat,
    linear-gradient(#000, #000) bottom / 100% var(--card-edge) no-repeat;
  mask:
    linear-gradient(#000, #000) top / 100% var(--card-edge) no-repeat,
    linear-gradient(#000, #000) bottom / 100% var(--card-edge) no-repeat;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.card-glow:hover .card-edge-light,
.card-glow:focus-within .card-edge-light { opacity: 1; }

/* pill tint on the hovered/focused row */
.card-glow:hover .card-pills > *,
.card-glow:focus-within .card-pills > * {
  border-color: var(--accent);
  color: var(--accent);
}

@media (prefers-reduced-motion: reduce) {
  .card-glow::before,
  .card-edge-light,
  .card-glow:hover .card-pills > *,
  .card-glow:focus-within .card-pills > * {
    transition: none !important;
  }
}
```

- [ ] **Step 3: Verify the build compiles the CSS**

Run: `npm run build`
Expected: build succeeds (no CSS/Tailwind errors).

- [ ] **Step 4: Manual visual check (optional but recommended)**

Run `npm run dev`, open `/en/work` and `/en/blog`, hover rows: interior glow appears (gray on neighbours, subject color on the hovered row), top/bottom edge light tracks the cursor, pills tint, `Tab` lights the focused row. Confirm against `.superpowers/brainstorm/**/pattern2-edges.html`.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add card hover glow + edge-light styles"
```

---

### Task 5: Wire `GlowGroup` into render sites + stories

**Files:**
- Modify: `src/app/[lang]/work/page.tsx`
- Modify: `src/components/blog-explorer.tsx`
- Modify: `src/app/[lang]/blog/tags/[tag]/page.tsx`
- Modify: `src/app/[lang]/page.tsx`
- Modify: `src/components/project-card.stories.tsx`
- Modify: `src/components/post-card.stories.tsx`

**Interfaces:**
- Consumes: `GlowGroup` (Task 1), the glow-enabled cards (Tasks 2–3), the CSS (Task 4).
- Produces: every card list rendered inside a `GlowGroup`. No new exported API.

- [ ] **Step 1: Wrap the Work page list**

In `src/app/[lang]/work/page.tsx`, add the import (after the `ProjectCard` import):

```tsx
import { GlowGroup } from "@/components/glow-group";
```

Replace:

```tsx
          projects.map((project) => (
            <ProjectCard key={project.slug} project={project} lang={lang} />
          ))
```

with:

```tsx
          <GlowGroup>
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} lang={lang} />
            ))}
          </GlowGroup>
```

- [ ] **Step 2: Wrap the Blog explorer list**

In `src/components/blog-explorer.tsx`, add the import (after the `PostCard` import):

```tsx
import { GlowGroup } from "@/components/glow-group";
```

Replace:

```tsx
          filtered.map((post) => <PostCard key={post.slug} post={post} />)
```

with:

```tsx
          <GlowGroup>
            {filtered.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </GlowGroup>
```

- [ ] **Step 3: Wrap the Tag page list**

In `src/app/[lang]/blog/tags/[tag]/page.tsx`, add the import (after the `PostCard` import):

```tsx
import { GlowGroup } from "@/components/glow-group";
```

Replace:

```tsx
      <div className="mt-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
```

with:

```tsx
      <div className="mt-8">
        <GlowGroup>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </GlowGroup>
      </div>
```

- [ ] **Step 4: Wrap the landing featured lists**

In `src/app/[lang]/page.tsx`, add the import (after the `PostCard` import):

```tsx
import { GlowGroup } from "@/components/glow-group";
```

Replace the projects map:

```tsx
          <div className="mt-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} lang={lang} />
            ))}
          </div>
```

with:

```tsx
          <div className="mt-2">
            <GlowGroup>
              {projects.map((project) => (
                <ProjectCard key={project.slug} project={project} lang={lang} />
              ))}
            </GlowGroup>
          </div>
```

Replace the posts map:

```tsx
          <div className="mt-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
```

with:

```tsx
          <div className="mt-2">
            <GlowGroup>
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </GlowGroup>
          </div>
```

- [ ] **Step 5: Add a GlowGroup decorator to the card stories**

In `src/components/project-card.stories.tsx`, add the import (after the `ProjectCard` import):

```tsx
import { GlowGroup } from "./glow-group";
```

Add a `decorators` field to the `meta` object (alongside `title`, `component`, `args`):

```tsx
  decorators: [(Story) => <GlowGroup>{Story()}</GlowGroup>],
```

In `src/components/post-card.stories.tsx`, add the import (after the `PostCard` import):

```tsx
import { GlowGroup } from "./glow-group";
```

Add the same `decorators` field to its `meta` object:

```tsx
  decorators: [(Story) => <GlowGroup>{Story()}</GlowGroup>],
```

- [ ] **Step 6: Run the full verification gate**

Run:

```bash
npx tsc --noEmit && npm test && npm run lint && npm run build
```

Expected: all pass — types clean, all tests green (including Tasks 1–3), lint clean, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/[lang]/work/page.tsx src/components/blog-explorer.tsx \
  "src/app/[lang]/blog/tags/[tag]/page.tsx" src/app/[lang]/page.tsx \
  src/components/project-card.stories.tsx src/components/post-card.stories.tsx
git commit -m "feat: wrap card lists in GlowGroup across pages and stories"
```

---

## Self-Review

**Spec coverage:**
- §2.1 interior glow, seam-aligned (un-clamped) → Task 1 (vars) + Task 4 (`::before`). ✓
- §2.2 per-card color, gray elsewhere → Task 4 (`--glow-neutral` default, `[data-hot]` subject) + Task 1 (`data-hot`). ✓
- §2.3 top/bottom edge light → Task 4 (`.card-edge-light` mask). ✓
- §2.4 text cues (title existing; pills) → Task 4 (`.card-pills` tint). **Category-badge tint deliberately dropped** to avoid editing the shared `CategoryBadge`/`TagPill` components (no drive-by edits); title + pills + glow + edge carry the cue. Minor, documented deviation from spec §2.4.
- §3.1 GlowGroup (perf: rect cache, rAF coalesce, pointerType guard, cleanup) → Task 1. ✓
- §3.2 card changes, server/client preserved → Tasks 2–3. ✓
- §3.3 CSS, color-mix, reduced-motion, focus-within fallback → Task 4. ✓
- §3.4 four application sites → Task 5. ✓
- §4 tests (glow-group DOM contract; card data-subject/hooks; CSS-not-testable note) → Tasks 1–3 + Task 4 note. ✓
- §5 verification gate → Task 5 Step 6. ✓

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `GlowGroup({ children, className? })` used identically in Task 5; data-attributes (`data-glow-row`, `data-hot`, `data-on`, `data-glow-group`) and classes (`card-glow`, `card-edge-light`, `card-pills`) match across Tasks 1–4; `resolveSubject` input shapes (`{ category }` / `{ tags }`) match `src/core/domain/subject.ts`.
