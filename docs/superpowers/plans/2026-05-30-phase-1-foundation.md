# Phase 1: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js + TypeScript + Tailwind foundation with first-class light/dark theming, design tokens, a tested theme toggle, and the shared layout (nav + footer) — deployable to Vercel.

**Architecture:** Next.js App Router with a `src/` directory for app code and a root-level `content/` directory (added in Phase 2) for MDX. Tailwind v4 (CSS-first config) drives styling via CSS-variable design tokens that flip on a `.dark` class managed by `next-themes`. Interactive components are client components, tested in isolation with Vitest + Testing Library.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS v4, next-themes, next/font (Inter), Vitest, @testing-library/react, Vercel.

This is **Phase 1 of 6** from `docs/superpowers/specs/2026-05-30-portfolio-blog-design.md`. Subsequent phases (Blog core, Work/projects, Landing v0, Engagement, Extras & polish) each get their own plan.

---

## File Structure

Files created/modified in this phase:

- `package.json` — deps + scripts (created by scaffold, modified for test scripts)
- `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` — from scaffold
- `src/app/layout.tsx` — root layout: fonts, metadata, ThemeProvider, Nav, Footer, page shell
- `src/app/page.tsx` — temporary home placeholder
- `src/app/globals.css` — Tailwind import, design tokens (CSS vars), dark variant
- `src/components/theme-provider.tsx` — thin client wrapper around next-themes
- `src/components/theme-toggle.tsx` — light/dark toggle button (tested)
- `src/components/nav.tsx` — top navigation (tested)
- `src/components/footer.tsx` — site footer (tested)
- `vitest.config.ts`, `vitest.setup.ts` — test harness
- `src/components/*.test.tsx` — component tests
- `README.md` — project overview + commands

---

## Task 1: Scaffold the Next.js app

The directory already contains `.git`, `.gitignore`, `.claude/`, `.superpowers/`, and `docs/`. `create-next-app` refuses to run in a non-empty directory, so scaffold into a temp subdir and sync the files in.

**Files:**
- Create: entire Next.js scaffold (`src/app/*`, `package.json`, configs)
- Modify: `.gitignore` (re-add `.superpowers/`)

- [ ] **Step 1: Scaffold into a temp directory**

```bash
npx --yes create-next-app@latest .next-scaffold \
  --ts --tailwind --eslint --app --src-dir \
  --import-alias "@/*" --use-npm --turbopack
```

Expected: completes with "Success! Created ... in .next-scaffold". Installs dependencies.

- [ ] **Step 2: Sync scaffold into the project root and remove temp**

```bash
rsync -a --exclude='.git' .next-scaffold/ ./
rm -rf .next-scaffold
```

Expected: `src/`, `package.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `node_modules/`, etc. now exist at the repo root.

- [ ] **Step 3: Re-add `.superpowers/` to `.gitignore`**

The scaffold overwrote `.gitignore`. Append the brainstorm-files ignore so they stay local:

```bash
printf '\n# brainstorming companion files\n.superpowers/\n' >> .gitignore
```

- [ ] **Step 4: Verify the build succeeds**

```bash
npm run build
```

Expected: build completes with no errors; output shows the `/` route compiled.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

## Task 2: Set up the Vitest + Testing Library harness

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `src/components/smoke.test.tsx`
- Modify: `package.json` (test scripts)

- [ ] **Step 1: Install test dependencies**

```bash
npm install -D vitest@^3 @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @testing-library/user-event vite-tsconfig-paths
```

Expected: installs without peer-dependency errors.

- [ ] **Step 2: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 3: Create the test setup file**

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test scripts to `package.json`**

In `package.json`, add to the `"scripts"` object:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 5: Write a smoke test to verify the harness**

Create `src/components/smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("renders and queries DOM", () => {
    render(<button>Click me</button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run the test to verify the harness passes**

```bash
npm test
```

Expected: PASS — 1 passed (1 test). Confirms jsdom + Testing Library + jest-dom matchers work.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add Vitest + Testing Library harness"
```

---

## Task 3: Define design tokens, dark variant, and the Inter font

Replace the scaffold's `globals.css` with our token system. Tailwind v4 is configured in CSS (no `tailwind.config.js`). We define CSS variables for light, override them under `.dark`, and expose them to Tailwind via `@theme inline` so utilities like `bg-background`, `text-foreground`, `text-accent`, `border-border`, `bg-card` exist.

**Files:**
- Modify: `src/app/globals.css` (full replace)

- [ ] **Step 1: Replace `src/app/globals.css` with the token system**

```css
@import "tailwindcss";

/* Enable class-based dark mode for next-themes (Tailwind v4 syntax) */
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #fbfbfd;
  --foreground: #1d1d1f;
  --accent: #0071e3;
  --muted: #515154;
  --border: #e8e8ed;
  --card: #ffffff;
}

.dark {
  --background: #0f1115;
  --foreground: #f5f5f7;
  --accent: #2997ff;
  --muted: #a1a1a6;
  --border: #2c2c2e;
  --card: #1a1d23;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-card: var(--card);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 2: Verify the build still compiles with the new CSS**

```bash
npm run build
```

Expected: build succeeds (no Tailwind/PostCSS errors).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add design tokens and dark-mode variant"
```

---

## Task 4: Add the next-themes provider to the root layout

**Files:**
- Create: `src/components/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install next-themes**

```bash
npm install next-themes
```

- [ ] **Step 2: Create the theme provider wrapper**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

- [ ] **Step 3: Wire fonts, metadata, and the provider into `src/app/layout.tsx`**

Replace the contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Titouan Lebocq",
    template: "%s · Titouan Lebocq",
  },
  description: "Software engineer — engineering with the craft of design.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

(Nav and Footer get added to this layout in Task 8, once they exist.)

- [ ] **Step 4: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds; no hydration or import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate next-themes provider in root layout"
```

---

## Task 5: Build the ThemeToggle component (TDD)

A client component that shows the current mode and switches it. It avoids a hydration mismatch by only rendering theme-dependent content after mount.

**Files:**
- Test: `src/components/theme-toggle.test.tsx`
- Create: `src/components/theme-toggle.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/theme-toggle.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/theme-toggle.test.tsx
```

Expected: FAIL — cannot resolve `@/components/theme-toggle` (module does not exist yet).

- [ ] **Step 3: Implement the component**

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-border px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
    >
      {mounted ? (isDark ? "☀️" : "🌙") : null}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/theme-toggle.test.tsx
```

Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tested light/dark theme toggle"
```

---

## Task 6: Build the Nav component (TDD)

Top navigation: site name (links home) + section links + the theme toggle.

**Files:**
- Test: `src/components/nav.test.tsx`
- Create: `src/components/nav.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/nav.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/nav.test.tsx
```

Expected: FAIL — cannot resolve `@/components/nav`.

- [ ] **Step 3: Implement the component**

Create `src/components/nav.tsx`:

```tsx
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
];

export function Nav() {
  return (
    <header className="flex items-center justify-between py-6">
      <Link
        href="/"
        className="text-sm font-bold tracking-tight transition-colors hover:text-accent"
      >
        Titouan Lebocq
      </Link>
      <nav className="flex items-center gap-5 text-sm text-muted">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/nav.test.tsx
```

Expected: PASS — 3 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tested site navigation"
```

---

## Task 7: Build the Footer component (TDD)

**Files:**
- Test: `src/components/footer.test.tsx`
- Create: `src/components/footer.tsx`

- [ ] **Step 1: Write the failing test**

The footer shows the owner name and external profile links. It takes the current year as a prop so the test is deterministic (no reliance on the system clock).

Create `src/components/footer.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Footer } from "@/components/footer";

describe("Footer", () => {
  it("renders the owner and the provided year", () => {
    render(<Footer year={2026} />);
    expect(screen.getByText(/© 2026 titouan lebocq/i)).toBeInTheDocument();
  });

  it("links to GitHub", () => {
    render(<Footer year={2026} />);
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      "https://github.com/titouanlebocq",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/components/footer.test.tsx
```

Expected: FAIL — cannot resolve `@/components/footer`.

- [ ] **Step 3: Implement the component**

Create `src/components/footer.tsx`:

```tsx
const SOCIALS = [
  { href: "https://github.com/titouanlebocq", label: "GitHub" },
  { href: "https://www.linkedin.com/in/titouanlebocq", label: "LinkedIn" },
];

export function Footer({ year }: { year: number }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-border py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>© {year} Titouan Lebocq</span>
      <nav className="flex gap-4">
        {SOCIALS.map((social) => (
          <a
            key={social.href}
            href={social.href}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-foreground"
          >
            {social.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
```

(GitHub/LinkedIn handles are placeholders to confirm during execution — update the URLs to the real profiles.)

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/components/footer.test.tsx
```

Expected: PASS — 2 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add tested site footer"
```

---

## Task 8: Compose the layout and replace the home placeholder

Wire Nav and Footer into the shared shell and replace the scaffold's home page with a minimal placeholder (the real Landing v0 is Phase 4).

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx` (full replace)

- [ ] **Step 1: Add Nav + Footer to the layout shell**

In `src/app/layout.tsx`, add these imports below the existing imports:

```tsx
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
```

Then replace the `<ThemeProvider ...>{children}</ThemeProvider>` block with:

```tsx
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6">
            <Nav />
            <main className="flex-1 py-8">{children}</main>
            <Footer year={new Date().getFullYear()} />
          </div>
        </ThemeProvider>
```

(`new Date().getFullYear()` runs at request/render time on the server — fine in app code; only test code must avoid the live clock, which Task 7 does via the `year` prop.)

- [ ] **Step 2: Replace `src/app/page.tsx` with the placeholder home**

```tsx
export default function HomePage() {
  return (
    <section className="py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">
        Software Engineer · Design-led
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
        Engineering with the craft of design.
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        I build robust backend systems and interfaces people love — pushing
        technology to its limits without ever losing clarity.
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Verify the build succeeds**

```bash
npm run build
```

Expected: build succeeds; `/` route renders.

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: PASS — all suites green (smoke, theme-toggle, nav, footer).

- [ ] **Step 5: Manually verify theming in the browser**

```bash
npm run dev
```

Open the printed localhost URL. Confirm: the home placeholder renders, the theme toggle switches light/dark and the palette flips, and the system preference is respected on first load. Stop the dev server when done (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: compose layout with nav, footer, and home placeholder"
```

---

## Task 9: Project README and Vercel deployment

**Files:**
- Modify: `README.md` (full replace)

- [ ] **Step 1: Replace `README.md`**

```markdown
# Titouan Lebocq — Portfolio & Blog

Personal portfolio and technical blog. Engineering with the craft of design.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · next-themes · Vitest

## Development

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm test         # run the test suite
npm run build    # production build
```

## Project structure

- `src/app` — routes and layouts (App Router)
- `src/components` — UI components
- `content/` — MDX posts and projects (added in Phase 2)
- `docs/superpowers/` — design spec and implementation plans
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: add project README"
```

- [ ] **Step 3: Deploy to Vercel (requires interactive login)**

This step needs your Vercel account. In the terminal, run the login yourself (interactive):

```
! npx vercel login
```

Then deploy a preview, and finally production:

```bash
npx vercel        # creates/links the project, deploys a preview
npx vercel --prod # promotes to production
```

Expected: Vercel prints a live URL. Confirm the deployed site loads, theming works, and the home placeholder renders. Vercel auto-detects Next.js — no extra configuration needed.

(If you'd rather connect the GitHub repo through the Vercel dashboard for automatic deploys on push, do that instead — push the repo to GitHub first, then "Import Project" in Vercel.)

---

## Self-Review

**Spec coverage (Phase 1 items from §2, §3, §8.1):**
- Next.js + TS + Tailwind → Task 1 ✓
- next-themes light/dark → Tasks 4, 5 ✓
- Design tokens / palette → Task 3 ✓
- Inter font + typographic baseline → Task 4 ✓
- Layout / nav / footer → Tasks 6, 7, 8 ✓
- Test harness (Vitest + Testing Library) → Task 2 ✓
- Deploy to Vercel → Task 9 ✓
- (Content layer, SEO, OG, RSS, analytics, etc. are later phases — correctly out of scope here.)

**Type consistency:** `ThemeToggle` (no props) used by `Nav`; `Footer` takes `{ year: number }` consistently in test and layout; `ThemeProvider` forwards next-themes props. Token utility names (`bg-background`, `text-foreground`, `text-accent`, `text-muted`, `border-border`) defined in Task 3 and used consistently in Tasks 5–8.

**Placeholder scan:** No TBD/TODO. The only intentional placeholders are the GitHub/LinkedIn handles (Task 7) and the home content (replaced in Phase 4) — both explicitly flagged.
