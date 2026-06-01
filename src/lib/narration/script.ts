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
    { id: "project-header", mood: "focused", text: "Here's the shape of this one." },
    { id: "project-body", mood: "calm", text: "And here's how it actually came together." },
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
    { id: "project-header", mood: "focused", text: "Voilà la forme de celui-ci." },
    { id: "project-body", mood: "calm", text: "Et voilà comment ça s'est vraiment construit." },
  ],
};

export const script = { en, fr };
