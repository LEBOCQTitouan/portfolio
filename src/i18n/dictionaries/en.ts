export const en = {
  common: {
    skipToContent: "Skip to content",
    minRead: "min read",
  },
  nav: {
    work: "Work",
    writing: "Writing",
    about: "About",
    toggleTheme: "Toggle theme",
  },
  footer: {
    uses: "Uses",
    now: "Now",
    designSystem: "Design system",
    github: "GitHub",
    linkedin: "LinkedIn",
  },
  hero: {
    eyebrow: "Software Engineer · Design-led",
    title: "Engineering with the craft of design.",
    subtitle:
      "I build robust backend systems and interfaces people love — pushing technology to its limits without ever losing clarity.",
    viewWork: "View work",
    readWriting: "Read writing",
  },
  home: {
    whatIDo: "What I do",
    systems: "Systems",
    systemsDesc: "Distributed, fast, reliable backends.",
    interfaces: "Interfaces",
    interfacesDesc: "Polished, accessible, delightful UI.",
    selectedWork: "Selected work",
    viewAll: "View all →",
    latestWriting: "Latest writing",
    readAll: "Read all →",
  },
  contact: {
    title: "Let's build something.",
    body: "I'm open to roles and collaborations. The fastest way to reach me is email.",
    getInTouch: "Get in touch",
    github: "GitHub",
  },
  newsletter: {
    title: "Subscribe to new posts",
    body: "Occasional essays on software and design craft. No spam.",
    emailLabel: "Email address",
    placeholder: "you@example.com",
    submit: "Subscribe",
    success: "Thanks — you're subscribed.",
    error: "Something went wrong. Please try again.",
  },
  blog: {
    title: "Writing",
    description: "Essays and notes on software, systems, and design craft.",
    empty: "No posts yet.",
    searchPlaceholder: "Search posts",
    searchLabel: "Search posts",
    noMatch: "No posts match.",
    tag: "Tag",
    taggedPrefix: "Posts tagged",
  },
  work: {
    title: "Work",
    description: "Selected projects across backend systems and interfaces.",
    empty: "No projects yet.",
    source: "Source →",
    liveDemo: "Live demo →",
  },
  about: {
    title: "About",
    metaDescription: "Software engineer focused on backend systems and design craft.",
    experience: "Experience",
    skills: "Skills",
  },
  uses: {
    title: "Uses",
    metaDescription: "The tools, hardware, and software I use day to day.",
  },
  now: {
    title: "Now",
    metaDescription: "What I'm focused on right now.",
    lastUpdated: "Last updated",
    focusedOn: "What I'm focused on at the moment:",
    nowPageLabel: "/now page",
  },
  designSystem: {
    title: "Design system",
    metaDescription:
      "The design system behind this site — and the thinking that shaped it.",
    problemTitle: "The problem",
    problem1:
      "A portfolio for an engineer who works where systems thinking meets interface craft has to be both at once — rigorous as a system and expressive as craft. Most sites pick one: chase expression and you get chaos; chase rigor and you get generic.",
    problem2:
      `So the goal was never “add color.” It was to make expression an output of rigor — a disciplined token system, with contrast gated in CI, is what lets the site be colorful, alive, and per-subject without ever breaking. The site is the argument: a design-led engineer has to build the proof, not describe it.`,
    principleTitle: "The principle",
    principle1:
      `Everything is a declension of one brand blue. Three layers — primitive values, semantic tokens, per-subject skins — make a "subject" a small, safe override, never a one-off.`,
    principle2:
      "The page is the light; the companion is a lens. Each page carries a subtle aura in its subject's colour, and the orb diffracts that light rather than emitting its own.",
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
        a: `Green and red are reserved for success/error, and a green↔red split fails for red-green colour-blindness. Teal reads "infrastructure" without colliding with state.`,
      },
      {
        q: "The page colours the companion",
        a: "The active subject is lifted to the page with a CSS :has() selector, so a fixed, off-scope orb still inherits the page's colour.",
      },
      {
        q: "Accessibility by construction",
        a: "A contrast contract runs in CI: every accent, gradient stop, and aura tint is checked against WCAG AA. Motion is gated behind prefers-reduced-motion.",
      },
      {
        q: "A lens, not a mascot",
        a: "The companion is part of the system — it diffracts the page's light — so personality never becomes decorative noise.",
      },
    ],
    outcomeTitle: "Outcome",
    outcome:
      "A coherent, accessible, self-theming portfolio: four subjects, contrast gated in CI, reduced-motion-safe, and extensible from one place.",
  },
  meta: {
    siteTitle: "Titouan Lebocq",
    siteDescription: "Software engineer — engineering with the craft of design.",
  },
  companion: {
    mute: "Mute site companion",
    unmute: "Unmute site companion",
  },
} as const;

/** Recursive mapped type that widens literal string leaves to `string`.
 *  This lets translated dictionaries (fr, …) satisfy the type while the
 *  compiler still enforces that every key is present.
 */
type Widen<T> = T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
