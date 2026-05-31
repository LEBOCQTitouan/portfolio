import { describe, it, expect } from "vitest";
import { pickActiveSection } from "./active-section";

describe("pickActiveSection", () => {
  it("returns the id with the highest visibility ratio", () => {
    expect(pickActiveSection({ a: 0.1, b: 0.8, c: 0.3 })).toBe("b");
  });

  it("returns null when nothing is visible", () => {
    expect(pickActiveSection({ a: 0, b: 0 })).toBeNull();
  });

  it("returns null for an empty map", () => {
    expect(pickActiveSection({})).toBeNull();
  });

  it("returns the first-encountered id when two sections tie", () => {
    expect(pickActiveSection({ a: 0.5, b: 0.5 })).toBe("a");
  });
});
