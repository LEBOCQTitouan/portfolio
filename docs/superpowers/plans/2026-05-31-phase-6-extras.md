# Phase 6: Extras & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Round out the site with `/about` (bio + experience timeline + skills), `/uses`, and `/now` pages, plus a polish pass: a skip-to-content link, visible focus styles, and restrained, intentional motion that honors `prefers-reduced-motion`.

**Architecture:** The three new pages are simple Server Components with structured, editable placeholder content (the owner edits the copy later). The polish changes are global: a skip link + `id="main"` in the root layout, a `:focus-visible` style and a reduced-motion-safe fade-in keyframe in `globals.css`, and `/uses`+`/now` links added to the footer. No new dependencies, no external services.

**Tech Stack:** Reuses Phases 1–5. Next.js 16 App Router Server Components, Tailwind v4. Tests: Vitest + Testing Library (the footer change keeps its existing test green).

This is **Phase 6 of 6** (final) from `docs/superpowers/specs/2026-05-30-portfolio-blog-design.md`. Builds on Phases 1–5 merged on `main`.

Note: the new pages contain **realistic placeholder content** the owner will edit (bio, roles, tools). That's intentional for v1 — flagged, not a defect.

---

## File Structure

Created/modified this phase:

- `src/app/about/page.tsx` — bio + experience timeline + skills
- `src/app/uses/page.tsx` — tools/setup
- `src/app/now/page.tsx` — current focus (with a "last updated" date)
- `src/app/globals.css` — `:focus-visible` style + reduced-motion-safe fade-in
- `src/app/layout.tsx` — skip-to-content link + `id="main"` + fade-in on `<main>`
- `src/components/footer.tsx` — add `/uses` and `/now` links (existing test stays green)
- `src/app/sitemap.ts` — add `/uses` and `/now`

---

## Task 1: About page

**Files:**
- Create: `src/app/about/page.tsx`

- [ ] **Step 1: Create `src/app/about/page.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Software engineer focused on backend systems and design craft.",
};

const experience = [
  {
    role: "Senior Software Engineer",
    org: "Company",
    period: "2023 — Present",
    blurb:
      "Lead backend systems work and design-minded product engineering. (Edit me.)",
  },
  {
    role: "Software Engineer",
    org: "Company",
    period: "2021 — 2023",
    blurb:
      "Built and scaled services and the interfaces on top of them. (Edit me.)",
  },
];

const skills = [
  { group: "Languages", items: ["TypeScript", "Go", "Rust", "Python"] },
  { group: "Backend", items: ["Postgres", "Kafka", "gRPC", "Distributed systems"] },
  { group: "Frontend", items: ["React", "Next.js", "Tailwind", "Accessibility"] },
  { group: "Infra", items: ["Cloudflare", "Docker", "CI/CD", "Observability"] },
];

export default function AboutPage() {
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <div className="prose-content mt-6 max-w-2xl">
        <p>
          I&apos;m Titouan — a software engineer who believes great engineering
          and great design are the same discipline aimed at different layers. I
          build robust backend systems and the interfaces that make them usable.
          (Edit this bio.)
        </p>
        <p>
          I care about clarity: clear systems, clear interfaces, and clear
          writing about both.
        </p>
      </div>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Experience</h2>
      <ol className="mt-4 space-y-6 border-l border-border pl-6">
        {experience.map((job) => (
          <li key={`${job.org}-${job.period}`} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[1.65rem] top-1.5 h-2 w-2 rounded-full bg-accent"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="font-semibold">
                {job.role} · {job.org}
              </h3>
              <span className="text-sm text-muted">{job.period}</span>
            </div>
            <p className="mt-1 text-muted">{job.blurb}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-xl font-semibold tracking-tight">Skills</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {skills.map((s) => (
          <div key={s.group}>
            <p className="text-sm font-semibold">{s.group}</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {s.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Build + smoke-check**

```bash
npm run build
```

Expected: `/about` builds as a static route.

```bash
(npm run dev &) ; sleep 6 ; curl -s -o /tmp/about.html -w "%{http_code}\n" http://localhost:3000/about ; grep -c -E "Experience|Skills" /tmp/about.html ; pkill -f "next dev" || true
```

Expected: HTTP 200; "Experience"/"Skills" headings present. Report what you saw.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(about): about page with experience and skills"
```

---

## Task 2: Uses and Now pages

**Files:**
- Create: `src/app/uses/page.tsx`, `src/app/now/page.tsx`

- [ ] **Step 1: Create `src/app/uses/page.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uses",
  description: "The tools, hardware, and software I use day to day.",
};

const categories = [
  {
    title: "Editor & Terminal",
    items: ["VS Code", "Neovim", "Ghostty", "zsh + starship"],
  },
  {
    title: "Languages & Tooling",
    items: ["TypeScript", "Go", "Rust", "pnpm / npm"],
  },
  {
    title: "Hardware",
    items: ['MacBook Pro', "External display", "Mechanical keyboard"],
  },
  {
    title: "Services",
    items: ["Cloudflare", "GitHub", "Linear", "Figma"],
  },
];

export default function UsesPage() {
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">Uses</h1>
      <p className="mt-2 text-muted">
        The tools I reach for day to day. (Edit this list.)
      </p>
      <div className="mt-8 space-y-8">
        {categories.map((cat) => (
          <div key={cat.title}>
            <h2 className="text-lg font-semibold tracking-tight">
              {cat.title}
            </h2>
            <ul className="mt-2 list-disc pl-5 text-muted">
              {cat.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/app/now/page.tsx`**

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now",
  description: "What I'm focused on right now.",
};

// Update this date and list when your focus changes.
const lastUpdated = "May 2026";

const focus = [
  "Building this site and writing more about systems and design craft.",
  "Going deeper on distributed systems reliability.",
  "Exploring the edges of polished, accessible web UI.",
];

export default function NowPage() {
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">Now</h1>
      <p className="mt-2 text-sm text-muted">Last updated {lastUpdated}</p>
      <p className="mt-6 max-w-2xl text-muted">
        What I&apos;m focused on at the moment:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
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
          /now page
        </a>
        .
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Build + smoke-check**

```bash
npm run build
```

Expected: `/uses` and `/now` build as static routes.

```bash
(npm run dev &) ; sleep 6 ; \
echo -n "uses -> " ; curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/uses ; \
echo -n "now -> " ; curl -s -o /tmp/now.html -w "%{http_code}\n" http://localhost:3000/now ; grep -c "Last updated" /tmp/now.html ; \
pkill -f "next dev" || true
```

Expected: both 200; "Last updated" present on /now. Report what you saw.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(pages): uses and now pages"
```

---

## Task 3: Polish — skip link, focus styles, motion, footer + sitemap

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/footer.tsx`, `src/app/sitemap.ts`

- [ ] **Step 1: Add focus + motion styles to `src/app/globals.css`**

Append:

```css
/* Visible keyboard focus */
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Restrained, intentional entrance — disabled under reduced-motion */
@media (prefers-reduced-motion: no-preference) {
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .animate-in {
    animation: fade-in-up 0.5s ease-out both;
  }
}
```

- [ ] **Step 2: Add the skip link + `id="main"` + entrance animation in `src/app/layout.tsx`**

In the page shell, add a skip link as the first child inside the centered `<div>` (before `<Nav />`), and add `id="main"` + `className="... animate-in"` to `<main>`. The shell becomes:

```tsx
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
            >
              Skip to content
            </a>
            <Nav />
            <main id="main" className="flex-1 py-8 animate-in">
              {children}
            </main>
            <Footer year={new Date().getFullYear()} />
          </div>
```

(Only the skip link, `id="main"`, and the `animate-in` class are added; keep the rest of the layout unchanged.)

- [ ] **Step 3: Add `/uses` and `/now` links to `src/components/footer.tsx`**

The footer currently renders the copyright span and a `<nav>` of social links. Add a second `<nav>` of internal page links. Read the file, then add — right after the opening `<footer ...>` content, restructure so it has the copyright, an internal-links nav, and the socials nav. Concretely, change the socials `<nav>` block so the footer contains both:

```tsx
      <nav className="flex gap-4">
        <a href="/uses" className="transition-colors hover:text-foreground">
          Uses
        </a>
        <a href="/now" className="transition-colors hover:text-foreground">
          Now
        </a>
      </nav>
```

placed before the existing socials `<nav>`. Keep the existing `© {year} Titouan Lebocq` span and the socials nav (GitHub/LinkedIn) intact — the existing footer test asserts the year text and the GitHub link, both of which must still pass. Use plain `<a href="/uses">` (internal links are fine as anchors here, or `next/link` if you prefer — either works; if you use `next/link`, import it).

- [ ] **Step 4: Add `/uses` and `/now` to `src/app/sitemap.ts`**

In the `staticRoutes` array, add `/about` is already there — add `"/uses"` and `"/now"`:

```ts
  const staticRoutes = ["", "/blog", "/work", "/about", "/uses", "/now"].map(
    (p) => ({
      url: `${site.url}${p}`,
      lastModified: new Date(),
    }),
  );
```

(Read the file first; only extend the existing `staticRoutes` list.)

- [ ] **Step 5: Verify build + full suite + types**

```bash
npm test && npm run build && npx tsc --noEmit
```

Expected: all tests pass (40, including the unchanged footer test); build green; no type errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(polish): skip link, focus styles, restrained motion, footer links"
```

---

## Task 4: Phase verification + lint gate

**Files:** none (verification; plus any small fixes surfaced).

- [ ] **Step 1: Run every CI gate**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

Expected: all green (lint clean, no type errors, 40 tests pass, build succeeds). Fix minimally and re-run if lint flags the new files.

- [ ] **Step 2: Smoke-test new pages on the real Cloudflare runtime**

```bash
(npm run preview > /tmp/prev.log 2>&1 &) ; sleep 30 ; tail -5 /tmp/prev.log
PORT=8787   # adjust to the log
for p in /about /uses /now /sitemap.xml ; do
  echo -n "$p -> " ; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$PORT$p"
done
echo -n "uses+now in sitemap: " ; curl -s "http://localhost:$PORT/sitemap.xml" | grep -c -E "/uses|/now"
pkill -f "wrangler" ; pkill -f "opennextjs" 2>/dev/null || true
```

Expected: `/about`, `/uses`, `/now`, `/sitemap.xml` all 200; sitemap includes `/uses` and `/now` (count ≥2). Report the table.

- [ ] **Step 3: a11y sanity check**

Confirm on the rendered pages: each new page has exactly one `<h1>`; the skip link is the first focusable element and targets `#main`; `:focus-visible` outline is defined. Report the observed structure. (No full Lighthouse run required in this environment; report what you verified.)

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore(polish): phase 6 verification fixes" || echo "no fixes needed"
```

---

## Self-Review

**Spec coverage (Phase 6 items from §4, §8.6):**
- `/about` (bio, experience timeline, skills) → Task 1 ✓
- `/uses` → Task 2 ✓
- `/now` → Task 2 ✓
- Accessibility pass (skip link, visible focus, single-h1 pages, semantic timeline `<ol>`) → Tasks 1–3 ✓
- Restrained, intentional motion honoring `prefers-reduced-motion` → Task 3 ✓
- `/uses` + `/now` discoverable (footer) and in sitemap → Task 3 ✓

**Type consistency:** No new types. Footer keeps its `{ year: number }` prop and existing test. Sitemap extends its existing `staticRoutes`. Pages are prop-less Server Components.

**Placeholder scan:** No TBD/TODO markers. The page copy (bio, roles, tools, focus list) is realistic placeholder content the owner edits — explicitly flagged, consistent with the site-wide placeholders (handles, URLs). The motion is intentionally subtle per the design's "restrained & intentional" directive.

**Risk notes:** Lowest-risk phase — static content + global CSS, no data layer or dependencies. Watch points: keep the existing footer test green (don't remove the year span or GitHub link), and ensure the fade-in animation is fully inside the `prefers-reduced-motion: no-preference` media query so reduced-motion users get no animation.

---

## After this phase

This completes all 6 phases of the spec. Remaining to go fully live (owner actions, not code):
- Fill in real content (bio, projects, posts, handles/URLs).
- Connect the domain; set `site.url`.
- Configure services (Buttondown key, giscus, Plausible) and Cloudflare secrets; set `CLOUDFLARE_DEPLOY=true`.
- Optional: the Awwwards-level hero deep-dive (the `Hero` component is isolated for a clean swap).
