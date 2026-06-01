import { describe, it, expect } from "vitest";
import { negotiateLocale } from "./negotiate";

describe("negotiateLocale", () => {
  it("prefers a valid cookie locale", () => {
    expect(negotiateLocale("fr", "en-US,en;q=0.9")).toBe("fr");
    expect(negotiateLocale("en", "fr-FR,fr;q=0.9")).toBe("en");
  });
  it("ignores an invalid cookie and uses Accept-Language", () => {
    expect(negotiateLocale("de", "fr-FR,fr;q=0.9,en;q=0.5")).toBe("fr");
  });
  it("picks fr when Accept-Language prefers French", () => {
    expect(negotiateLocale(null, "fr-CA,fr;q=0.9,en;q=0.5")).toBe("fr");
  });
  it("picks en when English outranks French", () => {
    expect(negotiateLocale(null, "en-GB,en;q=0.9,fr;q=0.4")).toBe("en");
  });
  it("falls back to default when nothing matches or header is empty", () => {
    expect(negotiateLocale(null, "")).toBe("en");
    expect(negotiateLocale(null, "de,es;q=0.5")).toBe("en");
    expect(negotiateLocale(null, null)).toBe("en");
  });
});
