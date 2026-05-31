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
