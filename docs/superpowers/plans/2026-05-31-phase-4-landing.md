# Phase 4: Landing v0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the home placeholder with a real landing (v0): an isolated, swappable hero stating the dual identity, two Systems/Interfaces craft pillars, and sections wiring in real featured projects and latest posts.

**Architecture:** The hero lives in its own `src/components/landing/` folder as a self-contained `Hero` component with no external data dependencies — this is the deliberately-swappable piece, so the later Awwwards-level redesign is a one-component replacement. The home page (`src/app/page.tsx`, a Server Component) composes `Hero` + pillar grid + "Selected work" (reusing `ProjectCard` with `getFeaturedProjects`) + "Latest writing" (reusing `PostCard` with `getAllPosts`). No new data layer — everything reuses Phases 2–3.

**Tech Stack:** Reuses everything from Phases 1–3 — no new dependencies. Next.js 16 (App Router) Server Components, Tailwind v4 tokens. Tests: Vitest + Testing Library.

This is **Phase 4 of 6** from `docs/superpowers/specs/2026-05-30-portfolio-blog-design.md`. Builds on Phases 1–3 merged on `main`. Explicitly **v0** — the hero's Awwwards-level deep-dive is a separate later effort; keep `Hero` isolated to make that swap cheap.

---

## File Structure

Created/modified this phase:

- `src/components/landing/hero.tsx` + `.test.tsx` — isolated, swappable hero
- `src/components/landing/pillar-card.tsx` + `.test.tsx` — Systems/Interfaces pillar card
- `src/app/page.tsx` — replace placeholder with the composed landing

---

## Task 1: Hero component (TDD)

The swappable hero. Self-contained (no data props) so it can be replaced wholesale later.

**Files:**
- Test: `src/components/landing/hero.test.tsx`
- Create: `src/components/landing/hero.tsx`

- [ ] **Step 1: Write the failing test `src/components/landing/hero.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "@/components/landing/hero";

describe("Hero", () => {
  it("renders the dual-identity headline as the h1", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { level: 1, name: /craft of design/i }),
    ).toBeInTheDocument();
  });

  it("links to work and writing", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /view work/i })).toHaveAttribute(
      "href",
      "/work",
    );
    expect(screen.getByRole("link", { name: /read writing/i })).toHaveAttribute(
      "href",
      "/blog",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/landing/hero.test.tsx
```

Expected: FAIL — cannot resolve `@/components/landing/hero`.

- [ ] **Step 3: Implement `src/components/landing/hero.tsx`**

```tsx
import Link from "next/link";

// Landing v0 hero — intentionally self-contained and swappable.
// A later Awwwards-level redesign should be able to replace this file wholesale.
export function Hero() {
  return (
    <section className="py-16 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        Software Engineer · Design-led
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
        Engineering with the craft of design.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        I build robust backend systems and interfaces people love — pushing
        technology to its limits without ever losing clarity.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/work"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          View work
        </Link>
        <Link
          href="/blog"
          className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
        >
          Read writing
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/landing/hero.test.tsx
```

Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(landing): swappable v0 hero"
```

---

## Task 2: PillarCard component (TDD)

**Files:**
- Test: `src/components/landing/pillar-card.test.tsx`
- Create: `src/components/landing/pillar-card.tsx`

- [ ] **Step 1: Write the failing test `src/components/landing/pillar-card.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PillarCard } from "@/components/landing/pillar-card";

describe("PillarCard", () => {
  it("renders label and description inside a link to href", () => {
    render(
      <PillarCard
        label="Systems"
        description="Distributed, fast, reliable backends."
        href="/work"
      />,
    );
    const link = screen.getByRole("link", { name: /systems/i });
    expect(link).toHaveAttribute("href", "/work");
    expect(screen.getByText(/reliable backends/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/landing/pillar-card.test.tsx
```

Expected: FAIL — cannot resolve `@/components/landing/pillar-card`.

- [ ] **Step 3: Implement `src/components/landing/pillar-card.tsx`**

The label is a styled `<span>` (not a heading) to keep the page's heading outline clean (h1 in Hero, then h2 section headings).

```tsx
import Link from "next/link";

export function PillarCard({
  label,
  description,
  href,
}: {
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-5 transition hover:border-accent/50"
    >
      <span className="block font-semibold tracking-tight">{label}</span>
      <span className="mt-1 block text-sm text-muted">{description}</span>
      <span className="mt-3 inline-block text-sm text-accent opacity-0 transition group-hover:opacity-100">
        Explore →
      </span>
    </Link>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/landing/pillar-card.test.tsx
```

Expected: PASS — 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(landing): pillar card"
```

---

## Task 3: Compose the landing in `src/app/page.tsx`

Replace the placeholder home with the composed landing. Reuses `ProjectCard` and `PostCard`.

**Files:**
- Modify (full replace): `src/app/page.tsx`

- [ ] **Step 1: Replace `src/app/page.tsx` entirely with:**

```tsx
import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { PillarCard } from "@/components/landing/pillar-card";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { getFeaturedProjects, getAllProjects } from "@/lib/projects";
import { getAllPosts } from "@/lib/posts";

export default function HomePage() {
  const featured = getFeaturedProjects();
  const projects = (featured.length > 0 ? featured : getAllProjects()).slice(
    0,
    2,
  );
  const posts = getAllPosts().slice(0, 3);

  return (
    <div>
      <Hero />

      <section className="py-8" aria-label="What I do">
        <div className="grid gap-4 sm:grid-cols-2">
          <PillarCard
            label="Systems"
            description="Distributed, fast, reliable backends."
            href="/work"
          />
          <PillarCard
            label="Interfaces"
            description="Polished, accessible, delightful UI."
            href="/work"
          />
        </div>
      </section>

      {projects.length > 0 && (
        <section className="py-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Selected work</h2>
            <Link href="/work" className="text-sm text-accent hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="py-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              Latest writing
            </h2>
            <Link href="/blog" className="text-sm text-accent hover:underline">
              Read all →
            </Link>
          </div>
          <div className="mt-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build + verify**

```bash
npm run build
```

Expected: build succeeds; `/` is static.

- [ ] **Step 3: Smoke-check the landing (dev)**

```bash
(npm run dev &) ; sleep 6 ; curl -s -o /tmp/home.html -w "%{http_code}\n" http://localhost:3000/ ; \
echo -n "headline: " ; grep -c "craft of design" /tmp/home.html ; \
echo -n "featured project: " ; grep -c "Ledger Engine" /tmp/home.html ; \
echo -n "latest post: " ; grep -c "Designing for Failure" /tmp/home.html ; \
echo -n "section headings: " ; grep -c -E "Selected work|Latest writing" /tmp/home.html ; \
pkill -f "next dev" || true
```

Expected: HTTP 200; headline found; "Ledger Engine" (a featured project) found; "Designing for Failure" (a post) found; both section headings present. Report what you saw (adjust port if 3000 busy).

- [ ] **Step 4: Full suite + types**

```bash
npm test && npx tsc --noEmit
```

Expected: tests pass (24 prior + 3 new from Tasks 1–2 = 27); no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(landing): compose v0 landing with featured work and latest writing"
```

---

## Task 4: Phase verification + lint gate

**Files:** none (verification; plus any small fixes surfaced).

- [ ] **Step 1: Run every CI gate**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

Expected: all green (lint clean, no type errors, 27 tests pass, build succeeds). Fix minimally and re-run if lint flags the new files.

- [ ] **Step 2: Smoke-test the landing on the real Cloudflare runtime**

```bash
(npm run preview > /tmp/prev.log 2>&1 &) ; sleep 30 ; tail -5 /tmp/prev.log
PORT=8787   # adjust to the log
echo -n "/ -> " ; curl -s -o /tmp/h.html -w "%{http_code} %{content_type}\n" "http://localhost:$PORT/"
echo -n "headline: " ; grep -c "craft of design" /tmp/h.html
echo -n "featured + post present: " ; grep -c -E "Ledger Engine|Designing for Failure" /tmp/h.html
pkill -f "wrangler" ; pkill -f "opennextjs" 2>/dev/null || true
```

Expected: `/` → 200 text/html on Cloudflare; headline present; featured project + post present (count ≥2). Report the result.

- [ ] **Step 3: a11y heading-outline sanity check**

Confirm the landing has exactly one `<h1>` (in Hero) and that the section headings are `<h2>`. Note: `ProjectCard`/`PostCard` render their item titles as `<h2>` (same level as the section headings) — this is acceptable for v0 and consistent with how those cards work on the `/work` and `/blog` index pages; do NOT refactor the shared cards for this. Just report the observed heading structure.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore(landing): phase 4 verification fixes" || echo "no fixes needed"
```

---

## Self-Review

**Spec coverage (Phase 4 items from §4, §8.4):**
- Landing v0 with isolated, swappable hero stating the dual identity → Task 1 (`Hero` in its own `landing/` folder) ✓
- Two Systems/Interfaces craft pillars routing into work → Tasks 2, 3 ✓
- Wired to real content (featured projects + latest posts) → Task 3 (`getFeaturedProjects`/`getAllProjects`, `getAllPosts`) ✓
- Built for low-friction later replacement → `Hero` is self-contained with no data deps ✓

**Type consistency:** Reuses `ProjectCard` (`{ project: Project }`) and `PostCard` (`{ post: Post }`) unchanged. `PillarCard` takes `{ label, description, href }` consistently in test and home. `Hero` takes no props. No new types.

**Placeholder scan:** No TBD/TODO. This phase is explicitly the **v0** landing; the hero is intentionally simple and isolated so the later Awwwards-level pass can replace it. Pillars both link to `/work` for v0 (work showcases both systems and interface projects).

**Risk notes:** Lowest-risk phase — pure composition reusing verified components, no new data layer or dependencies. The only real check is Task 4 Step 2 (landing serves on the real Cloudflare runtime) and the heading-outline note (accepted for v0).
