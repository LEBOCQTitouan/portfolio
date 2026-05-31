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
    expect(home).toHaveAttribute("href", "/");
  });

  it("renders the primary section links", () => {
    renderNav();
    expect(screen.getByRole("link", { name: /work/i })).toHaveAttribute(
      "href",
      "/work",
    );
    expect(screen.getByRole("link", { name: /writing/i })).toHaveAttribute(
      "href",
      "/blog",
    );
    expect(screen.getByRole("link", { name: /about/i })).toHaveAttribute(
      "href",
      "/about",
    );
  });

  it("includes the theme toggle", () => {
    renderNav();
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });
});
