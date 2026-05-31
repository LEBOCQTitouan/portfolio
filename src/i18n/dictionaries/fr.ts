import type { Dictionary } from "./en";

export const fr: Dictionary = {
  common: {
    skipToContent: "Aller au contenu",
    minRead: "min de lecture",
  },
  nav: {
    work: "Projets",
    writing: "Articles",
    about: "À propos",
    toggleTheme: "Changer de thème",
  },
  footer: {
    uses: "Outils",
    now: "Maintenant",
    github: "GitHub",
    linkedin: "LinkedIn",
  },
  hero: {
    eyebrow: "Ingénieur logiciel · Design-led",
    title: "L'ingénierie avec l'exigence du design.",
    subtitle:
      "Je construis des systèmes backend robustes et des interfaces que les gens apprécient — en repoussant les limites de la technologie sans jamais sacrifier la clarté.",
    viewWork: "Voir les projets",
    readWriting: "Lire les articles",
  },
  home: {
    whatIDo: "Ce que je fais",
    systems: "Systèmes",
    systemsDesc: "Backends distribués, rapides et fiables.",
    interfaces: "Interfaces",
    interfacesDesc: "UI soignée, accessible et agréable.",
    selectedWork: "Projets sélectionnés",
    viewAll: "Voir tout →",
    latestWriting: "Articles récents",
    readAll: "Lire tout →",
  },
  contact: {
    title: "Construisons quelque chose ensemble.",
    body: "Je suis ouvert aux missions et collaborations. Le moyen le plus rapide de me joindre, c'est l'email.",
    getInTouch: "Me contacter",
    github: "GitHub",
  },
  newsletter: {
    title: "S'abonner aux nouveaux articles",
    body: "Essais occasionnels sur le logiciel et le design. Zéro spam.",
    emailLabel: "Adresse e-mail",
    placeholder: "vous@exemple.com",
    submit: "S'abonner",
    success: "Merci — vous êtes abonné.",
    error: "Une erreur est survenue. Veuillez réessayer.",
  },
  blog: {
    title: "Articles",
    description: "Essais et notes sur le logiciel, les systèmes et le design.",
    empty: "Aucun article pour l'instant.",
    searchPlaceholder: "Rechercher des articles",
    searchLabel: "Rechercher des articles",
    noMatch: "Aucun article ne correspond.",
    tag: "Tag",
  },
  work: {
    title: "Projets",
    description: "Projets sélectionnés en systèmes backend et interfaces.",
    empty: "Aucun projet pour l'instant.",
    source: "Code source →",
    liveDemo: "Démo en ligne →",
  },
  about: {
    title: "À propos",
    metaDescription: "Ingénieur logiciel spécialisé en systèmes backend et design.",
    experience: "Expérience",
    skills: "Compétences",
  },
  uses: {
    title: "Outils",
    metaDescription: "Les outils, le matériel et les logiciels que j'utilise au quotidien.",
  },
  now: {
    title: "Maintenant",
    metaDescription: "Sur quoi je me concentre en ce moment.",
    lastUpdated: "Dernière mise à jour",
    focusedOn: "Ce sur quoi je me concentre en ce moment :",
    nowPageLabel: "page /now",
  },
  meta: {
    siteTitle: "Titouan Lebocq",
    siteDescription: "Ingénieur logiciel — l'ingénierie avec l'exigence du design.",
  },
  companion: {
    mute: "Mettre en sourdine le compagnon",
    unmute: "Réactiver le compagnon",
  },
} as const;
