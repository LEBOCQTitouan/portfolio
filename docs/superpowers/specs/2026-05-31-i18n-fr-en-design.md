# FR/EN Internationalization — Design Spec

**Status:** Approved design, ready for implementation planning
**Date:** 2026-05-31

## 1. Goal & decisions

Add a French/English language system to the portfolio. Settled decisions:

- **Tooling:** Next.js 16.2.6 **built-in** i18n — `middleware` for locale negotiation + a `[lang]` route segment + typed per-locale dictionaries. **No i18n dependency** (protects the 3 MiB Worker budget; matches the project's lean ethos). Locale matching is hand-rolled for the two locales (no `negotiator`/`intl-localematcher`).
- **Scope:** the i18n *system* + all UI strings + companion narration + metadata are translated to FR now. **MDX content falls back to EN** when no FR file exists (FR articles added incrementally — out of scope here).
- **URL strategy:** prefix everything — `/en/*` and `/fr/*`; **`en` is the default**. Un-prefixed paths (the currently-live `/about`, `/`, …) redirect to their `/en/*` twin so existing links don't 404.
- **Content storage:** locale subdirectories `content/{locale}/posts`, `content/{locale}/projects`, with **per-slug EN fallback**.
- **FR authoring:** I draft idiomatic French for UI + narration; the author reviews/refines.

This is implemented per `node_modules/next/dist/docs/01-app/02-guides/internationalization.md` (the plan phase reads it — this Next version's i18n specifics may differ from common knowledge).

## 2. Locales

```ts
// src/i18n/config.ts
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export function isLocale(x: string): x is Locale { return (locales as readonly string[]).includes(x); }
```

## 3. Routing & middleware

- **Move all pages under `app/[lang]/`:** `app/page.tsx` → `app/[lang]/page.tsx`, and likewise `about`, `uses`, `now`, `blog`, `blog/[slug]`, `blog/tags/[tag]`, `work`, `work/[slug]`, plus the per-route `opengraph-image.tsx`. `app/[lang]/layout.tsx` becomes the **root layout**, rendering `<html lang={lang}>` and wrapping the existing providers/nav/footer/companion.
- **Site-wide single files stay at `app/` root** and enumerate locales: `sitemap.ts`, `robots.ts`, `rss.xml/route.ts`, and `api/subscribe/route.ts` (the API is locale-agnostic). `app/layout.tsx`’s `<html>`/`<body>` responsibilities move into `app/[lang]/layout.tsx` per the Next i18n doc.
- **`generateStaticParams`** on the `[lang]` layout returns `[{ lang: "en" }, { lang: "fr" }]` so both locales prerender (preserves full SSG).
- **`middleware.ts`** at the repo root:
  - Skips `/_next`, static assets, `/api`, and files with an extension.
  - If the path already starts with a known locale → continue.
  - Else negotiate: **cookie `NEXT_LOCALE` → `Accept-Language` (hand-parsed: pick `fr` if preferred over `en`, else `en`) → `defaultLocale`**, then **redirect** to `/{locale}{path}` (so `/about` → `/en/about`, `/` → `/en`). Sets/refreshes the `NEXT_LOCALE` cookie.
- **`isLocale` guard** in the `[lang]` layout/pages: unknown `lang` → `notFound()`.

## 4. UI strings — dictionaries + `useT`

- **Dictionaries:** `src/i18n/dictionaries/en.ts` is the **source of truth** and exports the `Dictionary` type (`export type Dictionary = typeof en`). `fr.ts` is typed `: Dictionary`, so the compiler enforces it has exactly the same keys. Keys are namespaced by area (e.g. `nav`, `footer`, `hero`, `home`, `blog`, `work`, `about`, `uses`, `now`, `newsletter`, `contact`, `common`).
- **Server access:** `getDictionary(lang)` (in `src/i18n/get-dictionary.ts`) dynamically imports the locale module. Server components/pages call it and read `dict.section.key`.
- **Client access:** `app/[lang]/layout.tsx` renders `<TranslationProvider dictionary={dict} lang={lang}>` (a `"use client"` context). A `useT()` hook returns the dictionary (and `lang`) for client components. This is the small (~30-line) owned context — `src/i18n/translation-provider.tsx` + `use-t.ts`.
- **Extraction:** the ~70 hardcoded strings across nav, footer, hero, contact-cta, newsletter, blog-explorer, the page headers/empty-states, about/uses/now content labels, theme-toggle aria, and `[slug]` detail labels ("Source →", "min read", etc.) move into the dictionaries. Dynamic/data-driven content (the about/uses/now *lists*, project frontmatter) is treated as content (see §5), not UI strings.

## 5. Content i18n (hexagonal, EN fallback)

- **Files:** move existing `content/posts/*` → `content/en/posts/*` and `content/projects/*` → `content/en/projects/*`. `content/fr/…` is added per-article later.
- **Port:** `ContentRepository` gains the locale:
  ```ts
  interface ContentRepository {
    listPosts(locale: Locale): Post[];
    listProjects(locale: Locale): Project[];
  }
  ```
- **Adapter (`MdxContentRepository`):** reads `content/{locale}/{posts|projects}`. **Fallback rule:** the canonical slug set comes from `en`; for `fr`, each slug uses its `content/fr/...` file if present, else the `content/en/...` file. (So FR is an overlay on the EN base — never produces a slug that doesn't exist in EN.)
- **In-memory adapter:** `InMemoryContentRepository` updated to hold `{ en: {...}, fr: {...} }` (or accept a locale-keyed map) for tests.
- **Use-cases & composition:** `makeContentUseCases` and the `composition/server` legacy exports become locale-aware (`getAllPosts(locale)`, `getPostBySlug(locale, slug)`, `getAllProjects(locale)`, …). Every caller (pages, `sitemap`, `rss`, `opengraph-image`) passes the locale; the site-wide files iterate both locales.
- **Dates:** the blog post date formatting switches from hardcoded `"en-US"` to the active locale (`toLocaleDateString(lang, …)`).

## 6. Companion narration

- The narration script becomes per-locale: `src/lib/narration/script.ts` exports `{ en: NarrationMap, fr: NarrationMap }` (or `script.en.ts` / `script.fr.ts`).
- `getNarration(route, locale)` **strips the `/en`|`/fr` prefix** from `route` before matching the script's route keys (which stay locale-agnostic: `/`, `/about`, `/work/[slug]`, …), then indexes the locale's map.
- The `Companion` (client) derives the current locale from `usePathname()` (first segment) and passes it to `getNarration`. FR narration drafted by me.

## 7. Metadata & SEO

- `generateMetadata({ params })` reads `lang`, pulls localized `title`/`description` from `getDictionary(lang)` (and from content for `[slug]` pages), and sets:
  - **`alternates.languages`** (hreflang): each page maps `en`/`fr` to its twin URL, plus `x-default` → the `en` URL.
  - `openGraph.locale` (`en_US` / `fr_FR`).
- `<html lang={lang}>` is correct per locale (§3).
- **Sitemap** emits every route for both locales, each entry carrying `alternates.languages`. **RSS** is generated per locale (e.g. `/rss.xml` = en; the feed `language` field set accordingly — a `/fr/rss.xml` may be added, or the single feed documents `en` as canonical; default: keep one EN feed + note FR feed as a later addition).
- The giscus comments `lang` prop switches with the active locale.

## 8. Language switcher

A small client control in the nav (`src/components/language-switcher.tsx`): shows `FR · EN`, links the current path to the **other** locale (swap the first segment), and sets the `NEXT_LOCALE` cookie on click so the middleware honors the preference. Marked-up as accessible links with `hreflang` and `aria-current`.

## 9. Testing

- **Locale negotiation** (pure helper extracted from middleware): cookie > Accept-Language > default; `fr`/`en` matching; unknown → default.
- **Dictionaries:** `fr` satisfies the `Dictionary` type at compile time; a test asserts `Object.keys` parity between `en` and `fr` (catches drift even if a key is widened).
- **Content repo:** `listPosts("fr")` overlays FR on EN and falls back per slug (in-memory + a real-dir integration test with an `en/` fixture and a partial `fr/`).
- **Narration resolver:** `getNarration("/fr/about", "fr")` strips the prefix and returns the FR `/about` beats; unknown route → `[]`.
- **Switcher:** swaps `/en/x` ↔ `/fr/x`, preserving the rest of the path; sets the cookie.
- **Build:** both locales prerender; all routes static/SSG; Worker still under 3 MiB.

## 10. Migration & sequencing

The plan will sequence the work so each phase keeps the suite green:
1. `i18n/config` + locale negotiation helper + `middleware.ts` + the `[lang]` segment move (EN only wired) → site works at `/en/*`, old URLs redirect.
2. Dictionaries (`en` first) + `getDictionary` + `TranslationProvider`/`useT`; extract UI strings (still EN).
3. Content locale-threading + EN fallback (move content to `content/en`).
4. Narration locale-threading.
5. Metadata/hreflang + sitemap/RSS locale iteration + dates + giscus lang.
6. Language switcher.
7. Add the `fr` dictionary + FR narration (my drafts) → fully bilingual shell.

## 11. Out of scope (YAGNI)

FR translations of the 5 MDX articles (EN fallback; added later) · 3rd+ locales · ICU pluralization/rich formatting · RTL · per-locale domains. The architecture leaves clean seams for all of these (add a locale to `config`, a dictionary file, a content subdir).

## 12. Success criteria

- `/en/*` and `/fr/*` both render, fully prerendered; un-prefixed legacy URLs redirect to `/en/*`.
- All chrome/UI + companion narration display in French under `/fr`; articles fall back to EN when no FR file exists.
- `hreflang`/`<html lang>`/sitemap correct; a working `FR · EN` switcher that preserves the current page and remembers the choice.
- Tests green; build clean; Worker under 3 MiB (no new runtime deps).
