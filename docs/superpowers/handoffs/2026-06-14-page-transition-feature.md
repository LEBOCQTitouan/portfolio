# Handoff — "Intentional color" page transitions

Paste the block below as the first message of a fresh session to brainstorm + build this feature.

---

I want to design and build **page-to-page transitions** for my portfolio whose primary job is to make the **subject color change feel intentional** — so when a visitor navigates from a blue (brand) page to a teal (systems) or pink (interface) or violet (AI) page, the recolor reads as a deliberate, designed moment, not a flicker or a bug.

Please run the full superpowers cycle: **brainstorming → writing-plans → subagent-driven execution**, with the visual companion (I like reviewing mockups; note the local visual server tends to die — headless-Chrome screenshots served over a small static server worked well last time).

## Project context (already in place)
- **Stack:** Next.js **16** (App Router — treat as unfamiliar/breaking; read `node_modules/next/dist/docs/` before writing code), React 19, **Tailwind v4** (theme via `@theme inline` in `src/app/globals.css`, no config file), TypeScript, Vitest, deployed to **Cloudflare** via OpenNext. **i18n:** routes are `/[lang]/...` (en/fr). **Architecture:** hexagonal (pure domain in `src/core`, deps point inward).
- **Design system (shipped):** three token layers (primitives → semantic → subject skins). Source of truth: `src/design/tokens.ts`; mirrored in `globals.css`. Subjects: **brand=blue, systems=teal, interface=pink/coral, ai=violet→cyan animated gradient**. Subject is chosen by `resolveSubject({category?,tags?})` (`src/core/domain/subject.ts`) and applied as `data-subject` on `<body>` (brand default) and on the content `<article>` (per project/blog page).
- **Page aura (shipped):** a single fixed `.page-aura` layer recolored per page via `body:has([data-subject="…"]) .page-aura` — a subtle global background **tint + top-right glow** in the active subject color. Conceptual model: **the page is the light source; the companion orb is a *lens* that diffracts that light.**
- **Badges (shipped):** the subject-determining badge/tags (`CategoryBadge`, `TagPill`) are filled with the subject's `--accent-soft`, so the page's color has a visible on-page cause.
- **Companion (Phase 2, NOT done yet):** an eyes-only "orb-as-lens" that wears/diffracts the subject. Travels hero→gutter→dock. The transition design should *cooperate* with it (the orb may lead the transition), but don't depend on Phase 2 being finished.
- **Reference docs:** `docs/design-system.md`; specs in `docs/superpowers/specs/` (`…avatar-and-design-system…`, `…subject-palette-and-page-aura…`); plans in `docs/superpowers/plans/`.

## Goal & feel
A smooth transition on client-side navigation that **foregrounds the color change**. The new subject's aura/accent should arrive as a deliberate gesture. Subtlety still matters (this is a senior systems+interface portfolio) — restrained, fast, never gimmicky.

## Constraints
- Client-side App Router navigation (no full reload). Consider the **View Transitions API** (check Next 16 support in the bundled docs) vs a custom motion layer.
- **Respect `prefers-reduced-motion`** (fall back to an instant or minimal cross-fade).
- **SSR-correct**, no hydration flash; keep **WCAG AA** intact during/after the transition.
- Don't fight the existing `.page-aura` / `:has()` recolor or the orb-as-lens model — ideally the transition is the aura/orb *doing* the recolor visibly.

## Idea seeds (for brainstorming, not prescriptions)
- Aura **bloom/wipe**: the new subject color radiates out from the orb (the lens) or from the just-clicked badge, replacing the old aura.
- **Orb-led**: the lens pulses/streaks and the page color follows it.
- View-Transitions **cross-fade keyed to subject**, with the accent as the transition tint.
- A brief **accent sweep** across the viewport in the new subject color.

## Deliverables
Spec (`docs/superpowers/specs/`), plan (`docs/superpowers/plans/`), tests, and an implementation that passes `npx vitest run`, `npx tsc --noEmit`, and `npm run build`. Don't merge; leave it on a branch.
