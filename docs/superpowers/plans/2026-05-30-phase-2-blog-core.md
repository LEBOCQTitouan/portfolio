# Phase 2: Blog Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working MDX-powered blog: type-safe content layer, post list + detail pages, syntax-highlighted code with copy buttons, reading time, tags + tag archives, RSS feed, per-post SEO, and dynamic OG images — all statically generated and Cloudflare-compatible.

**Architecture:** Posts are `.mdx` files in `content/posts/`. A single `src/lib/posts.ts` module is the only thing that knows how content is stored: it reads files, validates frontmatter with a Zod schema, derives slug + reading time, and exposes typed `Post` data to the rest of the app. Pages are React Server Components statically generated at build (`generateStaticParams`); MDX is compiled at build via `next-mdx-remote/rsc` with `rehype-pretty-code` for highlighting. No runtime MDX compilation, so everything runs on Cloudflare's static + edge model.

**Tech Stack:** Next.js 16 (App Router) · `next-mdx-remote/rsc` · `gray-matter` · `zod` · `reading-time` · `rehype-pretty-code` + `shiki` · `rehype-slug` · `remark-gfm` · `github-slugger` · `feed` (RSS) · `next/og` (OG images). Tests: Vitest + Testing Library (from Phase 1).

This is **Phase 2 of 6** from `docs/superpowers/specs/2026-05-30-portfolio-blog-design.md`. Builds on the merged Phase 1 foundation on `main`.

---

## File Structure

Created/modified in this phase:

- `content/posts/*.mdx` — the blog posts (seed content added in Task 2)
- `src/lib/posts.ts` — content layer: schema, `parsePost` (pure), `getAllPosts`, `getPostBySlug`, `getAllTags`, types
- `src/lib/posts.test.ts` — unit tests for `parsePost`
- `src/lib/seo.ts` — shared SEO/OG metadata + JSON-LD helpers
- `src/lib/site.ts` — site constants (url, name, author, social) used by RSS/SEO/OG
- `src/components/mdx.tsx` — `Mdx` renderer + component mapping (server)
- `src/components/copy-button.tsx` — client copy-to-clipboard button
- `src/components/pre.tsx` — client `<pre>` wrapper hosting the copy button
- `src/components/post-card.tsx` + `src/components/post-card.test.tsx` — post list item
- `src/components/tag-pill.tsx` — tag link chip
- `src/app/blog/page.tsx` — blog index (post list)
- `src/app/blog/[slug]/page.tsx` — post detail
- `src/app/blog/[slug]/opengraph-image.tsx` — dynamic OG image per post
- `src/app/blog/tags/[tag]/page.tsx` — tag archive
- `src/app/rss.xml/route.ts` — RSS feed
- `src/app/sitemap.ts`, `src/app/robots.ts` — SEO infra
- `src/app/globals.css` — minor additions for code-block / prose styling tokens

---

## Task 1: Content layer — deps, schema, and `lib/posts` (TDD)

**Files:**
- Create: `src/lib/site.ts`, `src/lib/posts.ts`, `src/lib/posts.test.ts`
- Modify: `package.json` (deps)

- [ ] **Step 1: Install dependencies**

```bash
npm install gray-matter zod reading-time github-slugger next-mdx-remote rehype-pretty-code shiki rehype-slug remark-gfm feed
```

Expected: installs without peer-dependency errors.

- [ ] **Step 2: Create site constants**

Create `src/lib/site.ts`:

```ts
export const site = {
  name: "Titouan Lebocq",
  title: "Titouan Lebocq",
  description: "Software engineer — engineering with the craft of design.",
  // Update to the real production URL once the domain is set.
  url: "https://portfolio.titouanlebocq.workers.dev",
  author: "Titouan Lebocq",
  social: {
    github: "https://github.com/titouanlebocq",
    linkedin: "https://www.linkedin.com/in/titouanlebocq",
  },
} as const;
```

- [ ] **Step 3: Write the failing test for `parsePost`**

Create `src/lib/posts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parsePost } from "@/lib/posts";

const raw = `---
title: Designing for Failure
date: 2026-01-15
summary: How to build systems that fail gracefully.
tags: [systems, reliability]
---

# Hello

This is the body of the post with several words used to estimate reading time.
`;

describe("parsePost", () => {
  it("parses and validates frontmatter, deriving slug", () => {
    const post = parsePost(raw, "designing-for-failure");
    expect(post.slug).toBe("designing-for-failure");
    expect(post.title).toBe("Designing for Failure");
    expect(post.summary).toBe("How to build systems that fail gracefully.");
    expect(post.tags).toEqual(["systems", "reliability"]);
    expect(post.draft).toBe(false);
  });

  it("normalizes the date to an ISO date string", () => {
    const post = parsePost(raw, "designing-for-failure");
    expect(post.date).toBe("2026-01-15");
  });

  it("computes a positive reading time in minutes", () => {
    const post = parsePost(raw, "designing-for-failure");
    expect(post.readingTimeMinutes).toBeGreaterThanOrEqual(1);
  });

  it("exposes the markdown body separately from frontmatter", () => {
    const post = parsePost(raw, "designing-for-failure");
    expect(post.content).toContain("# Hello");
    expect(post.content).not.toContain("title: Designing for Failure");
  });

  it("defaults tags to an empty array and draft to false when omitted", () => {
    const minimal = `---\ntitle: Bare\ndate: 2026-02-01\nsummary: Minimal post.\n---\n\nBody.`;
    const post = parsePost(minimal, "bare");
    expect(post.tags).toEqual([]);
    expect(post.draft).toBe(false);
  });

  it("throws a descriptive error when a required field is missing", () => {
    const bad = `---\ndate: 2026-02-01\nsummary: No title.\n---\n\nBody.`;
    expect(() => parsePost(bad, "bad")).toThrow(/bad/);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npx vitest run src/lib/posts.test.ts
```

Expected: FAIL — cannot resolve `@/lib/posts`.

- [ ] **Step 5: Implement `src/lib/posts.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { z } from "zod";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const frontmatterSchema = z.object({
  title: z.string().min(1),
  // gray-matter may yield a Date; coerce to a YYYY-MM-DD string.
  date: z.coerce.date(),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Post = {
  slug: string;
  title: string;
  date: string; // ISO date (YYYY-MM-DD)
  summary: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  readingTimeMinutes: number;
  content: string; // raw MDX body (frontmatter stripped)
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Pure: parse raw file contents + slug into a validated Post. */
export function parsePost(raw: string, slug: string): Post {
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in post "${slug}": ${parsed.error.message}`,
    );
  }
  const fm = parsed.data;
  return {
    slug,
    title: fm.title,
    date: toISODate(fm.date),
    summary: fm.summary,
    tags: fm.tags,
    cover: fm.cover,
    draft: fm.draft,
    readingTimeMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    content,
  };
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

/** Read every post from disk, validate, drop drafts in production, newest first. */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const posts = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, f), "utf8");
      return parsePost(raw, slugFromFilename(f));
    })
    .filter((p) => process.env.NODE_ENV === "development" || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

export function getPostBySlug(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) post.tags.forEach((t) => tags.add(t));
  return [...tags].sort();
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx vitest run src/lib/posts.test.ts
```

Expected: PASS — 6 passed.

- [ ] **Step 7: Verify the full suite + types are green**

```bash
npm test && npx tsc --noEmit
```

Expected: all tests pass; no type errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(blog): add type-safe MDX content layer"
```

---

## Task 2: Seed example posts

The blog pages need real content to render and statically generate. Add two posts that also exercise code blocks, headings, and tags.

**Files:**
- Create: `content/posts/designing-for-failure.mdx`, `content/posts/the-craft-of-interfaces.mdx`

- [ ] **Step 1: Create `content/posts/designing-for-failure.mdx`**

```mdx
---
title: Designing for Failure
date: 2026-01-15
summary: Resilient systems assume things break. Here is how I design backends that fail gracefully instead of catastrophically.
tags: [systems, reliability]
---

## Failure is the default

Every dependency you call will, eventually, be slow or unavailable. The
question is not *if* but *how* your system behaves when it happens.

### Timeouts and budgets

Give every outbound call a deadline. A request without a timeout is a request
that can hang forever.

```ts
async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}
```

When a dependency degrades, fail fast and shed load rather than letting
queues grow without bound.
```

- [ ] **Step 2: Create `content/posts/the-craft-of-interfaces.mdx`**

```mdx
---
title: The Craft of Interfaces
date: 2026-02-20
summary: Good engineering and good design are the same discipline pointed at different layers. A short note on caring about both.
tags: [design, craft]
---

## The same discipline

Backend rigor and interface polish come from the same instinct: respect for
the person on the other side of the system.

- A clear error message is an API contract.
- A fast first paint is a performance budget.
- A keyboard-navigable menu is correctness, not decoration.

The best software treats **clarity** as a feature, all the way down.
```

- [ ] **Step 3: Verify posts load**

```bash
npx tsx --eval "import('./src/lib/posts.ts').then(m => console.log(m.getAllPosts().map(p => p.slug)))" 2>/dev/null || node --experimental-strip-types -e "import('./src/lib/posts.ts').then(m=>console.log(m.getAllPosts().map(p=>p.slug)))"
```

Expected: prints `[ 'the-craft-of-interfaces', 'designing-for-failure' ]` (newest first). If neither command runs in this environment, skip — Task 4's build will exercise loading. Report which path you used.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "content: add seed blog posts"
```

---

## Task 3: MDX renderer with syntax highlighting + copy button

Render MDX in a Server Component with `rehype-pretty-code` (Shiki) for build-time highlighting, `rehype-slug` for heading anchors, and `remark-gfm`. Code blocks get a copy button via a client `<pre>` wrapper.

**Files:**
- Create: `src/components/copy-button.tsx`, `src/components/pre.tsx`, `src/components/mdx.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Create the copy button (client)**

Create `src/components/copy-button.tsx`:

```tsx
"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy code"
      className="absolute right-2 top-2 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:text-foreground"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
```

- [ ] **Step 2: Create the `<pre>` wrapper (client)**

Create `src/components/pre.tsx`:

```tsx
"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { CopyButton } from "@/components/copy-button";

export function Pre(props: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const text = () => ref.current?.textContent ?? "";

  return (
    <div className="group relative">
      <CopyButton text={text()} />
      <pre
        ref={ref}
        {...props}
        className="overflow-x-auto rounded-lg border border-border p-4 text-sm"
      />
    </div>
  );
}
```

Note: `text()` reads `textContent` at click time via the ref, so it captures the fully-rendered code regardless of highlight markup.

- [ ] **Step 3: Create the MDX renderer**

Create `src/components/mdx.tsx`:

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { MDXComponents } from "mdx/types";
import { Pre } from "@/components/pre";

const components: MDXComponents = {
  pre: Pre,
};

export function Mdx({ source }: { source: string }) {
  return (
    <div className="prose-content">
      <MDXRemote
        source={source}
        components={components}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeSlug,
              [
                rehypePrettyCode,
                { theme: { dark: "github-dark", light: "github-light" } },
              ],
            ],
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Add prose + code styling to `globals.css`**

Append to `src/app/globals.css`:

```css
/* Long-form post content */
.prose-content {
  line-height: 1.75;
}
.prose-content h2 {
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.prose-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
}
.prose-content p,
.prose-content ul,
.prose-content ol {
  margin-bottom: 1rem;
}
.prose-content ul {
  list-style: disc;
  padding-left: 1.25rem;
}
.prose-content a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.prose-content :not(pre) > code {
  border-radius: 4px;
  border: 1px solid var(--border);
  padding: 0.1rem 0.3rem;
  font-size: 0.875em;
}
/* rehype-pretty-code: show the right theme per color mode */
.prose-content pre code span {
  color: var(--shiki-light);
}
.dark .prose-content pre code span {
  color: var(--shiki-dark);
}
.prose-content pre {
  background: var(--shiki-light-bg);
}
.dark .prose-content pre {
  background: var(--shiki-dark-bg);
}
```

- [ ] **Step 5: Verify build compiles MDX**

```bash
npm run build
```

Expected: build succeeds (MDX plugins resolve and compile). If `rehype-pretty-code` errors on the dual-theme config under the installed Shiki version, switch the `theme` option to a single string `theme: "github-dark"` and the matching CSS to a single theme, then report the change.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(blog): MDX renderer with highlighting and copy button"
```

---

## Task 4: PostCard component (TDD) and the `/blog` index page

**Files:**
- Test: `src/components/post-card.test.tsx`
- Create: `src/components/post-card.tsx`, `src/components/tag-pill.tsx`, `src/app/blog/page.tsx`

- [ ] **Step 1: Write the failing PostCard test**

Create `src/components/post-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PostCard } from "@/components/post-card";
import type { Post } from "@/lib/posts";

const post: Post = {
  slug: "designing-for-failure",
  title: "Designing for Failure",
  date: "2026-01-15",
  summary: "Resilient systems assume things break.",
  tags: ["systems"],
  draft: false,
  readingTimeMinutes: 4,
  content: "",
};

describe("PostCard", () => {
  it("links to the post", () => {
    render(<PostCard post={post} />);
    expect(
      screen.getByRole("link", { name: /designing for failure/i }),
    ).toHaveAttribute("href", "/blog/designing-for-failure");
  });

  it("shows the summary and reading time", () => {
    render(<PostCard post={post} />);
    expect(screen.getByText(/resilient systems/i)).toBeInTheDocument();
    expect(screen.getByText(/4 min read/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/post-card.test.tsx
```

Expected: FAIL — cannot resolve `@/components/post-card`.

- [ ] **Step 3: Create the tag pill**

Create `src/components/tag-pill.tsx`:

```tsx
import Link from "next/link";

export function TagPill({ tag }: { tag: string }) {
  return (
    <Link
      href={`/blog/tags/${tag}`}
      className="rounded-full border border-border px-2 py-0.5 text-xs text-muted transition-colors hover:text-foreground"
    >
      {tag}
    </Link>
  );
}
```

- [ ] **Step 4: Create the PostCard**

Create `src/components/post-card.tsx`:

```tsx
import Link from "next/link";
import type { Post } from "@/lib/posts";
import { TagPill } from "@/components/tag-pill";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="border-b border-border py-6">
      <div className="flex items-baseline justify-between gap-4 text-sm text-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </time>
        <span>{post.readingTimeMinutes} min read</span>
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">
        <Link href={`/blog/${post.slug}`} className="hover:text-accent">
          {post.title}
        </Link>
      </h2>
      <p className="mt-1 text-muted">{post.summary}</p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/components/post-card.test.tsx
```

Expected: PASS — 2 passed.

- [ ] **Step 6: Create the `/blog` index page**

Create `src/app/blog/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays and notes on software, systems, and design craft.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  return (
    <section className="py-8">
      <h1 className="text-3xl font-bold tracking-tight">Writing</h1>
      <p className="mt-2 text-muted">
        Essays and notes on software, systems, and design craft.
      </p>
      <div className="mt-8">
        {posts.length === 0 ? (
          <p className="text-muted">No posts yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Verify build + tests**

```bash
npm test && npm run build
```

Expected: tests pass; `/blog` builds as a static route.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(blog): post card and blog index page"
```

---

## Task 5: Post detail page `/blog/[slug]`

Static per-post pages with `generateStaticParams`, per-post `generateMetadata` (SEO), the MDX body, and post meta (date, reading time, tags).

**Files:**
- Create: `src/app/blog/[slug]/page.tsx`

- [ ] **Step 1: Create the post page**

Create `src/app/blog/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { Mdx } from "@/components/mdx";
import { TagPill } from "@/components/tag-pill";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `${site.url}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="py-8">
      <header className="mb-8">
        <div className="flex items-baseline justify-between gap-4 text-sm text-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>{post.readingTimeMinutes} min read</span>
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">{post.title}</h1>
        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagPill key={tag} tag={tag} />
            ))}
          </div>
        )}
      </header>
      <Mdx source={post.content} />
    </article>
  );
}
```

- [ ] **Step 2: Verify the post pages build and render**

```bash
npm run build
```

Expected: build succeeds; `/blog/[slug]` is statically generated for both seed posts (check the build output lists the two post routes).

- [ ] **Step 3: Smoke-check a post renders**

```bash
(npm run dev &) ; sleep 6 ; curl -s -o /tmp/post.html -w "%{http_code}\n" http://localhost:3000/blog/designing-for-failure ; grep -c "Designing for Failure" /tmp/post.html ; pkill -f "next dev" || true
```

Expected: HTTP 200 and the title found ≥ 1. Report what you observed (adjust port if 3000 is taken).

- [ ] **Step 4: Run the full test suite + types**

```bash
npm test && npx tsc --noEmit
```

Expected: green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(blog): post detail page with per-post SEO metadata"
```

---

## Task 6: Tag archive `/blog/tags/[tag]`

**Files:**
- Create: `src/app/blog/tags/[tag]/page.tsx`

- [ ] **Step 1: Create the tag archive page**

Create `src/app/blog/tags/[tag]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllTags, getPostsByTag } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag}`,
    description: `Posts tagged "${tag}".`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const posts = getPostsByTag(tag);
  if (posts.length === 0) notFound();

  return (
    <section className="py-8">
      <p className="text-sm uppercase tracking-wide text-accent">Tag</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">#{tag}</h1>
      <div className="mt-8">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build (tag routes generated)**

```bash
npm run build
```

Expected: build succeeds; tag routes (`/blog/tags/systems`, etc.) statically generated.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(blog): tag archive pages"
```

---

## Task 7: RSS feed `/rss.xml`

**Files:**
- Create: `src/app/rss.xml/route.ts`

- [ ] **Step 1: Create the RSS route handler**

Create `src/app/rss.xml/route.ts`:

```ts
import { Feed } from "feed";
import { getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const feed = new Feed({
    title: site.title,
    description: site.description,
    id: site.url,
    link: site.url,
    language: "en",
    copyright: `© ${new Date().getFullYear()} ${site.author}`,
    feedLinks: { rss: `${site.url}/rss.xml` },
    author: { name: site.author, link: site.url },
  });

  for (const post of getAllPosts()) {
    const url = `${site.url}/blog/${post.slug}`;
    feed.addItem({
      title: post.title,
      id: url,
      link: url,
      description: post.summary,
      date: new Date(post.date),
    });
  }

  return new Response(feed.rss2(), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
```

Note: `export const dynamic = "force-static"` makes Next emit `/rss.xml` as a static file at build — the right model for Cloudflare. `new Date().getFullYear()` runs at build, which is fine.

- [ ] **Step 2: Verify the feed builds and is valid XML**

```bash
npm run build
(npm run dev &) ; sleep 6 ; curl -s -o /tmp/rss.xml -w "%{http_code}\n" http://localhost:3000/rss.xml ; head -c 200 /tmp/rss.xml ; echo ; grep -c "<item>" /tmp/rss.xml ; pkill -f "next dev" || true
```

Expected: HTTP 200; output starts with `<?xml`; `<item>` count is 2 (the seed posts). Report observations.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(blog): RSS feed"
```

---

## Task 8: SEO infrastructure — sitemap, robots, JSON-LD

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo.ts`
- Modify: `src/app/blog/[slug]/page.tsx` (inject Article JSON-LD)

- [ ] **Step 1: Create the sitemap**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "@/lib/posts";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog", "/work", "/about"].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: new Date(),
  }));
  const postRoutes = getAllPosts().map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));
  const tagRoutes = getAllTags().map((tag) => ({
    url: `${site.url}/blog/tags/${tag}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
```

- [ ] **Step 2: Create robots**

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Create the JSON-LD helper**

Create `src/lib/seo.ts`:

```ts
import { site } from "@/lib/site";
import type { Post } from "@/lib/posts";

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    url: `${site.url}/blog/${post.slug}`,
    author: { "@type": "Person", name: site.author, url: site.url },
  };
}
```

- [ ] **Step 4: Inject Article JSON-LD into the post page**

In `src/app/blog/[slug]/page.tsx`, add the import:

```tsx
import { articleJsonLd } from "@/lib/seo";
```

Then, inside the returned `<article>`, add this as the first child (right after the opening `<article ...>` tag, before `<header>`):

```tsx
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd(post)),
        }}
      />
```

(The JSON is generated from our own typed data — no untrusted input — so `dangerouslySetInnerHTML` is safe here. This is the standard Next.js pattern for JSON-LD.)

- [ ] **Step 5: Verify build + types**

```bash
npm run build && npx tsc --noEmit
```

Expected: build succeeds; `/sitemap.xml` and `/robots.txt` emitted as static. The post page still renders.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(seo): sitemap, robots, and article structured data"
```

---

## Task 9: Dynamic OG images per post

Generate a branded social-share image per post via Next's file-based `opengraph-image` convention using `next/og` `ImageResponse`. Must be verified against the Cloudflare runtime.

**Files:**
- Create: `src/app/blog/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create the OG image route**

Create `src/app/blog/[slug]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { site } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? site.title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1115",
          color: "#f5f5f7",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#2997ff", letterSpacing: 2 }}>
          {site.name.toUpperCase()}
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#a1a1a6" }}>
          engineering with the craft of design
        </div>
      </div>
    ),
    { ...size },
  );
}
```

- [ ] **Step 2: Verify it builds and renders in the Cloudflare preview**

First confirm `next build` succeeds:

```bash
npm run build
```

Then verify under the actual Cloudflare worker runtime (this is the key check — `next/og` uses WASM that must work on Cloudflare):

```bash
(npm run preview &) ; sleep 25 ; curl -s -o /tmp/og.png -w "%{http_code} %{content_type}\n" http://localhost:8787/blog/designing-for-failure/opengraph-image ; file /tmp/og.png ; pkill -f "wrangler" ; pkill -f "opennextjs" || true
```

Expected: HTTP 200, content-type `image/png`, and `file` reports a PNG image. The preview port is printed by wrangler — it is usually `8787`; if the curl fails, read the actual URL/port from the `npm run preview` output and retry.

**If OG generation fails on the Cloudflare runtime** (non-200, or a runtime error about WASM/edge): do NOT spin indefinitely. Report it as DONE_WITH_CONCERNS with the exact error, and note the fallback for the controller to decide: either (a) add `export const runtime = "edge"` to the route and re-test, or (b) defer dynamic OG images and use a single static default OG image referenced in metadata. Capture the error output.

- [ ] **Step 3: Wire the default site OG image fallback into root metadata**

In `src/app/layout.tsx`, extend the existing `metadata` export's object with an `openGraph` block so non-post pages still get a sensible card. Add this property to the `metadata` object (alongside `title` and `description`):

```tsx
  openGraph: {
    title: "Titouan Lebocq",
    description: "Software engineer — engineering with the craft of design.",
    type: "website",
  },
```

- [ ] **Step 4: Run full suite + build + types**

```bash
npm test && npm run build && npx tsc --noEmit
```

Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(seo): dynamic per-post Open Graph images"
```

---

## Task 10: Phase verification and lint gate

**Files:** none (verification only, plus any small fixes surfaced).

- [ ] **Step 1: Run every gate the CI runs**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

Expected: all green (lint clean, no type errors, all tests pass, build succeeds). If `npm run lint` flags anything in the new files, fix it minimally and re-run.

- [ ] **Step 2: Smoke-check the whole blog in the Cloudflare preview**

```bash
(npm run preview &) ; sleep 25 ; \
for path in /blog /blog/designing-for-failure /blog/tags/systems /rss.xml /sitemap.xml /robots.txt ; do \
  echo -n "$path -> " ; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8787$path" ; \
done ; pkill -f "wrangler" ; pkill -f "opennextjs" || true
```

Expected: every path returns 200. Report the table (adjust port if needed).

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore(blog): phase 2 verification fixes" || echo "no fixes needed"
```

---

## Self-Review

**Spec coverage (Phase 2 items from §4, §5, §6, §8.2):**
- Content layer + `lib/content` (single content module) → Task 1 (`src/lib/posts.ts`) ✓
- Post pages (index + detail) → Tasks 4, 5 ✓
- MDXComponents (syntax highlighting + copy button) → Task 3 ✓
- Reading time → Task 1 (`readingTimeMinutes`) ✓
- Tags (display + archive pages) → Tasks 4, 6 ✓
- RSS → Task 7 ✓
- SEO (metadata, Open Graph, JSON-LD, sitemap, robots, canonical) → Tasks 5, 8 ✓
- Dynamic OG images → Task 9 ✓
- (Search + tag *filtering*, newsletter, comments, analytics are Phase 5; sticky scroll-spy TOC and `/about`,`/uses`,`/now` are later — correctly out of scope here. Basic tag archives are included as part of "tags".)

**Type consistency:** `Post` type defined in Task 1 is consumed unchanged by `PostCard` (Task 4), the post page (Task 5), tag pages (Task 6), RSS (Task 7), sitemap/seo (Task 8), and OG images (Task 9). `parsePost(raw, slug)` signature is stable. `site` constants object shape is referenced consistently. `Mdx` takes `{ source: string }`; `Pre`/`CopyButton` props are `pre`-element props and `{ text: string }` respectively.

**Placeholder scan:** No TBD/TODO. Intentional, flagged placeholders: `site.url` (set to the future Cloudflare workers.dev URL — update when the real domain is chosen) and the GitHub/LinkedIn handles inherited from Phase 1. The OG-image task has an explicit, bounded fallback path rather than an open-ended placeholder.

**Risk notes for the executor:**
- `rehype-pretty-code` dual-theme config (Task 3) — fallback to single theme documented.
- `next/og` on Cloudflare (Task 9) — explicit verification step + bounded fallback, since edge/WASM support is the one genuine runtime risk in this phase.
