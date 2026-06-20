import { describe, it, expect } from "vitest";
import { parseProject, sortProjects, type Project } from "./project";

const make = (over: Partial<Project> = {}): Project => ({
  slug: "s", title: "T", summary: "S", role: "R", stack: [], category: "systems",
  links: {}, metrics: [], featured: false, order: 0, content: "b", ...over,
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
  it("parses metrics", () => {
    const p = parseProject(
      { title: "T", summary: "S", role: "R", category: "systems",
        metrics: [{ value: "12ms", label: "p99 latency" }] },
      "b", "x",
    );
    expect(p.metrics).toEqual([{ value: "12ms", label: "p99 latency" }]);
  });
  it("defaults metrics to an empty array", () => {
    const p = parseProject({ title: "T", summary: "S", role: "R", category: "systems" }, "b", "x");
    expect(p.metrics).toEqual([]);
  });
  it("rejects more than four metrics", () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ value: `${i}`, label: `l${i}` }));
    expect(() =>
      parseProject({ title: "T", summary: "S", role: "R", category: "systems", metrics: five }, "b", "x"),
    ).toThrow(/project "x"/);
  });
});

describe("sortProjects", () => {
  it("orders featured first, then by order, then title", () => {
    const out = sortProjects([
      make({ slug: "b", order: 2 }), make({ slug: "feat", featured: true }), make({ slug: "a", order: 1 }),
    ]);
    expect(out.map((p) => p.slug)).toEqual(["feat", "a", "b"]);
  });
  it("breaks ties on title via localeCompare", () => {
    const out = sortProjects([make({ slug: "b", order: 0, title: "B" }), make({ slug: "a", order: 0, title: "A" })]);
    expect(out.map((p) => p.slug)).toEqual(["a", "b"]);
  });
});
