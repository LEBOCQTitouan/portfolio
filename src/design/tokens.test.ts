import { describe, it, expect } from "vitest";
import { SUBJECTS, TOKENS, type SubjectId } from "./tokens";

describe("tokens", () => {
  it("lists the four subjects", () => {
    expect(SUBJECTS).toEqual(["brand", "systems", "interface", "ai"]);
  });

  it("fully specifies every subject", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      expect(t.accent.light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accent.dark).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accentFill).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.onAccent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accentSoft.light).toMatch(/^rgba\(/);
      expect(t.accentSoft.dark).toMatch(/^rgba\(/);
      expect(Array.isArray(t.gradientStops)).toBe(true);
      expect(t.gradientStops.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("AI is the only multi-stop gradient subject", () => {
    expect(TOKENS.ai.gradientStops.length).toBeGreaterThan(1);
    for (const id of ["brand", "systems", "interface"] as SubjectId[]) {
      expect(TOKENS[id].gradientStops.length).toBe(1);
    }
  });
});
