import { describe, it, expect } from "vitest";
import { resolveSubject } from "./subject";

describe("resolveSubject", () => {
  it("maps project categories", () => {
    expect(resolveSubject({ category: "systems" })).toBe("systems");
    expect(resolveSubject({ category: "interface" })).toBe("interface");
  });
  it("maps category 'both' to brand (blend deferred)", () => {
    expect(resolveSubject({ category: "both" })).toBe("brand");
  });
  it("maps known tags, case-insensitively", () => {
    expect(resolveSubject({ tags: ["LLM"] })).toBe("ai");
    expect(resolveSubject({ tags: ["architecture"] })).toBe("systems");
    expect(resolveSubject({ tags: ["UI"] })).toBe("interface");
  });
  it("prioritises ai > systems > interface when tags overlap", () => {
    expect(resolveSubject({ tags: ["ui", "ai", "backend"] })).toBe("ai");
    expect(resolveSubject({ tags: ["ui", "backend"] })).toBe("systems");
  });
  it("falls back to brand for unknown tags or empty input", () => {
    expect(resolveSubject({ tags: ["cooking"] })).toBe("brand");
    expect(resolveSubject({})).toBe("brand");
  });
  it("prefers category over tags when both present", () => {
    expect(resolveSubject({ category: "interface", tags: ["ai"] })).toBe("interface");
  });
});
