import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Typography } from "./typography";

describe("Typography", () => {
  it("shows both typeface labels", () => {
    render(<Typography displayLabel="Display · Dragonsteel" sansLabel="Sans · Inter" />);
    expect(screen.getByText("Display · Dragonsteel")).toBeInTheDocument();
    expect(screen.getByText("Sans · Inter")).toBeInTheDocument();
  });
  it("renders the display sample with the font-display class", () => {
    const { container } = render(<Typography displayLabel="d" sansLabel="s" />);
    expect(container.querySelector(".font-display")).toBeInTheDocument();
  });
});
