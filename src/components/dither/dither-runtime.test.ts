import { describe, it, expect } from "vitest";
import { computeBackingSize, resolvePrecision, precisionToCell } from "@/components/dither/dither-runtime";

describe("computeBackingSize", () => {
  it("multiplies by dpr, clamped to maxDpr", () => {
    expect(computeBackingSize(100, 50, 2)).toEqual({ width: 200, height: 100 });
    expect(computeBackingSize(100, 50, 3, 2)).toEqual({ width: 200, height: 100 });
    expect(computeBackingSize(100, 50, 1.5, 2)).toEqual({ width: 150, height: 75 });
  });
  it("never returns zero", () => {
    expect(computeBackingSize(0, 0, 2)).toEqual({ width: 1, height: 1 });
  });
});

describe("resolvePrecision", () => {
  it("stays within [0,1] and is larger when hovered", () => {
    const opts = { ambient: 0.2, hover: 0.6, speed: 1 };
    const rest = resolvePrecision(opts, 1570, false); // sin peak near here
    const hov = resolvePrecision(opts, 1570, true);
    expect(rest).toBeGreaterThanOrEqual(0);
    expect(hov).toBeLessThanOrEqual(1);
    expect(hov).toBeGreaterThanOrEqual(rest);
  });
});

describe("precisionToCell", () => {
  it("returns the base cell at full precision and coarser at low precision", () => {
    expect(precisionToCell(2, 1)).toBe(2);
    expect(precisionToCell(2, 0, 4)).toBe(6);
    expect(precisionToCell(2, 0.5, 4)).toBe(4);
  });
  it("never returns less than 1", () => {
    expect(precisionToCell(1, 1, 0)).toBe(1);
  });
});
