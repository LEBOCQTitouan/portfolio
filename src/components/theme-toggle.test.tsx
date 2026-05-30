import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme }),
}));

import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => setTheme.mockClear());

  it("renders an accessible toggle button", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("switches to dark when the current theme is light", async () => {
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: /toggle theme/i }),
    );
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
