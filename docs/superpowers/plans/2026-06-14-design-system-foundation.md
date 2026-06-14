# Design System Foundation (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the three-layer, subject-adaptive token system (primitives → semantic → subject skins) where every subject is a blue-family declension of the brand, wired from content metadata, with baked-in contrast — and document the philosophy.

**Architecture:** TypeScript module `tokens.ts` is the single source of truth for subject color values (also consumed by the avatar in Phase 2 and by the contrast tests). `globals.css` carries the runtime CSS custom properties (primitives, semantic tokens, and `[data-subject]` skin blocks) authored to match `tokens.ts`. A pure `resolveSubject` function maps `project.category` / post `tags` → a subject id, applied as `data-subject` on a DOM scope; the CSS cascade does the rest. Existing token names (`background, foreground, accent, muted, border, card`) keep working.

**Tech Stack:** Next 16, React 19, Tailwind CSS v4 (`@theme inline`), TypeScript, Vitest, Zod (already present).

> **Spec:** `docs/superpowers/specs/2026-06-14-avatar-and-design-system-design.md` (Part 1). This plan covers Phase 1 only. Phases 2 (avatar) and 3 (workshop + showcase) are separate plans.

---

## File Structure

- **Create** `src/core/domain/subject.ts` — subject ids, the `tag → subject` map, and the pure `resolveSubject(input)` function. No DOM, no React.
- **Create** `src/core/domain/subject.test.ts` — table-driven tests for `resolveSubject`.
- **Create** `src/design/tokens.ts` — single source of truth: the subject palette (per subject: accent light/dark, accent-fill, gradient stops, on-accent, accent-soft light/dark) + `SUBJECTS` list + types.
- **Create** `src/design/tokens.test.ts` — structural tests (every subject fully specified).
- **Create** `src/design/contrast.ts` — pure `relativeLuminance(hex)` and `contrastRatio(hex, hex)`.
- **Create** `src/design/contrast.test.ts` — known-value tests for the contrast math.
- **Create** `src/design/tokens-contrast.test.ts` — asserts every subject's fill/gradient vs `on-accent`, and accent-text vs background, meet WCAG AA, using `tokens.ts`.
- **Modify** `src/app/globals.css` — restructure into primitives / semantic / subject-skin layers; add accent utilities + animated gradient; keep existing token names.
- **Modify** `src/app/[lang]/layout.tsx:59` — default `data-subject="brand"` on `<body>`.
- **Modify** `src/app/[lang]/work/[slug]/page.tsx:57` — `data-subject` from `resolveSubject({ category })`.
- **Modify** `src/app/[lang]/blog/[slug]/page.tsx:65` — `data-subject` from `resolveSubject({ tags })`.
- **Create** `docs/design-system.md` — the philosophy doc + "add a subject" recipe.

---

## Task 1: Contrast math utility

**Files:**
- Create: `src/design/contrast.ts`
- Test: `src/design/contrast.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/design/contrast.test.ts
import { describe, it, expect } from "vitest";
import { relativeLuminance, contrastRatio } from "./contrast";

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is symmetric", () => {
    expect(contrastRatio("#0a66c2", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#0a66c2"),
      5,
    );
  });
  it("accepts 3- and 6-digit hex with or without #", () => {
    expect(contrastRatio("000", "fff")).toBeCloseTo(21, 1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/design/contrast.test.ts`
Expected: FAIL — cannot find module `./contrast`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/design/contrast.ts

/** Parse #rgb / #rrggbb (with or without leading #) into [r,g,b] 0-255. */
function parseHex(hex: string): [number, number, number] {
  let h = hex.replace(/^#/, "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) throw new Error(`Invalid hex color: "${hex}"`);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance (0..1) for an sRGB hex color. */
export function relativeLuminance(hex: string): number {
  const lin = parseHex(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** WCAG contrast ratio (1..21) between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/design/contrast.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/design/contrast.ts src/design/contrast.test.ts
git commit -m "feat(design): add WCAG contrast utility"
```

---

## Task 2: Token source of truth

**Files:**
- Create: `src/design/tokens.ts`
- Test: `src/design/tokens.test.ts`

> These hex values are the finalized blue-family palette from the spec. `globals.css` (Task 5) must mirror them exactly. Every value below has been chosen so the contrast contract in Task 4 passes.

- [ ] **Step 1: Write the failing test**

```ts
// src/design/tokens.test.ts
import { describe, it, expect } from "vitest";
import { SUBJECTS, TOKENS, type SubjectId } from "./tokens";

describe("tokens", () => {
  it("lists the four subjects", () => {
    expect(SUBJECTS).toEqual(["brand", "systems", "interface", "ai"]);
  });

  it("fully specifies every subject", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      expect(t.accent.light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accent.dark).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accentFill).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.onAccent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(t.accentSoft.light).toMatch(/^rgba\(/);
      expect(t.accentSoft.dark).toMatch(/^rgba\(/);
      expect(Array.isArray(t.gradientStops)).toBe(true);
      expect(t.gradientStops.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("AI is the only multi-stop gradient subject", () => {
    expect(TOKENS.ai.gradientStops.length).toBeGreaterThan(1);
    for (const id of ["brand", "systems", "interface"] as SubjectId[]) {
      expect(TOKENS[id].gradientStops.length).toBe(1);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/design/tokens.test.ts`
Expected: FAIL — cannot find module `./tokens`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/design/tokens.ts

export const SUBJECTS = ["brand", "systems", "interface", "ai"] as const;
export type SubjectId = (typeof SUBJECTS)[number];

type ModeColor = { light: string; dark: string };

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
};

export const TOKENS: Record<SubjectId, SubjectTokens> = {
  brand: {
    accent: { light: "#0071e3", dark: "#2997ff" },
    accentFill: "#0a66c2",
    gradientStops: ["#0a66c2"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(0,113,227,0.10)", dark: "rgba(41,151,255,0.16)" },
  },
  systems: {
    accent: { light: "#3a36cc", dark: "#7c84ff" },
    accentFill: "#322db5",
    gradientStops: ["#322db5"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(58,54,204,0.10)", dark: "rgba(124,132,255,0.16)" },
  },
  interface: {
    accent: { light: "#1657d8", dark: "#4f9bff" },
    accentFill: "#1657d8",
    gradientStops: ["#1657d8"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(22,87,216,0.10)", dark: "rgba(79,155,255,0.16)" },
  },
  ai: {
    accent: { light: "#2747d6", dark: "#6f8cff" },
    accentFill: "#3a52d8",
    gradientStops: ["#1b63e8", "#3a52d8", "#4a4fcf"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(58,82,216,0.12)", dark: "rgba(111,140,255,0.18)" },
  },
};

/** CSS gradient string for a subject (used by fills/accent-text). */
export function gradientCss(id: SubjectId, angle = "110deg"): string {
  const stops = TOKENS[id].gradientStops;
  return stops.length === 1
    ? stops[0]
    : `linear-gradient(${angle}, ${stops.join(", ")})`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/design/tokens.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/design/tokens.ts src/design/tokens.test.ts
git commit -m "feat(design): add subject token source of truth"
```

---

## Task 3: Backgrounds constant + contrast contract test

**Files:**
- Modify: `src/design/tokens.ts` (add exported `BACKGROUND`)
- Create: `src/design/tokens-contrast.test.ts`

- [ ] **Step 1: Add the background constant to `tokens.ts`**

Append to `src/design/tokens.ts`:

```ts
/** Page background per mode (mirrors --background in globals.css). */
export const BACKGROUND: ModeColor = { light: "#fbfbfd", dark: "#0f1115" };
```

- [ ] **Step 2: Write the failing contrast test**

```ts
// src/design/tokens-contrast.test.ts
import { describe, it, expect } from "vitest";
import { SUBJECTS, TOKENS, BACKGROUND } from "./tokens";
import { contrastRatio } from "./contrast";

const AA_NORMAL = 4.5;

describe("subject contrast contract (WCAG AA)", () => {
  it("on-accent is legible on the solid fill of every subject", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      expect(contrastRatio(t.onAccent, t.accentFill)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });

  it("on-accent is legible on EVERY gradient stop", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      for (const stop of t.gradientStops) {
        expect(contrastRatio(t.onAccent, stop)).toBeGreaterThanOrEqual(AA_NORMAL);
      }
    }
  });

  it("accent text is legible on the page background in both modes", () => {
    for (const id of SUBJECTS) {
      const t = TOKENS[id];
      expect(contrastRatio(t.accent.light, BACKGROUND.light)).toBeGreaterThanOrEqual(AA_NORMAL);
      expect(contrastRatio(t.accent.dark, BACKGROUND.dark)).toBeGreaterThanOrEqual(AA_NORMAL);
    }
  });
});
```

- [ ] **Step 3: Run test to verify it passes**

Run: `npx vitest run src/design/tokens-contrast.test.ts`
Expected: PASS. (If any case fails, the offending hex in `tokens.ts` must be darkened/brightened until it passes — the values in Task 2 were chosen to pass; do not weaken the thresholds.)

- [ ] **Step 4: Commit**

```bash
git add src/design/tokens.ts src/design/tokens-contrast.test.ts
git commit -m "test(design): enforce WCAG AA contrast contract on subjects"
```

---

## Task 4: `resolveSubject` + tag map

**Files:**
- Create: `src/core/domain/subject.ts`
- Test: `src/core/domain/subject.test.ts`

> Lives in `src/core/domain` (pure domain, no DOM/React) per the hexagonal boundary. Re-exports `SubjectId` from `src/design/tokens` so there is one definition.

- [ ] **Step 1: Write the failing test**

```ts
// src/core/domain/subject.test.ts
import { describe, it, expect } from "vitest";
import { resolveSubject } from "./subject";

describe("resolveSubject", () => {
  it("maps project categories", () => {
    expect(resolveSubject({ category: "systems" })).toBe("systems");
    expect(resolveSubject({ category: "interface" })).toBe("interface");
  });
  it("maps category 'both' to brand (blend deferred)", () => {
    expect(resolveSubject({ category: "both" })).toBe("brand");
  });
  it("maps known tags, case-insensitively", () => {
    expect(resolveSubject({ tags: ["LLM"] })).toBe("ai");
    expect(resolveSubject({ tags: ["architecture"] })).toBe("systems");
    expect(resolveSubject({ tags: ["UI"] })).toBe("interface");
  });
  it("prioritises ai > systems > interface when tags overlap", () => {
    expect(resolveSubject({ tags: ["ui", "ai", "backend"] })).toBe("ai");
    expect(resolveSubject({ tags: ["ui", "backend"] })).toBe("systems");
  });
  it("falls back to brand for unknown tags or empty input", () => {
    expect(resolveSubject({ tags: ["cooking"] })).toBe("brand");
    expect(resolveSubject({})).toBe("brand");
  });
  it("prefers category over tags when both present", () => {
    expect(resolveSubject({ category: "interface", tags: ["ai"] })).toBe("interface");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/domain/subject.test.ts`
Expected: FAIL — cannot find module `./subject`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/core/domain/subject.ts
import type { ProjectCategory } from "./project";
import type { SubjectId } from "@/design/tokens";

export type { SubjectId };

/** Curated tag → subject map. Priority order matters: ai > systems > interface. */
const TAG_GROUPS: { subject: SubjectId; tags: string[] }[] = [
  { subject: "ai", tags: ["ai", "ml", "llm", "machine-learning", "genai", "rag"] },
  { subject: "systems", tags: ["systems", "architecture", "backend", "infra", "distributed", "rust"] },
  { subject: "interface", tags: ["design", "frontend", "ui", "ux", "css", "react"] },
];

const CATEGORY_MAP: Record<ProjectCategory, SubjectId> = {
  systems: "systems",
  interface: "interface",
  both: "brand", // blend deferred (YAGNI)
};

export type SubjectInput = { category?: ProjectCategory; tags?: string[] };

/** Resolve content metadata to a subject id. Category wins; then tags by
 *  priority; otherwise brand. Pure — safe for server or client. */
export function resolveSubject(input: SubjectInput): SubjectId {
  if (input.category) return CATEGORY_MAP[input.category];
  const tags = (input.tags ?? []).map((t) => t.toLowerCase());
  for (const group of TAG_GROUPS) {
    if (tags.some((t) => group.tags.includes(t))) return group.subject;
  }
  return "brand";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/domain/subject.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/domain/subject.ts src/core/domain/subject.test.ts
git commit -m "feat(domain): resolve content metadata to a subject"
```

---

## Task 5: Restructure `globals.css` into the token layers + skins

**Files:**
- Modify: `src/app/globals.css`

> CSS is not unit-tested; the guard is that existing component tests stay green (Step 3) and a visual check (Step 4). The hex values MUST match `src/design/tokens.ts`. `data-subject` is placed on `<body>` (Task 6), so dark-mode skins use the descendant selector `.dark [data-subject="…"]` (the `.dark` class sits on `<html>` via next-themes).

- [ ] **Step 1: Replace the `:root` / `.dark` / `@theme` head of `globals.css`**

Replace lines 1–37 (from `@import "tailwindcss";` through the `body { … }` block) with:

```css
@import "tailwindcss";

/* Enable class-based dark mode for next-themes (Tailwind v4 syntax) */
@custom-variant dark (&:where(.dark, .dark *));

/* ── Layer 1+2: neutral primitives → semantic tokens ──────────── */
:root {
  --background: #fbfbfd;
  --foreground: #1d1d1f;
  --muted: #515154;
  --border: #e8e8ed;
  --card: #ffffff;
  --surface: #f2f2f5;

  /* Accent semantics — overridden per subject below. Default = brand. */
  --accent: #0071e3;           /* text/border accent on background */
  --accent-fill: #0a66c2;      /* solid fill (white-safe), gradient fallback */
  --accent-gradient: #0a66c2;  /* fill/accent-text background-image */
  --accent-soft: rgba(0,113,227,0.10);
  --on-accent: #ffffff;
  --ring: var(--accent);
}

.dark {
  --background: #0f1115;
  --foreground: #f5f5f7;
  --muted: #a1a1a6;
  --border: #2c2c2e;
  --card: #1a1d23;
  --surface: #15181e;

  --accent: #2997ff;
  --accent-soft: rgba(41,151,255,0.16);
  /* --accent-fill / --accent-gradient / --on-accent are mode-stable */
}

/* ── Layer 3: subject skins (values mirror src/design/tokens.ts) ── */
/* Each subject overrides only the accent group. Light first, then dark. */
[data-subject="brand"] {
  --accent: #0071e3; --accent-fill: #0a66c2; --accent-gradient: #0a66c2;
  --accent-soft: rgba(0,113,227,0.10); --on-accent: #ffffff;
}
.dark [data-subject="brand"] { --accent: #2997ff; --accent-soft: rgba(41,151,255,0.16); }

[data-subject="systems"] {
  --accent: #3a36cc; --accent-fill: #322db5; --accent-gradient: #322db5;
  --accent-soft: rgba(58,54,204,0.10); --on-accent: #ffffff;
}
.dark [data-subject="systems"] { --accent: #7c84ff; --accent-soft: rgba(124,132,255,0.16); }

[data-subject="interface"] {
  --accent: #1657d8; --accent-fill: #1657d8; --accent-gradient: #1657d8;
  --accent-soft: rgba(22,87,216,0.10); --on-accent: #ffffff;
}
.dark [data-subject="interface"] { --accent: #4f9bff; --accent-soft: rgba(79,155,255,0.16); }

[data-subject="ai"] {
  --accent: #2747d6; --accent-fill: #3a52d8;
  --accent-gradient: linear-gradient(110deg, #1b63e8, #3a52d8, #4a4fcf);
  --accent-soft: rgba(58,82,216,0.12); --on-accent: #ffffff;
}
.dark [data-subject="ai"] { --accent: #6f8cff; --accent-soft: rgba(111,140,255,0.18); }

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-card: var(--card);
  --color-surface: var(--surface);
  --color-ring: var(--ring);
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

- [ ] **Step 2: Append accent utilities + animated gradient near the end of `globals.css`**

Add before the final companion/hero sections (anywhere after `@theme`):

```css
/* ── Accent usages (resolve per active subject) ───────────────── */
/* Solid by default; gradient subjects opt into the gradient below. */
.accent-fill { background: var(--accent-fill); color: var(--on-accent); }
.accent-text { color: var(--accent); }

[data-subject="ai"] .accent-fill { background: var(--accent-gradient); }
[data-subject="ai"] .accent-text {
  background-image: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Animated flow for gradient subjects — motion only when allowed. */
@media (prefers-reduced-motion: no-preference) {
  @keyframes accent-flow { to { background-position: 300% 0; } }
  [data-subject="ai"] .accent-fill,
  [data-subject="ai"] .accent-text {
    background-size: 300% 100%;
    animation: accent-flow 8s linear infinite;
  }
}
```

- [ ] **Step 3: Verify existing tests still pass**

Run: `npx vitest run`
Expected: PASS — no test references removed tokens; `bg-background`, `text-foreground`, `text-accent`, `border-border`, `bg-card`, `text-muted` all still resolve.

- [ ] **Step 4: Visual smoke check**

Run: `npm run dev`, open `http://localhost:3000/en`. Expected: site looks identical to before (brand blue everywhere — no regression). Toggle dark mode; colors still correct.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): layer tokens into primitives, semantics, and subject skins"
```

---

## Task 6: Wire `data-subject` from content

**Files:**
- Modify: `src/app/[lang]/layout.tsx`
- Modify: `src/app/[lang]/work/[slug]/page.tsx`
- Modify: `src/app/[lang]/blog/[slug]/page.tsx`

- [ ] **Step 1: Default subject on `<body>`**

In `src/app/[lang]/layout.tsx`, change the `<body>` opening tag (line ~59) to add `data-subject="brand"`:

```tsx
      <body
        className="min-h-screen bg-background text-foreground font-sans antialiased"
        data-subject="brand"
      >
```

- [ ] **Step 2: Subject on the project page**

In `src/app/[lang]/work/[slug]/page.tsx`:
- Add import near the other domain imports (after line 6):

```tsx
import { resolveSubject } from "@/core/domain/subject";
```

- Change the `<article>` opening tag (line 57) to:

```tsx
    <article className="py-8" data-subject={resolveSubject({ category: project.category })}>
```

- [ ] **Step 3: Subject on the blog post page**

In `src/app/[lang]/blog/[slug]/page.tsx`:
- Add import (after line 9):

```tsx
import { resolveSubject } from "@/core/domain/subject";
```

- Change the `<article>` opening tag (line 65) to:

```tsx
    <article className="py-8" data-subject={resolveSubject({ tags: post.tags })}>
```

- [ ] **Step 4: Type-check + tests + build**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS (no type errors, all tests green).

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Visual check**

Run: `npm run dev`. Open a project with `category: systems` (`/en/work/<slug>`) → accent shifts to indigo on that page; open an `ai`-tagged post → AI blue. Home/about stay brand blue.

- [ ] **Step 6: Commit**

```bash
git add src/app/[lang]/layout.tsx src/app/[lang]/work/[slug]/page.tsx src/app/[lang]/blog/[slug]/page.tsx
git commit -m "feat(design): apply subject skins from content metadata"
```

---

## Task 7: Philosophy doc

**Files:**
- Create: `docs/design-system.md`

- [ ] **Step 1: Write the doc**

```markdown
# Design system

> The whole system has one rule: **everything is a declension of the brand.**
> One blue, expressed through a small set of subjects, applied through three
> layers of tokens. Nothing is a one-off.

## Three layers

1. **Primitives** — raw neutral + blue values (in `globals.css`). Never used directly.
2. **Semantic tokens** — what the UI consumes: `--background, --surface,
   --foreground, --muted, --border, --ring`, and the accent group. Mapped to
   Tailwind utilities via `@theme inline`.
3. **Subject skins** — `[data-subject="…"]` blocks that override only the accent
   group. The cascade does the rest.

## The accent group

| Token | Use |
|---|---|
| `--accent` | accent **text/borders** on the page background (per mode) |
| `--accent-fill` | solid accent **fill** — white-safe; gradient fallback |
| `--accent-gradient` | the fill/text background-image (a gradient for gradient subjects, else a color) |
| `--accent-soft` | low-alpha tint for beds/badges/hovers |
| `--on-accent` | foreground guaranteed **WCAG AA** on the fill/gradient |
| `--ring` | focus ring (= `--accent`) |

Utilities: `.accent-text` (colored or gradient-clipped text) and `.accent-fill`
(filled surface with `--on-accent` text). Gradient subjects animate a slow flow,
disabled under `prefers-reduced-motion`.

## Subjects

| Subject | Trigger | Character |
|---|---|---|
| `brand` | default / untagged | the blue · solid |
| `systems` | `category: systems`, tags architecture/backend/… | deep indigo · solid |
| `interface` | `category: interface`, tags design/frontend/ui/… | cobalt · solid |
| `ai` | tags ai/ml/llm/… | blue→indigo · **animated gradient** |

`category: both` falls back to `brand` (blend deferred). Subjects are chosen by
`resolveSubject()` (`src/core/domain/subject.ts`) and applied as `data-subject`.

## Source of truth

Color values live once in **`src/design/tokens.ts`** (also consumed by the
companion and the contrast tests). `globals.css` mirrors them. The contrast
contract (`src/design/tokens-contrast.test.ts`) fails CI if any subject breaks
WCAG AA.

## Recipe: add a new subject

1. Pick a **blue-family** accent (keep the declension principle).
2. In `src/design/tokens.ts`: add the id to `SUBJECTS` and a `TOKENS` entry —
   `accent` (light+dark), `accentFill`, `gradientStops`, `onAccent`,
   `accentSoft` (light+dark).
3. Run `npx vitest run src/design/tokens-contrast.test.ts`. Adjust hexes until
   AA passes — do not weaken thresholds.
4. Mirror the values into `globals.css` as a `[data-subject="<id>"]` block plus a
   `.dark [data-subject="<id>"]` block. If gradient, add the `[data-subject="<id>"]
   .accent-fill/.accent-text` rules (copy the `ai` pattern).
5. Add the trigger to `src/core/domain/subject.ts` (category map and/or
   `TAG_GROUPS`), with a test in `subject.test.ts`.
6. (Phase 2+) The companion picks it up automatically via the active subject.
```

- [ ] **Step 2: Commit**

```bash
git add docs/design-system.md
git commit -m "docs(design): add design-system philosophy and add-a-subject recipe"
```

---

## Self-review notes (verified against spec Part 1)

- §1.1 layering → Tasks 2, 5 (tokens.ts + globals.css three layers). ✓
- §1.2 accent group (accent / accent-solid→accent-fill / accent-soft / on-accent / accent-text) → Tasks 2, 5. Naming: spec's `accent-solid` is implemented as `--accent-fill` (clearer); `accent-text` is the `.accent-text` utility reading `--accent`. ✓
- §1.3 four subjects + `both`→brand + tag fallback + no live switcher → Tasks 4, 5. ✓
- §1.4 resolveSubject pure in `src/core`, data-subject scope → Tasks 4, 6. ✓
- §1.5 animated gradient + reduced-motion → Task 5 Step 2. ✓
- §1.6 contrast baked + AA acceptance → Tasks 1, 3. ✓
- §1.7 philosophy doc + add-a-subject recipe → Task 7. ✓
- Out of scope (site-wide switcher, blend, Storybook, avatar) correctly excluded. ✓
- Type consistency: `SubjectId` defined once in `tokens.ts`, re-exported by `subject.ts`; `resolveSubject` signature matches its test and its call sites in Task 6. ✓
```
