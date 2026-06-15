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
    taggedPrefix: "Articles tagués",
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
    metaDescription:
      "Lead Tech à la FARNUM d’EDF — je conçois et exploite la plateforme qui rend possible un développement moderne et rapide dans un environnement très réglementé et axé sécurité.",
    experience: "Expérience",
    skills: "Compétences",
    aiHeading: "Travailler avec l’IA",
    focusEyebrow: "Ce que j’approfondis en ce moment",
    intro: [
      "Je suis Titouan — je rends possible un développement moderne et rapide dans l’un des environnements les plus réglementés qui soient. En tant que Lead Tech à la FARNUM (Force d’Action Rapide du Numérique) d’EDF, je conçois et j’exploite une plateforme qui permet aux équipes locales de concevoir et de livrer leurs propres innovations, tout en respectant les règles de l’entreprise et des exigences strictes de cybersécurité.",
      "J’ai passé ma carrière des deux côtés de cette tension : à écrire le code — React, Symfony, IoT, authentification sécurisée — et à vivre les contraintes, au sein de la division production nucléaire d’EDF où « aller vite » et « avoir une fiabilité prouvée » doivent coexister. Je suis convaincu que les deux ne s’opposent pas ; l’ingénierie intéressante consiste à réduire l’écart entre elles.",
    ],
    experienceItems: [
      {
        role: "Lead Tech",
        org: "EDF — FARNUM (Force d’Action Rapide du Numérique)",
        period: "Déc. 2025 — Présent",
        blurb:
          "Je conçois et exploite une plateforme qui permet et accélère le développement et l’innovation en local, tout en la maintenant conforme aux règles de l’entreprise, à la gouvernance et aux exigences de cybersécurité.",
      },
      {
        role: "Appui aux projets informatiques",
        org: "EDF — Division Production Nucléaire",
        period: "2021 — 2024",
        blurb:
          "Appui aux projets informatiques en environnement nucléaire. Pilotage de la conduite du changement IT — digitalisation des processus de maintenance et d’exploitation nucléaires et déploiement d’IoT pour surveiller les zones à risque — et maintien des installations informatiques, gestion de l’infrastructure des applications web et administration applicative.",
      },
      {
        role: "Développeur Full Stack",
        org: "EDF — Division Production Nucléaire",
        period: "2020 — 2021",
        blurb:
          "Développement d’un ERP pour administrer et préparer la maintenance sur site : front-end React dynamique, back-end Symfony, services API Platform et authentification LDAP sécurisée.",
      },
    ],
    focusItems: [
      {
        name: "Kubernetes",
        note: "orchestration des charges de la plateforme — en self-service et encadré par les règles",
      },
      {
        name: "Conteneurisation",
        note: "images Docker / OCI ; des builds reproductibles qui passent la revue de sécurité par défaut",
      },
      {
        name: "Rust",
        note: "des systèmes plus sûrs et de l’outillage de plateforme — une justesse démontrable",
      },
    ],
    skillGroups: [
      {
        group: "Langages",
        caption: "Rust quand ça doit être juste, TypeScript quand ça doit sortir",
        items: ["Rust", "TypeScript", "JavaScript", "PHP", "Python", "SQL"],
      },
      {
        group: "Plateforme & Infra",
        caption: "le cœur du métier au quotidien — la plateforme elle-même",
        items: ["Kubernetes", "Docker", "Linux", "Git", "CI/CD", "Observabilité"],
      },
      {
        group: "Backend",
        caption: "la couche volontairement ennuyeuse sur laquelle tourne une plateforme réglementée",
        items: ["Symfony", "API Platform", "REST / OpenAPI", "PostgreSQL", "LDAP / SSO"],
      },
      {
        group: "Frontend",
        caption: "assez de soin pour rendre les systèmes utilisables",
        items: ["React", "Next.js", "HTML / CSS", "Tailwind"],
      },
      {
        group: "Mathématiques",
        caption: "le socle des systèmes et du travail sur l’IA",
        items: ["Algèbre linéaire", "Probabilités & statistiques", "Calcul différentiel", "Mathématiques discrètes", "Optimisation"],
      },
      {
        group: "Sécurité & Gouvernance",
        caption: "un paramètre de conception dès le départ, pas une case à cocher finale",
        items: ["Cybersécurité", "Gouvernance IT", "Conduite du changement"],
      },
    ],
    aiThreads: [
      {
        name: "Développement augmenté par l’IA",
        note: "workflows agentiques, développement piloté par les specs et revue assistée par l’IA, comme multiplicateur de force au quotidien",
      },
      {
        name: "Architecture & mécanismes internes",
        note: "comment les modèles fonctionnent vraiment — transformers, attention, embeddings, RAG et évaluation",
      },
    ],
    aiItems: ["LLM", "RAG", "Embeddings", "Agents", "Prompt engineering", "Fine-tuning"],
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
