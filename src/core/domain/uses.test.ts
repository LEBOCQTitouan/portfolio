import { describe, it, expect } from "vitest";
import { z } from "zod";
import { uses, getUses, usesCategorySchema } from "./uses";
import { locales } from "@/core/domain/locale";

describe("usesCategorySchema", () => {
  const valid = { title: "T", items: [{ name: "N", why: "W" }] };

  it("accepts a well-formed category", () => {
    expect(() => usesCategorySchema.parse(valid)).not.toThrow();
  });
  it("rejects an empty name", () => {
    expect(() => usesCategorySchema.parse({ title: "T", items: [{ name: "", why: "W" }] })).toThrow();
  });
  it("rejects an empty why", () => {
    expect(() => usesCategorySchema.parse({ title: "T", items: [{ name: "N", why: "" }] })).toThrow();
  });
  it("rejects a category with no items", () => {
    expect(() => usesCategorySchema.parse({ title: "T", items: [] })).toThrow();
  });
});

describe("uses content", () => {
  it("is valid for every locale", () => {
    for (const locale of locales) {
      expect(() => z.array(usesCategorySchema).parse(uses[locale])).not.toThrow();
    }
  });
  it("getUses returns the array for a locale", () => {
    expect(getUses("en")).toBe(uses.en);
  });
});

describe("locale parity", () => {
  it("en and fr have identical structure (category count, order, item counts)", () => {
    expect(uses.fr.length).toBe(uses.en.length);
    uses.en.forEach((cat, i) => {
      expect(uses.fr[i].items.length).toBe(cat.items.length);
      // tool names are identical across locales
      expect(uses.fr[i].items.map((x) => x.name)).toEqual(cat.items.map((x) => x.name));
    });
  });
});
