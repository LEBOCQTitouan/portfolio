"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="rounded-md border border-border px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
    >
      <span className="dark:hidden" aria-hidden="true">🌙</span>
      <span className="hidden dark:inline" aria-hidden="true">☀️</span>
    </button>
  );
}
