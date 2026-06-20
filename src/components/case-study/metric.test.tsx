import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Metric } from "@/components/case-study/metric";

describe("Metric", () => {
  it("renders value and label", () => {
    render(<Metric value="42%" label="faster builds" />);
    expect(screen.getByText("42%")).toBeInTheDocument();
    expect(screen.getByText(/faster builds/i)).toBeInTheDocument();
  });
});
