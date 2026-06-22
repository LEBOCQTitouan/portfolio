import { describe, it, expect } from "vitest";
import {
  genBayerMatrix, luminance, applyContrast, orderedTone, ditherFrame, parseRgb,
} from "@/components/dither/dither-math";
import type { DitherFrame, DitherParams } from "@/components/dither/types";

describe("genBayerMatrix", () => {
  it("builds the canonical 2x2 matrix", () => {
    expect(genBayerMatrix(2)).toEqual([[0, 2], [3, 1]]);
  });
  it("builds a 4x4 matrix with values 0..15", () => {
    const m = genBayerMatrix(4).flat().sort((a, b) => a - b);
    expect(m).toEqual([...Array(16).keys()]);
  });
});

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1, 5);
  });
});

describe("applyContrast", () => {
  it("pushes values away from 0.5 and clamps", () => {
    expect(applyContrast(0.5, 2)).toBeCloseTo(0.5, 5);
    expect(applyContrast(0.75, 2)).toBeCloseTo(1, 5);
    expect(applyContrast(1, 5)).toBe(1);
    expect(applyContrast(0, 5)).toBe(0);
  });
});

describe("orderedTone", () => {
  it("is binary for 2 levels", () => {
    expect(orderedTone(0.9, 2, 0.5)).toBe(1);
    expect(orderedTone(0.1, 2, 0.5)).toBe(0);
  });
  it("returns intermediate steps for >2 levels", () => {
    // 4 levels => steps at 0, 1/3, 2/3, 1
    expect(orderedTone(0.0, 4, 0.5)).toBeCloseTo(0, 5);
    expect(orderedTone(1.0, 4, 0.5)).toBeCloseTo(1, 5);
  });
});

describe("ditherFrame", () => {
  it("maps a 2x2 mid-grey frame to ink/paper per the bayer threshold", () => {
    // all pixels mid-grey (128) -> lum ~0.5; bayer 2x2 thresholds vary -> mix of ink/paper
    const data = new Uint8ClampedArray(2 * 2 * 4);
    for (let i = 0; i < data.length; i += 4) { data[i] = 128; data[i + 1] = 128; data[i + 2] = 128; data[i + 3] = 255; }
    const frame: DitherFrame = { data, width: 2, height: 2 };
    const params: DitherParams = {
      pattern: "bayer", levels: 2, cellSize: 1, threshold: 0.5, contrast: 1,
      ink: [0, 0, 0], paper: [255, 255, 255],
    };
    ditherFrame(frame, params);
    // every output pixel must be pure black or pure white
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      expect(v === 0 || v === 255).toBe(true);
      expect(data[i + 1]).toBe(v);
      expect(data[i + 2]).toBe(v);
    }
    // and not ALL the same (the bayer matrix splits mid-grey)
    const first = data[0];
    const mixed = [0, 4, 8, 12].some((o) => data[o] !== first);
    expect(mixed).toBe(true);
  });
});

describe("parseRgb", () => {
  it("parses rgb() and rgba() strings", () => {
    expect(parseRgb("rgb(16, 30, 56)", [0, 0, 0])).toEqual([16, 30, 56]);
    expect(parseRgb("rgba(255, 0, 10, 0.5)", [0, 0, 0])).toEqual([255, 0, 10]);
  });
  it("returns the fallback for unparseable input", () => {
    expect(parseRgb("var(--nope)", [1, 2, 3])).toEqual([1, 2, 3]);
  });
});
