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
    designSystem: "Système de design",
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
    intro: "Le matériel que j'utilise vraiment — et pourquoi chacun mérite sa place.",
  },
  now: {
    title: "Maintenant",
    metaDescription: "Sur quoi je me concentre en ce moment.",
    lastUpdated: "Dernière mise à jour",
    focusedOn: "Ce sur quoi je me concentre en ce moment :",
    nowPageLabel: "page /now",
  },
  designSystem: {
    title: "Système de design",
    metaDescription:
      "Le système de design derrière ce site — et la réflexion qui l'a façonné.",
    problemTitle: "Le problème",
    problem1:
      "Le portfolio d'un ingénieur qui travaille là où la pensée systèmes rencontre le soin de l'interface doit être les deux à la fois — rigoureux comme un système, expressif comme un travail d'artisan. La plupart des sites choisissent : viser l'expression donne le chaos ; viser la rigueur donne du générique.",
    problem2:
      "L'objectif n'a jamais été « ajouter de la couleur ». C'était de faire de l'expression le produit de la rigueur — un système de tokens discipliné, avec les contrastes vérifiés en CI, est ce qui permet au site d'être coloré, vivant et propre à chaque sujet sans jamais casser. Le site est la démonstration : un ingénieur design-led doit construire la preuve, pas la décrire.",
    principleTitle: "Le principe",
    principle1:
      "Tout est une déclinaison d'un seul bleu de marque. Trois couches — valeurs primitives, tokens sémantiques, habillages par sujet — font d'un « sujet » une surcharge petite et sûre, jamais un cas unique.",
    principle2:
      "La page est la lumière ; le compagnon est une lentille. Chaque page porte une aura discrète dans la couleur de son sujet, et l'orbe diffracte cette lumière au lieu d'émettre la sienne.",
    subjectsTitle: "Les sujets, en direct",
    subjectsHint:
      "Choisissez un sujet — l'aperçu et le compagnon prennent sa couleur. Même système, quatre déclinaisons.",
    previewLead: "La page porte",
    previewAccent: "cette couleur",
    primaryAction: "Action principale",
    tokensTitle: "Tokens de couleur",
    tokensHint:
      "Lus directement depuis la source de vérité, pour ne jamais diverger du site.",
    companionTitle: "Le compagnon",
    companionBody:
      "Une lentille tout en yeux qui porte le sujet actif et réagit — elle suit le curseur, s'endort, et s'agace si on la titille.",
    decisionsTitle: "Décisions & arbitrages",
    decisions: [
      {
        q: "Turquoise pour Systems, pas vert",
        a: `Le vert et le rouge sont réservés aux états succès/erreur, et une opposition vert↔rouge échoue pour le daltonisme. Le turquoise évoque "l'infrastructure" sans entrer en conflit avec les états.`,
      },
      {
        q: "La page colore le compagnon",
        a: "Le sujet actif est remonté à la page via un sélecteur CSS :has(), pour qu'un orbe fixe et hors-portée hérite quand même de la couleur de la page.",
      },
      {
        q: "L'accessibilité par construction",
        a: "Un contrat de contraste tourne en CI : chaque accent, arrêt de dégradé et teinte d'aura est vérifié contre WCAG AA. Le mouvement est conditionné à prefers-reduced-motion.",
      },
      {
        q: "Une lentille, pas une mascotte",
        a: "Le compagnon fait partie du système — il diffracte la lumière de la page — pour que la personnalité ne devienne jamais du bruit décoratif.",
      },
    ],
    outcomeTitle: "Résultat",
    outcome:
      "Un portfolio cohérent, accessible et auto-thématisé : quatre sujets, contrastes vérifiés en CI, respect du reduced-motion, et extensible depuis un seul endroit.",
    typeTitle: "Typographie",
    typeHint: `Deux familles — une fonte d'affichage pour le logo, Inter pour tout le reste.`,
    typeDisplay: "Affichage · Dragonsteel · le logo",
    typeSans: "Sans · Inter · tout le reste",
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
