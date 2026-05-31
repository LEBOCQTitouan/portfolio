import { describe, it, expect } from "vitest";
import { getNarration } from "./resolver";

describe("getNarration", () => {
  it("returns the lines for an exact static route", () => {
    const lines = getNarration("/about");
    expect(lines.map((l) => l.id)).toEqual(["intro", "experience", "skills"]);
  });

  it("resolves any /work/<slug> to the project template", () => {
    const lines = getNarration("/work/ledger-engine");
    expect(lines.map((l) => l.id)).toEqual(["project-header", "project-body"]);
  });

  it("treats /work (index) as its own route, not a slug", () => {
    expect(getNarration("/work").map((l) => l.id)).toEqual(["intro", "projects"]);
  });

  it("returns an empty array for routes with no narration", () => {
    expect(getNarration("/blog/some-post")).toEqual([]);
  });
});
