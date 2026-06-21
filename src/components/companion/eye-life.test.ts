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
