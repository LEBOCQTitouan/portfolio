import { describe, it, expect } from "vitest";
import { scrollProgress, interpolateOrb, HERO_HOME, gutterTargetPercent, COMPANION_SIZE } from "./hero-phase";

describe("scrollProgress", () => {
  it("is 0 at the top and 1 once scrolled a full hero height", () => {
    expect(scrollProgress(0, 800)).toBe(0);
    expect(scrollProgress(800, 800)).toBe(1);
  });
  it("clamps to [0,1] and is linear in between", () => {
    expect(scrollProgress(400, 800)).toBe(0.5);
    expect(scrollProgress(2000, 800)).toBe(1);
    expect(scrollProgress(-50, 800)).toBe(0);
  });
  it("returns 0 for a zero/unknown hero height", () => {
    expect(scrollProgress(100, 0)).toBe(0);
  });
});

describe("interpolateOrb", () => {
  const travel = { x: 30, y: 50 };
  it("at p=0 returns the hero-home aura (large, blurred, behind, no bubble)", () => {
    const g = interpolateOrb(0, travel);
    expect(g.size).toBe(HERO_HOME.size);
    expect(g.x).toBe(HERO_HOME.x);
    expect(g.y).toBe(HERO_HOME.y);
    expect(g.bubble).toBe(false);
    expect(g.front).toBe(false);
    expect(g.blur).toBeGreaterThan(0);
  });
  it("at p=1 returns the small foreground companion at the travel anchor", () => {
    const g = interpolateOrb(1, travel);
    expect(g.size).toBe(92);
    expect(g.x).toBe(30);
    expect(g.y).toBe(50);
    expect(g.blur).toBe(0);
    expect(g.opacity).toBe(1);
    expect(g.bubble).toBe(true);
    expect(g.front).toBe(true);
  });
  it("interpolates size linearly at the midpoint", () => {
    const g = interpolateOrb(0.5, travel);
    expect(g.size).toBeCloseTo((HERO_HOME.size + 92) / 2);
  });
});

describe("gutterTargetPercent", () => {
  it("exports COMPANION_SIZE as a positive number", () => {
    expect(COMPANION_SIZE).toBeGreaterThan(0);
  });
  it("places x near the right edge (in the gutter)", () => {
    const { x } = gutterTargetPercent(1280, 800, { top: 100, height: 200 });
    expect(x).toBeGreaterThan(90); // right gutter
    expect(x).toBeLessThan(100);
  });
  it("y tracks the section's vertical center as a viewport %", () => {
    const { y } = gutterTargetPercent(1280, 800, { top: 300, height: 200 }); // center 400 of 800 = 50%
    expect(y).toBeCloseTo(50);
  });
  it("clamps y so the orb stays on screen", () => {
    expect(gutterTargetPercent(1280, 800, { top: -500, height: 100 }).y).toBe(12); // MIN
    expect(gutterTargetPercent(1280, 800, { top: 2000, height: 100 }).y).toBe(88); // MAX
  });
  it("falls back to mid-screen when no rect / zero viewport", () => {
    expect(gutterTargetPercent(1280, 800, null).y).toBe(50);
    expect(gutterTargetPercent(0, 0, null)).toEqual({ x: 90, y: 50 });
  });
});
