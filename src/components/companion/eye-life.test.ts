import { describe, it, expect } from "vitest";
import { BLINK, blinkTransform } from "./eye-life";

describe("blinkTransform", () => {
  it("is fully open at elapsed 0 and not done", () => {
    const b = blinkTransform(0, "open");
    expect(b.scaleY).toBeCloseTo(1, 3);
    expect(b.scaleX).toBeCloseTo(1, 3);
    expect(b.done).toBe(false);
  });

  it("reaches the slit (not a flat line) while held shut", () => {
    const mid = (BLINK.closeMs + BLINK.holdMs) / 2 + BLINK.closeMs / 2; // inside hold
    const b = blinkTransform(BLINK.closeMs + 1, "open");
    expect(b.scaleY).toBeCloseTo(BLINK.minY, 2);
    expect(b.scaleY).toBeGreaterThan(0.05); // slit, never a knife edge
    expect(b.scaleX).toBeGreaterThan(1); // width bulges (squash)
    expect(mid).toBeGreaterThan(0);
  });

  it("closes faster than it opens (asymmetric)", () => {
    // halfway-closed point happens before halfway-open point in time
    const quarterClose = blinkTransform(BLINK.closeMs * 0.5, "open").scaleY;
    const quarterOpen = blinkTransform(BLINK.closeMs + BLINK.holdMs + BLINK.openMs * 0.5, "open").scaleY;
    expect(quarterClose).toBeLessThan(1);
    expect(quarterOpen).toBeGreaterThan(BLINK.minY);
  });

  it("overshoots past full height during reopen", () => {
    let maxY = 0;
    for (let t = BLINK.closeMs + BLINK.holdMs; t <= BLINK.totalMs; t += 2) {
      maxY = Math.max(maxY, blinkTransform(t, "open").scaleY);
    }
    expect(maxY).toBeGreaterThan(1.0); // settle-from-overshoot
  });

  it("returns to rest and reports done at total duration", () => {
    const b = blinkTransform(BLINK.totalMs, "open");
    expect(b.scaleY).toBeCloseTo(1, 2);
    expect(b.scaleX).toBeCloseTo(1, 2);
    expect(b.done).toBe(true);
  });

  it("collapses less for an already-narrow squint eye", () => {
    const open = blinkTransform(BLINK.closeMs + 1, "open").scaleY;
    const squint = blinkTransform(BLINK.closeMs + 1, "squint").scaleY;
    expect(squint).toBeGreaterThan(open);
  });
});

import {
  EYE_GAZE_PX, SACCADE, STARTLE_AMP, FOCUS_SCALE,
  nextBlinkDelay, wantsDoubleBlink, saccadeTarget, saccadeIntensity,
  blinkAllowed, focusScale,
} from "./eye-life";

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("nextBlinkDelay", () => {
  it("stays within 3–6s for the rand range", () => {
    expect(nextBlinkDelay(() => 0)).toBeCloseTo(3000, 0);
    expect(nextBlinkDelay(() => 0.999)).toBeLessThan(6000);
    expect(nextBlinkDelay(() => 0.999)).toBeGreaterThanOrEqual(3000);
  });
});

describe("wantsDoubleBlink", () => {
  it("fires only in the low ~10% of the rand range", () => {
    expect(wantsDoubleBlink(() => 0.05)).toBe(true);
    expect(wantsDoubleBlink(() => 0.5)).toBe(false);
    expect(wantsDoubleBlink(() => 0.1)).toBe(false);
  });
});

describe("saccadeTarget", () => {
  it("scales amplitude with intensity (reading < idle)", () => {
    const reading = saccadeTarget(seq([0, 1]), 0.35);
    const idle = saccadeTarget(seq([0, 1]), 1);
    expect(Math.hypot(idle.x, idle.y)).toBeGreaterThan(Math.hypot(reading.x, reading.y));
  });

  it("stays within the amplitude envelope", () => {
    for (let i = 0; i < 50; i++) {
      const r = seq([i / 50, ((i * 7) % 50) / 50]);
      const t = saccadeTarget(r, 1);
      expect(Math.hypot(t.x, t.y)).toBeLessThanOrEqual(SACCADE.ampPx + 1e-6);
    }
  });
});

describe("saccadeIntensity", () => {
  it("is calmer right after a scroll than when idle", () => {
    expect(saccadeIntensity(200)).toBeLessThan(saccadeIntensity(5000));
    expect(saccadeIntensity(5000)).toBe(1);
    expect(saccadeIntensity(1200)).toBe(1);
    expect(saccadeIntensity(1199)).toBe(0.35);
  });
});

describe("blinkAllowed", () => {
  it("blinks only in alert-open states", () => {
    expect(blinkAllowed("active", "open")).toBe(true);
    expect(blinkAllowed("active", "happy")).toBe(true);
    expect(blinkAllowed("active", "squint")).toBe(true); // focused mood
    expect(blinkAllowed("sleepy", "open")).toBe(true);
    expect(blinkAllowed("annoyed", "squint")).toBe(false);
    expect(blinkAllowed("angry", "angry")).toBe(false);
    expect(blinkAllowed("asleep", "closed")).toBe(false);
    expect(blinkAllowed("sleeping", "closed")).toBe(false);
  });
});

describe("focusScale", () => {
  it("narrows on hover, rests otherwise", () => {
    expect(focusScale(true)).toBeCloseTo(FOCUS_SCALE, 3);
    expect(focusScale(false)).toBe(1);
    expect(EYE_GAZE_PX).toBeGreaterThan(0);
    expect(STARTLE_AMP).toBeGreaterThan(0);
  });
});
