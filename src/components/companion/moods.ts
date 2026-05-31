import type { CSSProperties } from "react";
import type { Mood } from "@/lib/narration/types";

type MoodColors = { mid: string; edge: string; glow: string };

export const MOOD_COLORS: Record<Mood, MoodColors> = {
  calm: { mid: "rgba(41,151,255,.55)", edge: "rgba(111,125,255,.32)", glow: "rgba(74,157,255,.45)" },
  warm: { mid: "rgba(255,143,166,.55)", edge: "rgba(255,122,122,.32)", glow: "rgba(255,154,176,.45)" },
  focused: { mid: "rgba(139,120,255,.55)", edge: "rgba(95,118,255,.32)", glow: "rgba(151,133,255,.45)" },
};

/** Inline style (background + glow) for the orb in a given mood. */
export function moodStyle(mood: Mood): Pick<CSSProperties, "background" | "boxShadow"> {
  const c = MOOD_COLORS[mood];
  return {
    background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.34), ${c.mid} 56%, ${c.edge})`,
    boxShadow: `inset 0 0 18px rgba(255,255,255,.22), 0 0 30px 6px ${c.glow}`,
  };
}
