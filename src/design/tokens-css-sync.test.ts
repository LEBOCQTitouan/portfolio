import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TOKENS } from "./tokens";

// globals.css hand-mirrors the token values. These tests bind the two so a
// change to one without the other fails CI — the `ai` fill already drifted
// once (a base color was painted but never contrast-tested). See tokens.ts.
const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Lowercased 6-digit hex colors found in a CSS snippet. */
function hexes(s: string): Set<string> {
  return new Set((s.match(/#[0-9a-fA-F]{6}/g) ?? []).map((h) => h.toLowerCase()));
}

describe("tokens.ts ↔ globals.css stay in sync", () => {
  it("--ai-deep paints exactly the colors in TOKENS.ai.gradientStops", () => {
    const m = css.match(/--ai-deep:([\s\S]*?);\s*\n/);
    expect(m, "could not find --ai-deep in globals.css").toBeTruthy();
    const painted = hexes(m![1]); // sheen layer is rgba(white), excluded
    const declared = new Set(TOKENS.ai.gradientStops.map((s) => s.toLowerCase()));
    expect(painted).toEqual(declared);
  });

  it("each subject's accent-fill hex appears in globals.css", () => {
    for (const id of Object.keys(TOKENS) as (keyof typeof TOKENS)[]) {
      const fill = TOKENS[id].accentFill.toLowerCase();
      expect(css.toLowerCase(), `${id}.accentFill missing from globals.css`).toContain(fill);
    }
  });
});
