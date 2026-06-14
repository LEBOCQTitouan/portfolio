import { describe, it, expect } from "vitest";
import { PAGE_TITLE, PAGE_AURA, workTitleName } from "./names";

describe("transition names", () => {
  it("exposes stable through-line names", () => {
    expect(PAGE_TITLE).toBe("page-title");
    expect(PAGE_AURA).toBe("page-aura");
  });

  it("derives a unique, slug-scoped name for the work card<->hero pair", () => {
    expect(workTitleName("atlas-design-system")).toBe("work-title-atlas-design-system");
    expect(workTitleName("pulse")).not.toBe(workTitleName("relay"));
  });
});
