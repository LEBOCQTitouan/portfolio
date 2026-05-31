import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "fs", message: "core must stay pure — use an adapter." },
            { name: "node:fs", message: "core must stay pure — use an adapter." },
            { name: "path", message: "core must stay pure — use an adapter." },
            { name: "node:path", message: "core must stay pure — use an adapter." },
            { name: "gray-matter", message: "Filesystem parsing belongs in an adapter." },
            { name: "reading-time", message: "Move into an adapter or pass the value in." },
          ],
          patterns: [
            { group: ["next", "next/*"], message: "core must not depend on Next.js." },
            { group: ["@/adapters/*", "@/composition/*", "@/lib/*"], message: "core must not depend on adapters/composition/lib (dependency rule)." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output directories not covered by .next:
    ".open-next/**",
    ".wrangler/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
