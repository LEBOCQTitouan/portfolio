import { describe, it, expect } from "vitest";
import { MOOD_COLORS, moodStyle } from "./moods";
import type { Mood } from "@/lib/narration/types";

describe("moodStyle", () => {
  const moods: Mood[] = ["calm", "warm", "focused"];

  it("defines colors for every mood", () => {
    for (const mood of moods) {
      expect(MOOD_COLORS[mood]).toBeDefined();
    }
  });

  it("builds a gradient background and glow for a mood", () => {
    const style = moodStyle("warm");
    expect(style.background).toContain(MOOD_COLORS.warm.mid);
    expect(style.background).toContain("radial-gradient");
    expect(style.boxShadow).toContain(MOOD_COLORS.warm.glow);
  });
});
