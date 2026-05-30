# Phase 5: Engagement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reader-engagement features — client-side blog search + tag filtering (self-contained), newsletter signup (Buttondown), comments (giscus), and privacy-friendly analytics (Plausible) — each built behind a clean boundary that **degrades gracefully** when its external service isn't configured yet.

**Architecture:** Search/filtering is pure client-side over post metadata passed from the statically-generated `/blog` page (a new `PostMeta` type strips the heavy MDX body before it crosses to the client). The three external integrations each live in a single component that reads its config from environment variables and renders nothing (or returns a clear 503) when unconfigured — so the site builds and runs fully without any keys, and wiring real accounts is a config-only change. Newsletter submission goes through an `/api/subscribe` route that encapsulates the Buttondown provider.

**Tech Stack:** Reuses Phases 1–4. New dep: `@giscus/react` (comments). Plausible is a `next/script` tag (no dep); Buttondown is a server `fetch` (no dep). Tests: Vitest + Testing Library.

This is **Phase 5 of 6** from `docs/superpowers/specs/2026-05-30-portfolio-blog-design.md`. Builds on Phases 1–4 merged on `main`.

**External config (set later; everything degrades gracefully until then):**
- `BUTTONDOWN_API_KEY` — server secret (Cloudflare secret) for newsletter
- `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPO_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID` — public giscus config
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — public analytics domain

---

## File Structure

Created/modified this phase:

- `src/lib/posts.ts` — add `PostMeta` type + `getAllPostMeta()`
- `src/components/post-card.tsx` — accept `PostMeta` (drops the need to ship MDX body to the client)
- `src/lib/search.ts` + `src/lib/search.test.ts` — pure `filterPosts`
- `src/components/blog-explorer.tsx` + `.test.tsx` — client search + tag filter UI
- `src/app/blog/page.tsx` — use `BlogExplorer`
- `src/app/api/subscribe/route.ts` — Buttondown newsletter endpoint
- `src/components/newsletter.tsx` + `.test.tsx` — newsletter form
- `src/components/comments.tsx` + `.test.tsx` — giscus comments (graceful)
- `src/app/blog/[slug]/page.tsx` — mount `Comments`
- `src/components/analytics.tsx` + `.test.tsx` — Plausible script (graceful)
- `src/app/layout.tsx` — mount `Analytics`
- `.env.example`, `README.md` — document env vars

---

## Task 1: Blog search + tag filtering (TDD)

**Files:**
- Modify: `src/lib/posts.ts`, `src/components/post-card.tsx`, `src/app/blog/page.tsx`
- Create: `src/lib/search.ts`, `src/lib/search.test.ts`, `src/components/blog-explorer.tsx`, `src/components/blog-explorer.test.tsx`

- [ ] **Step 1: Add `PostMeta` + `getAllPostMeta()` to `src/lib/posts.ts`**

After the existing `Post` type, add:

```ts
export type PostMeta = Omit<Post, "content">;
```

After the existing `getAllPosts` function, add:

```ts
/** Post metadata without the (heavy) MDX body — safe to pass to client components. */
export function getAllPostMeta(): PostMeta[] {
  return getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    date: p.date,
    summary: p.summary,
    tags: p.tags,
    cover: p.cover,
    draft: p.draft,
    readingTimeMinutes: p.readingTimeMinutes,
  }));
}
```

- [ ] **Step 2: Change `PostCard` to accept `PostMeta`**

In `src/components/post-card.tsx`, change the import and prop type. Replace:

```tsx
import type { Post } from "@/lib/posts";
```

with:

```tsx
import type { PostMeta } from "@/lib/posts";
```

and change the function signature from `{ post: Post }` to `{ post: PostMeta }`. Everything else stays the same (PostCard never used `post.content`). Full posts remain assignable to `PostMeta`, so the home page and other callers are unaffected.

- [ ] **Step 3: Write the failing test `src/lib/search.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { filterPosts } from "@/lib/search";
import type { PostMeta } from "@/lib/posts";

const posts: PostMeta[] = [
  { slug: "a", title: "Designing for Failure", date: "2026-01-15", summary: "Resilient backends.", tags: ["systems"], draft: false, readingTimeMinutes: 4 },
  { slug: "b", title: "The Craft of Interfaces", date: "2026-02-20", summary: "Design and engineering.", tags: ["design", "craft"], draft: false, readingTimeMinutes: 2 },
];

describe("filterPosts", () => {
  it("returns all posts when query is empty and no tags selected", () => {
    expect(filterPosts(posts, "", [])).toHaveLength(2);
  });

  it("matches query against title (case-insensitive)", () => {
    const r = filterPosts(posts, "failure", []);
    expect(r).toHaveLength(1);
    expect(r[0].slug).toBe("a");
  });

  it("matches query against summary", () => {
    const r = filterPosts(posts, "design and", []);
    expect(r.map((p) => p.slug)).toEqual(["b"]);
  });

  it("filters by selected tag (any-of)", () => {
    const r = filterPosts(posts, "", ["design"]);
    expect(r.map((p) => p.slug)).toEqual(["b"]);
  });

  it("combines query and tags (AND between the two dimensions)", () => {
    expect(filterPosts(posts, "failure", ["design"])).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
npx vitest run src/lib/search.test.ts
```

Expected: FAIL — cannot resolve `@/lib/search`.

- [ ] **Step 5: Implement `src/lib/search.ts`**

```ts
import type { PostMeta } from "@/lib/posts";

export function filterPosts(
  posts: PostMeta[],
  query: string,
  selectedTags: string[],
): PostMeta[] {
  const q = query.trim().toLowerCase();
  return posts.filter((post) => {
    const matchesQuery =
      q === "" ||
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q);
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => post.tags.includes(tag));
    return matchesQuery && matchesTags;
  });
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx vitest run src/lib/search.test.ts
```

Expected: PASS — 5 passed.

- [ ] **Step 7: Write the failing test `src/components/blog-explorer.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { BlogExplorer } from "@/components/blog-explorer";
import type { PostMeta } from "@/lib/posts";

const posts: PostMeta[] = [
  { slug: "a", title: "Designing for Failure", date: "2026-01-15", summary: "Resilient backends.", tags: ["systems"], draft: false, readingTimeMinutes: 4 },
  { slug: "b", title: "The Craft of Interfaces", date: "2026-02-20", summary: "Design and engineering.", tags: ["design"], draft: false, readingTimeMinutes: 2 },
];

describe("BlogExplorer", () => {
  it("lists all posts initially", () => {
    render(<BlogExplorer posts={posts} allTags={["systems", "design"]} />);
    expect(screen.getByText("Designing for Failure")).toBeInTheDocument();
    expect(screen.getByText("The Craft of Interfaces")).toBeInTheDocument();
  });

  it("filters by search query", async () => {
    render(<BlogExplorer posts={posts} allTags={["systems", "design"]} />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: /search posts/i }),
      "failure",
    );
    expect(screen.getByText("Designing for Failure")).toBeInTheDocument();
    expect(
      screen.queryByText("The Craft of Interfaces"),
    ).not.toBeInTheDocument();
  });

  it("filters by toggling a tag", async () => {
    render(<BlogExplorer posts={posts} allTags={["systems", "design"]} />);
    await userEvent.click(screen.getByRole("button", { name: "design" }));
    expect(screen.getByText("The Craft of Interfaces")).toBeInTheDocument();
    expect(
      screen.queryByText("Designing for Failure"),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Run the test to verify it fails**

```bash
npx vitest run src/components/blog-explorer.test.tsx
```

Expected: FAIL — cannot resolve `@/components/blog-explorer`.

- [ ] **Step 9: Implement `src/components/blog-explorer.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { PostMeta } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { filterPosts } from "@/lib/search";

export function BlogExplorer({
  posts,
  allTags,
}: {
  posts: PostMeta[];
  allTags: string[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = filterPosts(posts, query, selected);

  function toggle(tag: string) {
    setSelected((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag],
    );
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search posts"
        aria-label="Search posts"
        className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
      />
      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-0.5 text-xs transition ${
                  active
                    ? "border-accent text-accent"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <p className="text-muted">No posts match.</p>
        ) : (
          filtered.map((post) => <PostCard key={post.slug} post={post} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Run the test to verify it passes**

```bash
npx vitest run src/components/blog-explorer.test.tsx
```

Expected: PASS — 3 passed.

- [ ] **Step 11: Wire `BlogExplorer` into `src/app/blog/page.tsx`**

Replace the file's body so it passes post metadata + tags to the explorer. Replace the imports and component with:

```tsx
import type { Metadata } from "next";
import { getAllPostMeta, getAllTags } from "@/lib/posts";
import { BlogExplorer } from "@/components/blog-explorer";

export const metadata: Metadata = {
  title: "Writing",
  description: "Essays and notes on software, systems, and design craft.",
};

export default function BlogIndexPage() {
  const posts = getAllPostMeta();
  const tags = getAllTags();
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
          <BlogExplorer posts={posts} allTags={tags} />
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 12: Verify build + full suite + types**

```bash
npm test && npm run build && npx tsc --noEmit
```

Expected: tests pass (27 prior + 5 search + 3 explorer = 35); `/blog` builds; no type errors.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(blog): client-side search and tag filtering"
```

---

## Task 2: Newsletter (Buttondown) — API route + form (TDD)

**Files:**
- Create: `src/app/api/subscribe/route.ts`, `src/components/newsletter.tsx`, `src/components/newsletter.test.tsx`
- Modify: `src/app/blog/page.tsx` (mount the form)

- [ ] **Step 1: Create the API route `src/app/api/subscribe/route.ts`**

```ts
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
  const key = process.env.BUTTONDOWN_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Newsletter is not configured yet." },
      { status: 503 },
    );
  }

  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, {
      status: 400,
    });
  }

  const res = await fetch("https://api.buttondown.email/v1/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Token ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email }),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Subscription failed. Please try again later." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Write the failing test `src/components/newsletter.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Newsletter } from "@/components/newsletter";

describe("Newsletter", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders an email input and subscribe button", () => {
    render(<Newsletter />);
    expect(screen.getBylabel ?? screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /subscribe/i }),
    ).toBeInTheDocument();
  });

  it("shows a success message after a successful subscribe", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    render(<Newsletter />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /email/i }),
      "me@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/thanks|subscribed/i)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Newsletter is not configured yet." }),
    });
    render(<Newsletter />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /email/i }),
      "me@example.com",
    );
    await userEvent.click(screen.getByRole("button", { name: /subscribe/i }));
    expect(await screen.findByText(/not configured|try again/i)).toBeInTheDocument();
  });
});
```

Note: the first test's `screen.getByLabel ?? ...` is a typo guard — simplify it to just `screen.getByRole("textbox", { name: /email/i })` when implementing if the `??` line looks odd; the intent is "an email textbox labelled email exists."

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run src/components/newsletter.test.tsx
```

Expected: FAIL — cannot resolve `@/components/newsletter`.

- [ ] **Step 4: Implement `src/components/newsletter.tsx`**

```tsx
"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Thanks — you're subscribed.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data?.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card p-5"
    >
      <p className="font-semibold tracking-tight">Subscribe to new posts</p>
      <p className="mt-1 text-sm text-muted">
        Occasional essays on software and design craft. No spam.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={`mt-2 text-sm ${
            status === "error" ? "text-red-500" : "text-accent"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/components/newsletter.test.tsx
```

Expected: PASS — 3 passed. (`type="email"` inputs expose the `textbox` role in jsdom; the `aria-label="Email address"` gives the accessible name matched by `/email/i`.)

- [ ] **Step 6: Mount the form at the bottom of `src/app/blog/page.tsx`**

Add the import:

```tsx
import { Newsletter } from "@/components/newsletter";
```

Add, after the closing `</div>` that wraps the `BlogExplorer` (still inside the `<section>`):

```tsx
      <div className="mt-12">
        <Newsletter />
      </div>
```

- [ ] **Step 7: Verify build + suite + types**

```bash
npm test && npm run build && npx tsc --noEmit
```

Expected: tests pass (38 total: 35 + 3); build green (the `/api/subscribe` route appears as a dynamic route); no type errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(newsletter): Buttondown signup form and API route"
```

---

## Task 3: Comments (giscus) — graceful when unconfigured (TDD)

**Files:**
- Create: `src/components/comments.tsx`, `src/components/comments.test.tsx`
- Modify: `src/app/blog/[slug]/page.tsx` (mount `Comments`), `package.json` (dep)

- [ ] **Step 1: Install `@giscus/react`**

```bash
npm install @giscus/react
```

- [ ] **Step 2: Write the failing test `src/components/comments.test.tsx`**

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));
vi.mock("@giscus/react", () => ({
  default: () => <div data-testid="giscus" />,
}));

import { Comments } from "@/components/comments";

describe("Comments", () => {
  it("renders nothing when giscus env is not configured", () => {
    // NEXT_PUBLIC_GISCUS_REPO is unset in the test environment
    const { container } = render(<Comments />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run src/components/comments.test.tsx
```

Expected: FAIL — cannot resolve `@/components/comments`.

- [ ] **Step 4: Implement `src/components/comments.tsx`**

```tsx
"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export function Comments() {
  const { resolvedTheme } = useTheme();

  if (!repo || !repoId || !categoryId) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <Giscus
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        lang="en"
        loading="lazy"
      />
    </section>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/components/comments.test.tsx
```

Expected: PASS — 1 passed (renders null because the env vars are unset in the test environment).

- [ ] **Step 6: Mount `Comments` on the post page**

In `src/app/blog/[slug]/page.tsx`, add the import:

```tsx
import { Comments } from "@/components/comments";
```

Add `<Comments />` right after the `<Mdx source={post.content} />` line (still inside the `<article>`):

```tsx
      <Mdx source={post.content} />
      <Comments />
```

- [ ] **Step 7: Verify build + suite + types**

```bash
npm test && npm run build && npx tsc --noEmit
```

Expected: tests pass (39 total: 38 + 1); build green; no type errors. The post page still builds (Comments renders null without config).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(comments): giscus comments on posts (graceful when unconfigured)"
```

---

## Task 4: Analytics (Plausible) — graceful when unconfigured (TDD)

**Files:**
- Create: `src/components/analytics.tsx`, `src/components/analytics.test.tsx`
- Modify: `src/app/layout.tsx` (mount `Analytics`)

- [ ] **Step 1: Write the failing test `src/components/analytics.test.tsx`**

```tsx
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Analytics } from "@/components/analytics";

describe("Analytics", () => {
  it("renders nothing when no Plausible domain is configured", () => {
    // NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset in the test environment
    const { container } = render(<Analytics />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/analytics.test.tsx
```

Expected: FAIL — cannot resolve `@/components/analytics`.

- [ ] **Step 3: Implement `src/components/analytics.tsx`**

```tsx
import Script from "next/script";

const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function Analytics() {
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/analytics.test.tsx
```

Expected: PASS — 1 passed.

- [ ] **Step 5: Mount `Analytics` in `src/app/layout.tsx`**

Add the import:

```tsx
import { Analytics } from "@/components/analytics";
```

Render `<Analytics />` just inside `<body>`, as the first child before `<ThemeProvider>`:

```tsx
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Analytics />
        <ThemeProvider
```

- [ ] **Step 6: Verify build + suite + types**

```bash
npm test && npm run build && npx tsc --noEmit
```

Expected: tests pass (40 total: 39 + 1); build green; no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(analytics): Plausible script (graceful when unconfigured)"
```

---

## Task 5: Document environment variables

**Files:**
- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Create `.env.example`**

```bash
# Newsletter (Buttondown) — server secret. On Cloudflare: `npx wrangler secret put BUTTONDOWN_API_KEY`
BUTTONDOWN_API_KEY=

# Comments (giscus) — from https://giscus.app after enabling Discussions on the repo. Public values.
NEXT_PUBLIC_GISCUS_REPO=
NEXT_PUBLIC_GISCUS_REPO_ID=
NEXT_PUBLIC_GISCUS_CATEGORY=
NEXT_PUBLIC_GISCUS_CATEGORY_ID=

# Analytics (Plausible) — your site domain, e.g. titouanlebocq.com. Public value.
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

- [ ] **Step 2: Confirm `.env*.local` is gitignored, and ensure `.env` won't be committed**

```bash
grep -n "env" .gitignore
```

The Next scaffold `.gitignore` ignores `.env*` files (e.g. `.env*.local`). Confirm `.env.example` is NOT ignored (it must be committed) and that real `.env` / `.env.local` files ARE ignored. If `.env.example` would be ignored by an `.env*` pattern, add an explicit negation to `.gitignore`:

```
!.env.example
```

(Report what the existing patterns are and whether the negation was needed.)

- [ ] **Step 3: Add an "Environment" section to `README.md`**

Append:

```markdown
## Environment variables

Copy `.env.example` to `.env.local` and fill in what you have. Everything degrades gracefully when unset — the newsletter form returns a friendly message, comments and analytics simply don't render.

- `BUTTONDOWN_API_KEY` — newsletter (server-only). In production set it as a Cloudflare secret: `npx wrangler secret put BUTTONDOWN_API_KEY`.
- `NEXT_PUBLIC_GISCUS_*` — comments config from https://giscus.app (enable GitHub Discussions on the repo first).
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` — your domain for Plausible analytics.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: document engagement env vars"
```

---

## Task 6: Phase verification + lint gate

**Files:** none (verification; plus any small fixes surfaced).

- [ ] **Step 1: Run every CI gate**

```bash
npm run lint && npx tsc --noEmit && npm test && npm run build
```

Expected: all green (lint clean, no type errors, 40 tests pass, build succeeds). Fix minimally and re-run if lint flags anything in the new files.

- [ ] **Step 2: Smoke-test on the real Cloudflare runtime (unconfigured-but-graceful)**

```bash
(npm run preview > /tmp/prev.log 2>&1 &) ; sleep 30 ; tail -5 /tmp/prev.log
PORT=8787   # adjust to the log
echo -n "/blog -> " ; curl -s -o /tmp/b.html -w "%{http_code}\n" "http://localhost:$PORT/blog"
echo -n "search box present: " ; grep -c 'type="search"' /tmp/b.html
echo -n "newsletter present: " ; grep -c -i "subscribe" /tmp/b.html
echo -n "post page -> " ; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:$PORT/blog/designing-for-failure"
echo -n "subscribe (unconfigured) -> " ; curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "Content-Type: application/json" -d '{"email":"me@example.com"}' "http://localhost:$PORT/api/subscribe"
pkill -f "wrangler" ; pkill -f "opennextjs" 2>/dev/null || true
```

Expected: `/blog` → 200 with a search box and a "Subscribe" form present; post page → 200 (comments render nothing without config — should not error); `/api/subscribe` → **503** (no `BUTTONDOWN_API_KEY` configured — the graceful path). Report the table. A 500 on `/api/subscribe` (vs 503) would indicate a bug.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore(engagement): phase 5 verification fixes" || echo "no fixes needed"
```

---

## Self-Review

**Spec coverage (Phase 5 items from §5, §6, §8.5):**
- Blog search + tag filtering → Task 1 ✓
- Newsletter (Buttondown, behind an interface, graceful) → Task 2 ✓
- Comments (giscus, themed, graceful) → Task 3 ✓
- Analytics (Plausible, cookieless, graceful, `lib/analytics`-style component) → Task 4 ✓
- Env documentation → Task 5 ✓

**Type consistency:** `PostMeta = Omit<Post, "content">` introduced in Task 1; `PostCard`, `BlogExplorer`, `filterPosts`, and `getAllPostMeta` all use it consistently. Full `Post` objects remain assignable to `PostMeta`, so existing callers (home page) are unaffected. `Newsletter`/`Comments`/`Analytics` take no props. The `/api/subscribe` contract (`{ email: string }` → `{ ok: true }` | `{ error: string }`) matches what `Newsletter` sends and reads.

**Placeholder scan:** No TBD/TODO. The newsletter test's `getByLabel ?? ...` line is explicitly flagged to simplify on implementation. All external integrations intentionally read from env and degrade gracefully — these are not placeholders but the designed unconfigured state.

**Risk notes:**
- The graceful-degradation paths are the key behaviors to verify (Task 6 Step 2): `/api/subscribe` must return **503** (not 500) when unconfigured; comments/analytics must render nothing (not throw) when unconfigured.
- `@giscus/react` is the one new dependency — confirm it builds on Cloudflare (it's a client component, so it ships to the browser and shouldn't affect the worker build, but verify the build).
- Reading `process.env.BUTTONDOWN_API_KEY` in the route: on Cloudflare via OpenNext, server env/secrets are exposed on `process.env`. Set in production with `wrangler secret put`.
