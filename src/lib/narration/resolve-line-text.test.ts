import { describe, it, expect } from "vitest";
import { resolveLineText } from "./resolve-line-text";

describe("resolveLineText", () => {
  it("uses the override when it is a non-empty string", () => {
    expect(resolveLineText("Custom line", "Fallback")).toBe("Custom line");
  });
  it("falls back when override is undefined", () => {
    expect(resolveLineText(undefined, "Fallback")).toBe("Fallback");
  });
  it("falls back when override is empty or whitespace", () => {
    expect(resolveLineText("", "Fallback")).toBe("Fallback");
    expect(resolveLineText("   ", "Fallback")).toBe("Fallback");
  });
  it("preserves the override's own surrounding spaces when it has content", () => {
    expect(resolveLineText(" Custom ", "Fallback")).toBe(" Custom ");
  });
});
