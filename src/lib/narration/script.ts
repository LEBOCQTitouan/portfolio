import type { NarrationMap } from "./types";

export const en: NarrationMap = {
  "/": [
    { id: "hero", mood: "warm", text: "Hey — I'm Titouan. Let me show you around." },
    { id: "pillars", mood: "focused", text: "I live where systems thinking meets interface craft." },
    { id: "work", mood: "calm", text: "A few things I'm genuinely proud of." },
    { id: "writing", mood: "focused", text: "And I write about how it all fits together." },
    { id: "contact", mood: "warm", text: "Like what you see? Let's talk." },
  ],
  "/about": [
    { id: "intro", mood: "warm", text: "A bit about how I think about this craft." },
    { id: "experience", mood: "calm", text: "Where I've built things, and what I learned." },
    { id: "skills", mood: "focused", text: "The tools I reach for across the stack." },
  ],
  "/uses": [
    { id: "intro", mood: "warm", text: "The kit I actually use every day." },
    { id: "tools", mood: "focused", text: "Editor, languages, hardware, services." },
  ],
  "/now": [
    { id: "intro", mood: "warm", text: "Here's what has my attention right now." },
    { id: "focus", mood: "calm", text: "A few things I'm focused on at the moment." },
  ],
  "/work": [
    { id: "intro", mood: "warm", text: "Selected work, across systems and interfaces." },
    { id: "projects", mood: "calm", text: "Take a look — each one tells its own story." },
  ],
  "/work/[slug]": [
    { id: "project-header", mood: "warm", text: "Pull up a chair — every project here is a small story." },
    { id: "section-1", mood: "focused", text: "It always starts with something quietly broken." },
    { id: "section-2", mood: "calm", text: "So I made a bet on how to fix it. Here's the bet." },
    { id: "section-3", mood: "focused", text: "Every bet costs something. Here's what this one cost." },
    { id: "section-last", mood: "warm", text: "And here's how it paid off." },
  ],
  "/design-system": [
    { id: "problem", mood: "focused", text: "The system behind the site — here's how it thinks." },
    { id: "subjects", mood: "warm", text: "Watch me change colour with the subject." },
    { id: "decisions", mood: "calm", text: "And here's why each call was made." },
  ],
};

export const fr: NarrationMap = {
  "/": [
    { id: "hero", mood: "warm", text: "Salut — moi c'est Titouan. Je te fais visiter." },
    { id: "pillars", mood: "focused", text: "J'évolue là où la pensée systèmes rencontre le soin de l'interface." },
    { id: "work", mood: "calm", text: "Quelques projets dont je suis vraiment fier." },
    { id: "writing", mood: "focused", text: "J'écris aussi sur la façon dont tout ça s'articule." },
    { id: "contact", mood: "warm", text: "Ce que tu vois te parle ? Parlons-en." },
  ],
  "/about": [
    { id: "intro", mood: "warm", text: "Un peu de ma façon d'aborder ce métier." },
    { id: "experience", mood: "calm", text: "Où j'ai construit des choses, et ce que j'en ai appris." },
    { id: "skills", mood: "focused", text: "Les outils que je choisis à chaque étape de la stack." },
  ],
  "/uses": [
    { id: "intro", mood: "warm", text: "Le setup que j'utilise vraiment au quotidien." },
    { id: "tools", mood: "focused", text: "Éditeur, langages, matériel, services." },
  ],
  "/now": [
    { id: "intro", mood: "warm", text: "Voilà ce qui retient mon attention en ce moment." },
    { id: "focus", mood: "calm", text: "Quelques choses sur lesquelles je me concentre." },
  ],
  "/work": [
    { id: "intro", mood: "warm", text: "Une sélection de projets, entre systèmes et interfaces." },
    { id: "projects", mood: "calm", text: "Jette un œil — chacun raconte sa propre histoire." },
  ],
  "/work/[slug]": [
    { id: "project-header", mood: "warm", text: "Installe-toi — chaque projet ici raconte une petite histoire." },
    { id: "section-1", mood: "focused", text: "Tout commence par quelque chose de discrètement cassé." },
    { id: "section-2", mood: "calm", text: "Alors j'ai fait un pari sur la façon de le réparer. Voici le pari." },
    { id: "section-3", mood: "focused", text: "Tout pari a un coût. Voici ce que celui-ci a coûté." },
    { id: "section-last", mood: "warm", text: "Et voilà comment ça a payé." },
  ],
  "/design-system": [
    { id: "problem", mood: "focused", text: "Le système derrière le site — voici comment il raisonne." },
    { id: "subjects", mood: "warm", text: "Regarde-moi changer de couleur selon le sujet." },
    { id: "decisions", mood: "calm", text: "Et voici pourquoi chaque choix a été fait." },
  ],
};

export const script = { en, fr };
