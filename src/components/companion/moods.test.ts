import { describe, it, expect } from "vitest";
import { MOOD_PARAMS, moodParams } from "./moods";
import type { Mood } from "@/lib/narration/types";

describe("moodParams", () => {
  const moods: Mood[] = ["calm", "warm", "focused"];

  it("defines params for every mood", () => {
    for (const m of moods) expect(MOOD_PARAMS[m]).toBeDefined();
  });

  it("maps each mood to an eye shape and a flow speed", () => {
    expect(moodParams("calm").eye).toBe("open");
    expect(moodParams("warm").eye).toBe("happy");
    expect(moodParams("focused").eye).toBe("squint");
    for (const m of moods) expect(moodParams(m).flowMs).toBeGreaterThan(0);
  });
});
