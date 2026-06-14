import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubjectSwitcher } from "./subject-switcher";

const defaultProps = { lead: "The page wears", accent: "this colour", primaryAction: "Primary action" };

describe("SubjectSwitcher", () => {
  it("defaults the preview to brand", () => {
    const { container } = render(<SubjectSwitcher {...defaultProps} />);
    expect(container.querySelector("[data-ds-preview]")?.getAttribute("data-subject")).toBe("brand");
  });

  it("recolors the preview when a subject is chosen", async () => {
    const user = userEvent.setup();
    const { container } = render(<SubjectSwitcher {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /systems/i }));
    expect(container.querySelector("[data-ds-preview]")?.getAttribute("data-subject")).toBe("systems");
  });

  it("renders a control for every subject", () => {
    render(<SubjectSwitcher {...defaultProps} />);
    for (const name of ["brand", "systems", "interface", "ai"]) {
      expect(screen.getByRole("button", { name: new RegExp(name, "i") })).toBeInTheDocument();
    }
  });

  it("renders the primaryAction text", () => {
    render(<SubjectSwitcher {...defaultProps} />);
    expect(screen.getByText("Primary action")).toBeInTheDocument();
  });
});
