import { describe, it, expect } from "vitest";
import { SUBJECTS, TOKENS, BACKGROUND, FOREGROUND } from "./tokens";
import { contrastRatio } from "./contrast";

const AA_NORMAL = 4.5;

/** Composite an "rgba(r,g,b,a)" overlay over a solid hex base → resulting hex. */
function flattenRgbaOverHex(rgba: string, baseHex: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!m) throw new Error(`bad rgba: ${rgba}`);
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const base = baseHex.replace(/^#/, "");
  const br = parseInt(base.slice(0, 2), 16);
  const bg = parseInt(base.slice(2, 4), 16);
  const bb = parseInt(base.slice(4, 6), 16);
  const mix = (o: number, bse: number) => Math.round(o * a + bse * (1 - a));
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(mix(r, br))}${hex(mix(g, bg))}${hex(mix(b, bb))}`;
}

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

  it("AI gradient TEXT stops are legible on the page background per mode", () => {
    const t = TOKENS.ai;
    if (!t.textGradient) throw new Error("expected ai.textGradient to be defined");
    for (const stop of t.textGradient.light) {
      expect(contrastRatio(stop, BACKGROUND.light)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
    for (const stop of t.textGradient.dark) {
      expect(contrastRatio(stop, BACKGROUND.dark)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  // Only the flat aura tint is gated here. The radial glow peaks at "85% -10%"
  // (above the content fold) and fades to near-zero over the reading column, so
  // it can't lower text contrast in practice. If the glow is ever moved nearer
  // content or made denser, add a glow-composited assertion alongside this one.
  it("body text stays legible over the aura tint in both modes", () => {
    for (const id of SUBJECTS) {
      const a = TOKENS[id].aura;
      const overLight = flattenRgbaOverHex(a.tint.light, BACKGROUND.light);
      const overDark = flattenRgbaOverHex(a.tint.dark, BACKGROUND.dark);
      expect(contrastRatio(FOREGROUND.light, overLight)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(FOREGROUND.dark, overDark)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});
