import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Orb } from "./orb";

describe("Orb", () => {
  it("renders mood + reaction as data attributes and contains eyes", () => {
    const { container } = render(<Orb mood="warm" reaction="active" gaze={{ x: 0, y: 0 }} />);
    const orb = container.querySelector(".companion-orb") as HTMLElement;
    expect(orb).toBeInTheDocument();
    expect(orb.dataset.mood).toBe("warm");
    expect(orb.dataset.reaction).toBe("active");
    expect(container.querySelector(".companion-eyes")).toBeInTheDocument();
  });

  it("is decorative (aria-hidden)", () => {
    const { container } = render(<Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} />);
    expect(container.querySelector(".companion-orb")).toHaveAttribute("aria-hidden", "true");
  });

  it("applies a caller style override (size/position)", () => {
    const { container } = render(
      <Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} style={{ width: 200, height: 200 }} />,
    );
    expect((container.querySelector(".companion-orb") as HTMLElement).style.width).toBe("200px");
  });
});
