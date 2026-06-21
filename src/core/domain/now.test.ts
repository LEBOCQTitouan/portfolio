import { describe, it, expect } from "vitest";
import {
  now,
  nowSchema,
  getNowFocus,
  getNowUpdated,
  daysSinceUpdate,
  isStale,
  relativeUpdated,
  STALE_AFTER_DAYS,
} from "./now";
import { locales } from "@/core/domain/locale";

const DAY = 86_400_000;
const refAfter = (days: number) => new Date(new Date(`${getNowUpdated()}T00:00:00Z`).getTime() + days * DAY);

describe("nowSchema", () => {
  const valid = { updated: "2026-06-21", focus: { en: ["a"], fr: ["b"] } };

  it("accepts a well-formed object", () => {
    expect(() => nowSchema.parse(valid)).not.toThrow();
  });
  it("rejects a non-ISO updated date", () => {
    expect(() => nowSchema.parse({ ...valid, updated: "May 2026" })).toThrow();
  });
  it("rejects an empty focus array", () => {
    expect(() => nowSchema.parse({ ...valid, focus: { en: [], fr: ["b"] } })).toThrow();
  });
  it("rejects an empty focus string", () => {
    expect(() => nowSchema.parse({ ...valid, focus: { en: [""], fr: ["b"] } })).toThrow();
  });
});

describe("now content", () => {
  it("parses for the real content", () => {
    expect(() => nowSchema.parse(now)).not.toThrow();
  });
  it("getNowFocus returns the locale array", () => {
    for (const locale of locales) expect(getNowFocus(locale)).toBe(now.focus[locale]);
  });
});

describe("locale parity", () => {
  it("en and fr focus have identical length", () => {
    expect(now.focus.fr.length).toBe(now.focus.en.length);
  });
});

describe("staleness", () => {
  it("daysSinceUpdate counts whole days", () => {
    expect(daysSinceUpdate(refAfter(10))).toBe(10);
  });
  it("is not stale at exactly the threshold", () => {
    expect(isStale(refAfter(STALE_AFTER_DAYS))).toBe(false);
  });
  it("is stale one day past the threshold", () => {
    expect(isStale(refAfter(STALE_AFTER_DAYS + 1))).toBe(true);
  });
});

describe("relativeUpdated", () => {
  it("formats months in English", () => {
    expect(relativeUpdated("en", refAfter(60))).toBe("2 months ago");
  });
  it("formats months in French", () => {
    expect(relativeUpdated("fr", refAfter(60))).toBe("il y a 2 mois");
  });
  it("formats days for recent updates", () => {
    expect(relativeUpdated("en", refAfter(10))).toBe("10 days ago");
  });
});
