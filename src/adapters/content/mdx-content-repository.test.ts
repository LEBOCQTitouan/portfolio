import { describe, it, expect } from "vitest";
import { MdxContentRepository } from "./mdx-content-repository";

describe("MdxContentRepository (real content/)", () => {
  const repo = new MdxContentRepository();

  it("listPosts('en') reads and parses posts from disk", () => {
    const posts = repo.listPosts("en");
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      expect(p.slug).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.readingTimeMinutes).toBeGreaterThanOrEqual(1);
      expect(typeof p.content).toBe("string");
    }
  });

  it("listPosts('fr') returns same slugs as 'en' (full EN fallback, no content/fr yet)", () => {
    const enSlugs = repo.listPosts("en").map((p) => p.slug).sort();
    const frSlugs = repo.listPosts("fr").map((p) => p.slug).sort();
    expect(frSlugs).toEqual(enSlugs);
    expect(frSlugs.length).toBeGreaterThan(0);
  });

  it("listProjects('en') reads and parses projects from disk", () => {
    const projects = repo.listProjects("en");
    expect(projects.length).toBeGreaterThan(0);
    for (const p of projects) {
      expect(p.slug).toBeTruthy();
      expect(["systems", "interface", "both"]).toContain(p.category);
    }
  });

  it("listProjects('fr') returns same slugs as 'en' (full EN fallback)", () => {
    const enSlugs = repo.listProjects("en").map((p) => p.slug).sort();
    const frSlugs = repo.listProjects("fr").map((p) => p.slug).sort();
    expect(frSlugs).toEqual(enSlugs);
    expect(frSlugs.length).toBeGreaterThan(0);
  });
});
