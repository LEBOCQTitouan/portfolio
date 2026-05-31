import { describe, it, expect } from "vitest";
import { filterPosts } from "./search";
import type { PostMeta } from "./post";

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
