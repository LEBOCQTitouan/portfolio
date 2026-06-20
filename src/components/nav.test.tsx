import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
}));

import { Nav } from "@/components/nav";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";

function renderNav() {
  return render(
    <TranslationProvider dictionary={en} lang="en">
      <Nav />
    </TranslationProvider>,
  );
}

describe("Nav", () => {
  it("renders the site name linking home", () => {
    renderNav();
    const home = screen.getByRole("link", { name: /titouan lebocq/i });
    expect(home).toHaveAttribute("href", "/en");
  });

  it("renders the primary section links", () => {
    renderNav();
    expect(screen.getByRole("link", { name: /work/i })).toHaveAttribute(
      "href",
      "/en/work",
    );
    expect(screen.getByRole("link", { name: /writing/i })).toHaveAttribute(
      "href",
      "/en/blog",
    );
    expect(screen.getByRole("link", { name: /about/i })).toHaveAttribute(
      "href",
      "/en/about",
    );
  });

  it("includes the theme toggle", () => {
    renderNav();
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("sets the display font on the wordmark", () => {
    renderNav();
    expect(screen.getByText("Titouan Lebocq")).toHaveClass("font-display");
  });

  it("is expanded (not condensed) at the top of the page", () => {
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    const { container } = renderNav();
    const header = container.querySelector("header")!;
    expect(header).not.toHaveAttribute("data-condensed");
    expect(header.className).toContain("py-6");
  });

  it("condenses once the page is scrolled past the threshold", () => {
    Object.defineProperty(window, "scrollY", { value: 40, configurable: true });
    const { container } = renderNav();
    const header = container.querySelector("header")!;
    expect(header).toHaveAttribute("data-condensed", "true");
    expect(header.className).toContain("py-3");
  });
});
