# Hexagonal Architecture — Design Spec

**Status:** Approved design, ready for implementation planning
**Date:** 2026-05-31
**Type:** Refactor (behavior-preserving) of an existing Next.js portfolio/blog.

## 1. Goal & motivation

Adopt a hexagonal (ports & adapters) architecture, **primarily for testability and clean decoupling**, with consistent, craft-quality structure and future-proofing (e.g. swapping MDX for a CMS) as secondary benefits.

Concretely this should:
- Decouple the app's logic from the filesystem, Buttondown, and the client widgets behind explicit interfaces.
- Make the currently-untested content-access code testable via in-memory adapters.
- Keep a single, enforceable dependency rule so the boundaries don't erode.

This is a **refactor, not a rewrite**: existing logic moves into the new structure unchanged; the site behaves identically and all tests stay green throughout.

## 2. Scope

**Full ports-&-adapters** across every external touchpoint:

| Port (interface, in `core`) | Driven adapter(s) | Driving adapters (callers) |
|---|---|---|
| `ContentRepository` | `MdxContentRepository`, `InMemoryContentRepository` (tests) | blog/work pages, RSS route, sitemap, OG images |
| `SubscriptionGateway` | `ButtondownGateway`, `InMemorySubscriptionGateway` (tests) | `/api/subscribe` route handler |
| `AnalyticsTracker` (client) | `CloudflareTracker`, `NoopTracker` | root layout |
| `CommentsRenderer` (client) | `GiscusRenderer`, `NoopRenderer` | blog post page |

**Not ports:** Search stays **pure domain logic** (it's not an outside dependency). Site config (`site.ts`) and SEO/JSON-LD (`seo.ts`) stay as pure domain/value modules.

**Honest caveat:** the analytics and comments "ports" are *client-side React* abstractions — an interface plus a React adapter component — not backend domain ports. They are genuinely swappable (incl. `Noop` fallbacks that preserve today's "degrade gracefully when unconfigured" behavior) but are lighter-weight than the server-side ports.

## 3. Structure & the dependency rule

```
src/
  core/                         # INSIDE the hexagon — pure TS; no next/react/fs imports
    domain/                     # entities + pure logic
      post.ts                   #   Post / PostMeta types + Zod schema + parsePost
      project.ts                #   Project types + Zod schema + parseProject
      subscriber.ts             #   email value object / validation
      search.ts                 #   filterPosts (pure)
      reading-time.ts           #   (wraps the reading-time calc; pure)
    ports/                      # interfaces only
      content-repository.ts
      subscription-gateway.ts
      analytics-tracker.ts      #   client port
      comments-renderer.ts      #   client port
    application/                # use-cases orchestrating domain via ports
      content.ts                #   makeContentUseCases(repo): listPosts/getPost/listProjects/...
      subscribe.ts              #   makeSubscribe(gateway): subscribe(email)
  adapters/                     # OUTSIDE — implement ports + framework glue
    content/
      mdx-content-repository.ts        #   fs + gray-matter (server-only)
      in-memory-content-repository.ts  #   test double
    newsletter/
      buttondown-gateway.ts
      in-memory-subscription-gateway.ts
    analytics/
      cloudflare-tracker.tsx           #   client
      noop-tracker.tsx
    comments/
      giscus-renderer.tsx              #   client
      noop-renderer.tsx
  composition/
    server.ts                   # composition root: wires real adapters into use-cases (server)
    client.ts                   # selects client adapters by env (Cloudflare/Giscus vs Noop)
```

**Dependency rule (enforced):** `core/**` must not import from `adapters/**`, `composition/**`, `next`, `react`, or `fs`/`node:*`. Adapters may import core ports + frameworks. Composition imports both. The Next.js pages/route-handlers/`opengraph-image`/`sitemap`/`rss` are **driving adapters** — thin translators from framework I/O to use-case calls.

**Enforcement:** an ESLint `no-restricted-imports` (or `import/no-restricted-paths`) rule fails CI if `core/**` reaches outward. This is the guardrail that keeps the architecture honest over time.

## 4. Port contracts (interfaces)

Illustrative shapes (final signatures match what the current code already returns, so callers change imports, not data shapes):

```ts
// core/ports/content-repository.ts
export interface ContentRepository {
  listPosts(): Post[];
  getPost(slug: string): Post | undefined;
  listProjects(): Project[];
  getProject(slug: string): Project | undefined;
}

// core/ports/subscription-gateway.ts
export interface SubscriptionGateway {
  subscribe(email: string): Promise<SubscribeResult>; // { ok: true } | { ok: false, reason }
}

// core/ports/analytics-tracker.ts (client)
export interface AnalyticsTracker { Script(): ReactNode | null }   // renders beacon or nothing

// core/ports/comments-renderer.ts (client)
export interface CommentsRenderer { Comments(props): ReactNode | null }
```

Application use-cases are plain factories:
```ts
// core/application/content.ts
export function makeContentUseCases(repo: ContentRepository) {
  return {
    listPosts: () => repo.listPosts(),
    getPost: (slug: string) => repo.getPost(slug),
    listProjects: () => repo.listProjects(),
    getProject: (slug: string) => repo.getProject(slug),
    listTags: () => uniqueTags(repo.listPosts()),
    postsByTag: (tag: string) => repo.listPosts().filter(...),
    featuredProjects: () => repo.listProjects().filter((p) => p.featured),
  };
}
```
(Sorting, draft-filtering, tag derivation, and reading-time live in the domain/use-cases — moved out of the fs functions so they're testable without disk.)

## 5. Wiring (composition root)

Server:
```ts
// composition/server.ts
import "server-only";
import { MdxContentRepository } from "@/adapters/content/mdx-content-repository";
import { ButtondownGateway } from "@/adapters/newsletter/buttondown-gateway";
import { makeContentUseCases } from "@/core/application/content";
import { makeSubscribe } from "@/core/application/subscribe";

const content = makeContentUseCases(new MdxContentRepository());
export const { listPosts, getPost, listProjects, getProject, listTags, postsByTag, featuredProjects } = content;
export const subscribe = makeSubscribe(new ButtondownGateway());
```
Pages/routes import from `@/composition/server` (never instantiate adapters). Tests build use-cases directly with the in-memory adapters.

Client:
```ts
// composition/client.ts
export const analytics: AnalyticsTracker =
  process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ? CloudflareTracker : NoopTracker;
export const comments: CommentsRenderer =
  hasGiscusEnv() ? GiscusRenderer : NoopRenderer;
```

## 6. Testing

- **Use-cases** (`core/application`) tested against `InMemoryContentRepository` with fixture data — covers list/sort/draft-filter/tag/featured logic that is **currently untested**.
- **`MdxContentRepository`** gets an integration test reading real `content/` fixtures — closes today's gap (`getAllPosts`/`getPostBySlug` have no tests).
- **Domain** keeps its existing pure tests (`parsePost`, `parseProject`, `filterPosts`) — moved to `core/domain` paths.
- **`ButtondownGateway`** tested against a mocked `fetch`; the subscribe use-case tested with `InMemorySubscriptionGateway` (no HTTP).
- Net: strictly more coverage than today, with faster, disk-free unit tests.

## 7. Migration plan (incremental, behavior-preserving)

Each slice is its own commit; the full Vitest suite + `tsc` + `lint` + `build` stay green after every slice:

1. **Scaffold + dependency-rule lint** — create `core/`, `adapters/`, `composition/` folders and add the ESLint boundary rule (no behavior change yet).
2. **Content slice** — move `posts.ts`/`projects.ts` domain (types, Zod, parsers, sort/filter) into `core/domain`; move fs reads into `MdxContentRepository`; define the port; add `InMemoryContentRepository`; wrap in use-cases; expose via `composition/server`; repoint blog/work pages, RSS, sitemap, OG images. Delete the old `lib/posts.ts`/`lib/projects.ts` once callers move.
3. **Newsletter slice** — extract Buttondown HTTP into `ButtondownGateway`; define the port; `subscribe` use-case; repoint `/api/subscribe`.
4. **Client ports slice** — wrap analytics + giscus behind their interfaces with `Noop` fallbacks; wire via `composition/client`; repoint layout + blog post page.
5. **Cleanup** — ensure `search.ts`, `site.ts`, `seo.ts` live in their final `core` locations; update imports; final full-gate pass.

## 8. Risks & call-outs

- **`server-only` guard:** server adapters use `fs`; mark `composition/server` and the MDX adapter with the `server-only` package so they can never be bundled into a client component (protects the 3 MiB Worker budget and prevents RSC leaks).
- **Footprint:** this touches most of `src/lib` and nearly every page's imports. It's a sizable refactor for a thin app — accepted deliberately for the testability/craft goals.
- **No DI container:** wiring is a composition root with plain interfaces (no `reflect-metadata`/decorators) — chosen to avoid bundle weight and RSC friction; this is the Next.js-idiomatic approach.
- **Client ports are lighter** than server ports (React-component-level abstraction), by nature of the widgets they wrap.

## 9. Out of scope (YAGNI)

- No DI container library. No runtime data-source switching beyond the test/in-memory adapters. No change to content authoring, routes, or visible behavior. No new features — this is purely structural.

## 10. Success criteria

- Identical site behavior (build output, pages, RSS, OG, newsletter) before/after.
- `core/**` provably free of framework/fs imports (ESLint rule passes; CI enforces).
- New tests for content use-cases + the MDX adapter; whole suite green; `tsc`, `lint`, `build` clean; Worker still under 3 MiB.
