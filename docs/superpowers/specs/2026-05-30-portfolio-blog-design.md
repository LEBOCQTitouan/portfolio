# Portfolio + Blog — Design Spec

**Date:** 2026-05-30
**Owner:** Titouan Lebocq
**Status:** Approved (design); landing locked as **v0** (to be deepened later, Awwwards-inspired)

## 1. Purpose & identity

A software-engineering reputation site for Titouan Lebocq, built around one thesis:

> **Engineering depth in service of design and clarity — Apple-like craftsmanship.** Technology pushed to its limits, never at the cost of design or communication.

It is both a **portfolio** (code projects, professional experience, visual/design work) and a **blog** (technical writing as a first-class citizen). The site itself is the proof of the thesis. Primary goal: **build reputation** — grow a readership and credibility over time.

## 2. Stack & infrastructure

- **Next.js (App Router) + TypeScript + Tailwind CSS.**
- **MDX content in-repo.** Content layer parsed at build with type-safe frontmatter. Preferred: `contentlayer2`; fallback `next-mdx-remote` if Contentlayer proves unstable with the chosen Next version. Decision finalized at plan time after a compatibility check.
- **Hosting:** Cloudflare (Pages/Workers) via the OpenNext adapter (`@opennextjs/cloudflare`) — edge runtime, EU presence, no Vercel dependency. Dynamic features (OG image route, newsletter API route) run on the Cloudflare server runtime.
- **Analytics:** **Plausible** (cookieless, EU-hosted, no consent banner) behind a thin `lib/analytics` abstraction so heatmaps (Matomo or Microsoft Clarity) can be added later as a one-file change. No heatmap at launch.
- **Theming:** light + dark via `next-themes`, first-class both ways.
- **Quality bar:** Lighthouse ~100 across the board; accessible (semantic HTML, keyboard nav, visible focus, `prefers-reduced-motion` respected); fully responsive.

## 3. Visual direction

Refined, lightened take on a "polished senior engineer" aesthetic (direction "B"), with first-class light + dark modes.

- **Palette:** near-white `#fbfbfd` (light) / soft charcoal `#0f1115` (dark, not harsh black); Apple-ish ink text (`#1d1d1f` / `#f5f5f7`); one confident blue accent (`#0071e3` light / `#2997ff` dark). Tokens centralized for easy retheming.
- **Type:** Inter (or close equivalent), tight letter-spacing on headlines, strong hierarchy, generous spacing.
- **Depth:** soft borders/shadows; tasteful, never noisy.
- **Motion:** **restrained & intentional** — smooth theme transitions, gentle fade/slide on scroll, considered hover states. Honors reduced-motion. No gimmicks.

## 4. Information architecture (pages)

- `/` — **Landing (v0)**: an isolated hero section stating the dual identity ("Engineering with the craft of design"), plus two **craft pillars — Systems & Interfaces** — that route into work and writing. Built as a cleanly swappable section so a later Awwwards-level deep-dive is a low-friction replacement, not a rewrite.
- `/work` and `/work/[slug]` — projects spanning backend *and* UI; each detail page shows stack, role, links, and visuals.
- `/blog` and `/blog/[slug]` — MDX posts with table of contents, reading time, tags, syntax-highlighted code (with copy button), comments, and related posts.
- `/blog` index — **client-side search + tag filtering**.
- `/about` — bio, experience timeline, skills.
- `/uses` — tools/setup. `/now` — current focus.
- System routes: `404`, `/rss.xml`, `/sitemap.xml`, `robots.txt`.

(No downloadable résumé/CV — explicitly out of scope.)

## 5. Content model (type-checked frontmatter)

**Post** (`content/posts/*.mdx`)
- `title`, `slug`, `date`, `summary`, `tags: string[]`, `cover?`, `draft: boolean`
- `readingTime` — derived at build, not authored.

**Project** (`content/projects/*.mdx`)
- `title`, `slug`, `summary`, `role`, `stack: string[]`
- `category: "systems" | "interface" | "both"`
- `links: { repo?, demo? }`, `cover`, `featured: boolean`, `order: number`

Authoring workflow = drop a `.mdx` file in the right folder; frontmatter is validated at build (build fails on malformed/missing required fields).

## 6. Cross-cutting features

- **Dynamic OG images** — per-post branded social card via Next `ImageResponse` (edge route).
- **SEO** — Next Metadata API, Open Graph / Twitter cards, JSON-LD structured data (`Article`, `Person`), canonical URLs.
- **RSS** — `/rss.xml` generated at build from published posts.
- **Newsletter** — Buttondown (simple, dev-friendly, free tier) via an API route + form; degrades gracefully if the service is unreachable. Provider sits behind a small interface for easy swap.
- **Comments** — giscus (GitHub Discussions), themed to match light/dark.

## 7. Component boundaries

Each unit has one clear purpose, a defined interface, and is testable in isolation:

- Layout: `Layout`, `Nav`, `Footer`, `ThemeToggle`
- Landing: `Hero` (swappable), `PillarCard`
- Lists/cards: `ProjectCard`, `PostCard`
- Post reading: `TableOfContents`, `MDXComponents` (code block w/ copy, callouts, images), `Comments`, `RelatedPosts`
- Discovery: `SearchBox`, `TagFilter`
- Growth: `Newsletter`
- Infra helpers: `lib/content` (single module the rest of the app uses to read posts/projects — hides MDX loading), `lib/analytics`, `lib/seo`

The rest of the app depends on `lib/content`'s interface, not on how MDX is loaded — so the content layer can change without ripple.

## 8. Phasing (each phase independently shippable)

1. **Foundation** — Next.js + TS + Tailwind + `next-themes`; layout/nav/footer; design tokens; Cloudflare (OpenNext) deploy pipeline.
2. **Blog core** — content layer + `lib/content`; post pages; `MDXComponents` (syntax highlighting + copy); reading time; tags; RSS; SEO + dynamic OG images.
3. **Work / projects** — project model; `/work` index; `/work/[slug]` detail.
4. **Landing v0** — hero + pillars wired to real featured content.
5. **Engagement** — blog search + tag filtering; newsletter; giscus comments; Plausible analytics.
6. **Extras & polish** — `/about`, `/uses`, `/now`; accessibility + performance pass; restrained motion; final Lighthouse/a11y verification.

## 9. Testing

- **Component tests** (Vitest + Testing Library) for interactive pieces: search, tag filter, theme toggle, table of contents, newsletter form states (idle/loading/success/error).
- **Build-time validation** of all frontmatter (build fails on invalid content).
- **Pre-"done" verification:** Lighthouse (~100 perf/a11y/SEO/best-practices) and an accessibility/keyboard pass.

## 10. Out of scope (for now)

- Downloadable résumé/CV page.
- Heatmaps at launch (abstraction leaves the door open).
- Headless CMS (MDX-in-repo chosen instead).
- Awwwards-level landing animation work (landing is v0; deep iteration is a deliberate later project).
