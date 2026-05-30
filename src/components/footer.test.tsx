import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Footer } from "@/components/footer";

describe("Footer", () => {
  it("renders the owner and the provided year", () => {
    render(<Footer year={2026} />);
    expect(screen.getByText(/© 2026 titouan lebocq/i)).toBeInTheDocument();
  });

  it("links to GitHub", () => {
    render(<Footer year={2026} />);
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/titouanlebocq",
    );
  });
});
