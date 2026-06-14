export const SUBJECTS = ["brand", "systems", "interface", "ai"] as const;
export type SubjectId = (typeof SUBJECTS)[number];

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
};

export const TOKENS: Record<SubjectId, SubjectTokens> = {
  brand: {
    accent: { light: "#0071e3", dark: "#2997ff" },
    accentFill: "#0a66c2",
    gradientStops: ["#0a66c2"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(0,113,227,0.10)", dark: "rgba(41,151,255,0.16)" },
  },
  systems: {
    accent: { light: "#3a36cc", dark: "#7c84ff" },
    accentFill: "#322db5",
    gradientStops: ["#322db5"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(58,54,204,0.10)", dark: "rgba(124,132,255,0.16)" },
  },
  interface: {
    accent: { light: "#1657d8", dark: "#4f9bff" },
    accentFill: "#1657d8",
    gradientStops: ["#1657d8"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(22,87,216,0.10)", dark: "rgba(79,155,255,0.16)" },
  },
  ai: {
    accent: { light: "#2747d6", dark: "#6f8cff" },
    accentFill: "#3a52d8",
    gradientStops: ["#1b63e8", "#3a52d8", "#4a4fcf"],
    onAccent: "#ffffff",
    accentSoft: { light: "rgba(58,82,216,0.12)", dark: "rgba(111,140,255,0.18)" },
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
