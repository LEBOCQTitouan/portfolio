import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Footer } from "@/components/footer";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";

function renderFooter(year = 2026) {
  return render(
    <TranslationProvider dictionary={en} lang="en">
      <Footer year={year} />
    </TranslationProvider>,
  );
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
});
