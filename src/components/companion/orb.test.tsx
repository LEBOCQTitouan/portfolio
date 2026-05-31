import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Orb } from "./orb";

describe("Orb", () => {
  it("renders with the mood as a data attribute and a gradient background", () => {
    const { container } = render(<Orb mood="warm" muted={false} />);
    const orb = container.querySelector(".companion-orb") as HTMLElement;
    expect(orb).toBeInTheDocument();
    expect(orb.dataset.mood).toBe("warm");
    expect(orb.style.background).toContain("radial-gradient");
  });

  it("is decorative (aria-hidden) so it doesn't reach screen readers", () => {
    const { container } = render(<Orb mood="calm" muted={false} />);
    expect(container.querySelector(".companion-orb")).toHaveAttribute("aria-hidden", "true");
  });
});
