import type { Mood } from "@/lib/narration/types";
import { moodStyle } from "./moods";

export function Orb({ mood, muted }: { mood: Mood; muted: boolean }) {
  return (
    <div
      className="companion-orb"
      data-mood={mood}
      aria-hidden="true"
      style={{
        ...moodStyle(mood),
        ...(muted ? { transform: "scale(0.6)", filter: "saturate(.7) opacity(.8)" } : null),
      }}
    />
  );
}
