import * as React from "react";
import type { Preview, Decorator } from "@storybook/nextjs-vite";
import { ThemeProvider } from "../src/components/theme-provider";

// Pull in the app's Tailwind v4 entrypoint + theme tokens so components render
// with the real design tokens (--background, --foreground, --accent, …).
import "../src/app/globals.css";

// Toggle light/dark from the toolbar. `forcedTheme` makes next-themes set the
// `.dark` class on <html> deterministically, so the CSS variables flip and any
// component calling `useTheme()` sees the correct resolvedTheme.
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as "light" | "dark") ?? "light";
  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      defaultTheme={theme}
      forcedTheme={theme}
    >
      <div
        style={{
          background: "var(--background)",
          color: "var(--foreground)",
          minHeight: "100vh",
          padding: "2rem",
          fontFamily: "var(--font-inter, ui-sans-serif, system-ui, sans-serif)",
        }}
      >
        <Story />
      </div>
    </ThemeProvider>
  );
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  globalTypes: {
    theme: {
      description: "Light / dark color scheme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
