import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Footer } from "@/components/footer";
import { en } from "@/i18n/dictionaries/en";

function renderFooter(year = 2026) {
  return render(<Footer year={year} t={en.footer} lang="en" />);
}

describe("Footer", () => {
  it("renders the owner and the provided year", () => {
    renderFooter(2026);
    expect(screen.getByText(/© 2026 titouan lebocq/i)).toBeInTheDocument();
  });

  it("links to GitHub", () => {
    renderFooter(2026);
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/LEBOCQTitouan",
    );
  });

  it("links to the design-system page", () => {
    renderFooter(2026);
    const link = screen.getByRole("link", { name: /design system/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("/design-system"));
  });
});
