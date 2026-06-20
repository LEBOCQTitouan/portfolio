import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Figure } from "@/components/case-study/figure";

describe("Figure", () => {
  it("renders an image when src is provided", () => {
    render(<Figure src="/work/arch.svg" alt="architecture" caption="Write path" />);
    const img = screen.getByRole("img", { name: /architecture/i });
    expect(img).toHaveAttribute("src", "/work/arch.svg");
    expect(screen.getByText(/write path/i)).toBeInTheDocument();
  });

  it("renders a placeholder with the caption when src is absent", () => {
    render(<Figure caption="Event-sourced write path" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText(/event-sourced write path/i).length).toBeGreaterThan(0);
  });
});
