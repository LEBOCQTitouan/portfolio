import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

import { Nav } from "@/components/nav";

describe("Nav", () => {
  it("renders the site name linking home", () => {
    render(<Nav />);
    const home = screen.getByRole("link", { name: /titouan lebocq/i });
    expect(home).toHaveAttribute("href", "/");
  });

  it("renders the primary section links", () => {
    render(<Nav />);
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
    render(<Nav />);
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });
});
