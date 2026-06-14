import { describe, it, expect } from "vitest";
import { relativeLuminance, contrastRatio } from "./contrast";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is symmetric", () => {
    expect(contrastRatio("#0a66c2", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#0a66c2"),
      5,
    );
  });
  it("expands 3-digit hex equivalently to 6-digit", () => {
    expect(contrastRatio("f00", "#ff0000")).toBeCloseTo(1, 5);
  });
  it("throws on malformed hex", () => {
    expect(() => contrastRatio("nope", "#fff")).toThrow();
  });
});
