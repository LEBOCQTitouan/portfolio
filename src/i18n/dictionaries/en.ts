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
    metaDescription:
      "Lead Tech at EDF FARNUM — I build and operate the platform that makes fast, modern development possible inside a highly regulated, security-first organization.",
    experience: "Experience",
    skills: "Skills",
    aiHeading: "Working with AI",
    focusEyebrow: "Currently going deep on",
    intro: [
      "I’m Titouan — I make modern, fast development possible in one of the most regulated environments there is. As Lead Tech at EDF’s FARNUM (Force d’Action Rapide du Numérique), I create and operate a platform that lets local teams build and ship their own innovations, while staying inside company policy and strict cybersecurity rules.",
      "I’ve spent my career on both sides of that tension: writing the code — React, Symfony, IoT, secure auth — and living the constraints, from inside EDF’s nuclear production division where “move fast” and “get it provably right” have to coexist. I’m convinced those two aren’t opposites; the interesting engineering is in closing the gap between them.",
    ],
    experienceItems: [
      {
        role: "Lead Tech",
        org: "EDF — FARNUM (Force d’Action Rapide du Numérique)",
        period: "Dec 2025 — Present",
        blurb:
          "Build and operate a platform that enables and accelerates local development and innovation, while keeping it aligned with company policy, governance, and cybersecurity requirements.",
      },
      {
        role: "IT Project Support",
        org: "EDF — Nuclear Production Division",
        period: "2021 — 2024",
        blurb:
          "Supported IT projects in a nuclear environment. Led IT change management — digitalizing nuclear maintenance and operations processes and deploying IoT to monitor high-risk zones — and maintained IT facilities, managing web-application infrastructure and administering applications.",
      },
      {
        role: "Full Stack Developer",
        org: "EDF — Nuclear Production Division",
        period: "2020 — 2021",
        blurb:
          "Built an ERP to administer and prepare on-site maintenance: dynamic React front end, Symfony back end, API Platform services, and secure LDAP authentication.",
      },
    ],
    focusItems: [
      {
        name: "Kubernetes",
        note: "orchestrating the platform’s workloads — self-serve and policy-bound",
      },
      {
        name: "Containerization",
        note: "Docker / OCI images; reproducible builds that pass security review by default",
      },
      {
        name: "Rust",
        note: "safer systems and platform tooling — correctness you can prove",
      },
    ],
    skillGroups: [
      {
        group: "Languages",
        caption: "Rust when it must be right, TypeScript when it must ship",
        items: ["Rust", "TypeScript", "JavaScript", "PHP", "Python", "SQL"],
      },
      {
        group: "Platform & Infra",
        caption: "where the day job lives — the platform itself",
        items: ["Kubernetes", "Docker", "Linux", "Git", "CI/CD", "Observability"],
      },
      {
        group: "Backend",
        caption: "the boring-on-purpose layer a regulated platform runs on",
        items: ["Symfony", "API Platform", "REST / OpenAPI", "PostgreSQL", "LDAP / SSO"],
      },
      {
        group: "Frontend",
        caption: "enough craft to make the systems usable",
        items: ["React", "Next.js", "HTML / CSS", "Tailwind"],
      },
      {
        group: "Mathematics",
        caption: "the foundation under the systems and AI work",
        items: ["Linear algebra", "Probability & statistics", "Calculus", "Discrete math", "Optimization"],
      },
      {
        group: "Security & Governance",
        caption: "a design input from day one, not a final checkbox",
        items: ["Cybersecurity", "IT governance", "Change management"],
      },
    ],
    aiThreads: [
      {
        name: "Augmented coding",
        note: "agentic workflows, spec-driven development, and AI-assisted review as a daily force multiplier",
      },
      {
        name: "Architecture & inner mechanisms",
        note: "how the models actually work — transformers, attention, embeddings, RAG, and evaluation",
      },
    ],
    aiItems: ["LLMs", "RAG", "Embeddings", "Agents", "Prompt engineering", "Fine-tuning"],
  },
  uses: {
    title: "Uses",
    metaDescription: "The tools and software I reach for day to day.",
    intro: "The kit I actually reach for — and why each one earns its place.",
    dotfilesLabel: "My dotfiles",
  },
  now: {
    title: "Now",
    metaDescription: "What I'm focused on right now.",
    updatedPrefix: "Updated",
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
    previewLead: "The page wears",
    previewAccent: "this colour",
    primaryAction: "Primary action",
    tokensTitle: "Colour tokens",
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
    typeTitle: "Type",
    typeHint: "Two typefaces — a display face for the wordmark, Inter for everything else.",
    typeDisplay: "Display · Dragonsteel · the wordmark",
    typeSans: "Sans · Inter · everything else",
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
