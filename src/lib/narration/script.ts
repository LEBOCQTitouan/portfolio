import type { NarrationMap } from "./types";

export const en: NarrationMap = {
  "/": [
    { id: "hero", mood: "warm", text: "Hey — I'm Titouan. Let me show you around.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "pillars", mood: "focused", text: "I live where systems thinking meets interface craft.", anchor: { x: 30, y: 50, side: "right" } },
    { id: "work", mood: "calm", text: "A few things I'm genuinely proud of.", anchor: { x: 74, y: 46, side: "left" } },
    { id: "writing", mood: "focused", text: "And I write about how it all fits together.", anchor: { x: 30, y: 58, side: "right" } },
    { id: "contact", mood: "warm", text: "Like what you see? Let's talk.", anchor: { x: 30, y: 64, side: "right" } },
  ],
  "/about": [
    { id: "intro", mood: "warm", text: "A bit about how I think about this craft.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "experience", mood: "calm", text: "Where I've built things, and what I learned.", anchor: { x: 30, y: 48, side: "right" } },
    { id: "skills", mood: "focused", text: "The tools I reach for across the stack.", anchor: { x: 74, y: 52, side: "left" } },
  ],
  "/uses": [
    { id: "intro", mood: "warm", text: "The kit I actually use every day.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "tools", mood: "focused", text: "Editor, languages, hardware, services.", anchor: { x: 30, y: 50, side: "right" } },
  ],
  "/now": [
    { id: "intro", mood: "warm", text: "Here's what has my attention right now.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "focus", mood: "calm", text: "A few things I'm focused on at the moment.", anchor: { x: 30, y: 52, side: "right" } },
  ],
  "/work": [
    { id: "intro", mood: "warm", text: "Selected work, across systems and interfaces.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "projects", mood: "calm", text: "Take a look — each one tells its own story.", anchor: { x: 30, y: 50, side: "right" } },
  ],
  "/work/[slug]": [
    { id: "project-header", mood: "focused", text: "Here's the shape of this one.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "project-body", mood: "calm", text: "And here's how it actually came together.", anchor: { x: 30, y: 50, side: "right" } },
  ],
};

export const fr: NarrationMap = {
  "/": [
    { id: "hero", mood: "warm", text: "Salut — moi c'est Titouan. Je te fais visiter.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "pillars", mood: "focused", text: "J'évolue là où la pensée systèmes rencontre le soin de l'interface.", anchor: { x: 30, y: 50, side: "right" } },
    { id: "work", mood: "calm", text: "Quelques projets dont je suis vraiment fier.", anchor: { x: 74, y: 46, side: "left" } },
    { id: "writing", mood: "focused", text: "J'écris aussi sur la façon dont tout ça s'articule.", anchor: { x: 30, y: 58, side: "right" } },
    { id: "contact", mood: "warm", text: "Ce que tu vois te parle ? Parlons-en.", anchor: { x: 30, y: 64, side: "right" } },
  ],
  "/about": [
    { id: "intro", mood: "warm", text: "Un peu de ma façon d'aborder ce métier.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "experience", mood: "calm", text: "Où j'ai construit des choses, et ce que j'en ai appris.", anchor: { x: 30, y: 48, side: "right" } },
    { id: "skills", mood: "focused", text: "Les outils que je choisis à chaque étape de la stack.", anchor: { x: 74, y: 52, side: "left" } },
  ],
  "/uses": [
    { id: "intro", mood: "warm", text: "Le setup que j'utilise vraiment au quotidien.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "tools", mood: "focused", text: "Éditeur, langages, matériel, services.", anchor: { x: 30, y: 50, side: "right" } },
  ],
  "/now": [
    { id: "intro", mood: "warm", text: "Voilà ce qui retient mon attention en ce moment.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "focus", mood: "calm", text: "Quelques choses sur lesquelles je me concentre.", anchor: { x: 30, y: 52, side: "right" } },
  ],
  "/work": [
    { id: "intro", mood: "warm", text: "Une sélection de projets, entre systèmes et interfaces.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "projects", mood: "calm", text: "Jette un œil — chacun raconte sa propre histoire.", anchor: { x: 30, y: 50, side: "right" } },
  ],
  "/work/[slug]": [
    { id: "project-header", mood: "focused", text: "Voilà la forme de celui-ci.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "project-body", mood: "calm", text: "Et voilà comment ça s'est vraiment construit.", anchor: { x: 30, y: 50, side: "right" } },
  ],
};

export const script = { en, fr };
