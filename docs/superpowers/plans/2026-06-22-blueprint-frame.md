# Blueprint Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the sparse, peripheral "blueprint frame" — one overall dimension (768 / 24) at the top of the content, a designed title block + drafting marks in the footer — as crisp DOM/SVG components, leaving page content un-annotated.

**Architecture:** Three small presentational React components (`Dimension`, `TitleBlock`, `DraftingMarks`) in one focused module, styled by a `.bp-*` block in `globals.css` using the existing `--bp-ink` tokens. The `Dimension` mounts absolutely in the top padding of `<main>` (spans the 768 column box); `TitleBlock` + `DraftingMarks` mount in the `Footer` (the "sheet strip"). All decorative/`aria-hidden`, static (unaffected by reduced-motion), and the canvas `BlueprintField` is untouched.

**Tech Stack:** Next.js (modified fork — see Global Constraints), React, CSS in `globals.css`, Vitest + Testing Library, Storybook.

## Global Constraints

- **This is a modified Next.js.** Before editing `layout.tsx` / `footer.tsx` or writing components, skim the relevant guide in `node_modules/next/dist/docs/`. These are presentational server components (no `"use client"` needed).
- **No new runtime dependencies.**
- **Mono only, except one sanctioned accent:** all frame ink uses `--bp-ink` (theme-aware). The single exception is the title block's top **accent hairline**, which uses `var(--subject-accent)`.
- **Frame is a peripheral layer, content stays clean** — do NOT annotate individual content components.
- **Decorative:** every frame root element is `aria-hidden="true"` and non-interactive.
- **Static:** no animation; no `prefers-reduced-motion` branch needed (it does not move).
- **Desktop-only flourish:** the frame is hidden below 900px viewport width (mobile stays clean and avoids the column-shrink dimension mismatch).
- **Exact values:** column dimension label = `768` (from `BP.COLUMN`), gutter = `24` (from `BP.GUTTER`). Title block fields come from `BP_FRAME` (Task 1).
- **Commits:** Conventional Commits, imperative, scoped. Commit after each task. End commit message bodies with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Test commands: single file `npx vitest run <path>`; full suite `npm test`; types `npx tsc --noEmit`; lint `npm run lint`.

---

### Task 1: Frame config + CSS

**Files:**
- Modify: `src/design/blueprint.ts` (append a `BP_FRAME` export)
- Modify: `src/app/globals.css` (append a `/* Blueprint frame */` block near the existing `--bp-ink` / `.page-aura` rules)

**Interfaces:**
- Consumes: nothing.
- Produces: `BP_FRAME` — `{ name:string; title:string; rev:string; sheet:string; scale:string; status:string }`; the `.bp-dim`, `.bp-tb`, `.bp-marks` CSS classes used by Task 2.

- [ ] **Step 1: Append the frame config to `src/design/blueprint.ts`**

```ts
// Title-block fields for the blueprint frame (mono drafting plate).
export const BP_FRAME = {
  name: "TITOUAN LEBOCQ",
  title: "Portfolio",
  rev: "2026.06",
  sheet: "01 / 04",
  scale: "1 : 1",
  status: "LIVE",
} as const;
```

- [ ] **Step 2: Append the CSS to `src/app/globals.css`** (after the `--bp-ink` block from the existing feature)

```css
/* ── Blueprint frame — peripheral drafting annotations (DOM, mono) ───── */
:root { --bp-mono: ui-monospace, SFMono-Regular, Menlo, monospace; }
.bp-dim, .bp-tb, .bp-marks { pointer-events: none; }

/* overall dimension — absolute in the top padding of <main>, spans the 768 column box */
.bp-dim { position: absolute; left: -24px; right: -24px; top: 6px; z-index: 1; font-family: var(--bp-mono); }
.bp-dim__line, .bp-dim__gutter { display: flex; align-items: center; }
.bp-dim__gutter { position: relative; width: 24px; margin-top: 9px; }
.bp-dim .bp-ln { flex: 1; height: 0; border-top: 1px solid rgba(var(--bp-ink), .34); }
.bp-dim .bp-v { font-size: 10px; letter-spacing: .05em; padding: 0 8px; color: rgba(var(--bp-ink), .6); }
.bp-dim__gutter .bp-v { position: absolute; left: 30px; }
.bp-arr { width: 0; height: 0; border-top: 3px solid transparent; border-bottom: 3px solid transparent; }
.bp-arr.l { border-right: 6px solid rgba(var(--bp-ink), .34); }
.bp-arr.r { border-left: 6px solid rgba(var(--bp-ink), .34); }

/* title block — designed plate, bottom-right of the footer strip */
.bp-tb { position: absolute; right: 0; bottom: 24px; width: 316px; border: 1px solid rgba(var(--bp-ink), .34);
  background: rgba(var(--bp-ink), .035); font-family: var(--bp-mono); }
.bp-tb { border-top: 2px solid var(--subject-accent, #0071e3); }      /* the one sanctioned accent */
.bp-tb__head { display: flex; align-items: baseline; justify-content: space-between; padding: 9px 12px; border-bottom: 1px solid rgba(var(--bp-ink), .34); }
.bp-tb__name { font-weight: 600; font-size: 12px; letter-spacing: .05em; color: rgba(var(--bp-ink), .92); }
.bp-tb__idx { font-size: 10px; color: rgba(var(--bp-ink), .58); }
.bp-tb__grid { display: grid; grid-template-columns: 1fr 1fr; }
.bp-tb__grid > div { padding: 7px 12px; border-right: 1px solid rgba(var(--bp-ink), .34); }
.bp-tb__grid > div:nth-child(2n) { border-right: 0; }
.bp-tb__grid > div:nth-child(n+3) { border-top: 1px solid rgba(var(--bp-ink), .34); }
.bp-tb__grid b { display: block; font-size: 8px; letter-spacing: .14em; color: rgba(var(--bp-ink), .58); font-weight: 600; }
.bp-tb__grid s { display: block; text-decoration: none; font-size: 12px; color: rgba(var(--bp-ink), .92); margin-top: 2px; }

/* drafting marks — registration crosshair + scale bar, bottom-left of the footer strip */
.bp-marks { position: absolute; left: 0; bottom: 24px; display: flex; align-items: flex-end; gap: 18px; }
.bp-reg { width: 18px; height: 18px; position: relative; }
.bp-reg::before, .bp-reg::after { content: ""; position: absolute; background: rgba(var(--bp-ink), .34); }
.bp-reg::before { left: 8px; top: -3px; bottom: -3px; width: 1px; }
.bp-reg::after { top: 8px; left: -3px; right: -3px; height: 1px; }
.bp-reg i { position: absolute; inset: 2px; border: 1px solid rgba(var(--bp-ink), .34); border-radius: 50%; }
.bp-scale { font-family: var(--bp-mono); font-size: 9px; color: rgba(var(--bp-ink), .58); }
.bp-scale__bar { display: flex; height: 8px; width: 96px; border: 1px solid rgba(var(--bp-ink), .34); border-radius: 1px; overflow: hidden; }
.bp-scale__bar span { flex: 1; border-right: 1px solid rgba(var(--bp-ink), .34); }
.bp-scale__bar span:last-child { border-right: 0; }
.bp-scale__bar span:nth-child(odd) { background: rgba(var(--bp-ink), .16); }
.bp-scale__cap { display: flex; justify-content: space-between; width: 96px; margin-top: 3px; }

@media (max-width: 900px) { .bp-dim, .bp-tb, .bp-marks { display: none; } }
```

- [ ] **Step 3: Verify it typechecks/lints**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/design/blueprint.ts src/app/globals.css
git commit -m "feat(blueprint): add frame config and drafting-annotation styles"
```

---

### Task 2: Frame components (Dimension, TitleBlock, DraftingMarks)

**Files:**
- Create: `src/components/blueprint/blueprint-frame.tsx`
- Test: `src/components/blueprint/blueprint-frame.test.tsx`
- Create: `src/components/blueprint/blueprint-frame.stories.tsx`

**Interfaces:**
- Consumes: `BP` (`BP.COLUMN`, `BP.GUTTER`) and `BP_FRAME` from `src/design/blueprint.ts`; the `.bp-*` CSS from Task 1.
- Produces:
  - `Dimension(): JSX.Element` — the overall + gutter dimension.
  - `TitleBlock(props: { lang: string }): JSX.Element` — the ledger plate.
  - `DraftingMarks(): JSX.Element` — registration crosshair + scale bar.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/blueprint/blueprint-frame.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Dimension, TitleBlock, DraftingMarks } from "@/components/blueprint/blueprint-frame";

describe("Dimension", () => {
  it("shows the 768 column and 24 gutter measurements, decorative", () => {
    const { container } = render(<Dimension />);
    expect(screen.getByText("768")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("TitleBlock", () => {
  it("renders the name, static fields, and the current language, decorative", () => {
    const { container } = render(<TitleBlock lang="fr" />);
    expect(screen.getByText("TITOUAN LEBOCQ")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("2026.06")).toBeInTheDocument();
    expect(screen.getByText("FR")).toBeInTheDocument(); // lang upper-cased
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("DraftingMarks", () => {
  it("renders the scale bar caption, decorative", () => {
    const { container } = render(<DraftingMarks />);
    expect(screen.getByText("96px")).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/blueprint/blueprint-frame.test.tsx`
Expected: FAIL — `Cannot find module '@/components/blueprint/blueprint-frame'`.

- [ ] **Step 3: Write the components**

```tsx
// src/components/blueprint/blueprint-frame.tsx
import { BP, BP_FRAME } from "@/design/blueprint";

// Overall column dimension (768) + gutter sub-dimension (24). Mono, static, decorative.
export function Dimension() {
  return (
    <div className="bp-dim" aria-hidden="true">
      <div className="bp-dim__line">
        <i className="bp-arr l" /><span className="bp-ln" />
        <b className="bp-v">{BP.COLUMN}</b>
        <span className="bp-ln" /><i className="bp-arr r" />
      </div>
      <div className="bp-dim__gutter">
        <i className="bp-arr l" /><span className="bp-ln" /><i className="bp-arr r" />
        <b className="bp-v">{BP.GUTTER}</b>
      </div>
    </div>
  );
}

// Designed title-block plate (ledger). Accent hairline is the one sanctioned colour.
export function TitleBlock({ lang }: { lang: string }) {
  const rows: Array<[string, string]> = [
    ["TITLE", BP_FRAME.title],
    ["REV", BP_FRAME.rev],
    ["SHEET", BP_FRAME.sheet],
    ["LANG", lang.toUpperCase()],
    ["SCALE", BP_FRAME.scale],
    ["STATUS", BP_FRAME.status],
  ];
  return (
    <div className="bp-tb" aria-hidden="true">
      <div className="bp-tb__head">
        <span className="bp-tb__name">{BP_FRAME.name}</span>
        <span className="bp-tb__idx">{BP_FRAME.sheet}</span>
      </div>
      <div className="bp-tb__grid">
        {rows.map(([k, v]) => (
          <div key={k}><b>{k}</b><s>{v}</s></div>
        ))}
      </div>
    </div>
  );
}

// Registration crosshair + scale bar.
export function DraftingMarks() {
  return (
    <div className="bp-marks" aria-hidden="true">
      <span className="bp-reg"><i /></span>
      <span className="bp-scale">
        <span className="bp-scale__bar"><span /><span /><span /><span /></span>
        <span className="bp-scale__cap"><span>0</span><span>96px</span></span>
      </span>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/blueprint/blueprint-frame.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Add a Storybook story** (matches the repo convention of one `.stories.tsx` per component)

```tsx
// src/components/blueprint/blueprint-frame.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Dimension, TitleBlock, DraftingMarks } from "./blueprint-frame";

const meta: Meta = { title: "Blueprint/Frame" };
export default meta;

export const Dimension_: StoryObj = { name: "Dimension", render: () => (
  <div style={{ position: "relative", height: 80 }}><Dimension /></div>
) };
export const TitleBlock_: StoryObj = { name: "TitleBlock", render: () => (
  <div style={{ position: "relative", height: 200 }}><TitleBlock lang="en" /></div>
) };
export const DraftingMarks_: StoryObj = { name: "DraftingMarks", render: () => (
  <div style={{ position: "relative", height: 80 }}><DraftingMarks /></div>
) };
```

- [ ] **Step 6: Verify types/lint, then commit**

Run: `npx tsc --noEmit && npm run lint && npx vitest run src/components/blueprint/blueprint-frame.test.tsx`
Expected: clean; 3 tests pass.

```bash
git add src/components/blueprint/blueprint-frame.tsx src/components/blueprint/blueprint-frame.test.tsx src/components/blueprint/blueprint-frame.stories.tsx
git commit -m "feat(blueprint): add frame components (dimension, title block, drafting marks)"
```

---

### Task 3: Mount the frame (layout + footer) and verify live

**Files:**
- Modify: `src/app/[lang]/layout.tsx` (make `<main>` relative; render `<Dimension/>` as its first child)
- Modify: `src/components/footer.tsx` (make footer relative + room; render `<DraftingMarks/>` and `<TitleBlock lang={lang}/>`)

**Interfaces:**
- Consumes: `Dimension`, `TitleBlock`, `DraftingMarks` from Task 2.
- Produces: the frame rendered site-wide.

- [ ] **Step 1: Mount the Dimension in the layout**

In `src/app/[lang]/layout.tsx`, import the component and render it at the top of `<main>`, and add `relative` so the absolute dimension anchors to main's padding box:

```tsx
import { Dimension } from "@/components/blueprint/blueprint-frame";
```
```tsx
// change the <main> opening tag and add Dimension as the first child:
<main id="main" className="relative flex-1 py-8 animate-in">
  <Dimension />
  {children}
</main>
```

- [ ] **Step 2: Mount the title block + marks in the footer**

In `src/components/footer.tsx`, import the components, add `relative` + bottom room to the `<footer>`, and render the two frame pieces as the last children:

```tsx
import { TitleBlock, DraftingMarks } from "@/components/blueprint/blueprint-frame";
```
```tsx
// change the <footer> className (add `relative pb-44`) and append the frame pieces
// before </footer>:
<footer className="relative flex flex-col gap-3 border-t border-border py-8 pb-44 text-sm text-muted sm:flex-row sm:items-center sm:justify-between" data-bp-clear>
  {/* …existing copy + nav + socials unchanged… */}
  <DraftingMarks />
  <TitleBlock lang={lang} />
</footer>
```
(Keep all existing footer content; only the className changes and the two components are appended.)

- [ ] **Step 3: Verify types, lint, full suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: clean; all tests pass (existing footer test still passes — only a className changed and decorative children were added).

- [ ] **Step 4: Verify live (manual — the frame is visual)**

Run `npm run dev`, open the homepage in a real browser:
- **Top:** the `768` dimension with arrowheads + value breaking the line, and the `24` gutter sub-dimension at the left, sitting in the band below the nav / above the hero — not overlapping either.
- **Footer (scroll down):** the title-block plate bottom-right (name + `01 / 04`, accent hairline on top, the `TITLE/REV/SHEET/LANG/SCALE/STATUS` ledger), and the registration crosshair + `0–96px` scale bar bottom-left — all in the footer's bottom band, not overlapping the footer text or the CTA.
- Toggle **dark mode**: ink switches to the light-blue token; accent hairline tracks the page subject.
- Narrow the window below ~900px: the entire frame disappears (mobile stays clean).
- Confirm the canvas grid / convergence / reveal still behave (frame did not disturb them).

- [ ] **Step 5: Commit**

```bash
git add src/app/[lang]/layout.tsx src/components/footer.tsx
git commit -m "feat(blueprint): mount the dimension, title block and drafting marks frame"
```

---

## Self-Review

**Spec coverage (§10):** peripheral frame, content clean → Tasks 2–3 (frame components mounted at edges only); DOM/SVG not canvas → Task 2 (React/CSS components); overall `768` + `24` dimension once, top → Dimension (Tasks 2–3, Step 1); Ledger title block + accent hairline → TitleBlock + Task 1 CSS (`border-top` accent); drafting marks (registration + scale bar) → DraftingMarks; mono except accent → Task 1 CSS (`--bp-ink` everywhere, `--subject-accent` only on `.bp-tb` border-top); decorative/`aria-hidden` + static → Task 2 (all roots `aria-hidden`, no animation); architecture (small components in layout + footer) → Tasks 2–3; desktop-only → Task 1 media query. No gaps.

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `Dimension()`, `TitleBlock({lang})`, `DraftingMarks()` are defined in Task 2 and imported with those exact names/props in Task 3. `BP.COLUMN`/`BP.GUTTER`/`BP_FRAME.*` match the existing token module + Task 1 additions. CSS class names (`bp-dim`, `bp-dim__line`, `bp-ln`, `bp-v`, `bp-arr`, `bp-dim__gutter`, `bp-tb`, `bp-tb__head/__name/__idx/__grid`, `bp-marks`, `bp-reg`, `bp-scale`, `bp-scale__bar/__cap`) are identical between Task 1 (CSS) and Task 2 (JSX).
