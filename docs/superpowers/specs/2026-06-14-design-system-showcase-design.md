# Public design-system showcase (`/design-system`) — case study

**Date:** 2026-06-14
**Status:** Approved (design); pending implementation plan
**Phase:** 3a (showcase). Storybook (the exhaustive *reference*) is a separate
later cycle (3b) — explicitly out of scope here.

## What this is

A public, bilingual (en/fr) route at `/design-system` that presents the design
system as a **designer's case study** (Genre 2: narrative + live proof), not a
component reference (Genre 1 — that's Storybook's job). It **dogfoods** the
system (it is themed by it) and is a natural home to show the companion.

Audience: someone evaluating *the designer* — recruiters, peers. The point is to
show **how the thinking worked**, with interactive proof, not to document every
component.

## The problem it argues (the spine of the narrative)

The surface task — "color the site per subject" — is a solution, not the problem.
The real problem, and the case study's spine:

> **A portfolio for a "systems thinking × interface craft" engineer has to be
> both at once — and most portfolios sacrifice one for the other.** Optimize for
> craft/expression and you drift to chaos (inconsistency, broken contrast,
> gimmickry). Optimize for system/rigor and you get correct-but-generic. The
> central move: **make expression an *output of* rigor** — the colorful, alive,
> per-subject experience is *produced by* a disciplined token system with
> contrast contracts, so the more systematic it gets, the more expressive it can
> safely be.

Meta-layer (raises the stakes): **the artifact is the argument.** A design-led
engineer who *claims* rigor + craft but ships a generic template has refuted
themselves. The site must embody the thesis.

**Lead thread:** *rigor produces expression* (primary). The meta-angle
(artifact-is-the-argument) and the UX angle (intentional-not-broken) are
supporting beats, not the headline.

Four sub-problems the system actually solves (each becomes a decision the case
study can point to):
1. **Variety vs. unity** — work should feel different, the site must read as one
   person → subjects as *declensions of one brand*.
2. **Intentional vs. broken** — a shift must read as deliberate and *caused*,
   never a glitch → badge-as-cause, the companion as narrator, transitions as the
   seam.
3. **Expressive vs. accessible** — multi-hue/gradient/motion usually breaks
   a11y → made impossible *by construction* (contrast gated in CI, motion gated
   by preference).
4. **Alive vs. gimmick** — personality without decorative noise → the orb *is*
   the system (a lens diffracting the page's own light), not a sticker on top.

## Sections (the arc)

A single scrolling page, themed by the system, companion present:

1. **Problem / context** — the tension above, in the user's voice. Opens roughly:
   *"A portfolio that argues you can have rigor and craft at once — and proves it
   by being built that way."*
2. **Principle** — brand-anchored semantic subjects · three token layers ·
   "the page is the light, the companion is the lens." 2–3 tight paragraphs.
3. **Subjects — live switcher** *(interactive, the centerpiece)* — Brand /
   Systems / Interface / AI controls recolor a preview region (aura, accent
   text, a button, a badge) **and the orb wears it**. Proof of "expression from
   rigor."
4. **Tokens — live** — color/subject tokens rendered **from
   `src/design/tokens.ts`** (actual source of truth → zero drift); type / space /
   radius shown as real rendered examples.
5. **The companion** — the lens/diffraction idea + its states, embedded live.
6. **Decisions & trade-offs** — the "why": teal not success-green (color-blind
   safety), `:has()` to lift the subject to off-scope consumers, orb-as-lens,
   AA gated in CI, reduced-motion. Maps each decision back to a sub-problem.
7. **Outcome** — one honest line: a coherent, accessible, self-theming portfolio
   — four subjects, AA-gated, reduced-motion-safe, extensible in one place.

## Architecture & boundaries

- Route `src/app/[lang]/design-system/page.tsx` + focused section components
  under `src/components/design-system-showcase/` (one file per section,
  single-responsibility).
- **Bilingual:** all narrative copy in the i18n dictionaries (en/fr); no
  hardcoded prose in components. Follows the existing `getDictionary` pattern.
- **Dogfoods the system:** the page uses the real tokens/components; sections are
  themed; the page-aura and (merged) page transitions apply.
- **Subject switcher is page-scoped:** sets `data-subject` on a *preview wrapper*
  (and a local `--subject-accent` for the embedded orb), NOT site-wide. Client
  component; SSR-safe default (brand).
- **Token reference from `tokens.ts`** (canonical) so it cannot drift from the
  site; non-color scales shown as live rendered examples, not hand-typed tables.
- **Companion sandbox:** embed the existing companion/orb in a bounded preview;
  reuse it, don't fork it.
- **Linked from the footer** (a "Design system" link). Nav entry optional/decline
  for now (keep nav lean).
- **Reduced-motion** respected (inherits the system's gating; the switcher works
  without motion).
- No new dependencies.

## Testing

- Route renders in both locales (en/fr) — smoke test per locale.
- Subject switcher sets `data-subject` on the preview wrapper (interaction test).
- Token reference is derived from `tokens.ts` (a test asserting the rendered set
  matches `SUBJECTS`/`TOKENS`, so it can't silently drift).
- Footer link present.
- Existing suite stays green; `tsc` clean; `next build` succeeds.
- Narrative/visual polish verified in-browser (stated, not unit-tested).

## Out of scope (deferred)

- **Storybook** and exhaustive per-component reference docs (Phase 3b).
- A site-wide theme switcher (the page switcher is local only).
- New components — the showcase presents existing ones.

## Implementation note

Build on the merged branch (foundation + palette/aura + avatar + transitions +
font all present). Sequence: i18n copy keys → section components (static) →
live subject switcher → live token reference → companion sandbox → footer link →
tests.
