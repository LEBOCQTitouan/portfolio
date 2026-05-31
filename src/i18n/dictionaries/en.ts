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
