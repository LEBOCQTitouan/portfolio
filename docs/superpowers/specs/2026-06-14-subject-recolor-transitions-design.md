# Subject-recolor page transitions — design

**Date:** 2026-06-14
**Status:** Approved (brainstorm)
**Branch:** `subject-color-page-transitions` (based on `avatar-mascot-design-system`)

## Problem

Client-side App Router navigation swaps one page for another instantly. When a
visitor moves from a brand (blue) page to a systems (teal), interface (pink), or
ai (violet) page, the subject recolor currently *snaps*: the `.page-aura`
`--aura-tint`/`--aura-glow` custom properties and the accent tokens change with
no tween (custom properties don't animate without `@property`). The recolor
reads as a flicker, not a designed decision.

## Goal & feel

A restrained, fast client-side transition whose primary job is to make the
subject color change feel **intentional** — an authored gesture, not a bug. The
transition *is* the aura and the page heading visibly performing the recolor.
Senior systems+interface portfolio: never gimmicky.

## Decisions (locked during brainstorm)

1. **Gesture = anchored headline morph (B).** The page's primary heading is the
   through-line: on navigation it travels + resizes from its old slot to its new
   one and recolors to the new subject. The one element that survives the
   navigation is the one that visibly changes color. Everything else crossfades.
2. **Mechanism = native View Transitions (i),** via React's `<ViewTransition>`
   component + `experimental.viewTransition: true`. Chosen over a custom FLIP
   layer because the browser snapshots the *outgoing* DOM automatically — a
   custom approach can't easily capture the old heading after React unmounts it.
   Verified viable against the bundled Next 16 docs
   (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).

## Verification findings (verify-then-commit)

- **Next 16.2.6** documents View Transitions for the App Router. Route
  navigations are React Transitions, so `<ViewTransition>` animations activate
  automatically. Enabled with `experimental: { viewTransition: true }`.
- **React export split (important).** The app's standalone `react@19.2.4` does
  **not** export `ViewTransition`. Next's **vendored** compiled React
  (`next/dist/compiled/react`, which the App Router bundle uses) **does**. So the
  feature works in the Next build/runtime, but **Vitest and `tsc` resolve the
  standalone react** and would break on a direct `import { ViewTransition } from
  "react"`. The wrapper must import defensively (namespace import + runtime
  fallback). This is the single most important constraint in the design.
- **Types.** `@types/react@19.2.15` declares `ViewTransition` only in
  `experimental.d.ts`, not the default surface. The wrapper carries a local cast
  so `tsc --noEmit` stays clean without forcing experimental types project-wide.
- **Headings inventory** (morph anchors — every route has a primary heading):
  - Home `/`: hero `h1` (`src/components/landing/hero.tsx:16`).
  - `/work`: `h1` (`src/app/[lang]/work/page.tsx:46`).
  - `/work/[slug]`: hero `h1` (`src/app/[lang]/work/[slug]/page.tsx:64`).
  - `/blog`, `/blog/tags/[tag]`, `/blog/[slug]`, `/about`, `/now`, `/uses`: each
    has an `h1` page title.
  - Shared element: `src/components/project-card.tsx:11` (card title link) →
    work detail hero `h1`.

## Architecture

Hexagonal: pure naming logic stays free of React; a single thin React wrapper is
the only View-Transitions-aware unit.

### 1. Pure transition-name helpers — `src/lib/transitions/names.ts`

```ts
export const PAGE_TITLE = "page-title";  // generic heading through-line
export const PAGE_AURA = "page-aura";    // the ambient field
export function workTitleName(slug: string): string {
  return `work-title-${slug}`;           // card ↔ hero shared element
}
```

Pure strings; trivially unit-tested. No React import.

### 2. `<MorphTitle>` wrapper — `src/components/transitions/morph-title.tsx`

The only unit that touches `ViewTransition`. Defensive import so it is correct in
the Next bundle and safe under Vitest/tsc:

```tsx
import * as React from "react";

type VTProps = { name?: string; share?: string; children: React.ReactNode };
const Native = (React as unknown as { ViewTransition?: React.ComponentType<VTProps> })
  .ViewTransition;
function Passthrough({ children }: VTProps) { return <>{children}</>; }
const VT = Native ?? Passthrough;

export function MorphTitle({ name, children }: { name: string; children: React.ReactNode }) {
  return <VT name={name} share="morph">{children}</VT>;
}
```

- In the Next build → `Native` is defined → real morph.
- Under Vitest/tsc → `Native` is `undefined` → `Passthrough` renders children;
  the bogus `name`/`share` props are dropped by `Passthrough` (NOT
  `React.Fragment`, which would warn on extra props). No throw, no DOM noise.
- Server-component safe (the Next docs use `<ViewTransition>` in async server
  components). No `"use client"` needed.

### 3. Applying names

- **Headings:** wrap each route's primary heading text in `<MorphTitle
  name={PAGE_TITLE}>`. Navigating between any two pages morphs the heading
  (position + size + color) — the anchored headline gesture.
- **Work shared element:** the project-card title and the work detail hero use
  `<MorphTitle name={workTitleName(slug)}>` instead of `PAGE_TITLE`. The hero
  therefore morphs from the *clicked card*, not the index page title. Other cards
  crossfade. (`view-transition-name` must be unique among elements rendered at
  transition time; per-slug names guarantee this.)
- **Aura:** the `.page-aura` element in `src/app/[lang]/layout.tsx` gets
  `style={{ viewTransitionName: PAGE_AURA }}`. It is a persistent layout element
  whose computed background changes via `body:has([data-subject]) .page-aura`;
  naming it lets us tune its color crossfade independently.

### 4. Config — `next.config.ts`

Add `experimental: { viewTransition: true }` to the existing `NextConfig`
(alongside the OpenNext Cloudflare dev hook, which is untouched).

## CSS (`src/app/globals.css`)

Appended after the existing aura/companion rules.

- **Aura — the deliberate beat.** Longer, eased color crossfade so the ambient
  field visibly settles into the new subject:
  ```css
  ::view-transition-group(page-aura) { animation-duration: 550ms; }
  ::view-transition-old(page-aura),
  ::view-transition-new(page-aura) {
    animation-timing-function: cubic-bezier(.6,.02,.2,1);
  }
  ```
- **Heading morph — softened.** `share="morph"` assigns the `.morph` class:
  ```css
  ::view-transition-group(.morph) { animation-duration: 420ms; }
  ::view-transition-image-pair(.morph) { animation-name: via-blur; }
  @keyframes via-blur { 30% { filter: blur(3px); } }
  ```
- **Reduced motion / a11y.** Instant recolor, no movement:
  ```css
  @media (prefers-reduced-motion: reduce) {
    ::view-transition-old(*), ::view-transition-new(*), ::view-transition-group(*) {
      animation-duration: 0s !important; animation-delay: 0s !important;
    }
  }
  ```
- The default `root` crossfade (automatic) carries general content; we rely on it
  rather than adding per-route directional animations.

## Data flow

1. User clicks a `<Link>` → App Router starts a React Transition.
2. React captures old-DOM snapshots for every `view-transition-name` + `root`.
3. New page renders (server components stream in); `data-subject` on the new
   `<article>` flips the `:has()` rules → aura + accent tokens resolve to the new
   subject in the new snapshot.
4. Browser tweens: aura color crossfades (550ms, eased); heading morphs
   position/size and crossfades color (420ms, blurred); root crossfades the rest.
5. On the work journey, the per-slug name pairs the clicked card with the hero.

## Scope

**In:** config flag; pure name helpers + tests; `MorphTitle` wrapper + test;
heading wrapping across routes; card↔hero shared element; aura naming; globals.css
view-transition rules incl. reduced-motion; build/tsc verification.

**Out (YAGNI):** directional forward/back slides (`transitionTypes`,
`addTransitionType`); Suspense skeleton choreography; **any companion-orb change**
— the transition stays independent of the (mood-colored) orb per constraint
"cooperate but don't depend"; we add no coupling, leaving the door open for a
later orb cue.

## Testing

- **Pure helpers** (`names.ts`): full unit coverage — `PAGE_TITLE`/`PAGE_AURA`
  constants and `workTitleName(slug)` output. (Vitest)
- **`MorphTitle`**: renders its children and does not throw when the native
  `ViewTransition` is absent (the Vitest environment) — proves the fallback path
  used by tsc/Vitest is safe. (React Testing Library)
- **Not unit-testable, stated explicitly:** jsdom implements neither the View
  Transitions API nor Next's vendored React, so the *actual* morph/crossfade
  animation cannot be asserted in a unit test. It is verified by `npm run build`
  succeeding and by visual review (headless-Chrome screenshots over a static
  server).
- Existing suites (companion, narration, subject, tokens) must stay green.

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| OpenNext/Cloudflare rejects `experimental.viewTransition` | Verify `npm run build`; flag is a build-time React integration, expected compatible. |
| `tsc` errors on `ViewTransition` type | Local cast inside the one wrapper; no project-wide experimental types. |
| Test/SSR breakage from missing standalone-react export | Namespace import + `Passthrough` fallback; covered by the `MorphTitle` test. |
| Hydration flash | Names are static strings, `ViewTransition` is render-time only; SSR renders children unchanged. |
| Duplicate `view-transition-name` at transition time | Per-slug names for the work pair; one `PAGE_TITLE`/`PAGE_AURA` each per page. |

## Acceptance criteria

- `npx vitest run`, `npx tsc --noEmit`, `npm run build` all pass.
- Navigating brand→systems→interface→ai shows the aura settling into the new
  color and the heading morphing+recoloring; reduced-motion shows an instant,
  motion-free recolor.
- No hydration warnings; existing behavior (companion, aura, badges) unchanged.
- Work index→detail morphs the clicked card title into the hero.
- Left on the branch, not merged.
```
