# Avatar end-product + subject-adaptive design system

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Supersedes/extends:** `2026-05-31-companion-orb-design.md`, `2026-06-01-companion-placement-design.md`

## Summary

Two related deliverables, built in this order:

1. **A subject-adaptive design system.** A three-layer token architecture
   (primitives → semantic → subject skins) where *everything is a declension of
   the brand blue*. Each "subject" (Brand, Systems, Interface, AI) is a small
   override of the accent + contrast tokens, chosen automatically from content
   metadata. Includes a written philosophy doc so future subjects extend the
   system consistently.

2. **The avatar end-product** — the existing orb evolved into "the orb with
   eyes": an eyes-only companion with section moods, gaze, an idle
   "fighting-sleep" sequence, a dream state, and click-disturbance/anger
   reactions. **The avatar consumes the design system** — its colors are
   declensions of the active subject skin, not hardcoded.

3. **A component workshop + public showcase.** **Storybook** as the dev/CI
   workshop (isolation, a11y, skin toolbar, Vitest-backed tests), and a
   **public, bilingual `/design-system` route** in the app that presents the
   system as a designer's case study — the *thinking*, not just a gallery.

The design system ships first because the avatar (and the showcase) depend on
it.

---

## Part 1 — Design system

### 1.1 Layering

Three layers, each deriving from the one above. Only layer 2 is consumed by
application code.

1. **Primitives** — raw values, no semantics. Brand blue scale, neutral scale,
   and the blue-family accent hues, defined for light and dark. Nobody styles
   against these directly.
2. **Semantic tokens** — the contract the whole UI uses:
   `--background, --surface, --foreground, --muted, --border, --ring`,
   the accent group (below), and the non-color scales
   (`--space-*, --radius-*, --shadow-*, --font-*, --motion-*, --z-*`).
   Mapped from primitives.
3. **Subject skins** — a closed set. Each skin overrides only the **accent
   group** (and nothing else needed for coherence). Applied via
   `data-subject="…"` on a scope element; CSS variable cascade does the rest.

This replaces today's flat 6-variable setup (`background, foreground, accent,
muted, border, card` in `globals.css`) — those become a subset of layer 2.

### 1.2 The accent group (the core contract)

"Accent" is **one concept that resolves per subject** into three usages — fill,
border, and text — and may be **solid or an animated gradient**, always
contrast-checked.

| Token | Meaning |
|---|---|
| `--accent` | The accent as used for **fills** and **text**. Solid color *or* a gradient (`linear-gradient(...)`). |
| `--accent-solid` | A **flat fallback** color for contexts a gradient can't render (borders, rings, `currentColor`, 1px lines, focus outline). For solid subjects, equals `--accent`. |
| `--accent-soft` | Low-alpha tint of the accent for hover beds, badges, subtle surfaces. |
| `--on-accent` | Foreground color guaranteed **WCAG AA** against the accent (every gradient stop). White for the blue subjects; a skin may declare a dark value if a stop is too light. |
| `--accent-text` | Accent color tuned for **legible text on the page background** at small sizes (may differ from `--accent`). Accent-as-text is otherwise reserved for large/bold. |

**Usage rules**
- **Fill:** `background: var(--accent)` (supports gradient). Text on it uses `var(--on-accent)`.
- **Border / ring / outline:** use `var(--accent-solid)` (gradient borders are avoided for simplicity; gradient `border-image` is out of scope).
- **Accented text (large/bold — headings, links, logo, keywords):** gradient subjects use `background-clip: text` with `--accent`; solid subjects set `color: var(--accent)`. Never on body copy.
- **Accented text (small):** use `var(--accent-text)`.

### 1.3 The subjects (closed set)

All hues are blue-family declensions of the brand. Exact hex finalized in
implementation (starting points below; light + dark variants required).

| Subject | `data-subject` | Trigger | Accent | `on-accent` |
|---|---|---|---|---|
| **Brand** (default) | `brand` | home, about, uses, now, contact, untagged, fallback | solid blue (`#0071e3` / `#2997ff`) | white |
| **Systems** | `systems` | `project.category === "systems"`; posts tagged systems/architecture/backend | solid indigo (`~#2f3fd4` / `#5b78ff`) | white |
| **Interface** | `interface` | `project.category === "interface"`; posts tagged design/frontend/ui | solid azure (`~#2f7dff` / `#49b6ff`) | white |
| **AI** | `ai` | posts/projects tagged ai/ml/llm | **animated** subtle blue gradient (`#2b8cff → #4f7cff → #6a7dff`) | white |

- **`project.category === "both"`** → falls back to **Brand** (blue). A
  systems↔interface blend is explicitly **deferred** (YAGNI).
- **Free-form post tags** never break the system: a curated `tag → subject` map
  resolves known tags; everything unmapped → **Brand**.
- **No live user theme switcher** (deferred; the layering makes it promotable
  later).

### 1.4 Subject resolution

- A pure function `resolveSubject(input): SubjectId` maps content metadata to a
  subject id. Inputs: `project.category`, the curated tag map, and route.
  Default `brand`. Fully unit-testable, no DOM.
- The resolved id is set as `data-subject` on the page/section scope (e.g. the
  route layout, or per project/post). The CSS cascade applies the skin.
- Lives in `src/core` (domain-adjacent, pure) per the hexagonal boundary; the
  React layer only reads the result and sets the attribute.

### 1.5 Animated gradient

- Gradient accents animate a slow horizontal flow (`background-position` over an
  oversized `background-size`), ~7–9s, `linear infinite`.
- **Respects `prefers-reduced-motion`**: the animation is disabled (static
  gradient) under reduced motion, consistent with the rest of the site.
- Subtle by design: close, related blue stops — a gentle shimmer, not a rainbow.

### 1.6 Contrast, baked in

- Each skin **declares** its `on-accent` and `accent-text`; these are not
  guessed at call sites.
- Acceptance: every accent/`on-accent` pair and every gradient stop vs.
  `on-accent` meets **WCAG AA** (≥4.5:1 normal text, ≥3:1 large/UI). The
  blue-family palette makes white-on-accent pass everywhere; the rule still
  lives in the skin so a future non-blue subject is forced to declare a safe
  pairing.

### 1.7 Philosophy doc (deliverable)

`docs/design-system.md` — a first-class, committed document containing:
- The "everything is a declension of the brand" principle and the three layers.
- The full semantic-token contract and the accent group.
- The contrast rules (what each skin must declare).
- **A step-by-step recipe to add a new subject:** pick a blue-family accent →
  declare `accent`, `accent-solid`, `accent-soft`, `on-accent`, `accent-text`
  for light + dark → add the trigger to `resolveSubject` / the tag map →
  verify AA. With a worked example.

---

## Part 2 — The avatar ("the orb with eyes")

The existing orb (`src/components/companion/*`) evolves; placement, mute,
reduced-motion, i18n, narration, hero-aura→travel, gutter/dock all stay.

### 2.1 Form

- A refined glowing orb with **eyes only** — no mouth, no brows. The eyes carry
  all expression (blink, squint, curve, dart, droop, close).
- Visual quality (light, depth) is elevated in a dedicated polish pass; the
  brainstorm sketches are direction only, not final art.

### 2.2 Colors come from the design system

- `moods.ts` stops hardcoding rgba. The orb's base color is the **active
  subject's accent** (so the orb wears Brand/Systems/Interface/AI — the AI orb
  *is* the animated blue gradient).
- **Moods become tonal shifts** within the active accent, not separate palettes:
  - `calm` — open relaxed eyes, base accent.
  - `warm` — happy curved eyes, slightly warmer/lighter tonal shift of accent.
  - `focused` — squinted eyes, slightly deeper tonal shift of accent.
- Moods remain driven by the per-section narration (`script.ts`), unchanged.

### 2.3 Behaviors

Principle: **rich repertoire, restrained execution** — reactions are subtle,
slow, infrequent, and always settle back to the section mood.

- **(a) Cursor gaze** — eyes subtly track the visitor's cursor.
- **(b) Section reading** — eyes glance toward the active section as you scroll
  (rides the existing IntersectionObserver active-section logic).
- **(c) Mood shift** — eye shape + accent tonal shift per section (2.2).
- **(d) Mute = sleeping** — when muted, eyes close and the orb dims (existing
  mute wiring drives this).
- **(e) Micro-reactions** — squint on code blocks, look up at page top,
  slow-blink on hover. *Lowest priority; may be a follow-up.*
- **Idle = fighting sleep** — after inactivity: eyes droop → orb nods down →
  **jerks awake** (eyes pop) → droops deeper → weaker snap → eventually loses
  the fight → asleep. **Timing is randomized** (droop depth, snap strength,
  number of nods) so it never reads as a fixed loop — JS-driven random timeouts,
  not a CSS loop.
- **Asleep + dreaming** — once it loses the fight: eyes closed, a **dream
  bubble** appears with floating **Zzz** (rising/fading). The dream bubble
  reuses the speech-bubble slot/position.
- **Click disturbance** — every click on the orb fires immediate feedback: a
  **restrained, direction-aware bump** — recoil vector points *away* from the
  click point (relative to orb center), eyes **dart toward** the click, plus
  squash-and-stretch, a single blink, and a damped settle-wobble. (Restrained,
  per the v3 sketch — not exaggerated.)
- **Anger** — escalates from **spam-clicking only** (no other triggers): a few
  fast pokes → **annoyed** (eyes narrow) → keep going → **angry** (accent heats
  within its hue, eye-slant, sharper/faster recoil). **Cools down on a timer
  only** (no hover-to-forgive), settling back to the section mood.

### 2.4 State model

Two layers, cleanly separated:
- **Mood** (content-driven, per section): `calm | warm | focused` — the resting
  state. Already exists.
- **Reaction** (interaction/idle-driven, transient): `gaze, sleepy(=fighting),
  asleep, annoyed, angry, sleeping(muted)` — layers over the mood, then decays
  back. Anger has an escalation counter with a time-based cooldown.

A small state machine (pure, testable) owns reaction transitions and decay;
the React component renders eye geometry + orb color from `(subject, mood,
reaction)`. Reduced-motion disables idle/disturbance animation (orb still shows
state statically).

---

---

## Part 3 — Component workshop + public showcase

Two distinct artifacts with different audiences. They do **not** duplicate
content: the philosophy doc (`docs/design-system.md`) is the source-of-truth
text, Storybook is the dev harness, the `/design-system` route is the public
narrative.

### 3.1 Storybook (dev + CI only — not hosted)

- **Storybook 9** with the **`@storybook/react-vite`** renderer (the plain Vite
  renderer, **not** the Next framework preset) to sidestep Next 16 friction.
  Components render in a Vite context; `next/navigation` (`usePathname`, used by
  the companion) is mocked in `.storybook/preview`.
- **Tailwind v4** wired into the Storybook Vite config so stories use the real
  tokens/`globals.css`.
- **`@storybook/addon-a11y`** — automated contrast/a11y checks, directly serving
  the contrast requirement.
- **Global toolbar decorator** — switch `data-subject` (brand/systems/interface/
  ai) and light/dark, so every story is viewable in every skin. This is where
  "everything is a declension" is verified visually.
- **Storybook Test (Vitest integration)** — stories run as Vitest tests, reusing
  the existing Vitest setup (one runner). Interaction/play tests for the
  companion's states where practical.
- **Stories for:** token reference (color/type/space/radius/shadow/motion),
  primitives & components (cards, badges, buttons, nav, etc.), and the
  **companion in every state** (moods, gaze, fighting-sleep, dream, disturbance,
  anger, sleeping) across subjects.
- Run locally + in CI; **no public deploy** (the public artifact is 3.2).

### 3.2 Public `/design-system` route (in-app, hosted with the site)

- A route under `src/app/[lang]/design-system/` — **publicly linked** (footer;
  optionally nav) and **bilingual** via the existing i18n dictionaries.
- Presented as a **designer's case study**, not a dry catalog: it explains the
  *thinking* — the "declension of the brand" philosophy, the three token layers,
  why subjects exist and how they're chosen, the contrast discipline, and the
  avatar as a consumer of the system. Narrative copy lives in the i18n
  dictionaries (en/fr).
- **Live, not screenshots:** renders the real tokens and components.
  - Token reference pulled from the actual CSS variables (single source of
    truth — no hand-maintained duplicate hex lists).
  - A **subject switcher** scoped to the page (sets `data-subject` on a preview
    region) so visitors see Brand/Systems/Interface/AI live, including the
    animated gradient and the orb wearing each skin.
  - The **companion** embedded in a sandbox showing its states.
- Deploys automatically with the app (Cloudflare/OpenNext) — satisfies "hosted
  on the server" with zero extra pipeline.
- Narrative draws from `docs/design-system.md` to avoid drift; the doc stays the
  canonical text, the route is its human-facing presentation.



- **Tokens:** primitives + semantic + skins in `globals.css` (Tailwind v4
  `@theme inline` + `[data-subject]` blocks). No new dependency.
- **Subject resolution:** pure function in `src/core` (+ tag map). Unit-tested.
- **Avatar state machine:** pure module under `src/components/companion/`
  (e.g. `reaction-state.ts`), unit-tested; component consumes it.
- **Avatar color:** `moods.ts` refactored to read CSS variables / accept the
  resolved accent rather than hardcoding rgba.
- **Storybook:** `.storybook/` config using `@storybook/react-vite` + Tailwind v4
  + a11y addon + Vitest test addon; `next/navigation` mocked. New devDeps only.
- **Showcase:** `src/app/[lang]/design-system/page.tsx` + section components;
  copy in i18n dictionaries; token reference reads live CSS variables.
- Dependencies point inward: React reads pure results; pure code knows nothing
  about the DOM.

## Testing

- `resolveSubject` — table-driven tests (category, tag map, fallback, route).
- Reaction state machine — escalation (poke→annoyed→angry), time-based cooldown,
  idle→fighting→asleep transitions, mute=sleeping.
- Contrast — a test (or documented check) asserting each skin's accent/on-accent
  meets AA, including gradient stops.
- Reduced-motion — animations gated; existing companion tests stay green.
- Existing companion/placement tests must continue to pass.
- Storybook stories double as component tests via the Vitest addon (a11y +
  interaction where practical); `pnpm/npm test` and the Storybook test run both
  stay green in CI.
- Showcase route — smoke test (renders in both locales; subject switcher sets
  `data-subject`).

## Out of scope (deferred)

- Live **site-wide** user theme switcher (the showcase's switcher is page-scoped
  only).
- `both` → systems/interface blend.
- Mouth/eyebrows (kept eyes-only).
- Anger triggers beyond spam-click; hover-to-forgive.
- Micro-reactions (e) may land as a follow-up, not blocking.
- Hosting Storybook publicly (dev + CI only; the public artifact is the
  `/design-system` route).

## Suggested implementation phases

1. **Design-system foundation** — token layers, subject skins, `resolveSubject`,
   wire `data-subject`, philosophy doc (`docs/design-system.md`). (Avatar and
   showcase untouched but unblocked.)
2. **Avatar** — consume tokens in `moods.ts`, eyes/state machine, idle
   fighting-sleep + dream, click-disturbance + anger, gaze/section-reading.
3. **Workshop + showcase** — Storybook (react-vite, a11y, skin toolbar, Vitest
   stories for tokens/components/companion) and the public bilingual
   `/design-system` case-study route. Best built after 1 (and the relevant
   parts of 2) so there are real tokens/components/states to document.

Each phase is its own implementation plan.
