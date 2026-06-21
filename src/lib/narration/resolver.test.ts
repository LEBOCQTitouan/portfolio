import { describe, it, expect } from "vitest";
import { getNarration } from "./resolver";

describe("getNarration", () => {
  it("returns the lines for an exact static route", () => {
    const lines = getNarration("/about", "en");
    expect(lines.map((l) => l.id)).toEqual(["intro", "experience", "skills"]);
  });

  it("resolves any /work/<slug> to the project template", () => {
    const lines = getNarration("/work/ledger-engine", "en");
    expect(lines.map((l) => l.id)).toEqual([
      "project-header", "section-1", "section-2", "section-3", "section-last",
    ]);
  });

  it("gives /work/<slug> the focused→calm→warm mood arc", () => {
    const lines = getNarration("/work/x", "en");
    expect(lines.map((l) => l.mood)).toEqual(["warm", "focused", "calm", "focused", "warm"]);
  });

  it("treats /work (index) as its own route, not a slug", () => {
    expect(getNarration("/work", "en").map((l) => l.id)).toEqual(["intro", "projects"]);
  });

  it("returns an empty array for routes with no narration", () => {
    expect(getNarration("/blog/some-post", "en")).toEqual([]);
  });

  // Locale prefix-stripping
  it("strips /fr prefix and returns fr map lines for /fr/about", () => {
    const lines = getNarration("/fr/about", "fr");
    expect(lines.map((l) => l.id)).toEqual(["intro", "experience", "skills"]);
  });

  it("strips /en prefix: /en resolves to /", () => {
    const lines = getNarration("/en", "en");
    expect(lines.map((l) => l.id)).toEqual(["hero", "pillars", "work", "writing", "contact"]);
  });

  it("strips /fr/ prefix from deeper paths", () => {
    const lines = getNarration("/fr/work/my-project", "fr");
    expect(lines.map((l) => l.id)).toEqual([
      "project-header", "section-1", "section-2", "section-3", "section-last",
    ]);
  });

  it("returns empty array for unknown locale-prefixed route", () => {
    expect(getNarration("/en/blog/some-post", "en")).toEqual([]);
  });
});
