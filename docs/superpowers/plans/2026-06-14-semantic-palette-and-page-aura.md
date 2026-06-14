# Semantic Palette + Page Aura Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the four blue-family subjects with a distinct semantic palette (brand blue / systems teal / interface pink / AI violet→cyan gradient) and add an always-on, subject-colored global page aura.

**Architecture:** `src/design/tokens.ts` stays the single source of truth — swap the four subjects' values and add an `aura` field; `globals.css` mirrors them and gains `--aura-tint`/`--aura-glow` plus a single fixed `.page-aura` layer recolored per page via CSS `:has()`. The contrast contract is extended to verify the new palette and the foreground-over-aura legibility. No `resolveSubject`/wiring change; no new components; no per-page edits.

**Tech Stack:** Next 16, React 19, Tailwind CSS v4, TypeScript, Vitest.

> **Spec:** `docs/superpowers/specs/2026-06-14-subject-palette-and-page-aura-design.md`. This revises the shipped Phase 1 foundation; the avatar (Phase 2) is a separate plan and must be built against this palette.

---

## File Structure

- **Modify** `src/design/tokens.ts` — new subject values; add `aura: {tint, glow}` to `SubjectTokens` and each subject; add `FOREGROUND` constant.
- **Modify** `src/design/tokens.test.ts` — assert the new `aura` field shape.
- **Modify** `src/design/tokens-contrast.test.ts` — add a foreground-over-aura-tint AA check (the existing checks re-validate the new palette automatically).
- **Modify** `src/app/globals.css` — replace the four `[data-subject]` skin blocks with the new values; add `--aura-tint`/`--aura-glow` defaults + `:has()` per-subject overrides + the `.page-aura` layer.
- **Modify** `src/app/[lang]/layout.tsx` — render the `.page-aura` element inside `<body>`.
- **Modify** `docs/design-system.md` — pivot the philosophy text, document the palette + best-practice rules + aura, update the add-a-subject recipe.

All hex/rgba values below are final and chosen to pass WCAG AA (verified). `tokens.ts` and `globals.css` MUST stay in sync.

---

## Task 1: New palette values + aura tokens in `tokens.ts`

**Files:**
- Modify: `src/design/tokens.ts`
- Test: `src/design/tokens.test.ts`

- [ ] **Step 1: Add the failing `aura`-shape assertion to `tokens.test.ts`**

In `src/design/tokens.test.ts`, inside the `it("fully specifies every subject", ...)` test, add these lines at the end of the `for` loop body (after the `gradientStops` assertions):

```ts
      expect(t.aura.tint.light).toMatch(/^rgba\(/);
      expect(t.aura.tint.dark).toMatch(/^rgba\(/);
      expect(t.aura.glow.light).toMatch(/^rgba\(/);
      expect(t.aura.glow.dark).toMatch(/^rgba\(/);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/design/tokens.test.ts`
Expected: FAIL — `t.aura` is undefined (property does not exist yet).

- [ ] **Step 3: Update `tokens.ts` — type, values, and new constant**

Replace the `SubjectTokens` type (lines 8–22) with (adds the `aura` field):

```ts
export type SubjectTokens = {
  /** Accent for TEXT/BORDERS on the page background (per mode). */
  accent: ModeColor;
  /** Solid accent FILL color — white-safe in both modes; gradient fallback. */
  accentFill: string;
  /** Gradient stops for fills/accent-text. One stop = solid subject. */
  gradientStops: string[];
  /** Foreground guaranteed AA on the fill/gradient. */
  onAccent: string;
  /** Low-alpha tint for beds/badges/hovers (per mode). */
  accentSoft: ModeColor;
  /** Gradient stops for CLIPPED TEXT, per mode (legible on the page bg).
   *  Only gradient subjects need this; fills use gradientStops. */
  textGradient?: { light: string[]; dark: string[] };
  /** Page aura: a low-alpha background tint + a soft radial glow (per mode). */
  aura: { tint: ModeColor; glow: ModeColor };
};
```

Replace the entire `TOKENS` object (lines 24–57) with:

```ts
export const TOKENS: Record<SubjectId, SubjectTokens> = {
  brand: {
    accent: { light: "#0071e3", dark: "#2997ff" },
    accentFill: "#0a66c2",
    gradientStops: ["#0a66c2"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(0,113,227,0.10)", dark: "rgba(41,151,255,0.16)" },
    aura: {
      tint: { light: "rgba(0,113,227,0.06)", dark: "rgba(41,151,255,0.10)" },
      glow: { light: "rgba(0,113,227,0.16)", dark: "rgba(41,151,255,0.22)" },
    },
  },
  systems: {
    accent: { light: "#0b7268", dark: "#20c8b8" },
    accentFill: "#0a6b63",
    gradientStops: ["#0a6b63"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(11,114,104,0.12)", dark: "rgba(32,200,184,0.16)" },
    aura: {
      tint: { light: "rgba(11,114,104,0.07)", dark: "rgba(32,200,184,0.10)" },
      glow: { light: "rgba(11,114,104,0.16)", dark: "rgba(32,200,184,0.20)" },
    },
  },
  interface: {
    accent: { light: "#c42d63", dark: "#f06595" },
    accentFill: "#c42d63",
    gradientStops: ["#c42d63"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(196,45,99,0.12)", dark: "rgba(240,101,149,0.16)" },
    aura: {
      tint: { light: "rgba(196,45,99,0.07)", dark: "rgba(240,101,149,0.10)" },
      glow: { light: "rgba(196,45,99,0.16)", dark: "rgba(240,101,149,0.20)" },
    },
  },
  ai: {
    accent: { light: "#6d28d9", dark: "#a78bfa" },
    accentFill: "#6d28d9",
    gradientStops: ["#7c3aed", "#4f63d8", "#0e7d96"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(124,58,237,0.12)", dark: "rgba(167,139,250,0.18)" },
    textGradient: {
      light: ["#6d28d9", "#4f46e5", "#0e7490"],
      dark: ["#a78bfa", "#8ab4ff", "#5ad1e0"],
    },
    aura: {
      tint: { light: "rgba(124,58,237,0.07)", dark: "rgba(167,139,250,0.10)" },
      glow: { light: "rgba(124,58,237,0.18)", dark: "rgba(167,139,250,0.22)" },
    },
  },
};
```

Then, immediately after the `BACKGROUND` constant (currently the last line), add:

```ts
/** Page foreground per mode (mirrors --foreground in globals.css). */
export const FOREGROUND: ModeColor = { light: "#1d1d1f", dark: "#f5f5f7" };
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/design/tokens.test.ts`
Expected: PASS (all three tests; AI still the only multi-stop subject — its `gradientStops` has 3, others 1).

- [ ] **Step 5: Commit**

```bash
git add src/design/tokens.ts src/design/tokens.test.ts
git commit -m "feat(design): semantic subject palette + aura tokens"
```

---

## Task 2: Extend the contrast contract (foreground-over-aura) + re-validate palette

**Files:**
- Modify: `src/design/tokens-contrast.test.ts`

> The existing three contrast tests already re-run against the new palette via `TOKENS` — running the file proves the new accent/fill/gradient values still meet AA. This task adds one more guarantee: body text stays legible over the aura tint.

- [ ] **Step 1: Add the failing foreground-over-aura test**

In `src/design/tokens-contrast.test.ts`, update the import line to also pull `FOREGROUND`:

```ts
import { SUBJECTS, TOKENS, BACKGROUND, FOREGROUND } from "./tokens";
```

Then add this helper above the `describe` block and a new test inside the `describe`:

```ts
/** Composite an "rgba(r,g,b,a)" overlay over a solid hex base → resulting hex. */
function flattenRgbaOverHex(rgba: string, baseHex: string): string {
  const m = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!m) throw new Error(`bad rgba: ${rgba}`);
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const base = baseHex.replace(/^#/, "");
  const br = parseInt(base.slice(0, 2), 16);
  const bg = parseInt(base.slice(2, 4), 16);
  const bb = parseInt(base.slice(4, 6), 16);
  const mix = (o: number, bse: number) => Math.round(o * a + bse * (1 - a));
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(mix(r, br))}${hex(mix(g, bg))}${hex(mix(b, bb))}`;
}
```

```ts
  it("body text stays legible over the aura tint in both modes", () => {
    for (const id of SUBJECTS) {
      const a = TOKENS[id].aura;
      const overLight = flattenRgbaOverHex(a.tint.light, BACKGROUND.light);
      const overDark = flattenRgbaOverHex(a.tint.dark, BACKGROUND.dark);
      expect(contrastRatio(FOREGROUND.light, overLight)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(FOREGROUND.dark, overDark)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
```

- [ ] **Step 2: Run the whole contrast file**

Run: `npx vitest run src/design/tokens-contrast.test.ts`
Expected: PASS — all four tests (the original three confirm the new palette meets AA; the new one confirms text-over-aura legibility). If any assertion fails, the offending hex must be adjusted in `tokens.ts` — do NOT lower `AA_NORMAL`.

- [ ] **Step 3: Commit**

```bash
git add src/design/tokens-contrast.test.ts
git commit -m "test(design): verify new palette + aura text legibility (WCAG AA)"
```

---

## Task 3: Mirror the palette + add the aura layer in `globals.css`

**Files:**
- Modify: `src/app/globals.css`

> CSS isn't unit-tested; the guard is the full suite staying green (Step 4) and a visual check. Hexes MUST match `tokens.ts`. The `.page-aura` is recolored per page with `:has()`: on a project page the inner `[data-subject="systems"]` (on the article) makes `body:has([data-subject="systems"])` match, recoloring the layout-level aura — SSR-correct, no JS.

- [ ] **Step 1: Replace the subject-skin blocks**

Replace the block from `[data-subject="brand"] {` through `.dark [data-subject="ai"] { ... }` (currently lines 40–64) with:

```css
[data-subject="brand"] {
  --accent: #0071e3; --accent-fill: #0a66c2; --accent-gradient: #0a66c2;
  --accent-soft: rgba(0,113,227,0.10); --on-accent: #ffffff;
}
.dark [data-subject="brand"] { --accent: #2997ff; --accent-soft: rgba(41,151,255,0.16); }

[data-subject="systems"] {
  --accent: #0b7268; --accent-fill: #0a6b63; --accent-gradient: #0a6b63;
  --accent-soft: rgba(11,114,104,0.12); --on-accent: #ffffff;
}
.dark [data-subject="systems"] { --accent: #20c8b8; --accent-soft: rgba(32,200,184,0.16); }

[data-subject="interface"] {
  --accent: #c42d63; --accent-fill: #c42d63; --accent-gradient: #c42d63;
  --accent-soft: rgba(196,45,99,0.12); --on-accent: #ffffff;
}
.dark [data-subject="interface"] { --accent: #f06595; --accent-soft: rgba(240,101,149,0.16); }

[data-subject="ai"] {
  --accent: #6d28d9; --accent-fill: #6d28d9;
  --accent-gradient: linear-gradient(110deg, #7c3aed, #4f63d8, #0e7d96);
  --accent-text-gradient: linear-gradient(110deg, #6d28d9, #4f46e5, #0e7490);
  --accent-soft: rgba(124,58,237,0.12); --on-accent: #ffffff;
}
.dark [data-subject="ai"] { --accent: #a78bfa; --accent-soft: rgba(167,139,250,0.18); --accent-text-gradient: linear-gradient(110deg, #a78bfa, #8ab4ff, #5ad1e0); }
```

- [ ] **Step 2: Add the page-aura layer + per-subject `:has()` overrides**

Insert this block immediately AFTER the `@media (prefers-reduced-motion: no-preference) { ... }` accent-flow block (currently ends at line 104), BEFORE the `/* Long-form post content */` comment:

```css
/* ── Page aura — always-on, subject-colored ambient light ─────── */
/* One fixed layer behind all content. Recolored per page: the active
   subject lives on the content's [data-subject]; :has() lifts it up to
   this layout-level element. SSR-correct, static, contrast-safe. */
.page-aura {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  /* default = brand (light) */
  --aura-tint: rgba(0,113,227,0.06);
  --aura-glow: rgba(0,113,227,0.16);
  background:
    radial-gradient(120% 90% at 85% -10%, var(--aura-glow), transparent 55%),
    var(--aura-tint);
}
.dark .page-aura { --aura-tint: rgba(41,151,255,0.10); --aura-glow: rgba(41,151,255,0.22); }

body:has([data-subject="systems"]) .page-aura { --aura-tint: rgba(11,114,104,0.07); --aura-glow: rgba(11,114,104,0.16); }
body:has([data-subject="interface"]) .page-aura { --aura-tint: rgba(196,45,99,0.07); --aura-glow: rgba(196,45,99,0.16); }
body:has([data-subject="ai"]) .page-aura { --aura-tint: rgba(124,58,237,0.07); --aura-glow: rgba(124,58,237,0.18); }

.dark body:has([data-subject="systems"]) .page-aura { --aura-tint: rgba(32,200,184,0.10); --aura-glow: rgba(32,200,184,0.20); }
.dark body:has([data-subject="interface"]) .page-aura { --aura-tint: rgba(240,101,149,0.10); --aura-glow: rgba(240,101,149,0.20); }
.dark body:has([data-subject="ai"]) .page-aura { --aura-tint: rgba(167,139,250,0.10); --aura-glow: rgba(167,139,250,0.22); }
```

- [ ] **Step 3: Verify existing tests still pass + typecheck**

Run: `npx vitest run && npx tsc --noEmit`
Expected: all tests pass; tsc clean. (No test references removed values; the CSS change is structural.)

- [ ] **Step 4: Build smoke check**

Run: `npm run build`
Expected: build succeeds (compiles the CSS; `:has()` and `color-mix` are valid).

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): mirror semantic palette + add page-aura layer"
```

---

## Task 4: Render the aura layer in the layout

**Files:**
- Modify: `src/app/[lang]/layout.tsx`

- [ ] **Step 1: Add the aura element**

In `src/app/[lang]/layout.tsx`, the `<body>` currently opens and its first child is `<analytics.Beacon />`. Add the aura as the FIRST child of `<body>`, before `<analytics.Beacon />`:

```tsx
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        data-subject="brand"
      >
        <div className="page-aura" aria-hidden="true" />
        <analytics.Beacon />
```

(Only that one `<div>` line is added; everything else is unchanged.)

- [ ] **Step 2: Typecheck, test, build**

Run: `npx tsc --noEmit && npx vitest run && npm run build`
Expected: clean typecheck, all tests pass, build succeeds.

- [ ] **Step 3: Visual check**

Run: `npm run dev`. Open:
- `http://localhost:3000/en` → faint **blue** aura (brand)
- `http://localhost:3000/en/work/ledger-engine` → **teal** aura (systems)
- `http://localhost:3000/en/work/atlas-design-system` → **pink** aura (interface)
- A post tagged ai (or temporarily add `ai` to a post's tags) → **violet** aura with animated gradient accents

Toggle dark mode (nav moon) on each: aura recolors, stays subtle, text stays legible.

- [ ] **Step 4: Commit**

```bash
git add src/app/[lang]/layout.tsx
git commit -m "feat(design): mount the page-aura layer"
```

---

## Task 5: Update the philosophy doc

**Files:**
- Modify: `docs/design-system.md`

- [ ] **Step 1: Replace the opening principle**

Replace the top blockquote (the lines starting `> The whole system has one rule:` through `> layers of tokens. Nothing is a one-off.`) with:

```markdown
> The system has one rule: **brand-anchored, semantic subjects.** One blue is the
> identity; each subject carries its own meaningful color, applied through three
> layers of tokens, and felt globally through a subtle page aura. Nothing is a
> one-off.
```

- [ ] **Step 2: Replace the Subjects table**

Replace the existing "## Subjects" table rows with:

```markdown
| Subject | Trigger | Color · meaning |
|---|---|---|
| `brand` | default / untagged | azure **blue** · trust, identity, the anchor |
| `systems` | `category: systems`, tags architecture/backend/… | **teal** · infrastructure, reliability (blue-green, clear of success-green) |
| `interface` | `category: interface`, tags design/frontend/ui/… | **pink/coral** · craft, warmth (clear of error-red) |
| `ai` | tags ai/ml/llm/… | **violet→cyan** · intelligence, the only animated multi-hue subject |
```

- [ ] **Step 3: Add a best-practices subsection**

Immediately after that table, add:

```markdown
### Color best practices (why these hues)

- Subject hues stay **clear of the reserved feedback colors** (success green,
  error red, warning amber) so a subject never competes with state UI.
- **No red↔green** primary distinction (color-blind safety).
- Consistent tonal step; **WCAG AA enforced** by `tokens-contrast.test.ts`.
- Color is **never the only signal** — the badge label and the orb carry the
  subject too.
```

- [ ] **Step 4: Add a Page aura subsection**

Immediately before the "## Source of truth" section, add:

```markdown
## Page aura

Every page is **always lit**: a subtle global background **tint** plus a soft
radial **glow** (top-right, where the companion sits), colored by the active
subject. The page is the light source; the companion orb is a **lens** that
diffracts it (see the avatar plan). Tokens: `--aura-tint` and `--aura-glow`
(per subject, per mode, in `tokens.ts` as `aura.tint` / `aura.glow`). It renders
as one fixed `.page-aura` layer in the root layout, recolored per page via
`body:has([data-subject="…"]) .page-aura`. Static and contrast-safe (the tint is
low-alpha; body text over it is AA-verified).
```

- [ ] **Step 5: Update the add-a-subject recipe**

In the "## Recipe: add a new subject", replace step 1 and step 2, and add a step, so the recipe reads (replace steps 1–2 with):

```markdown
1. Pick a **meaningful** hue that is **clear of the feedback colors** (success
   green / error red / warning amber) and doesn't rely on a red↔green contrast.
2. In `src/design/tokens.ts`: add the id to `SUBJECTS` (in
   `src/core/domain/subject.ts`, re-exported from `tokens.ts`) and a `TOKENS`
   entry — `accent` (light+dark), `accentFill`, `gradientStops`, `onAccent`,
   `accentSoft` (light+dark), and `aura` (`tint` + `glow`, light+dark). Gradient
   subjects also add `textGradient` (light+dark).
```

And append after the last step:

```markdown
7. Add the subject's `--aura-tint`/`--aura-glow` to `globals.css`: a
   `body:has([data-subject="<id>"]) .page-aura` rule (and a `.dark` variant).
```

- [ ] **Step 6: Commit**

```bash
git add docs/design-system.md
git commit -m "docs(design): semantic palette + page aura philosophy"
```

---

## Self-review notes (verified against spec)

- Part A semantic palette (brand/systems/interface/ai values, light+dark, fill, gradients) → Task 1, mirrored in Task 3. ✓
- Best-practice rationale (clear of feedback colors, no red-green, AA) → Task 5; AA enforced by Task 2. ✓
- AI fill-gradient (white-safe) vs mode-aware text-gradient → Task 1 (`gradientStops` vs `textGradient`) + Task 3 (`--accent-gradient` vs `--accent-text-gradient`). ✓
- Part B aura: every page, tint+glow, `--aura-tint`/`--aura-glow` tokens, one fixed layer in layout, static, contrast-safe → Tasks 1, 3, 4; foreground-over-tint AA test → Task 2. ✓
- Orb-as-lens → recorded in Task 5 doc as a forward note (implemented in Phase 2). ✓
- Out of scope (orb material, animated aura, theme switcher) correctly excluded. ✓
- Type/name consistency: `aura: { tint: ModeColor; glow: ModeColor }`, `FOREGROUND: ModeColor`, CSS vars `--aura-tint`/`--aura-glow`, `.page-aura` class — used identically across tokens.ts, the tests, globals.css, and layout.tsx. ✓
- No per-page churn / no new components — aura recolor via `:has()`. ✓
```
