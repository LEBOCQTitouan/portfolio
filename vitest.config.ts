import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // server-only is not a standalone package — it exists only inside Next's
      // compiled bundle. Under Vitest (Node) we just need a no-op stub.
      "server-only": new URL("./src/__test-stubs__/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
