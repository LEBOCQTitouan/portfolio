import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Eyes } from "./eyes";

describe("Eyes", () => {
  it("renders two eyes with the resolved shape as a data attribute", () => {
    const { container } = render(<Eyes mood="focused" reaction="active" gaze={{ x: 0, y: 0 }} />);
    const root = container.querySelector(".companion-eyes") as HTMLElement;
    expect(root).toBeInTheDocument();
    expect(root.dataset.shape).toBe("squint");
    expect(root.querySelectorAll(".companion-eye")).toHaveLength(2);
  });

  it("closes the eyes when sleeping or asleep", () => {
    for (const reaction of ["sleeping", "asleep"] as const) {
      const { container } = render(<Eyes mood="calm" reaction={reaction} gaze={{ x: 0, y: 0 }} />);
      expect((container.querySelector(".companion-eyes") as HTMLElement).dataset.shape).toBe("closed");
    }
  });

  it("offsets the eyes toward the gaze vector", () => {
    const { container } = render(<Eyes mood="calm" reaction="active" gaze={{ x: 1, y: -1 }} />);
    const root = container.querySelector(".companion-eyes") as HTMLElement;
    expect(root.style.getPropertyValue("--gx")).not.toBe("");
    expect(root.style.getPropertyValue("--gy")).not.toBe("");
  });
});
