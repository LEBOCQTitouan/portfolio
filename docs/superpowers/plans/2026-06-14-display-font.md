# Display Font (Dragonsteel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SimpleBits **Dragonsteel Regular** as a display typeface used on the nav wordmark only, while Inter keeps every other role.

**Architecture:** A new typography token `--font-display` is loaded via `next/font/local`, registered in Tailwind v4's `@theme inline` block, and applied with a `font-display` utility to the single wordmark text node in `nav.tsx`. First typography token of the (color-only) design-system; built self-contained so the unmerged `avatar-mascot-design-system` branch can absorb it later.

**Tech Stack:** Next.js 16.2.6 (App Router), Tailwind CSS v4, `next/font/local`, React 19, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-14-display-font-design.md`

> ⚠️ **This is NOT the Next.js you know** (`AGENTS.md`). Next 16's `next/font/local` API may differ from training data. Task 1 forces a read of the bundled docs before any font code.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/fonts/Dragonsteel-Regular.woff2` | The shipped font binary (Regular cut only) |
| `src/app/fonts/LICENSE.txt` | SimpleBits license / purchase provenance |
| `src/app/[lang]/layout.tsx` | Declares the `localFont` loader beside `inter`; puts `--font-dragonsteel` on `<html>` |
| `src/app/globals.css` | Maps `--font-display` token → Tailwind `font-display` utility |
| `src/components/nav.tsx` | Wraps the wordmark text in a `<span class="font-display">` |
| `src/components/nav.test.tsx` | Asserts the wordmark carries `font-display` |

Source font lives at `~/Downloads/Dragonsteel/Dragonsteel-Regular.woff2`.

---

## Task 1: Install deps and verify the `next/font/local` API

**Files:** none (environment + research)

- [ ] **Step 1: Install dependencies**

`node_modules` is absent. Install with the existing lockfile:

```bash
npm ci
```

Expected: completes; `node_modules/next` exists.

- [ ] **Step 2: Read the bundled font docs (mandatory per AGENTS.md)**

```bash
find node_modules/next/dist/docs -iname "*font*"
```

Open every match and read the `next/font/local` section. Confirm the exact shape of:
- the `localFont({ src, variable, display, ... })` call,
- whether `src` is a string or an array of `{ path, weight, style }`,
- how the returned object exposes a CSS variable (`.variable`).

If the API differs from what Tasks 3–4 assume below, **adjust those tasks to match the docs** and note the deviation in your commit message.

- [ ] **Step 3: Baseline the test suite**

```bash
npm test
```

Expected: existing suite PASSES (green baseline before any change).

- [ ] **Step 4: Commit (deps only, if the lockfile/install produced changes)**

No source changed in this task; only commit if `npm ci` modified tracked files (it should not). Otherwise skip.

---

## Task 2: Add the font file and license

**Files:**
- Create: `src/app/fonts/Dragonsteel-Regular.woff2`
- Create: `src/app/fonts/LICENSE.txt`

- [ ] **Step 1: Copy the licensed woff2 into the repo**

```bash
mkdir -p src/app/fonts
cp ~/Downloads/Dragonsteel/Dragonsteel-Regular.woff2 src/app/fonts/
```

Verify it's a real woff2 (header must read `wOF2`):

```bash
xxd src/app/fonts/Dragonsteel-Regular.woff2 | head -1
```

Expected: starts with `774f 4632` (`wOF2`).

- [ ] **Step 2: Record license provenance**

Create `src/app/fonts/LICENSE.txt` with:

```text
Dragonsteel — SimpleBits (Dan Cederholm)
https://simplebits.shop/products/dragonsteel

Licensed font. Purchased by Titouan Lebocq.
Only the Regular cut is bundled; Rough and Sharp are licensed but unused.
Do not redistribute the font files outside this project.
```

If the official license text from the purchase is available, paste it below this note.

- [ ] **Step 3: Commit**

```bash
git add src/app/fonts/Dragonsteel-Regular.woff2 src/app/fonts/LICENSE.txt
git commit -m "feat(fonts): add licensed Dragonsteel Regular woff2"
```

---

## Task 3: Load the font and register the `--font-display` token

**Files:**
- Modify: `src/app/[lang]/layout.tsx` (font loader + `<html>` className)
- Modify: `src/app/globals.css` (`@theme inline` token)

- [ ] **Step 1: Add the local font loader in `layout.tsx`**

At the top of `src/app/[lang]/layout.tsx`, beside the existing Inter import/loader (lines 2 and 15), add `localFont`. The path is relative to this file (`src/app/[lang]/` → `../fonts/`).

Existing:

```tsx
import { Inter } from "next/font/google";
// ...
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```

Add:

```tsx
import localFont from "next/font/local";
// ...
const dragonsteel = localFont({
  src: "../fonts/Dragonsteel-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  variable: "--font-dragonsteel",
});
```

> If Step-1.2 of Task 1 showed `src` must be an array, use:
> `src: [{ path: "../fonts/Dragonsteel-Regular.woff2", weight: "400", style: "normal" }]`
> and drop the top-level `weight`/`style`.

- [ ] **Step 2: Expose the variable on `<html>`**

Change `layout.tsx:58` from:

```tsx
<html lang={lang} suppressHydrationWarning className={inter.variable}>
```

to:

```tsx
<html
  lang={lang}
  suppressHydrationWarning
  className={`${inter.variable} ${dragonsteel.variable}`}
>
```

- [ ] **Step 3: Register the token in `globals.css`**

In `src/app/globals.css`, inside the `@theme inline { ... }` block, directly under the existing `--font-sans` line, add:

```css
  --font-display: var(--font-dragonsteel), var(--font-inter), ui-sans-serif, system-ui, sans-serif;
```

(The Inter + system fallback means the wordmark still reads as a clean bold name if the display glyphs ever fail to load.)

- [ ] **Step 4: Verify it builds**

```bash
npm run build
```

Expected: build SUCCEEDS. (`next/font/local` resolves the file at build time; a wrong path fails here.)

- [ ] **Step 5: Commit**

```bash
git add src/app/[lang]/layout.tsx src/app/globals.css
git commit -m "feat(fonts): wire Dragonsteel as the --font-display token"
```

---

## Task 4: Apply the display font to the wordmark (TDD)

**Files:**
- Modify: `src/components/nav.test.tsx` (add assertion)
- Modify: `src/components/nav.tsx:25` (wrap wordmark text)

- [ ] **Step 1: Write the failing test**

In `src/components/nav.test.tsx`, add this case inside the `describe("Nav", ...)` block:

```tsx
it("sets the display font on the wordmark", () => {
  renderNav();
  expect(screen.getByText("Titouan Lebocq")).toHaveClass("font-display");
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
npx vitest run src/components/nav.test.tsx -t "display font"
```

Expected: FAIL. Currently the wordmark is a bare text node (not its own element with that class), so either `getByText` finds the `<a>` without the class, or the class assertion fails.

- [ ] **Step 3: Wrap the wordmark text in a span**

In `src/components/nav.tsx`, change the wordmark text (line 25) from:

```tsx
        <Logo className="h-6 w-6" />
        Titouan Lebocq
```

to:

```tsx
        <Logo className="h-6 w-6" />
        <span className="font-display">Titouan Lebocq</span>
```

Leave the `<Link>`'s own classes (`text-sm font-bold tracking-tight …`) unchanged.

- [ ] **Step 4: Run the test — it passes**

```bash
npx vitest run src/components/nav.test.tsx -t "display font"
```

Expected: PASS.

- [ ] **Step 5: Run the full nav suite (no regressions)**

```bash
npx vitest run src/components/nav.test.tsx
```

Expected: all 4 cases PASS (the existing "renders the site name linking home" still matches, because the link's accessible name still contains the span text).

- [ ] **Step 6: Commit**

```bash
git add src/components/nav.tsx src/components/nav.test.tsx
git commit -m "feat(nav): set Dragonsteel display font on the wordmark"
```

---

## Task 5: Whole-suite + manual visual verification

**Files:** none (verification)

- [ ] **Step 1: Full test suite**

```bash
npm test
```

Expected: entire suite PASSES.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: SUCCEEDS, no font-resolution or type errors.

- [ ] **Step 3: Manual visual check**

```bash
npm run dev
```

Open the site and confirm:
- The nav wordmark "Titouan Lebocq" renders in **Dragonsteel**; the SVG monogram beside it is unchanged.
- Every heading, body paragraph, and the footer copyright line stay in **Inter**.
- Toggle dark mode — wordmark still correct in both themes.
- DevTools → Network: `Dragonsteel-Regular` woff2 loads with **200** (self-hosted by `next/font`, not a 404). No visible flash/reflow of the wordmark on load.

- [ ] **Step 4: Stop the dev server**

Ctrl-C.

---

## Done criteria

- Wordmark is Dragonsteel; nothing else changed visually.
- `npm test` and `npm run build` both green.
- Only the Regular cut shipped; license recorded.
- `--font-display` token exists and is consumed via the `font-display` utility.

## Deferred (out of scope — option A)

- Mirror `--font-display` into `avatar-mascot-design-system`'s `tokens.ts` + `docs/design-system.md` typography section (when that branch merges).
- Add `typography.stories.tsx` in the `origin/feat/storybook-stories` idiom.
- Rough / Sharp cuts; any wordmark-beyond usage.
