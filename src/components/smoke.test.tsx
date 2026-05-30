import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("renders and queries DOM", () => {
    render(<button>Click me</button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });
});
