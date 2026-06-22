// src/components/blueprint/geometry.test.ts
import { describe, it, expect } from "vitest";
import {
  alignedOriginX, distToRect, suppression, warpOffset, convergeOffset, rasterBlock, DPR_CAP,
} from "./geometry";
import { BP } from "@/design/blueprint";

describe("alignedOriginX", () => {
  it("places a grid line at the viewport centre", () => {
    const ox = alignedOriginX(1440, BP.PITCH);
    expect((720 - ox) % BP.PITCH).toBeCloseTo(0, 6); // centre is on a line
  });
  it("makes the 768 column edges land on MAJOR lines", () => {
    const ox = alignedOriginX(1440, BP.PITCH * BP.MAJOR);
    const major = BP.PITCH * BP.MAJOR; // 192
    for (const edge of [720 - 384, 720 + 384]) {
      expect((edge - ox) % major).toBeCloseTo(0, 6);
    }
  });
});

describe("distToRect", () => {
  const r = { l: 100, t: 100, r: 200, b: 200 };
  it("is 0 inside", () => expect(distToRect(150, 150, r)).toBe(0));
  it("measures orthogonal distance outside", () => expect(distToRect(100, 80, r)).toBeCloseTo(20, 6));
  it("measures corner distance", () => expect(distToRect(97, 96, r)).toBeCloseTo(5, 6));
});

describe("suppression", () => {
  const clears = [{ l: 100, t: 100, r: 200, b: 200, m: 20 }];
  it("is 1 inside the rect", () => expect(suppression(150, 150, clears)).toBe(1));
  it("is 0 beyond the margin", () => expect(suppression(150, 70, clears)).toBe(0));
  it("ramps linearly across the margin", () => expect(suppression(150, 90, clears)).toBeCloseTo(0.5, 6));
});

describe("warpOffset", () => {
  it("is zero when amplitude is zero", () => {
    expect(warpOffset(0, 0, 100, 0, 0, BP.warp)).toEqual({ dx: 0, dy: 0 });
  });
  it("points toward the cursor and stays within strength", () => {
    const w = warpOffset(0, 0, 100, 0, 1, BP.warp);
    expect(w.dx).toBeGreaterThan(0);
    expect(Math.abs(w.dx)).toBeLessThanOrEqual(BP.warp.strength + 1e-9);
  });
  it("is zero beyond reach", () => {
    expect(warpOffset(0, 0, BP.warp.reach + 50, 0, 1, BP.warp)).toEqual({ dx: 0, dy: 0 });
  });
});

describe("convergeOffset", () => {
  it("has no influence beyond the radius", () => {
    const c = convergeOffset(0, 0, BP.converge.radius + 10, 0, 1, BP.converge);
    expect(c.infl).toBe(0);
  });
  it("influence rises toward the cursor", () => {
    const c = convergeOffset(0, 0, 10, 0, 1, BP.converge);
    expect(c.infl).toBeGreaterThan(0);
    expect(c.infl).toBeLessThanOrEqual(1);
    expect(c.dx).toBeGreaterThan(0);
  });
  it("is inert when over=0", () => {
    expect(convergeOffset(0, 0, 10, 0, 0, BP.converge)).toEqual({ dx: 0, dy: 0, infl: 0 });
  });
});

describe("rasterBlock", () => {
  it("is sharp (1) when fully resolved", () => expect(rasterBlock(1, 18)).toBeCloseTo(1, 6));
  it("is coarsest at progress 0", () => expect(rasterBlock(0, 18)).toBeCloseTo(18, 6));
  it("caps DPR sanity", () => expect(DPR_CAP).toBe(2));
});
