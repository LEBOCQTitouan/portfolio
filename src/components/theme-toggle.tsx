"use client";

import { useTheme } from "next-themes";
import { useT } from "@/i18n/use-t";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useT();

  return (
    <button
      type="button"
      aria-label={t.nav.toggleTheme}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-input border border-border text-sm text-muted transition-colors duration-[var(--dur-micro)] hover:border-accent/40 hover:text-foreground"
    >
      {/* Two glyphs share one cell; the inactive rotates + scales out while
          the active rotates in. Spring easing adds a small settle. Reduced
          motion collapses it to an instant swap. */}
      <span
        className="absolute rotate-0 scale-100 opacity-100 transition-[transform,opacity] duration-[var(--dur-ui)] ease-[var(--ease-spring)] dark:rotate-90 dark:scale-0 dark:opacity-0 motion-reduce:transition-none"
        aria-hidden="true"
      >
        🌙
      </span>
      <span
        className="absolute -rotate-90 scale-0 opacity-0 transition-[transform,opacity] duration-[var(--dur-ui)] ease-[var(--ease-spring)] dark:rotate-0 dark:scale-100 dark:opacity-100 motion-reduce:transition-none"
        aria-hidden="true"
      >
        ☀️
      </span>
    </button>
  );
}
