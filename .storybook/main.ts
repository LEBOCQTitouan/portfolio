import type { StorybookConfig } from "@storybook/nextjs-vite";
import { fileURLToPath } from "node:url";

const config: StorybookConfig = {
  // Stories live next to the components they document.
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    // Vite-based Next.js framework — matches the project's existing Vite/Vitest
    // tooling and reads tsconfig paths (the "@/*" alias) automatically.
    name: "@storybook/nextjs-vite",
    options: {},
  },
  // <Comments> returns null unless the giscus env vars are set, so provide
  // placeholders. The giscus widget itself is mocked (see viteFinal) to avoid
  // a real network request to giscus.app.
  env: (existing) => ({
    ...existing,
    NEXT_PUBLIC_GISCUS_REPO: "owner/repo",
    NEXT_PUBLIC_GISCUS_REPO_ID: "R_demo",
    NEXT_PUBLIC_GISCUS_CATEGORY: "General",
    NEXT_PUBLIC_GISCUS_CATEGORY_ID: "DIC_demo",
  }),
  viteFinal: async (viteConfig) => {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias ?? {}),
      "@giscus/react": fileURLToPath(
        new URL("./mocks/giscus.tsx", import.meta.url),
      ),
    };
    return viteConfig;
  },
};

export default config;
