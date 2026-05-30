import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Hero } from "@/components/landing/hero";

describe("Hero", () => {
  it("renders the dual-identity headline as the h1", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { level: 1, name: /craft of design/i }),
    ).toBeInTheDocument();
  });

  it("links to work and writing", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: /view work/i })).toHaveAttribute(
      "href",
      "/work",
    );
    expect(screen.getByRole("link", { name: /read writing/i })).toHaveAttribute(
      "href",
      "/blog",
    );
  });
});
