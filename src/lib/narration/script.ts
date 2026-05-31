import type { NarrationMap } from "./types";

export const script: NarrationMap = {
  "/": [
    { id: "hero", mood: "warm", text: "Hey — I'm Titouan. Let me show you around.", anchor: { x: 72, y: 30, side: "left" } },
    { id: "pillars", mood: "focused", text: "I live where systems thinking meets interface craft.", anchor: { x: 30, y: 50, side: "right" } },
    { id: "work", mood: "calm", text: "A few things I'm genuinely proud of.", anchor: { x: 74, y: 46, side: "left" } },
    { id: "writing", mood: "focused", text: "And I write about how it all fits together.", anchor: { x: 30, y: 58, side: "right" } },
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
