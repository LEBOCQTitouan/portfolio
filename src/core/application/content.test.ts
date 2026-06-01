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
  return makeContentUseCases(new InMemoryContentRepository({ en: { posts, projects } }), { includeDrafts });
}

describe("content use-cases", () => {
  it("listPosts sorts by date desc and hides drafts by default", () => {
    const c = uc([post({ slug: "old", date: "2026-01-01" }), post({ slug: "new", date: "2026-02-01" }), post({ slug: "d", draft: true })]);
    expect(c.listPosts("en").map((p) => p.slug)).toEqual(["new", "old"]);
  });
  it("listPosts includes drafts when includeDrafts is true", () => {
    const c = uc([post({ slug: "d", draft: true })], [], true);
    expect(c.listPosts("en").map((p) => p.slug)).toEqual(["d"]);
  });
  it("getPost returns a visible post, undefined for a hidden draft", () => {
    const c = uc([post({ slug: "a" }), post({ slug: "d", draft: true })]);
    expect(c.getPost("en", "a")?.slug).toBe("a");
    expect(c.getPost("en", "d")).toBeUndefined();
  });
  it("listPostMeta strips content", () => {
    const c = uc([post()]);
    expect("content" in c.listPostMeta("en")[0]).toBe(false);
  });
  it("listTags returns unique sorted tags of visible posts", () => {
    const c = uc([post({ tags: ["b", "a"] }), post({ slug: "2", tags: ["a", "c"] })]);
    expect(c.listTags("en")).toEqual(["a", "b", "c"]);
  });
  it("postsByTag filters visible posts", () => {
    const c = uc([post({ slug: "a", tags: ["x"] }), post({ slug: "b", tags: ["y"] })]);
    expect(c.postsByTag("en", "x").map((p) => p.slug)).toEqual(["a"]);
  });
  it("listProjects sorts; featuredProjects filters; getProject looks up", () => {
    const c = uc([], [project({ slug: "b", order: 2 }), project({ slug: "f", featured: true }), project({ slug: "a", order: 1 })]);
    expect(c.listProjects("en").map((p) => p.slug)).toEqual(["f", "a", "b"]);
    expect(c.featuredProjects("en").map((p) => p.slug)).toEqual(["f"]);
    expect(c.getProject("en", "a")?.slug).toBe("a");
  });
});
