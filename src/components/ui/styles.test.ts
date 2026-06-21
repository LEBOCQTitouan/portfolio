import { describe, it, expect } from "vitest";
import { cardClass, panelClass } from "./styles";

describe("surface recipes", () => {
  it("cardClass is a rounded-card bg-card box with a hover lift", () => {
    const c = cardClass();
    expect(c).toContain("rounded-card");
    expect(c).toContain("bg-card");
    expect(c).toContain("border-border");
    expect(c).toContain("motion-safe:hover:-translate-y-0.5");
  });

  it("panelClass defaults to rounded-panel/bg-card/p-6", () => {
    const p = panelClass();
    expect(p).toContain("rounded-panel");
    expect(p).toContain("bg-card");
    expect(p).toContain("border-border");
    expect(p).toContain("p-6");
  });

  it("panelClass accent-soft variant drops bg-card for the accent-soft bed", () => {
    const p = panelClass({ variant: "accent-soft" });
    expect(p).toContain("border-accent/15");
    expect(p).toContain("var(--accent-soft)");
    expect(p).not.toContain("bg-card");
  });

  it("panelClass padding override replaces the default p-6", () => {
    const p = panelClass({ padding: "px-6 py-12" });
    expect(p).toContain("px-6 py-12");
    expect(p).not.toContain(" p-6");
  });
});
