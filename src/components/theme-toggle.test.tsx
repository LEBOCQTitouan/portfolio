import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme }),
}));

import { ThemeToggle } from "@/components/theme-toggle";
import { TranslationProvider } from "@/i18n/translation-provider";
import { en } from "@/i18n/dictionaries/en";

function renderToggle() {
  return render(
    <TranslationProvider dictionary={en} lang="en">
      <ThemeToggle />
    </TranslationProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => setTheme.mockClear());

  it("renders an accessible toggle button", () => {
    renderToggle();
    expect(
      screen.getByRole("button", { name: /toggle theme/i }),
    ).toBeInTheDocument();
  });

  it("switches to dark when the current theme is light", async () => {
    renderToggle();
    await userEvent.click(
      screen.getByRole("button", { name: /toggle theme/i }),
    );
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
