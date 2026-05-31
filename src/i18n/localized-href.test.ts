import { describe, it, expect } from "vitest";
import { localizedHref } from "./localized-href";

describe("localizedHref", () => {
  it('prefixes /work with fr', () => {
    expect(localizedHref("fr", "/work")).toBe("/fr/work");
  });

  it('handles root path for en', () => {
    expect(localizedHref("en", "/")).toBe("/en");
  });

  it('prefixes nested blog path with fr', () => {
    expect(localizedHref("fr", "/blog/x")).toBe("/fr/blog/x");
  });
});
