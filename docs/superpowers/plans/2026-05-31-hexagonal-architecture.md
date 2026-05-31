# Hexagonal Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the portfolio to a hexagonal (ports & adapters) architecture — behavior-preserving — so content access, the newsletter, and the client widgets sit behind explicit, testable interfaces with an enforced dependency rule.

**Architecture:** A pure `core` (domain + port interfaces + use-cases) that imports nothing outward; `adapters` that implement ports (MDX-on-disk, Buttondown, Cloudflare/Giscus) plus test doubles; a `composition` root that wires real adapters into use-cases. Next.js pages/routes become thin driving adapters. An ESLint boundary rule enforces `core` purity. Wiring is a composition root (no DI container).

**Tech Stack:** Next.js 16 (App Router), TypeScript, Zod, Vitest + Testing Library, ESLint flat config. Spec: `docs/superpowers/specs/2026-05-31-hexagonal-architecture-design.md`.

**Key principle for every task:** this is a MOVE/REWIRE, not a rewrite. Logic is preserved verbatim. After every task, `npx tsc --noEmit && npx vitest run && npm run lint` must pass (and `npm run build` at slice boundaries). Branch: `feat/hexagonal-architecture`.

---

## File Structure (target)

```
src/
  core/
    domain/
      post.ts          # Post/PostMeta types, frontmatter schema, parsePost, toISODate,
                       # sortPostsByDateDesc, filterDrafts, toPostMeta, uniqueSortedTags
      post.test.ts
      project.ts       # Project/ProjectCategory types, schema, parseProject, sortProjects
      project.test.ts
      search.ts        # filterPosts (pure)
      search.test.ts
      site.ts          # site config (moved from lib)
      seo.ts           # articleJsonLd (moved from lib)
    ports/
      content-repository.ts
      subscription-gateway.ts
      analytics-tracker.ts        # client port (type-only react)
      comments-renderer.ts        # client port (type-only react)
    application/
      content.ts       # makeContentUseCases(repo, { includeDrafts })
      content.test.ts
      subscribe.ts     # makeSubscribe(gateway)
      subscribe.test.ts
  adapters/
    content/
      mdx-content-repository.ts        # fs + gray-matter (server-only)
      in-memory-content-repository.ts
      mdx-content-repository.test.ts   # integration vs real content/ fixtures
    newsletter/
      buttondown-gateway.ts
      buttondown-gateway.test.ts
      in-memory-subscription-gateway.ts
    analytics/
      cloudflare-tracker.tsx
      noop-tracker.tsx
    comments/
      giscus-renderer.tsx
      noop-renderer.tsx
  composition/
    server.ts          # server-only; legacy-named exports bound to use-cases
    client.ts          # selects client adapters by env
```

**Caller import policy after migration:**
- **Types** (`Post`, `PostMeta`, `Project`, `ProjectCategory`) come from `@/core/domain/post` / `@/core/domain/project` (pure — safe in client components).
- **Server functions** (`getAllPosts`, etc.) come from `@/composition/server` (server-only).
- `site`/`articleJsonLd` come from `@/core/domain/site` / `@/core/domain/seo`.

---

## Task 1: Enforce the dependency rule (ESLint boundary)

**Files:** Modify `eslint.config.mjs`

- [ ] **Step 1: Add the `core` boundary rule**

Edit `eslint.config.mjs` — add this config object to the array passed to `defineConfig`, after `...nextTs,`:

```js
  {
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "fs", message: "core must stay pure — use an adapter." },
            { name: "node:fs", message: "core must stay pure — use an adapter." },
            { name: "path", message: "core must stay pure — use an adapter." },
            { name: "node:path", message: "core must stay pure — use an adapter." },
            { name: "gray-matter", message: "Filesystem parsing belongs in an adapter." },
            { name: "reading-time", message: "Move into an adapter or pass the value in." },
          ],
          patterns: [
            { group: ["next", "next/*"], message: "core must not depend on Next.js." },
            { group: ["@/adapters/*", "@/composition/*"], message: "core must not depend on adapters/composition (dependency rule)." },
          ],
        },
      ],
    },
  },
```

Note: `react` is intentionally allowed (the two client-port interfaces use `import type { ReactNode } from "react"`), and `zod` is allowed (pure schema validation in the domain). `reading-time` is restricted in `core`; the reading-time value will be computed in the MDX adapter and passed into `parsePost` (see Task 2).

- [ ] **Step 2: Verify lint still passes (no core files yet → rule is inert)**

Run: `npm run lint`
Expected: clean (no errors).

- [ ] **Step 3: Commit**

```bash
git add eslint.config.mjs
git commit -m "chore(arch): enforce core dependency rule via eslint"
```

---

## Task 2: Domain layer (types, parsers, pure helpers)

Move the framework-free logic out of `src/lib/posts.ts` / `projects.ts` / `search.ts` into `src/core/domain`. **Decision:** `parsePost` no longer calls `reading-time` itself (that's fs-adjacent and restricted in core); instead it accepts a pre-computed `readingTimeMinutes`. The MDX adapter (Task 3) computes it. Sorting and draft-filtering move into pure helpers so they're testable without disk.

**Files:**
- Create: `src/core/domain/post.ts`, `src/core/domain/project.ts`, `src/core/domain/search.ts`
- Create/Move tests: `src/core/domain/post.test.ts`, `project.test.ts`, `search.test.ts`

- [ ] **Step 1: Write `core/domain/post.ts`**

```ts
import { z } from "zod";

const frontmatterSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  readingTimeMinutes: number;
  content: string;
};

export type PostMeta = Omit<Post, "content">;

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parse raw MDX (frontmatter + body) into a Post. `readingTimeMinutes` is
 *  computed by the adapter (the reading-time lib is fs-adjacent) and injected. */
export function parsePost(
  data: unknown,
  content: string,
  slug: string,
  readingTimeMinutes: number,
): Post {
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in post "${slug}": ${parsed.error.message}`);
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
    readingTimeMinutes,
    content,
  };
}

export function sortPostsByDateDesc(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function filterDrafts(posts: Post[], includeDrafts: boolean): Post[] {
  return includeDrafts ? posts : posts.filter((p) => !p.draft);
}

export function toPostMeta(post: Post): PostMeta {
  const { content: _content, ...meta } = post;
  void _content;
  return meta;
}

export function uniqueSortedTags(posts: Post[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) post.tags.forEach((t) => tags.add(t));
  return [...tags].sort();
}
```

- [ ] **Step 2: Write `core/domain/post.test.ts` (move + extend the existing parser tests)**

Read the current `src/lib/posts.test.ts` for the existing parse assertions, then write this file. The signature changed (`parsePost(data, content, slug, readingTimeMinutes)`), so adapt accordingly, and add tests for the new pure helpers:

```ts
import { describe, it, expect } from "vitest";
import {
  parsePost, sortPostsByDateDesc, filterDrafts, toPostMeta, uniqueSortedTags,
  type Post,
} from "./post";

const make = (over: Partial<Post> = {}): Post => ({
  slug: "s", title: "T", date: "2026-01-01", summary: "sum",
  tags: [], draft: false, readingTimeMinutes: 1, content: "body", ...over,
});

describe("parsePost", () => {
  it("validates and maps frontmatter, coercing the date to ISO", () => {
    const post = parsePost(
      { title: "Hello", date: "2026-02-03", summary: "S", tags: ["a"] },
      "Body text",
      "hello",
      4,
    );
    expect(post).toMatchObject({ slug: "hello", title: "Hello", date: "2026-02-03", tags: ["a"], readingTimeMinutes: 4, content: "Body text" });
  });
  it("defaults tags=[] and draft=false", () => {
    const post = parsePost({ title: "T", date: "2026-01-01", summary: "S" }, "b", "t", 1);
    expect(post.tags).toEqual([]);
    expect(post.draft).toBe(false);
  });
  it("throws with the slug in the message on invalid frontmatter", () => {
    expect(() => parsePost({ title: "" }, "b", "bad", 1)).toThrow(/post "bad"/);
  });
});

describe("post helpers", () => {
  it("sorts by date descending", () => {
    const out = sortPostsByDateDesc([make({ slug: "old", date: "2026-01-01" }), make({ slug: "new", date: "2026-03-01" })]);
    expect(out.map((p) => p.slug)).toEqual(["new", "old"]);
  });
  it("filters drafts unless includeDrafts", () => {
    const posts = [make({ slug: "a" }), make({ slug: "d", draft: true })];
    expect(filterDrafts(posts, false).map((p) => p.slug)).toEqual(["a"]);
    expect(filterDrafts(posts, true).map((p) => p.slug)).toEqual(["a", "d"]);
  });
  it("strips content for meta", () => {
    expect("content" in toPostMeta(make())).toBe(false);
  });
  it("collects unique sorted tags", () => {
    expect(uniqueSortedTags([make({ tags: ["b", "a"] }), make({ tags: ["a", "c"] })])).toEqual(["a", "b", "c"]);
  });
});
```

- [ ] **Step 3: Run the post domain tests**

Run: `npx vitest run src/core/domain/post.test.ts`
Expected: PASS.

- [ ] **Step 4: Write `core/domain/project.ts`**

```ts
import { z } from "zod";

const frontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  stack: z.array(z.string()).default([]),
  category: z.enum(["systems", "interface", "both"]),
  links: z.object({ repo: z.string().optional(), demo: z.string().optional() }).default({}),
  cover: z.string().optional(),
  featured: z.boolean().default(false),
  order: z.number().default(0),
});

export type ProjectCategory = "systems" | "interface" | "both";

export type Project = {
  slug: string;
  title: string;
  summary: string;
  role: string;
  stack: string[];
  category: ProjectCategory;
  links: { repo?: string; demo?: string };
  cover?: string;
  featured: boolean;
  order: number;
  content: string;
};

export function parseProject(data: unknown, content: string, slug: string): Project {
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in project "${slug}": ${parsed.error.message}`);
  }
  return { slug, ...parsed.data, content };
}

export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) =>
    a.featured !== b.featured
      ? a.featured ? -1 : 1
      : a.order !== b.order
        ? a.order - b.order
        : a.title.localeCompare(b.title),
  );
}
```

- [ ] **Step 5: Write `core/domain/project.test.ts`** (adapt existing `src/lib/projects.test.ts` to the new `parseProject(data, content, slug)` signature, plus a sort test)

```ts
import { describe, it, expect } from "vitest";
import { parseProject, sortProjects, type Project } from "./project";

const make = (over: Partial<Project> = {}): Project => ({
  slug: "s", title: "T", summary: "S", role: "R", stack: [], category: "systems",
  links: {}, featured: false, order: 0, content: "b", ...over,
});

describe("parseProject", () => {
  it("validates and maps frontmatter", () => {
    const p = parseProject({ title: "Ledger", summary: "S", role: "Lead", category: "systems" }, "body", "ledger");
    expect(p).toMatchObject({ slug: "ledger", title: "Ledger", category: "systems", content: "body" });
    expect(p.stack).toEqual([]);
    expect(p.featured).toBe(false);
  });
  it("throws on invalid category", () => {
    expect(() => parseProject({ title: "T", summary: "S", role: "R", category: "nope" }, "b", "x")).toThrow(/project "x"/);
  });
});

describe("sortProjects", () => {
  it("orders featured first, then by order, then title", () => {
    const out = sortProjects([
      make({ slug: "b", order: 2 }), make({ slug: "feat", featured: true }), make({ slug: "a", order: 1 }),
    ]);
    expect(out.map((p) => p.slug)).toEqual(["feat", "a", "b"]);
  });
});
```

- [ ] **Step 6: Write `core/domain/search.ts`** (move `filterPosts`, retarget the type import)

```ts
import type { PostMeta } from "./post";

export function filterPosts(posts: PostMeta[], query: string, selectedTags: string[]): PostMeta[] {
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

- [ ] **Step 7: Move the search test** — copy `src/lib/search.test.ts` to `src/core/domain/search.test.ts`, changing the import to `from "./search"` and the `PostMeta` type import to `from "./post"`. Keep all existing test cases verbatim.

- [ ] **Step 8: Run all domain tests**

Run: `npx vitest run src/core/domain`
Expected: PASS (post, project, search).

- [ ] **Step 9: Delete the now-duplicated logic locations later** — leave `src/lib/*` in place for now (they still back the app); they're replaced in Task 4. Commit the domain layer.

```bash
git add src/core/domain
git commit -m "feat(arch): extract framework-free domain (post, project, search)"
```

---

## Task 3: Content port + adapters + use-cases

**Files:**
- Create: `src/core/ports/content-repository.ts`
- Create: `src/adapters/content/mdx-content-repository.ts`, `in-memory-content-repository.ts`, `mdx-content-repository.test.ts`
- Create: `src/core/application/content.ts`, `content.test.ts`

- [ ] **Step 1: Define the port `core/ports/content-repository.ts`**

```ts
import type { Post } from "@/core/domain/post";
import type { Project } from "@/core/domain/project";

/** Returns ALL parsed entities (unsorted, drafts included). Sorting/draft
 *  policy lives in the use-cases so it is testable without a real source. */
export interface ContentRepository {
  listPosts(): Post[];
  listProjects(): Project[];
}
```

- [ ] **Step 2: In-memory adapter `adapters/content/in-memory-content-repository.ts`**

```ts
import type { ContentRepository } from "@/core/ports/content-repository";
import type { Post } from "@/core/domain/post";
import type { Project } from "@/core/domain/project";

export class InMemoryContentRepository implements ContentRepository {
  constructor(private readonly data: { posts?: Post[]; projects?: Project[] } = {}) {}
  listPosts(): Post[] { return this.data.posts ?? []; }
  listProjects(): Project[] { return this.data.projects ?? []; }
}
```

- [ ] **Step 3: Write the use-cases test `core/application/content.test.ts` (failing first)**

```ts
import { describe, it, expect } from "vitest";
import { makeContentUseCases } from "./content";
import { InMemoryContentRepository } from "@/adapters/content/in-memory-content-repository";
import type { Post } from "@/core/domain/post";
import type { Project } from "@/core/domain/project";

const post = (over: Partial<Post> = {}): Post => ({
  slug: "s", title: "T", date: "2026-01-01", summary: "S", tags: [], draft: false,
  readingTimeMinutes: 1, content: "body", ...over,
});
const project = (over: Partial<Project> = {}): Project => ({
  slug: "p", title: "T", summary: "S", role: "R", stack: [], category: "systems",
  links: {}, featured: false, order: 0, content: "b", ...over,
});

function uc(posts: Post[] = [], projects: Project[] = [], includeDrafts = false) {
  return makeContentUseCases(new InMemoryContentRepository({ posts, projects }), { includeDrafts });
}

describe("content use-cases", () => {
  it("listPosts sorts by date desc and hides drafts by default", () => {
    const c = uc([post({ slug: "old", date: "2026-01-01" }), post({ slug: "new", date: "2026-02-01" }), post({ slug: "d", draft: true })]);
    expect(c.listPosts().map((p) => p.slug)).toEqual(["new", "old"]);
  });
  it("listPosts includes drafts when includeDrafts is true", () => {
    const c = uc([post({ slug: "d", draft: true })], [], true);
    expect(c.listPosts().map((p) => p.slug)).toEqual(["d"]);
  });
  it("getPost returns a visible post, undefined for a hidden draft", () => {
    const c = uc([post({ slug: "a" }), post({ slug: "d", draft: true })]);
    expect(c.getPost("a")?.slug).toBe("a");
    expect(c.getPost("d")).toBeUndefined();
  });
  it("listPostMeta strips content", () => {
    const c = uc([post()]);
    expect("content" in c.listPostMeta()[0]).toBe(false);
  });
  it("listTags returns unique sorted tags of visible posts", () => {
    const c = uc([post({ tags: ["b", "a"] }), post({ slug: "2", tags: ["a", "c"] })]);
    expect(c.listTags()).toEqual(["a", "b", "c"]);
  });
  it("postsByTag filters visible posts", () => {
    const c = uc([post({ slug: "a", tags: ["x"] }), post({ slug: "b", tags: ["y"] })]);
    expect(c.postsByTag("x").map((p) => p.slug)).toEqual(["a"]);
  });
  it("listProjects sorts; featuredProjects filters; getProject looks up", () => {
    const c = uc([], [project({ slug: "b", order: 2 }), project({ slug: "f", featured: true }), project({ slug: "a", order: 1 })]);
    expect(c.listProjects().map((p) => p.slug)).toEqual(["f", "a", "b"]);
    expect(c.featuredProjects().map((p) => p.slug)).toEqual(["f"]);
    expect(c.getProject("a")?.slug).toBe("a");
  });
});
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `npx vitest run src/core/application/content.test.ts`
Expected: FAIL — cannot find module `./content`.

- [ ] **Step 5: Implement `core/application/content.ts`**

```ts
import type { ContentRepository } from "@/core/ports/content-repository";
import {
  filterDrafts, sortPostsByDateDesc, toPostMeta, uniqueSortedTags,
  type Post, type PostMeta,
} from "@/core/domain/post";
import { sortProjects, type Project } from "@/core/domain/project";

export function makeContentUseCases(
  repo: ContentRepository,
  options: { includeDrafts: boolean },
) {
  const visiblePosts = (): Post[] =>
    sortPostsByDateDesc(filterDrafts(repo.listPosts(), options.includeDrafts));
  const sortedProjects = (): Project[] => sortProjects(repo.listProjects());

  return {
    listPosts: (): Post[] => visiblePosts(),
    getPost: (slug: string): Post | undefined => visiblePosts().find((p) => p.slug === slug),
    listPostMeta: (): PostMeta[] => visiblePosts().map(toPostMeta),
    listTags: (): string[] => uniqueSortedTags(visiblePosts()),
    postsByTag: (tag: string): Post[] => visiblePosts().filter((p) => p.tags.includes(tag)),
    listProjects: (): Project[] => sortedProjects(),
    getProject: (slug: string): Project | undefined => sortedProjects().find((p) => p.slug === slug),
    featuredProjects: (): Project[] => sortedProjects().filter((p) => p.featured),
  };
}
```

- [ ] **Step 6: Run it to confirm it passes**

Run: `npx vitest run src/core/application/content.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: MDX adapter `adapters/content/mdx-content-repository.ts`**

```ts
import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import type { ContentRepository } from "@/core/ports/content-repository";
import { parsePost, type Post } from "@/core/domain/post";
import { parseProject, type Project } from "@/core/domain/project";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/, "");
}

function readDir(dir: string): { raw: string; slug: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => ({ raw: fs.readFileSync(path.join(dir, f), "utf8"), slug: slugFromFilename(f) }));
}

export class MdxContentRepository implements ContentRepository {
  listPosts(): Post[] {
    return readDir(POSTS_DIR).map(({ raw, slug }) => {
      const { data, content } = matter(raw);
      const minutes = Math.max(1, Math.round(readingTime(content).minutes));
      return parsePost(data, content, slug, minutes);
    });
  }
  listProjects(): Project[] {
    return readDir(PROJECTS_DIR).map(({ raw, slug }) => {
      const { data, content } = matter(raw);
      return parseProject(data, content, slug);
    });
  }
}
```

- [ ] **Step 8: Integration test `adapters/content/mdx-content-repository.test.ts`** (reads the REAL `content/` fixtures — closes the untested-fs gap)

```ts
import { describe, it, expect } from "vitest";
import { MdxContentRepository } from "./mdx-content-repository";

describe("MdxContentRepository (real content/)", () => {
  const repo = new MdxContentRepository();
  it("reads and parses posts from disk", () => {
    const posts = repo.listPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.readingTimeMinutes).toBeGreaterThanOrEqual(1);
      expect(typeof p.content).toBe("string");
    }
  });
  it("reads and parses projects from disk", () => {
    const projects = repo.listProjects();
    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      expect(p.slug).toBeTruthy();
      expect(["systems", "interface", "both"]).toContain(p.category);
    }
  });
});
```

Note: this test imports a `server-only` module. `server-only` throws only in a client bundle; under Vitest (node) it's a no-op, so this is fine. If Vitest cannot resolve `server-only`, add it to `test.server.deps` — but it ships with Next and resolves to a node stub, so no config change is expected.

- [ ] **Step 9: Run the adapter test**

Run: `npx vitest run src/adapters/content/mdx-content-repository.test.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/core/ports/content-repository.ts src/core/application/content.ts src/core/application/content.test.ts src/adapters/content
git commit -m "feat(arch): content port, MDX + in-memory adapters, use-cases"
```

---

## Task 4: Compose content + repoint all callers; delete old lib

**Files:**
- Create: `src/composition/server.ts`
- Modify: every importer of `@/lib/posts`, `@/lib/projects`, `@/lib/search`
- Delete: `src/lib/posts.ts`, `src/lib/posts.test.ts`, `src/lib/projects.ts`, `src/lib/projects.test.ts`, `src/lib/search.ts`, `src/lib/search.test.ts`

- [ ] **Step 1: Composition root `src/composition/server.ts`** (legacy-named exports so callers change only the import path for functions)

```ts
import "server-only";
import { MdxContentRepository } from "@/adapters/content/mdx-content-repository";
import { makeContentUseCases } from "@/core/application/content";

const content = makeContentUseCases(new MdxContentRepository(), {
  includeDrafts: process.env.NODE_ENV === "development",
});

export const getAllPosts = content.listPosts;
export const getAllPostMeta = content.listPostMeta;
export const getPostBySlug = content.getPost;
export const getAllTags = content.listTags;
export const getPostsByTag = content.postsByTag;
export const getAllProjects = content.listProjects;
export const getProjectBySlug = content.getProject;
export const getFeaturedProjects = content.featuredProjects;
```

- [ ] **Step 2: Find every caller**

Run: `grep -rln "@/lib/posts\|@/lib/projects\|@/lib/search" src/`
This lists all files importing the old modules (pages, routes, OG images, sitemap, components, seo).

- [ ] **Step 3: Repoint imports** — for EACH file from Step 2, apply this mapping:
  - Function imports (`getAllPosts`, `getAllPostMeta`, `getPostBySlug`, `getAllTags`, `getPostsByTag`, `getAllProjects`, `getProjectBySlug`, `getFeaturedProjects`) → import from `@/composition/server`.
  - Type imports (`Post`, `PostMeta`) → from `@/core/domain/post`. (`Project`, `ProjectCategory`) → from `@/core/domain/project`.
  - `filterPosts` → from `@/core/domain/search`.
  - In `src/core/domain/seo.ts`-to-be (currently `src/lib/seo.ts`): its `import type { Post } from "@/lib/posts"` becomes `from "@/core/domain/post"` (this file moves in Task 6; for now just retarget the type import).

  **Important:** a few callers are **client components** (`src/components/blog-explorer.tsx`, `post-card.tsx`, `project-card.tsx`, and the `*.test.tsx`). They import only TYPES — point them at `@/core/domain/*`, never at `@/composition/server` (which is `server-only` and would break the client build).

- [ ] **Step 4: Delete the old lib modules and their tests**

```bash
git rm src/lib/posts.ts src/lib/posts.test.ts src/lib/projects.ts src/lib/projects.test.ts src/lib/search.ts src/lib/search.test.ts
```

(The parser/search test coverage now lives in `src/core/domain/*.test.ts`.)

- [ ] **Step 5: Full gate**

Run: `npx tsc --noEmit && npx vitest run && npm run lint && npm run build`
Expected: no type errors (every old import resolved), all tests pass, lint clean, build succeeds with all routes still prerendering. If `tsc` flags a missed import, fix it (it points to a caller Step 3 missed).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(arch): route content through composition root; remove lib content modules"
```

---

## Task 5: Newsletter port + adapter + use-case; repoint the route

**Files:**
- Create: `src/core/ports/subscription-gateway.ts`, `src/adapters/newsletter/buttondown-gateway.ts`, `in-memory-subscription-gateway.ts`, `buttondown-gateway.test.ts`
- Create: `src/core/application/subscribe.ts`, `subscribe.test.ts`
- Modify: `src/app/api/subscribe/route.ts`

- [ ] **Step 1: Port `core/ports/subscription-gateway.ts`**

```ts
export type SubscribeResult = { ok: true } | { ok: false; reason: "invalid" | "unavailable" | "failed" };

export interface SubscriptionGateway {
  subscribe(email: string): Promise<SubscribeResult>;
}
```

- [ ] **Step 2: In-memory gateway `adapters/newsletter/in-memory-subscription-gateway.ts`**

```ts
import type { SubscriptionGateway, SubscribeResult } from "@/core/ports/subscription-gateway";

export class InMemorySubscriptionGateway implements SubscriptionGateway {
  readonly emails: string[] = [];
  constructor(private readonly result: SubscribeResult = { ok: true }) {}
  async subscribe(email: string): Promise<SubscribeResult> {
    if (this.result.ok) this.emails.push(email);
    return this.result;
  }
}
```

- [ ] **Step 3: Subscribe use-case test `core/application/subscribe.test.ts` (failing)**

```ts
import { describe, it, expect } from "vitest";
import { makeSubscribe } from "./subscribe";
import { InMemorySubscriptionGateway } from "@/adapters/newsletter/in-memory-subscription-gateway";

describe("subscribe use-case", () => {
  it("rejects an invalid email without calling the gateway", async () => {
    const gw = new InMemorySubscriptionGateway();
    const res = await makeSubscribe(gw)("not-an-email");
    expect(res).toEqual({ ok: false, reason: "invalid" });
    expect(gw.emails).toEqual([]);
  });
  it("delegates a valid email to the gateway", async () => {
    const gw = new InMemorySubscriptionGateway();
    const res = await makeSubscribe(gw)("a@b.co");
    expect(res).toEqual({ ok: true });
    expect(gw.emails).toEqual(["a@b.co"]);
  });
  it("passes through a gateway failure", async () => {
    const gw = new InMemorySubscriptionGateway({ ok: false, reason: "failed" });
    expect(await makeSubscribe(gw)("a@b.co")).toEqual({ ok: false, reason: "failed" });
  });
});
```

- [ ] **Step 4: Run to confirm failure**

Run: `npx vitest run src/core/application/subscribe.test.ts`
Expected: FAIL — cannot find module `./subscribe`.

- [ ] **Step 5: Implement `core/application/subscribe.ts`** (email validation is domain policy — moved out of the route)

```ts
import type { SubscriptionGateway, SubscribeResult } from "@/core/ports/subscription-gateway";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function makeSubscribe(gateway: SubscriptionGateway) {
  return async (email: unknown): Promise<SubscribeResult> => {
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return { ok: false, reason: "invalid" };
    }
    return gateway.subscribe(email);
  };
}
```

- [ ] **Step 6: Run to confirm pass**

Run: `npx vitest run src/core/application/subscribe.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Buttondown adapter `adapters/newsletter/buttondown-gateway.ts`**

```ts
import "server-only";
import type { SubscriptionGateway, SubscribeResult } from "@/core/ports/subscription-gateway";

export class ButtondownGateway implements SubscriptionGateway {
  constructor(private readonly apiKey = process.env.BUTTONDOWN_API_KEY) {}
  async subscribe(email: string): Promise<SubscribeResult> {
    if (!this.apiKey) return { ok: false, reason: "unavailable" };
    const res = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: { Authorization: `Token ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email_address: email }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: "failed" };
  }
}
```

- [ ] **Step 8: Adapter test `adapters/newsletter/buttondown-gateway.test.ts`** (mock `fetch`)

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { ButtondownGateway } from "./buttondown-gateway";

afterEach(() => vi.restoreAllMocks());

describe("ButtondownGateway", () => {
  it("returns unavailable when no API key is set", async () => {
    const gw = new ButtondownGateway(undefined);
    expect(await gw.subscribe("a@b.co")).toEqual({ ok: false, reason: "unavailable" });
  });
  it("POSTs to Buttondown and returns ok on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const gw = new ButtondownGateway("key");
    expect(await gw.subscribe("a@b.co")).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.buttondown.email/v1/subscribers",
      expect.objectContaining({ method: "POST" }),
    );
  });
  it("returns failed on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));
    expect(await new ButtondownGateway("key").subscribe("a@b.co")).toEqual({ ok: false, reason: "failed" });
  });
});
```

- [ ] **Step 9: Run adapter test**

Run: `npx vitest run src/adapters/newsletter/buttondown-gateway.test.ts`
Expected: PASS.

- [ ] **Step 10: Add `subscribe` to the composition root** — append to `src/composition/server.ts`:

```ts
import { ButtondownGateway } from "@/adapters/newsletter/buttondown-gateway";
import { makeSubscribe } from "@/core/application/subscribe";

export const subscribe = makeSubscribe(new ButtondownGateway());
```

- [ ] **Step 11: Repoint the route handler** — replace the body of `src/app/api/subscribe/route.ts` with a thin driving adapter that translates HTTP ↔ the use-case (preserving the exact status codes/messages):

```ts
import { subscribe } from "@/composition/server";

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await subscribe(email);
  if (result.ok) return Response.json({ ok: true });

  switch (result.reason) {
    case "invalid":
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    case "unavailable":
      return Response.json({ error: "Newsletter is not configured yet." }, { status: 503 });
    default:
      return Response.json({ error: "Subscription failed. Please try again later." }, { status: 502 });
  }
}
```

- [ ] **Step 12: Full gate**

Run: `npx tsc --noEmit && npx vitest run && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor(arch): newsletter behind a subscription port"
```

---

## Task 6: Client ports (analytics, comments) + move site/seo into core

**Files:**
- Create: `src/core/ports/analytics-tracker.ts`, `src/core/ports/comments-renderer.ts`
- Create: `src/adapters/analytics/cloudflare-tracker.tsx`, `noop-tracker.tsx`; `src/adapters/comments/giscus-renderer.tsx`, `noop-renderer.tsx`
- Create: `src/composition/client.ts`
- Move: `src/lib/site.ts` → `src/core/domain/site.ts`; `src/lib/seo.ts` → `src/core/domain/seo.ts`
- Modify: `src/app/layout.tsx`, `src/app/blog/[slug]/page.tsx`, and all `@/lib/site` / `@/lib/seo` importers
- Delete: `src/components/analytics.tsx`, `src/components/comments.tsx` (logic moves into adapters)

- [ ] **Step 1: Move `site.ts` and `seo.ts` into core**

```bash
git mv src/lib/site.ts src/core/domain/site.ts
git mv src/lib/seo.ts src/core/domain/seo.ts
```
Then edit `src/core/domain/seo.ts`: change `import { site } from "@/lib/site"` → `from "@/core/domain/site"` and `import type { Post } from "@/lib/posts"` → `from "@/core/domain/post"`.

- [ ] **Step 2: Repoint `@/lib/site` and `@/lib/seo` importers**

Run: `grep -rln "@/lib/site\|@/lib/seo" src/`
For each, change `@/lib/site` → `@/core/domain/site` and `@/lib/seo` → `@/core/domain/seo`.

- [ ] **Step 3: Analytics port + adapters**

`src/core/ports/analytics-tracker.ts`:
```ts
import type { ReactNode } from "react";
export interface AnalyticsTracker {
  /** Renders the tracking beacon (or nothing). */
  Beacon(): ReactNode;
}
```

`src/adapters/analytics/cloudflare-tracker.tsx` (moves the logic from `src/components/analytics.tsx`):
```ts
import Script from "next/script";
import type { AnalyticsTracker } from "@/core/ports/analytics-tracker";

const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export const CloudflareTracker: AnalyticsTracker = {
  Beacon() {
    if (!token) return null;
    return (
      <Script
        defer
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon={JSON.stringify({ token })}
        strategy="afterInteractive"
      />
    );
  },
};
```

`src/adapters/analytics/noop-tracker.tsx`:
```ts
import type { AnalyticsTracker } from "@/core/ports/analytics-tracker";
export const NoopTracker: AnalyticsTracker = { Beacon: () => null };
```

- [ ] **Step 4: Comments port + adapters** (move logic from `src/components/comments.tsx`)

`src/core/ports/comments-renderer.ts`:
```ts
import type { ReactNode } from "react";
export interface CommentsRenderer {
  Comments(): ReactNode;
}
```

`src/adapters/comments/giscus-renderer.tsx` — copy the exact JSX from `src/components/comments.tsx` (the `"use client"` directive, the `useTheme` hook, the env-var reads, and the `<Giscus>` element), exported as:
```ts
"use client";
import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import type { CommentsRenderer } from "@/core/ports/comments-renderer";

const repo = process.env.NEXT_PUBLIC_GISCUS_REPO;
const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export const GiscusRenderer: CommentsRenderer = {
  Comments() {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- stable single renderer object
    const { resolvedTheme } = useTheme();
    if (!repo || !repoId || !categoryId) return null;
    return (
      <section className="mt-12 border-t border-border pt-8">
        <Giscus
          repo={repo as `${string}/${string}`}
          repoId={repoId}
          category={category ?? ""}
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
  },
};
```
Note: if the `rules-of-hooks` disable feels wrong, prefer keeping `GiscusRenderer.Comments` as a named function component `function GiscusComments() {...}` and assigning `{ Comments: GiscusComments }` — this satisfies the hooks lint rule cleanly. Use whichever passes `npm run lint`; the named-component form is preferred.

`src/adapters/comments/noop-renderer.tsx`:
```ts
import type { CommentsRenderer } from "@/core/ports/comments-renderer";
export const NoopRenderer: CommentsRenderer = { Comments: () => null };
```

- [ ] **Step 5: Client composition `src/composition/client.ts`**

```ts
import { CloudflareTracker } from "@/adapters/analytics/cloudflare-tracker";
import { NoopTracker } from "@/adapters/analytics/noop-tracker";
import { GiscusRenderer } from "@/adapters/comments/giscus-renderer";
import { NoopRenderer } from "@/adapters/comments/noop-renderer";
import type { AnalyticsTracker } from "@/core/ports/analytics-tracker";
import type { CommentsRenderer } from "@/core/ports/comments-renderer";

const hasGiscus =
  !!process.env.NEXT_PUBLIC_GISCUS_REPO &&
  !!process.env.NEXT_PUBLIC_GISCUS_REPO_ID &&
  !!process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export const analytics: AnalyticsTracker = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN
  ? CloudflareTracker
  : NoopTracker;
export const comments: CommentsRenderer = hasGiscus ? GiscusRenderer : NoopRenderer;
```

- [ ] **Step 6: Repoint consumers**
  - `src/app/layout.tsx`: replace `import { Analytics } from "@/components/analytics"` and `<Analytics />` with `import { analytics } from "@/composition/client"` and `<analytics.Beacon />`.
  - `src/app/blog/[slug]/page.tsx`: replace `import { Comments } from "@/components/comments"` and `<Comments />` with `import { comments } from "@/composition/client"` and `<comments.Comments />`.

- [ ] **Step 7: Delete the old components and their tests** (the analytics test, if any, moves with the logic — keep the existing `analytics.test.tsx` behavior by relocating it to assert `CloudflareTracker.Beacon()` returns null when no token; update its import)

```bash
git rm src/components/analytics.tsx src/components/comments.tsx
```
Relocate `src/components/analytics.test.tsx` → `src/adapters/analytics/cloudflare-tracker.test.tsx`, importing `CloudflareTracker` and asserting `render(<>{CloudflareTracker.Beacon()}</>)` is empty when `NEXT_PUBLIC_CF_BEACON_TOKEN` is unset.

- [ ] **Step 8: Full gate**

Run: `npx tsc --noEmit && npx vitest run && npm run lint && npm run build`
Expected: all green; build still prerenders every route.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(arch): analytics & comments behind client ports; move site/seo into core"
```

---

## Task 7: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm the dependency rule holds** — `grep -rn "from \"next\"\|from \"@/adapters\|from \"@/composition\|node:fs\|gray-matter" src/core/` should return nothing (only `react`/`zod`/intra-`core` imports remain). If anything shows up, it's a boundary violation — move it to an adapter.

- [ ] **Step 2: Full gate + bundle budget**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Then a dry-run size check: `npx wrangler deploy --dry-run 2>&1 | grep -i gzip`
Expected: all green; gzip size still well under 3072 KiB (the refactor adds no runtime weight).

- [ ] **Step 3: Manual smoke (real runtime)** — `npm run preview`, then confirm `/`, `/blog`, a post, `/work`, a project, `/rss.xml`, and the newsletter form all behave exactly as before. Stop preview.

- [ ] **Step 4: Push and open a PR**

```bash
git push -u origin feat/hexagonal-architecture
gh pr create --title "refactor: hexagonal (ports & adapters) architecture" --body "Implements docs/superpowers/specs/2026-05-31-hexagonal-architecture-design.md. Behavior-preserving move to core/adapters/composition with an enforced dependency rule. Adds tests for previously-untested content access. No visible behavior change."
```

---

## Self-Review Notes

- **Spec coverage:** dependency rule + ESLint (Task 1, 7) · domain extraction (Task 2) · ContentRepository port + MDX/in-memory adapters + use-cases (Task 3) · composition root + caller repoint + lib removal (Task 4) · SubscriptionGateway port/adapter/use-case + route (Task 5) · client AnalyticsTracker/CommentsRenderer ports + adapters + Noop fallbacks + site/seo move (Task 6) · `server-only` guards (Tasks 3,5; composition 4,5) · testing payoff: in-memory use-case tests + MDX integration test + Buttondown fetch-mock test (Tasks 3,5) · success criteria verification (Task 7). All covered.
- **Behavior preservation:** route status codes/messages, draft policy (`NODE_ENV==='development'`), sort orders, and graceful-degradation (Noop adapters when env unset) are all reproduced verbatim.
- **Type consistency:** `ContentRepository.listPosts/listProjects`, `SubscriptionGateway.subscribe`/`SubscribeResult`, use-case names (`listPosts`, `getPost`, `listPostMeta`, `listTags`, `postsByTag`, `listProjects`, `getProject`, `featuredProjects`) are consistent across the port, adapters, use-cases, and the composition root's legacy-name aliases.
- **Client/server safety:** `server-only` on fs/Buttondown adapters + composition/server; client components import TYPES from `@/core/domain/*`, never from `@/composition/server`.
