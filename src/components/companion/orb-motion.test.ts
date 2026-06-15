import { describe, it, expect } from "vitest";
import { MOTION, stepSpring, hoverOffset, stepSquash } from "./orb-motion";

describe("stepSpring", () => {
  it("converges to the target and settles (velocity → ~0)", () => {
    let s = { pos: 0, vel: 0 };
    for (let i = 0; i < 600; i++) s = stepSpring(s, 100, 1 / 60);
    expect(s.pos).toBeCloseTo(100, 1);
    expect(Math.abs(s.vel)).toBeLessThan(0.5);
  });

  it("is under-damped at the default preset (overshoots the target at least once)", () => {
    let s = { pos: 0, vel: 0 };
    let overshot = false;
    for (let i = 0; i < 600; i++) {
      s = stepSpring(s, 100, 1 / 60);
      if (s.pos > 100.5) overshot = true;
    }
    expect(overshot).toBe(true);
  });
});

describe("hoverOffset", () => {
  it("stays within ±hoverAmp on both axes", () => {
    for (let t = 0; t < 60000; t += 123) {
      const { x, y } = hoverOffset(t);
      expect(Math.abs(x)).toBeLessThanOrEqual(MOTION.hoverAmp + 1e-6);
      expect(Math.abs(y)).toBeLessThanOrEqual(MOTION.hoverAmp + 1e-6);
    }
  });

  it("is not a degenerate line (x and y differ over time)", () => {
    const a = hoverOffset(1000);
    const b = hoverOffset(4000);
    expect(a.x).not.toBeCloseTo(a.y, 3);
    expect(a.x).not.toBeCloseTo(b.x, 3);
  });
});

describe("stepSquash", () => {
  it("is volume-preserving: scaleX * scaleY ≈ 1", () => {
    const r = stepSquash(2000, 0, 0, 1 / 60);
    expect(r.scaleX * r.scaleY).toBeCloseTo(1, 5);
  });

  it("stays bounded by squashMax even for extreme velocity", () => {
    // Drive hard for many frames so the low-pass reaches its ceiling.
    let sq = 0, ln = 0, last = { scaleX: 1, scaleY: 1, tilt: 0, smoothSquash: 0, smoothLean: 0 };
    for (let i = 0; i < 240; i++) {
      last = stepSquash(1e9, sq, ln, 1 / 60);
      sq = last.smoothSquash; ln = last.smoothLean;
    }
    expect(last.smoothSquash).toBeLessThanOrEqual(MOTION.squashMax + 1e-6);
    expect(last.scaleY).toBeLessThanOrEqual(1 + MOTION.squashMax + 1e-6);
  });

  it("returns no deformation at zero velocity from rest", () => {
    const r = stepSquash(0, 0, 0, 1 / 60);
    expect(r.scaleX).toBeCloseTo(1, 6);
    expect(r.scaleY).toBeCloseTo(1, 6);
    expect(r.tilt).toBeCloseTo(0, 6);
  });
});
