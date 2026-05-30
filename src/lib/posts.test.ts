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
