import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/about",
}));
vi.mock("@/i18n/use-t", () => ({
  useT: () => ({ t: {}, lang: "en" }),
}));

import { LanguageSwitcher, swapLocaleInPath } from "@/components/language-switcher";

describe("swapLocaleInPath", () => {
  it("swaps the locale segment when a known locale is first", () => {
    expect(swapLocaleInPath("/en/blog/x", "fr")).toBe("/fr/blog/x");
    expect(swapLocaleInPath("/fr/about", "en")).toBe("/en/about");
  });

  it("replaces a bare locale path", () => {
    expect(swapLocaleInPath("/en", "fr")).toBe("/fr");
  });

  it("prefixes with target locale when no locale segment is present", () => {
    expect(swapLocaleInPath("/about", "fr")).toBe("/fr/about");
    expect(swapLocaleInPath("/", "en")).toBe("/en");
  });
});

describe("LanguageSwitcher", () => {
  it("renders FR link pointing to /fr/about when on /en/about", () => {
    render(<LanguageSwitcher />);
    const frLink = screen.getByRole("link", { name: "FR" });
    expect(frLink).toHaveAttribute("href", "/fr/about");
  });

  it("renders EN link pointing to /en/about and marks it as current", () => {
    render(<LanguageSwitcher />);
    const enLink = screen.getByRole("link", { name: "EN" });
    expect(enLink).toHaveAttribute("href", "/en/about");
    expect(enLink).toHaveAttribute("aria-current", "true");
  });

  it("FR link does not have aria-current when active locale is en", () => {
    render(<LanguageSwitcher />);
    const frLink = screen.getByRole("link", { name: "FR" });
    expect(frLink).not.toHaveAttribute("aria-current");
  });

  it("each link has the correct hreflang attribute", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByRole("link", { name: "FR" })).toHaveAttribute("hreflang", "fr");
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute("hreflang", "en");
  });
});
