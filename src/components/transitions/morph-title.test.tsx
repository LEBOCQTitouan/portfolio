import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MorphTitle } from "./morph-title";

describe("MorphTitle", () => {
  it("renders its child heading (passthrough when ViewTransition is absent)", () => {
    render(
      <MorphTitle name="page-title">
        <h1>Selected work</h1>
      </MorphTitle>,
    );
    expect(screen.getByRole("heading", { name: "Selected work" })).toBeInTheDocument();
  });

  it("does not emit a React warning about invalid props on the fallback", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <MorphTitle name="work-title-x">
          <h1>X</h1>
        </MorphTitle>,
      );
      expect(err).not.toHaveBeenCalled();
    } finally {
      err.mockRestore();
    }
  });
});
