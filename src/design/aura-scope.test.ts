import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("aura/companion subject is page-scoped, not card-scoped", () => {
  it("every .page-aura recolor rule keys off data-page-subject", () => {
    const auraRules = css.match(/^.*\.page-aura\s*\{[^}]*\}\s*$/gm) ?? [];
    const recolor = auraRules.filter((r) => r.includes("has("));
    expect(recolor.length).toBeGreaterThanOrEqual(3); // systems/interface/ai per mode
    for (const r of recolor) {
      expect(r).toContain("data-page-subject");
      expect(r).not.toContain("[data-subject");
    }
  });

  it("every --subject-accent lift rule keys off data-page-subject", () => {
    const lift = (css.match(/^body:has\([^)]*\)\s*\{[^}]*--subject-accent[^}]*\}/gm) ?? [])
      .concat(css.match(/^\.dark body:has\([^)]*\)\s*\{[^}]*--subject-accent[^}]*\}/gm) ?? []);
    expect(lift.length).toBeGreaterThanOrEqual(3);
    for (const r of lift) {
      expect(r).toContain("data-page-subject");
      expect(r).not.toContain("[data-subject");
    }
  });

  it("detail pages set data-page-subject; cards do not", () => {
    expect(read("src/app/[lang]/work/[slug]/page.tsx")).toContain("data-page-subject");
    expect(read("src/app/[lang]/blog/[slug]/page.tsx")).toContain("data-page-subject");
    expect(read("src/components/project-card.tsx")).not.toContain("data-page-subject");
    expect(read("src/components/post-card.tsx")).not.toContain("data-page-subject");
  });
});
