# Design-System Showcase (`/design-system`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, bilingual `/design-system` case-study page that argues "rigor produces expression" with live proof — a page-scoped subject switcher, a token reference read from the source of truth, and the companion — linked from the footer.

**Architecture:** A new `[lang]/design-system` route renders narrative sections (copy from the i18n dictionaries) plus three live, client components (subject switcher, token reference, companion sandbox). The switcher sets `data-subject` on a *preview wrapper* only. Token values come from `src/design/tokens.ts` so they can't drift. The companion is given narration lines so it appears on the route.

**Tech Stack:** Next 16 (App Router), React 19, Tailwind v4, TypeScript, Vitest + Testing Library.

> **Spec:** `docs/superpowers/specs/2026-06-14-design-system-showcase-design.md`. Built on the merged branch (foundation + palette/aura + avatar + transitions + font present). Storybook (Phase 3b) is out of scope.

---

## File Structure

- **Modify** `src/i18n/dictionaries/en.ts` — add a `designSystem` section + `footer.designSystem` key.
- **Modify** `src/i18n/dictionaries/fr.ts` — the same keys, translated (parity test enforces this).
- **Modify** `src/lib/narration/script.ts` — add `/design-system` narration lines (en + fr) so the companion appears.
- **Modify** `src/components/footer.tsx` — add the "Design system" link.
- **Modify** `src/components/footer.test.tsx` — assert the new link.
- **Create** `src/components/design-system-showcase/subject-switcher.tsx` — page-scoped live switcher (client).
- **Create** `src/components/design-system-showcase/subject-switcher.test.tsx`
- **Create** `src/components/design-system-showcase/token-reference.tsx` — live token table from `tokens.ts`.
- **Create** `src/components/design-system-showcase/token-reference.test.tsx`
- **Create** `src/components/design-system-showcase/companion-sandbox.tsx` — bounded preview of the orb.
- **Create** `src/app/[lang]/design-system/page.tsx` — the route assembling all sections + metadata.

---

## Task 1: i18n copy + companion narration

**Files:**
- Modify: `src/i18n/dictionaries/en.ts`
- Modify: `src/i18n/dictionaries/fr.ts`
- Modify: `src/lib/narration/script.ts`
- Test: `src/i18n/dictionaries.test.ts` (existing parity test — must stay green)

- [ ] **Step 1: Add the `designSystem` block + footer key to `en.ts`**

In `src/i18n/dictionaries/en.ts`, add `designSystem: "Design system",` inside the existing `footer: { … }` object (after `now`). Then add this new top-level section before the closing `meta:` entry (i.e., as a sibling of `now`, `meta`, etc.):

```ts
  designSystem: {
    title: "Design system",
    metaDescription:
      "The design system behind this site — and the thinking that shaped it.",
    problemTitle: "The problem",
    problem1:
      "A portfolio for an engineer who works where systems thinking meets interface craft has to be both at once — rigorous as a system and expressive as craft. Most sites pick one: chase expression and you get chaos; chase rigor and you get generic.",
    problem2:
      "So the goal was never “add color.” It was to make expression an output of rigor — a disciplined token system, with contrast gated in CI, is what lets the site be colorful, alive, and per-subject without ever breaking. The site is the argument: a design-led engineer has to build the proof, not describe it.",
    principleTitle: "The principle",
    principle1:
      "Everything is a declension of one brand blue. Three layers — primitive values, semantic tokens, per-subject skins — make a “subject” a small, safe override, never a one-off.",
    principle2:
      "The page is the light; the companion is a lens. Each page carries a subtle aura in its subject’s colour, and the orb diffracts that light rather than emitting its own.",
    subjectsTitle: "Subjects, live",
    subjectsHint:
      "Pick a subject — the preview and the companion take on its colour. Same system, four declensions.",
    tokensTitle: "Tokens",
    tokensHint:
      "Read straight from the source of truth, so this can never drift from the site.",
    companionTitle: "The companion",
    companionBody:
      "An eyes-only lens that wears the active subject and reacts — it follows your cursor, drifts to sleep, and flares if you poke it.",
    decisionsTitle: "Decisions & trade-offs",
    decisions: [
      {
        q: "Teal for Systems, not green",
        a: "Green and red are reserved for success/error, and a green↔red split fails for red-green colour-blindness. Teal reads “infrastructure” without colliding with state.",
      },
      {
        q: "The page colours the companion",
        a: "The active subject is lifted to the page with a CSS :has() selector, so a fixed, off-scope orb still inherits the page’s colour.",
      },
      {
        q: "Accessibility by construction",
        a: "A contrast contract runs in CI: every accent, gradient stop, and aura tint is checked against WCAG AA. Motion is gated behind prefers-reduced-motion.",
      },
      {
        q: "A lens, not a mascot",
        a: "The companion is part of the system — it diffracts the page’s light — so personality never becomes decorative noise.",
      },
    ],
    outcomeTitle: "Outcome",
    outcome:
      "A coherent, accessible, self-theming portfolio: four subjects, contrast gated in CI, reduced-motion-safe, and extensible from one place.",
  },
```

- [ ] **Step 2: Mirror into `fr.ts`** — add `designSystem: "Système de design",` to the `footer` object and this section (same shape, same `decisions` length = 4):

```ts
  designSystem: {
    title: "Système de design",
    metaDescription:
      "Le système de design derrière ce site — et la réflexion qui l’a façonné.",
    problemTitle: "Le problème",
    problem1:
      "Le portfolio d’un ingénieur qui travaille là où la pensée systèmes rencontre le soin de l’interface doit être les deux à la fois — rigoureux comme un système, expressif comme un travail d’artisan. La plupart des sites choisissent : viser l’expression donne le chaos ; viser la rigueur donne du générique.",
    problem2:
      "L’objectif n’a jamais été « ajouter de la couleur ». C’était de faire de l’expression le produit de la rigueur — un système de tokens discipliné, avec les contrastes vérifiés en CI, est ce qui permet au site d’être coloré, vivant et propre à chaque sujet sans jamais casser. Le site est la démonstration : un ingénieur design-led doit construire la preuve, pas la décrire.",
    principleTitle: "Le principe",
    principle1:
      "Tout est une déclinaison d’un seul bleu de marque. Trois couches — valeurs primitives, tokens sémantiques, habillages par sujet — font d’un « sujet » une surcharge petite et sûre, jamais un cas unique.",
    principle2:
      "La page est la lumière ; le compagnon est une lentille. Chaque page porte une aura discrète dans la couleur de son sujet, et l’orbe diffracte cette lumière au lieu d’émettre la sienne.",
    subjectsTitle: "Les sujets, en direct",
    subjectsHint:
      "Choisissez un sujet — l’aperçu et le compagnon prennent sa couleur. Même système, quatre déclinaisons.",
    tokensTitle: "Tokens",
    tokensHint:
      "Lus directement depuis la source de vérité, pour ne jamais diverger du site.",
    companionTitle: "Le compagnon",
    companionBody:
      "Une lentille tout en yeux qui porte le sujet actif et réagit — elle suit le curseur, s’endort, et s’agace si on la titille.",
    decisionsTitle: "Décisions & arbitrages",
    decisions: [
      {
        q: "Turquoise pour Systems, pas vert",
        a: "Le vert et le rouge sont réservés aux états succès/erreur, et une opposition vert↔rouge échoue pour le daltonisme. Le turquoise évoque “l’infrastructure” sans entrer en conflit avec les états.",
      },
      {
        q: "La page colore le compagnon",
        a: "Le sujet actif est remonté à la page via un sélecteur CSS :has(), pour qu’un orbe fixe et hors-portée hérite quand même de la couleur de la page.",
      },
      {
        q: "L’accessibilité par construction",
        a: "Un contrat de contraste tourne en CI : chaque accent, arrêt de dégradé et teinte d’aura est vérifié contre WCAG AA. Le mouvement est conditionné à prefers-reduced-motion.",
      },
      {
        q: "Une lentille, pas une mascotte",
        a: "Le compagnon fait partie du système — il diffracte la lumière de la page — pour que la personnalité ne devienne jamais du bruit décoratif.",
      },
    ],
    outcomeTitle: "Résultat",
    outcome:
      "Un portfolio cohérent, accessible et auto-thématisé : quatre sujets, contrastes vérifiés en CI, respect du reduced-motion, et extensible depuis un seul endroit.",
  },
```

- [ ] **Step 3: Add narration lines** so the companion appears on the route. In `src/lib/narration/script.ts`, add a `/design-system` entry to BOTH the `en` and `fr` `NarrationMap` objects (use the existing `Mood` values `warm`/`focused`/`calm`):

In `en`:
```ts
  "/design-system": [
    { id: "problem", mood: "focused", text: "The system behind the site — here's how it thinks." },
    { id: "subjects", mood: "warm", text: "Watch me change colour with the subject." },
    { id: "decisions", mood: "calm", text: "And here's why each call was made." },
  ],
```
In `fr`:
```ts
  "/design-system": [
    { id: "problem", mood: "focused", text: "Le système derrière le site — voici comment il raisonne." },
    { id: "subjects", mood: "warm", text: "Regarde-moi changer de couleur selon le sujet." },
    { id: "decisions", mood: "calm", text: "Et voici pourquoi chaque choix a été fait." },
  ],
```

- [ ] **Step 4: Run the i18n tests** — `npx vitest run src/i18n/dictionaries.test.ts src/lib/narration` → PASS (fr/en key parity holds; narration resolver still works). If parity fails, a key is missing or mismatched between en and fr — fix it.

- [ ] **Step 5: Typecheck** — `npx tsc --noEmit` → clean (the `Dictionary` type widens automatically from `en`; `fr` must satisfy it).

- [ ] **Step 6: Commit**

```bash
git add src/i18n/dictionaries/en.ts src/i18n/dictionaries/fr.ts src/lib/narration/script.ts
git commit -m "feat(showcase): bilingual copy + companion narration for /design-system"
```

---

## Task 2: Footer link

**Files:**
- Modify: `src/components/footer.tsx`
- Modify: `src/components/footer.test.tsx`

- [ ] **Step 1: Add the failing assertion** to `src/components/footer.test.tsx`. First READ the file to match its render setup, then add a test that the footer renders a link to `/design-system`. Use the existing test's dictionary/lang setup; add:

```tsx
  it("links to the design-system page", () => {
    renderFooter(); // use whatever helper/inline render the file already uses
    const link = screen.getByRole("link", { name: /design system/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("/design-system"));
  });
```
(If the file renders inline rather than via a helper, mirror that pattern; pass a `t` that includes `designSystem: "Design system"`.)

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/components/footer.test.tsx`.

- [ ] **Step 3: Add the link** in `src/components/footer.tsx`, in the first `<nav>` (the uses/now nav), after the "now" link:

```tsx
        <Link
          href={localizedHref(lang, "/design-system")}
          className="transition-colors hover:text-foreground"
        >
          {t.designSystem}
        </Link>
```
(`t` is `Dictionary["footer"]`, which now includes `designSystem`.)

- [ ] **Step 4: Run → PASS** — `npx vitest run src/components/footer.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/footer.tsx src/components/footer.test.tsx
git commit -m "feat(showcase): footer link to /design-system"
```

---

## Task 3: Live subject switcher

**Files:**
- Create: `src/components/design-system-showcase/subject-switcher.tsx`
- Test: `src/components/design-system-showcase/subject-switcher.test.tsx`

> Client component. Holds local subject state, renders the four subject buttons, and a preview region whose `data-subject` (and `--subject-accent`) reflect the selection — so the aura/accent/components AND any embedded orb recolor, page-scoped.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubjectSwitcher } from "./subject-switcher";

describe("SubjectSwitcher", () => {
  it("defaults the preview to brand", () => {
    const { container } = render(<SubjectSwitcher />);
    expect(container.querySelector("[data-ds-preview]")?.getAttribute("data-subject")).toBe("brand");
  });

  it("recolors the preview when a subject is chosen", async () => {
    const user = userEvent.setup();
    const { container } = render(<SubjectSwitcher />);
    await user.click(screen.getByRole("button", { name: /systems/i }));
    expect(container.querySelector("[data-ds-preview]")?.getAttribute("data-subject")).toBe("systems");
  });

  it("renders a control for every subject", () => {
    render(<SubjectSwitcher />);
    for (const name of ["brand", "systems", "interface", "ai"]) {
      expect(screen.getByRole("button", { name: new RegExp(name, "i") })).toBeInTheDocument();
    }
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/components/design-system-showcase/subject-switcher.test.tsx`.

- [ ] **Step 3: Implement**

```tsx
"use client";

import { useState } from "react";
import { SUBJECTS, type SubjectId } from "@/design/tokens";

const LABELS: Record<SubjectId, string> = {
  brand: "Brand",
  systems: "Systems",
  interface: "Interface",
  ai: "AI",
};

export function SubjectSwitcher() {
  const [subject, setSubject] = useState<SubjectId>("brand");

  return (
    <div>
      <div role="group" aria-label="Subject" className="flex flex-wrap gap-2">
        {SUBJECTS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubject(id)}
            aria-pressed={subject === id}
            className="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
            style={
              subject === id
                ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }
                : { borderColor: "var(--border)", color: "var(--muted)" }
            }
            data-subject={id}
          >
            {LABELS[id]}
          </button>
        ))}
      </div>

      <div
        data-ds-preview
        data-subject={subject}
        className="mt-6 overflow-hidden rounded-2xl border border-border p-8"
        style={{
          background:
            "radial-gradient(120% 90% at 85% -10%, var(--accent-soft), transparent 55%), var(--surface)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest accent-text">
          {LABELS[subject]} subject
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight">
          The page wears <span className="accent-text">this colour</span>.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="accent-fill rounded-lg px-4 py-2 text-sm font-semibold">Primary action</span>
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }}
          >
            {LABELS[subject]}
          </span>
        </div>
      </div>
    </div>
  );
}
```

(`.accent-text`/`.accent-fill` are the existing utilities; they resolve against the preview's `data-subject`. The buttons themselves carry `data-subject={id}` so each pressed button shows its own colour.)

- [ ] **Step 4: Run → PASS** — `npx vitest run src/components/design-system-showcase/subject-switcher.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/design-system-showcase/subject-switcher.tsx src/components/design-system-showcase/subject-switcher.test.tsx
git commit -m "feat(showcase): page-scoped live subject switcher"
```

---

## Task 4: Live token reference

**Files:**
- Create: `src/components/design-system-showcase/token-reference.tsx`
- Test: `src/components/design-system-showcase/token-reference.test.tsx`

> Renders one row per subject from `tokens.ts` (the source of truth) so it cannot drift. Server component (pure render).

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TokenReference } from "./token-reference";
import { SUBJECTS, TOKENS } from "@/design/tokens";

describe("TokenReference", () => {
  it("renders a row for every subject in tokens.ts", () => {
    render(<TokenReference />);
    for (const id of SUBJECTS) {
      expect(screen.getByText(id, { exact: false })).toBeInTheDocument();
    }
  });

  it("shows each subject's accent hex from the source of truth", () => {
    render(<TokenReference />);
    expect(screen.getByText(TOKENS.systems.accent.light, { exact: false })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run → FAIL** — `npx vitest run src/components/design-system-showcase/token-reference.test.tsx`.

- [ ] **Step 3: Implement**

```tsx
import { SUBJECTS, TOKENS, gradientCss } from "@/design/tokens";

export function TokenReference() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {SUBJECTS.map((id) => {
        const t = TOKENS[id];
        const swatch = gradientCss(id);
        return (
          <li key={id} className="flex items-center gap-3 rounded-xl border border-border p-4">
            <span
              aria-hidden="true"
              className="h-10 w-10 shrink-0 rounded-lg"
              style={{ background: swatch }}
            />
            <div className="min-w-0">
              <p className="font-semibold capitalize">{id}</p>
              <p className="font-mono text-xs text-muted">
                light {t.accent.light} · dark {t.accent.dark}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run → PASS** — `npx vitest run src/components/design-system-showcase/token-reference.test.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/design-system-showcase/token-reference.tsx src/components/design-system-showcase/token-reference.test.tsx
git commit -m "feat(showcase): live token reference from the source of truth"
```

---

## Task 5: Companion sandbox

**Files:**
- Create: `src/components/design-system-showcase/companion-sandbox.tsx`

> A bounded, static preview that shows the orb material itself (the live site companion is already present on the route via narration; this section gives a labelled, in-flow look). Reuses the existing `Orb` component. No new logic.

- [ ] **Step 1: Implement** (no unit test — purely presentational; verified in-browser)

```tsx
import { Orb } from "@/components/companion/orb";

export function CompanionSandbox() {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-2xl border border-border p-10"
      style={{
        background:
          "radial-gradient(120% 90% at 80% 0%, var(--accent-soft), transparent 55%), var(--surface)",
      }}
    >
      <div style={{ width: 120, height: 120, position: "relative" }}>
        <Orb mood="calm" reaction="active" gaze={{ x: 0, y: 0 }} style={{ width: 120, height: 120 }} />
      </div>
    </div>
  );
}
```

(If `Orb`'s prop names differ from `{ mood, reaction, gaze, style }`, read `src/components/companion/orb.tsx` and match them. The orb reads `--subject-accent`; inside the showcase it inherits whatever subject scope it sits in.)

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/design-system-showcase/companion-sandbox.tsx
git commit -m "feat(showcase): companion sandbox preview"
```

---

## Task 6: The route — assemble the case study

**Files:**
- Create: `src/app/[lang]/design-system/page.tsx`

> Server component. Reads the dictionary, renders the narrative arc + the three live components, wires `data-narrate` ids matching the narration (`problem`, `subjects`, `decisions`) so the companion tracks sections. Mirrors the metadata pattern from `uses/page.tsx`.

- [ ] **Step 1: Implement the route**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/core/domain/site";
import { MorphTitle } from "@/components/transitions/morph-title";
import { PAGE_TITLE } from "@/lib/transitions/names";
import { SubjectSwitcher } from "@/components/design-system-showcase/subject-switcher";
import { TokenReference } from "@/components/design-system-showcase/token-reference";
import { CompanionSandbox } from "@/components/design-system-showcase/companion-sandbox";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const dict = await getDictionary(locale);
  const routePath = "/design-system";
  return {
    title: dict.designSystem.title,
    description: dict.designSystem.metaDescription,
    alternates: {
      canonical: `${site.url}/${locale}${routePath}`,
      languages: {
        en: `${site.url}/en${routePath}`,
        fr: `${site.url}/fr${routePath}`,
        "x-default": `${site.url}/en${routePath}`,
      },
    },
    openGraph: {
      title: dict.designSystem.title,
      description: dict.designSystem.metaDescription,
      locale: locale === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function DesignSystemPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const ds = dict.designSystem;

  return (
    <article className="py-8">
      <MorphTitle name={PAGE_TITLE}>
        <h1 className="text-3xl font-bold tracking-tight">{ds.title}</h1>
      </MorphTitle>

      <section className="mt-8 max-w-2xl" data-narrate="problem">
        <h2 className="text-xl font-semibold tracking-tight">{ds.problemTitle}</h2>
        <p className="mt-3 text-muted">{ds.problem1}</p>
        <p className="mt-3 text-muted">{ds.problem2}</p>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">{ds.principleTitle}</h2>
        <p className="mt-3 text-muted">{ds.principle1}</p>
        <p className="mt-3 text-muted">{ds.principle2}</p>
      </section>

      <section className="mt-12" data-narrate="subjects">
        <h2 className="text-xl font-semibold tracking-tight">{ds.subjectsTitle}</h2>
        <p className="mt-2 text-muted">{ds.subjectsHint}</p>
        <div className="mt-6"><SubjectSwitcher /></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">{ds.tokensTitle}</h2>
        <p className="mt-2 text-muted">{ds.tokensHint}</p>
        <div className="mt-6"><TokenReference /></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight">{ds.companionTitle}</h2>
        <p className="mt-2 max-w-2xl text-muted">{ds.companionBody}</p>
        <div className="mt-6"><CompanionSandbox /></div>
      </section>

      <section className="mt-12 max-w-2xl" data-narrate="decisions">
        <h2 className="text-xl font-semibold tracking-tight">{ds.decisionsTitle}</h2>
        <dl className="mt-4 space-y-5">
          {ds.decisions.map((d) => (
            <div key={d.q}>
              <dt className="font-semibold">{d.q}</dt>
              <dd className="mt-1 text-muted">{d.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">{ds.outcomeTitle}</h2>
        <p className="mt-3 text-muted">{ds.outcome}</p>
      </section>
    </article>
  );
}
```

- [ ] **Step 2: Add `generateStaticParams`** so the route is statically generated per locale (match the pattern other routes use — e.g. `layout.tsx` exports it; pages under `[lang]` are covered by the layout's params, but if the build requires it, add to this page):

```tsx
import { locales } from "@/i18n/config";
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}
```
(Add only if `npm run build` complains about missing params for the route; otherwise skip — the `[lang]` layout already provides them.)

- [ ] **Step 3: Typecheck, tests, build**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass (incl. dictionaries parity, footer, switcher, token-reference).

Run: `npm run build`
Expected: succeeds; `/en/design-system` and `/fr/design-system` are generated.

- [ ] **Step 4: In-browser check** — `npm run dev`, open `http://localhost:3000/en/design-system`:
  - The companion appears (narration present) and tracks sections.
  - The subject switcher recolors the preview + its embedded accents.
  - The token reference shows four subjects with real hexes/gradients.
  - The footer "Design system" link works; `/fr/design-system` shows French copy.
  - Toggle dark mode + reduced-motion: legible, no motion escapes.

- [ ] **Step 5: Commit**

```bash
git add src/app/[lang]/design-system/page.tsx
git commit -m "feat(showcase): /design-system case-study route"
```

---

## Self-review notes (against the spec)

- Genre-2 case study, public bilingual route → Tasks 1, 6. ✓
- Problem spine (rigor produces expression) + four sub-problems as decisions → Task 1 copy + Task 6 sections. ✓
- Arc: Problem → Principle → live subjects → live tokens → companion → decisions → outcome → Task 6. ✓
- Live subject switcher, page-scoped (`data-subject` on a preview wrapper) → Task 3. ✓
- Token reference from `tokens.ts` (no drift) → Task 4 (+ test asserts it derives from `TOKENS`). ✓
- Companion present (narration lines) + sandbox → Tasks 1, 5. ✓
- Footer link → Task 2. ✓
- Bilingual (en/fr parity enforced) → Task 1 (+ existing parity test). ✓
- Dogfoods system; reduced-motion inherited; no new deps → Tasks 3–6. ✓
- Storybook / exhaustive docs / site-wide switcher excluded → not in any task. ✓
- Type consistency: `SubjectId`/`SUBJECTS`/`TOKENS`/`gradientCss` from `@/design/tokens`; `Orb` props `{mood,reaction,gaze,style}` (verify against orb.tsx in Task 5); dict key `designSystem` used in footer + route + metadata identically. ✓
- Visual/narrative polish is browser-verified (Task 6 Step 4), stated per spec.
```
