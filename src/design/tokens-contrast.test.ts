import { describe, it, expect } from "vitest";
import { SUBJECTS, TOKENS, BACKGROUND } from "./tokens";
import { contrastRatio } from "./contrast";

const AA_NORMAL = 4.5;

describe("subject contrast contract (WCAG AA)", () => {
  it("on-accent is legible on the solid fill of every subject", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      expect(contrastRatio(t.onAccent, t.accentFill)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("on-accent is legible on EVERY gradient stop", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      for (const stop of t.gradientStops) {
        expect(contrastRatio(t.onAccent, stop)).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  it("accent text is legible on the page background in both modes", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      expect(contrastRatio(t.accent.light, BACKGROUND.light)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(t.accent.dark, BACKGROUND.dark)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});
