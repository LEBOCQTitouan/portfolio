import type { Mood } from "@/lib/narration/types";

/** Per-mood render params. Color is NOT here — it comes from --subject-accent.
 *  `eye` is the resting eye shape; `flowMs` is the inner-light flow duration;
 *  `warmth` nudges the light's temperature (0 = neutral, + = warmer). */
export type MoodEye = "open" | "happy" | "squint";
export type MoodParams = { eye: MoodEye; flowMs: number; warmth: number };

export const MOOD_PARAMS: Record<Mood, MoodParams> = {
  calm: { eye: "open", flowMs: 6000, warmth: 0 },
  warm: { eye: "happy", flowMs: 5200, warmth: 0.15 },
  focused: { eye: "squint", flowMs: 4200, warmth: -0.1 },
};

export function moodParams(mood: Mood): MoodParams {
  return MOOD_PARAMS[mood];
}
