import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryBadge } from "./category-badge";

describe("CategoryBadge", () => {
  it("is neutral-at-rest by default: muted pill + card-subject hook + a dot", () => {
    const { container } = render(<CategoryBadge category="systems" />);
    const badge = container.querySelector("span.card-subject")!;
    expect(badge).toBeTruthy();
    expect(badge.className).toContain("text-muted");
    expect(badge.className).not.toContain("text-accent");
    expect(container.querySelector(".card-dot")).toBeTruthy();
  });

  it("renders an accent badge for committed detail pages", () => {
    const { container } = render(<CategoryBadge category="systems" accent />);
    const badge = container.querySelector("span")!;
    expect(badge.className).toContain("text-accent");
    expect(container.querySelector(".card-dot")).toBeNull();
  });
});
