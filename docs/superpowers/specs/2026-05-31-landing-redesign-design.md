# Landing Page Redesign — Design Spec

**Status:** Approved design, ready for implementation planning
**Date:** 2026-05-31

## 1. Goal

Upgrade the landing page's **UX and readability**, and **weave the mascot orb into the page flow** instead of floating over it. Audience is **balanced — credibility + craft**: a confident hero that signals craft, Work as proof, Writing for depth, and a clear path to contact. No single audience dominates.

## 2. Hero — orb aura that shrinks into the companion

The hero keeps its existing copy (eyebrow "Software Engineer · Design-led", headline "Engineering with the craft of design.", subhead, and the two CTAs "View work" / "Read writing"), **recomposed with the orb as a large translucent aura behind the headline** (composition direction "C"), gently breathing.

**The orb is a single persistent element.** It has two phases:
- **Hero phase** (hero in view): large, blurred, lower-opacity aura positioned *behind* the headline (text sits on top, higher z-index); a gentle breathe + subtle parallax.
- **Travel phase** (scrolled past the hero): the V0 companion — small, crisp, foreground, gliding to each section's anchor and narrating.

As the hero scrolls out, the orb **smoothly interpolates** from hero-phase (large/aura/behind) to travel-phase (small/crisp/companion). This unifies the new hero with the already-shipped companion — it's the *same* orb the whole way down.

## 3. Architecture — how the two phases connect

Extend the existing `Companion` (`src/components/companion/`) rather than add a parallel system:

- The hero renders an **"orb home" anchor** — an empty positioned element (e.g. `data-orb-home` with the intended large size/position) marking where the aura lives.
- The `Companion` controller, **only when an orb-home element exists on the current route** (i.e. the landing), computes a scroll progress `p` over the hero (0 while the hero fills the viewport → 1 once it has scrolled away) and interpolates the orb's **size, position, blur, and opacity** between the hero-home rect and the travel anchor. At `p ≥ 1` it hands off to the existing V0 travel behavior (section anchors + bubble).
- On routes **without** an orb-home (about/uses/now/work/blog), the Companion behaves exactly as V0 today — no hero phase. This keeps the hero phase landing-specific and decoupled (no route conditionals baked into the orb).
- The narration script for `/` is unchanged in spirit; the hero beat now coincides with the aura phase (no bubble while the orb is a full aura; the bubble fades in once it becomes the small companion).

**Boundaries:** the hero (`hero.tsx`) owns layout + the orb-home anchor; the `Companion` owns the phase interpolation; the narration data is untouched. Each can be reasoned about independently.

## 4. Section structure & hierarchy

Top to bottom on `/`:
1. **Hero** (aura)
2. **What I do** — Systems / Interfaces pillar band (cleaner treatment)
3. **Selected work** — 2–3 featured projects (proof)
4. **Latest writing** — 3 latest posts
5. **Contact CTA** — new closing band (see §5)

Readability upgrades applied to bands 2–4: a small uppercase **kicker** label and, where relevant, a **"view all →"** link, for scannability and clear hierarchy. The container keeps the site-wide `max-w-3xl` reading width for coherence with the rest of the site; the hero's aura glow may bleed slightly wider for drama (purely visual, no layout reflow).

## 5. Contact CTA (new section)

A calm closing band, lightly tinted to separate it from the content above. Copy along the lines of *"Let's build something."* + a line about being open to roles and collaborations.
- **Primary action:** `mailto:lebocq.titouan@gmail.com` — "Get in touch".
- **Secondary action:** GitHub link (reuse the `site.social.github` value).
The orb's final narration beat lands here.

## 6. Motion & accessibility

**Wow hero, calm rest:**
- Hero: orb aura **breathe** + subtle **parallax**; **shrink-on-scroll** interpolation (§2–3); a restrained headline entrance.
- Sections 2–5: subtle entrance fades only (reuse the existing `.animate-in` pattern).
- **`prefers-reduced-motion`:** collapses everything — the orb renders as a **static** aura in the hero and a static small companion below (no breathe, no parallax, no scroll-interpolation); sections appear with no transitions. This reuses the companion's existing reduced-motion handling.
- The companion's existing **mute** control still applies (muting hides narration; the hero aura can remain as a static visual or also hide — default: the aura stays as decoration, narration bubbles are suppressed).

## 7. Scope & isolation

**In scope:**
- `src/components/landing/hero.tsx` — recomposed (aura layout + orb-home anchor).
- `src/components/companion/companion.tsx` (+ small helpers) — hero↔travel phase interpolation, gated on the orb-home anchor's presence.
- `src/app/page.tsx` — add section kickers/"view all" treatment and the new Contact CTA section (or a small `landing/contact-cta.tsx` component).
- `src/components/landing/pillar-card.tsx` — minor visual polish if needed for the band.
- Styles in `globals.css` for the new hero/aura and any kicker utility.

**Out of scope (YAGNI):** no new routes; no content-model or narration-data changes; blog/work/about pages untouched; no new dependencies; no change to the companion on non-landing routes.

**Worker budget:** unaffected — the work is CSS/transform/IntersectionObserver-driven (no new heavy deps); stays well under the 3 MiB cap.

## 8. Testing

- **Companion phase logic:** a pure helper that maps scroll progress → orb {size, x, y, blur, opacity} is unit-tested (hero-home rect + travel anchor + progress → interpolated values; `p=0` = hero, `p=1` = travel). 
- **Gating:** Companion renders hero-phase only when an orb-home element is present; on a route without it, behaves as V0 (existing tests still pass).
- **Reduced-motion:** with `prefers-reduced-motion`, no interpolation/breathe; orb static (mock `matchMedia`).
- **Contact CTA:** renders the `mailto:lebocq.titouan@gmail.com` link and the GitHub link; present on `/`.
- **Build/a11y:** all routes still prerender; headings/landmarks sane; CTAs are real links/buttons.

## 9. Success criteria

- Visitors meet a memorable aura hero; the orb visibly **shrinks into the companion** on scroll (one continuous element).
- The page reads as a clear sequence — What I do · Work · Writing · Contact — with scannable kickers and a closing action.
- Identical behavior on all non-landing routes; reduced-motion + mute respected; tests green; build clean; Worker under budget.
