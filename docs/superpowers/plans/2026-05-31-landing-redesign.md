# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the landing page with an aura-hero whose orb is one continuous element that shrinks into the existing traveling companion on scroll, plus a clearer section hierarchy and a new Contact CTA.

**Architecture:** Add pure, tested geometry helpers (`scrollProgress` + `interpolateOrb`) that map scroll position over the hero to the orb's size/position/blur/opacity. Extend the existing `Companion` with a *hero phase*, gated on the presence of a `[data-orb-home]` element (only the landing has one) so all other routes keep the V0 behavior unchanged. The hero is recomposed (orb aura behind the headline), and `page.tsx` gains section kickers + a Contact CTA.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, TypeScript, Tailwind v4 + CSS, Vitest + Testing Library. Spec: `docs/superpowers/specs/2026-05-31-landing-redesign-design.md`.

**Every task:** after changes, `npx tsc --noEmit && npx vitest run && npm run lint` pass (and `npm run build` at the end). Branch: `feat/landing-redesign`.

---

## File Structure

- Create: `src/components/companion/hero-phase.ts` — pure geometry helpers + `HERO_HOME` constant.
- Create: `src/components/companion/hero-phase.test.ts`
- Modify: `src/components/companion/orb.tsx` — accept an optional `style` override (size/blur/opacity).
- Modify: `src/components/companion/companion.tsx` — hero-phase scroll interpolation, gated on `[data-orb-home]`.
- Modify: `src/components/companion/companion.test.tsx` — gating tests.
- Modify: `src/components/landing/hero.tsx` — aura composition + `data-orb-home` anchor.
- Create: `src/components/landing/contact-cta.tsx` — closing CTA section.
- Modify: `src/app/page.tsx` — section kickers, "view all" already present, add `<ContactCta/>`.
- Modify: `src/app/globals.css` — hero/aura styling, kicker utility, breathe keyframes (reduced-motion-gated).

---

## Task 1: Orb geometry helpers (pure)

**Files:** Create `src/components/companion/hero-phase.ts`, `src/components/companion/hero-phase.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/components/companion/hero-phase.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scrollProgress, interpolateOrb, HERO_HOME } from "./hero-phase";

describe("scrollProgress", () => {
  it("is 0 at the top and 1 once scrolled a full hero height", () => {
    expect(scrollProgress(0, 800)).toBe(0);
    expect(scrollProgress(800, 800)).toBe(1);
  });
  it("clamps to [0,1] and is linear in between", () => {
    expect(scrollProgress(400, 800)).toBe(0.5);
    expect(scrollProgress(2000, 800)).toBe(1);
    expect(scrollProgress(-50, 800)).toBe(0);
  });
  it("returns 0 for a zero/unknown hero height", () => {
    expect(scrollProgress(100, 0)).toBe(0);
  });
});

describe("interpolateOrb", () => {
  const travel = { x: 30, y: 50 };
  it("at p=0 returns the hero-home aura (large, blurred, behind, no bubble)", () => {
    const g = interpolateOrb(0, travel);
    expect(g.size).toBe(HERO_HOME.size);
    expect(g.x).toBe(HERO_HOME.x);
    expect(g.y).toBe(HERO_HOME.y);
    expect(g.bubble).toBe(false);
    expect(g.front).toBe(false);
    expect(g.blur).toBeGreaterThan(0);
  });
  it("at p=1 returns the small foreground companion at the travel anchor", () => {
    const g = interpolateOrb(1, travel);
    expect(g.size).toBe(92);
    expect(g.x).toBe(30);
    expect(g.y).toBe(50);
    expect(g.blur).toBe(0);
    expect(g.opacity).toBe(1);
    expect(g.bubble).toBe(true);
    expect(g.front).toBe(true);
  });
  it("interpolates size linearly at the midpoint", () => {
    const g = interpolateOrb(0.5, travel);
    expect(g.size).toBeCloseTo((HERO_HOME.size + 92) / 2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/hero-phase.test.ts`
Expected: FAIL — cannot find module `./hero-phase`.

- [ ] **Step 3: Implement `src/components/companion/hero-phase.ts`**

```ts
/** The orb's resting "home" in the hero: a large, soft aura (viewport %). */
export const HERO_HOME = { size: 240, x: 70, y: 34 };
const TRAVEL_SIZE = 92;

export type OrbGeometry = {
  size: number;
  x: number;
  y: number;
  blur: number;
  opacity: number;
  bubble: boolean;
  front: boolean;
};

/** 0 while the hero fills the viewport, 1 once it has scrolled a full hero height. */
export function scrollProgress(scrollY: number, heroHeight: number): number {
  if (heroHeight <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / heroHeight));
}

/** Interpolate the orb from the hero aura (p=0) to the travel companion (p=1). */
export function interpolateOrb(p: number, travel: { x: number; y: number }): OrbGeometry {
  const lerp = (a: number, b: number) => a + (b - a) * p;
  return {
    size: lerp(HERO_HOME.size, TRAVEL_SIZE),
    x: lerp(HERO_HOME.x, travel.x),
    y: lerp(HERO_HOME.y, travel.y),
    blur: lerp(3, 0),
    opacity: lerp(0.6, 1),
    bubble: p > 0.6,
    front: p > 0.5,
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/hero-phase.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/hero-phase.ts src/components/companion/hero-phase.test.ts
git commit -m "feat(landing): pure orb hero-phase geometry helpers"
```

---

## Task 2: Orb accepts a style override

**Files:** Modify `src/components/companion/orb.tsx`, `src/components/companion/orb.test.tsx`

- [ ] **Step 1: Add a failing test for the style override**

Add to `src/components/companion/orb.test.tsx` (keep existing tests):

```tsx
it("applies a caller style override (size/filter) on top of the mood style", () => {
  const { container } = render(
    <Orb mood="calm" muted={false} style={{ width: 200, height: 200, filter: "blur(3px)" }} />,
  );
  const orb = container.querySelector(".companion-orb") as HTMLElement;
  expect(orb.style.width).toBe("200px");
  expect(orb.style.filter).toBe("blur(3px)");
  expect(orb.style.background).toContain("radial-gradient"); // mood style still applied
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/components/companion/orb.test.tsx`
Expected: FAIL — `Orb` doesn't accept `style`.

- [ ] **Step 3: Implement — replace `src/components/companion/orb.tsx`**

```tsx
import type { CSSProperties } from "react";
import type { Mood } from "@/lib/narration/types";
import { moodStyle } from "./moods";

export function Orb({
  mood,
  muted,
  style,
}: {
  mood: Mood;
  muted: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className="companion-orb"
      data-mood={mood}
      aria-hidden="true"
      style={{
        ...moodStyle(mood),
        ...(muted ? { transform: "scale(0.6)", filter: "saturate(.7) opacity(.8)" } : null),
        ...style,
      }}
    />
  );
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run src/components/companion/orb.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/companion/orb.tsx src/components/companion/orb.test.tsx
git commit -m "feat(landing): orb accepts a style override for hero-phase geometry"
```

---

## Task 3: Companion hero-phase wiring

The Companion gains hero-phase behavior **only when a `[data-orb-home]` element exists on the page** (the landing). It tracks scroll, computes progress over the hero, and renders the orb at the interpolated geometry. Disabled when muted, on mobile, or under reduced-motion (then plain V0). The existing IntersectionObserver still selects the travel-target section.

**Files:** Modify `src/components/companion/companion.tsx`, `src/components/companion/companion.test.tsx`

- [ ] **Step 1: Add gating tests**

Add to `src/components/companion/companion.test.tsx` (keep existing tests):

```tsx
it("does not enter hero phase when there is no orb-home element (other routes)", () => {
  renderWithSections(["hero", "pillars"]); // no [data-orb-home]
  const orb = document.querySelector(".companion-orb") as HTMLElement;
  // V0: small companion (no inline width from hero geometry)
  expect(orb).toBeInTheDocument();
  expect(orb.style.width).toBe("");
});

it("enters hero phase (large aura) when an orb-home element is present and at top of page", () => {
  document.body.innerHTML =
    `<section data-orb-home style="height:800px"></section>` +
    ["hero", "pillars"].map((id) => `<div data-narrate="${id}" style="height:300px"></div>`).join("");
  render(<Companion />);
  const orb = document.querySelector(".companion-orb") as HTMLElement;
  // at scrollY 0 the orb is the large aura → inline width is set and large
  expect(parseInt(orb.style.width || "0", 10)).toBeGreaterThan(150);
});
```

(Reuse the file's existing `renderWithSections` helper and `usePathname` mock; the second test sets `pathname = "/"` via the existing mutable mock if needed — the hero phase does not depend on the route string, only on the orb-home element.)

- [ ] **Step 2: Run to verify the new tests fail**

Run: `npx vitest run src/components/companion/companion.test.tsx`
Expected: FAIL — no hero-phase behavior yet.

- [ ] **Step 3: Implement — replace `src/components/companion/companion.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { getNarration } from "@/lib/narration/resolver";
import type { Anchor } from "@/lib/narration/types";
import { pickActiveSection } from "./active-section";
import { getMuted, setMuted, subscribeMuted } from "./mute-storage";
import { useReducedMotion } from "./use-reduced-motion";
import { scrollProgress, interpolateOrb } from "./hero-phase";
import { Orb } from "./orb";
import { SpeechBubble } from "./speech-bubble";

const DESKTOP_QUERY = "(min-width: 640px)";
const CORNER_ANCHOR: Anchor = { x: 88, y: 86, side: "left" };

export function Companion() {
  const pathname = usePathname();
  const lines = getNarration(pathname);
  const reducedMotion = useReducedMotion();

  const muted = useSyncExternalStore(subscribeMuted, getMuted, () => false);
  const [active, setActive] = useState<{ route: string; id: string } | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [progress, setProgress] = useState(0); // hero-phase scroll progress (0..1)
  const [heroPresent, setHeroPresent] = useState(false);
  const ratios = useRef<Record<string, number>>({});

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    ratios.current = {};
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-narrate]"));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.narrate;
          if (id) ratios.current[id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        }
        const next = pickActiveSection(ratios.current);
        if (next) setActive({ route: pathname, id: next });
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname, lines.length]);

  // Hero phase: track scroll progress over the [data-orb-home] hero.
  useEffect(() => {
    const home = document.querySelector<HTMLElement>("[data-orb-home]");
    setHeroPresent(!!home);
    if (!home) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setProgress(scrollProgress(window.scrollY, home.offsetHeight));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  if (lines.length === 0) return null;

  const activeId = active?.route === pathname ? active.id : null;
  const activeLine = lines.find((l) => l.id === activeId) ?? lines[0];

  // Hero phase is active only on a route with an orb-home, on desktop, not muted,
  // and not under reduced motion (then we fall back to the plain V0 companion).
  const heroPhase = heroPresent && isDesktop && !muted && !reducedMotion;

  const travelAnchor = !isDesktop || muted ? CORNER_ANCHOR : activeLine.anchor;
  const geo = heroPhase ? interpolateOrb(progress, travelAnchor) : null;

  const dockStyle: CSSProperties = geo
    ? { left: `${geo.x}%`, top: `${geo.y}%`, zIndex: geo.front ? 40 : 5 }
    : { left: `${travelAnchor.x}%`, top: `${travelAnchor.y}%` };

  const orbStyle: CSSProperties | undefined = geo
    ? { width: geo.size, height: geo.size, filter: `blur(${geo.blur}px)`, opacity: geo.opacity }
    : undefined;

  const showBubble = !muted && (geo ? geo.bubble : true);

  const toggleMute = () => setMuted(!muted);

  return (
    <>
      <div
        className={`companion-dock side-${travelAnchor.side}`}
        style={dockStyle}
        aria-hidden="true"
      >
        {showBubble && <SpeechBubble text={activeLine.text} reducedMotion={reducedMotion} />}
        <Orb mood={activeLine.mood} muted={muted} style={orbStyle} />
      </div>
      <button
        type="button"
        className="companion-mute"
        onClick={toggleMute}
        aria-label={muted ? "Unmute site companion" : "Mute site companion"}
      >
        {muted ? "◌" : "×"}
      </button>
    </>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

Run: `npx vitest run src/components/companion/companion.test.tsx`
Expected: PASS (existing + 2 new). If the jsdom `offsetHeight` is 0 in the second test, the inline `height:800px` on the section plus jsdom's layout returns 0 — guard by asserting on the at-top geometry: if `offsetHeight` is 0, `scrollProgress` returns 0 → `interpolateOrb(0)` still yields `size = HERO_HOME.size` (240), so `orb.style.width` is "240px". The assertion (`> 150`) holds regardless of layout. Keep the test as written.

- [ ] **Step 5: Run the full companion suite + lint**

Run: `npx vitest run src/components/companion && npm run lint`
Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/components/companion/companion.tsx src/components/companion/companion.test.tsx
git commit -m "feat(landing): companion hero phase — scroll-interpolated orb, gated on orb-home"
```

---

## Task 4: Recompose the hero (aura + orb-home)

Replace the v0 hero with the aura composition. The orb itself is rendered by the `Companion` (fixed, behind the text at the top); the hero provides the `data-orb-home` marker (used to measure scroll distance) and keeps the headline above the orb via stacking.

**Files:** Modify `src/components/landing/hero.tsx`

- [ ] **Step 1: Replace `src/components/landing/hero.tsx`**

```tsx
import Link from "next/link";

// Aura hero: the orb (rendered by <Companion/>) sits behind this headline as a
// large ambient aura, then shrinks into the traveling companion on scroll.
// `data-orb-home` marks this section as the orb's hero home (scroll-distance ref).
export function Hero() {
  return (
    <section data-orb-home className="relative isolate py-20 sm:py-28">
      <div className="relative z-10" data-narrate="hero">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Software Engineer · Design-led
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-6xl">
          Engineering with the craft of design.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          I build robust backend systems and interfaces people love — pushing
          technology to its limits without ever losing clarity.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/work"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
          >
            View work
          </Link>
          <Link
            href="/blog"
            className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
          >
            Read writing
          </Link>
        </div>
      </div>
    </section>
  );
}
```

Note: the existing `page.tsx` wraps `<Hero/>` in `<div data-narrate="hero">`. Move the `data-narrate="hero"` onto the hero's inner content (as above) and remove the wrapper in Task 6 — OR keep the wrapper and drop the inner `data-narrate`. Pick one so there is exactly one `data-narrate="hero"`. This plan keeps it on the hero's inner `div` and removes the wrapper in Task 6 Step 2.

- [ ] **Step 2: Verify build + existing tests**

Run: `npx tsc --noEmit && npx vitest run && npm run lint`
Expected: green. (No new test here — the hero is presentational; its data attributes are exercised by the Companion tests and verified in the manual preview.)

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/hero.tsx
git commit -m "feat(landing): aura hero composition with orb-home anchor"
```

---

## Task 5: Contact CTA component

**Files:** Create `src/components/landing/contact-cta.tsx`, `src/components/landing/contact-cta.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/landing/contact-cta.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ContactCta } from "./contact-cta";

describe("ContactCta", () => {
  it("renders a mailto primary action and a GitHub link", () => {
    render(<ContactCta />);
    const email = screen.getByRole("link", { name: /get in touch/i });
    expect(email).toHaveAttribute("href", "mailto:lebocq.titouan@gmail.com");
    expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute(
      "href",
      expect.stringContaining("github.com"),
    );
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/components/landing/contact-cta.test.tsx`
Expected: FAIL — cannot find module `./contact-cta`.

- [ ] **Step 3: Implement `src/components/landing/contact-cta.tsx`**

```tsx
import { site } from "@/core/domain/site";

export function ContactCta() {
  return (
    <section
      data-narrate="contact"
      className="my-8 rounded-2xl border border-border bg-card px-6 py-12 text-center"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Let&apos;s build something.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-muted">
        I&apos;m open to roles and collaborations. The fastest way to reach me is
        email.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
        <a
          href="mailto:lebocq.titouan@gmail.com"
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background transition hover:opacity-90"
        >
          Get in touch
        </a>
        <a
          href={site.social.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border px-4 py-2 font-medium transition hover:text-accent"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/components/landing/contact-cta.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/contact-cta.tsx src/components/landing/contact-cta.test.tsx
git commit -m "feat(landing): contact CTA section (mailto + GitHub)"
```

---

## Task 6: Wire the landing page (kickers + CTA + narration)

**Files:** Modify `src/app/page.tsx`, `src/lib/narration/script.ts`

- [ ] **Step 1: Add the `contact` narration beat** — in `src/lib/narration/script.ts`, append to the `"/"` array (after the `writing` line):

```ts
    { id: "contact", mood: "warm", text: "Like what you see? Let's talk.", anchor: { x: 30, y: 64, side: "right" } },
```

- [ ] **Step 2: Update `src/app/page.tsx`** — remove the `<div data-narrate="hero">` wrapper around `<Hero/>` (the hero now carries `data-narrate="hero"` internally), add uppercase kickers to the two content bands, import and render `<ContactCta/>` last. Replace the file with:

```tsx
import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { PillarCard } from "@/components/landing/pillar-card";
import { ProjectCard } from "@/components/project-card";
import { PostCard } from "@/components/post-card";
import { ContactCta } from "@/components/landing/contact-cta";
import { getFeaturedProjects, getAllProjects } from "@/composition/server";
import { getAllPosts } from "@/composition/server";

export default function HomePage() {
  const featured = getFeaturedProjects();
  const projects = (featured.length > 0 ? featured : getAllProjects()).slice(0, 2);
  const posts = getAllPosts().slice(0, 3);

  return (
    <div>
      <Hero />

      <section className="py-8" aria-label="What I do" data-narrate="pillars">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">What I do</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <PillarCard label="Systems" description="Distributed, fast, reliable backends." href="/work" />
          <PillarCard label="Interfaces" description="Polished, accessible, delightful UI." href="/work" />
        </div>
      </section>

      {projects.length > 0 && (
        <section className="py-8" data-narrate="work">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Selected work</p>
            <Link href="/work" className="text-sm text-accent hover:underline">View all →</Link>
          </div>
          <div className="mt-2">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="py-8" data-narrate="writing">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Latest writing</p>
            <Link href="/blog" className="text-sm text-accent hover:underline">Read all →</Link>
          </div>
          <div className="mt-2">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      <ContactCta />
    </div>
  );
}
```

Note: the old page had `<h2>` headings ("Selected work", "Latest writing"); they're replaced by the uppercase kickers above for a cleaner, scannable hierarchy. The `data-narrate` ids (`pillars`, `work`, `writing`) are unchanged; `contact` is new (matches Step 1).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit && npx vitest run && npm run lint`
Expected: green; the companion test still finds the `hero`/`pillars`/`work`/`writing` ids.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/lib/narration/script.ts
git commit -m "feat(landing): section kickers, contact CTA, contact narration beat"
```

---

## Task 7: Hero/aura styles + reduced-motion breathe

**Files:** Modify `src/app/globals.css` (append a landing block)

- [ ] **Step 1: Append to `src/app/globals.css`**

```css
/* ── Landing hero ──────────────────────────────────────────── */
/* The orb (rendered by the companion) animates a gentle breathe while it is the
   hero aura. Motion only when the user allows it. */
@media (prefers-reduced-motion: no-preference) {
  @keyframes orb-breathe {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.04); }
  }
}
```

Note: the orb's size/position/blur are driven by inline styles from the Companion (Task 3); this stylesheet only adds the optional breathe keyframes for future use and keeps all motion gated behind `prefers-reduced-motion`. (The breathe is applied via the companion-orb's existing transition; no class change is required for V1 — the shrink-on-scroll is the primary motion. Leave the keyframes available; do not force them on, to avoid competing with the inline `transform` the muted state uses.)

- [ ] **Step 2: Verify**

Run: `npm run lint && npx vitest run`
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style(landing): reduced-motion-gated orb breathe keyframes"
```

---

## Task 8: Full verification & PR

**Files:** none (verification only)

- [ ] **Step 1: Full gate**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: all green; all routes still prerender; `/` builds static.

- [ ] **Step 2: Manual preview (the scroll feel needs eyes)**

Run: `npm run preview`. On `http://localhost:8787/`:
- Hero shows the orb as a large aura behind the headline.
- Scrolling shrinks the orb smoothly and it becomes the small traveling companion narrating each section.
- The Contact CTA renders last with a working "Get in touch" (mailto) + GitHub.
- Other routes (`/about`, `/blog`) are unchanged — orb is the plain V0 companion (no aura), confirming the gating.
- Enable OS "reduce motion" → orb is the plain small companion (no aura/shrink), page still readable.
Stop the preview.

- [ ] **Step 3: Push and open a PR**

```bash
git push -u origin feat/landing-redesign
gh pr create --title "feat: landing redesign — aura hero + orb in flow" --body "Implements docs/superpowers/specs/2026-05-31-landing-redesign-design.md. Aura hero whose orb shrinks into the traveling companion on scroll; clearer section hierarchy (kickers + view-all); new Contact CTA (mailto + GitHub). Reduced-motion safe; non-landing routes unchanged; Worker under budget."
```

---

## Self-Review Notes

- **Spec coverage:** aura hero + shrink-on-scroll (Tasks 1–4) · single persistent orb / hero↔travel phase (Task 3) · gating on orb-home so other routes unchanged (Task 3) · section hierarchy/kickers (Task 6) · Contact CTA mailto+GitHub (Tasks 5–6) · contact narration beat (Task 6) · reduced-motion safety (Task 3 falls back to V0; Task 7 gates breathe) · mute respected (Task 3 `!muted`) · worker budget (no new deps) · testing (helpers Task 1, orb Task 2, gating Task 3, CTA Task 5). All covered.
- **Type consistency:** `OrbGeometry`, `scrollProgress`, `interpolateOrb`, `HERO_HOME` used consistently across Tasks 1 and 3; `Orb` `style` prop added in Task 2 and consumed in Task 3.
- **One `data-narrate="hero"`:** moved onto the hero's inner div (Task 4) and the wrapper removed in Task 6 — exactly one remains.
- **Behavior preserved off the landing:** no orb-home → `geo` is null → identical V0 dock/anchor/bubble behavior.
