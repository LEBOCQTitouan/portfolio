import { SUBJECTS, type SubjectId } from "@/core/domain/subject";

// Re-export so existing token consumers can keep importing from here.
export { SUBJECTS, type SubjectId };

type ModeColor = { light: string; dark: string };

export type SubjectTokens = {
  /** Accent for TEXT/BORDERS on the page background (per mode). */
  accent: ModeColor;
  /** Solid accent FILL color — white-safe in both modes; gradient fallback. */
  accentFill: string;
  /** Gradient stops for fills/accent-text. One stop = solid subject. */
  gradientStops: string[];
  /** Foreground guaranteed AA on the fill/gradient. */
  onAccent: string;
  /** Low-alpha tint for beds/badges/hovers (per mode). */
  accentSoft: ModeColor;
  /** Gradient stops for CLIPPED TEXT, per mode (legible on the page bg).
   *  Only gradient subjects need this; fills use gradientStops. */
  textGradient?: { light: string[]; dark: string[] };
  /** Page aura: a low-alpha background tint + a soft radial glow (per mode). */
  aura: { tint: ModeColor; glow: ModeColor };
};

export const TOKENS: Record<SubjectId, SubjectTokens> = {
  brand: {
    accent: { light: "#0071e3", dark: "#2997ff" },
    accentFill: "#0a66c2",
    gradientStops: ["#0a66c2"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(0,113,227,0.10)", dark: "rgba(41,151,255,0.16)" },
    aura: {
      tint: { light: "rgba(0,113,227,0.06)", dark: "rgba(41,151,255,0.10)" },
      glow: { light: "rgba(0,113,227,0.16)", dark: "rgba(41,151,255,0.22)" },
    },
  },
  systems: {
    accent: { light: "#0b7268", dark: "#20c8b8" },
    accentFill: "#0a6b63",
    gradientStops: ["#0a6b63"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(11,114,104,0.12)", dark: "rgba(32,200,184,0.16)" },
    aura: {
      tint: { light: "rgba(11,114,104,0.07)", dark: "rgba(32,200,184,0.10)" },
      glow: { light: "rgba(11,114,104,0.16)", dark: "rgba(32,200,184,0.20)" },
    },
  },
  interface: {
    accent: { light: "#c42d63", dark: "#f06595" },
    accentFill: "#c42d63",
    gradientStops: ["#c42d63"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(196,45,99,0.12)", dark: "rgba(240,101,149,0.16)" },
    aura: {
      tint: { light: "rgba(196,45,99,0.07)", dark: "rgba(240,101,149,0.10)" },
      glow: { light: "rgba(196,45,99,0.16)", dark: "rgba(240,101,149,0.20)" },
    },
  },
  ai: {
    accent: { light: "#6d28d9", dark: "#a78bfa" },
    accentFill: "#6d28d9",
    gradientStops: ["#7c3aed", "#4f63d8", "#0e7d96"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(124,58,237,0.12)", dark: "rgba(167,139,250,0.18)" },
    textGradient: {
      light: ["#6d28d9", "#4f46e5", "#0e7d90"],
      dark: ["#a78bfa", "#8ab4ff", "#5ad1e0"],
    },
    aura: {
      tint: { light: "rgba(124,58,237,0.07)", dark: "rgba(167,139,250,0.10)" },
      glow: { light: "rgba(124,58,237,0.18)", dark: "rgba(167,139,250,0.22)" },
    },
  },
};

/** CSS gradient string for a subject (used by fills/accent-text). */
export function gradientCss(id: SubjectId, angle = "110deg"): string {
  const stops = TOKENS[id].gradientStops;
  return stops.length === 1
    ? stops[0]
    : `linear-gradient(${angle}, ${stops.join(", ")})`;
}

/** Page background per mode (mirrors --background in globals.css). */
export const BACKGROUND: ModeColor = { light: "#fbfbfd", dark: "#0f1115" };

/** Page foreground per mode (mirrors --foreground in globals.css). */
export const FOREGROUND: ModeColor = { light: "#1d1d1f", dark: "#f5f5f7" };
