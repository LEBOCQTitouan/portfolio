import { render, screen, act, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

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

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
}

// Drive a scroll event and flush the rAF-throttled handler synchronously.
function scrollTo(value: number) {
  setScrollY(value);
  act(() => {
    fireEvent.scroll(window);
  });
}

// Make requestAnimationFrame run its callback immediately so the scroll
// handler's state update is observable within act().
beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    cb(0);
    // Return 0 so the component's `raf` handle resets after the synchronous
    // callback, letting the next scroll event schedule again.
    return 0;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  setScrollY(0);
});

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
    setScrollY(80);
    const { container } = renderNav();
    const header = container.querySelector("header")!;
    expect(header).toHaveAttribute("data-condensed", "true");
    expect(header.className).toContain("py-3");
  });

  // Regression: the condense/expand boundary used to be a single threshold.
  // Because the sticky header sits in normal flow near the top, toggling its
  // height nudged scrollY back across that one line, producing a self-
  // sustaining condense/expand flicker. Hysteresis (separate thresholds with a
  // gap wider than the header's height change) must hold state inside the band.
  it("does not flip state within the hysteresis band (no flicker)", () => {
    const { container } = renderNav();
    const header = container.querySelector("header")!;

    // Starts expanded at the top.
    expect(header).not.toHaveAttribute("data-condensed");

    // Scrolling into the band from the top must NOT condense yet.
    scrollTo(20);
    expect(header).not.toHaveAttribute("data-condensed");

    // Past the condense threshold it condenses.
    scrollTo(80);
    expect(header).toHaveAttribute("data-condensed", "true");

    // Scrolling back up into the band must NOT expand yet (this is the bug:
    // the old single-threshold logic expanded here, then the resize shoved
    // scrollY back down and it re-condensed, looping forever).
    scrollTo(20);
    expect(header).toHaveAttribute("data-condensed", "true");

    // Only near the very top does it expand again.
    scrollTo(2);
    expect(header).not.toHaveAttribute("data-condensed");
  });
});
