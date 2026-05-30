import { describe, it, expect } from "vitest";
import { parseProject } from "@/lib/projects";

const raw = `---
title: Ledger Engine
summary: A distributed double-entry ledger handling 10k tx/sec.
role: Lead backend engineer
stack: [Go, Postgres, Kafka]
category: systems
featured: true
order: 1
links:
  repo: https://github.com/example/ledger
  demo: https://ledger.example.com
---

## Overview

The ledger body content.
`;

describe("parseProject", () => {
  it("parses and validates frontmatter, deriving slug", () => {
    const p = parseProject(raw, "ledger-engine");
    expect(p.slug).toBe("ledger-engine");
    expect(p.title).toBe("Ledger Engine");
    expect(p.role).toBe("Lead backend engineer");
    expect(p.stack).toEqual(["Go", "Postgres", "Kafka"]);
    expect(p.category).toBe("systems");
    expect(p.featured).toBe(true);
    expect(p.order).toBe(1);
    expect(p.links.repo).toBe("https://github.com/example/ledger");
    expect(p.links.demo).toBe("https://ledger.example.com");
  });

  it("separates the MDX body from frontmatter", () => {
    const p = parseProject(raw, "ledger-engine");
    expect(p.content).toContain("## Overview");
    expect(p.content).not.toContain("title: Ledger Engine");
  });

  it("applies defaults for optional fields", () => {
    const minimal = `---\ntitle: Tiny\nsummary: A small thing.\nrole: Solo\ncategory: interface\n---\n\nBody.`;
    const p = parseProject(minimal, "tiny");
    expect(p.stack).toEqual([]);
    expect(p.featured).toBe(false);
    expect(p.order).toBe(0);
    expect(p.links).toEqual({});
  });

  it("throws (with slug) when category is invalid", () => {
    const bad = `---\ntitle: X\nsummary: x\nrole: x\ncategory: frontend\n---\n\nBody.`;
    expect(() => parseProject(bad, "x")).toThrow(/project "x"/);
  });

  it("throws (with slug) when a required field is missing", () => {
    const bad = `---\nsummary: no title\nrole: x\ncategory: both\n---\n\nBody.`;
    expect(() => parseProject(bad, "notitle")).toThrow(/project "notitle"/);
  });
});
