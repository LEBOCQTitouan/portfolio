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
