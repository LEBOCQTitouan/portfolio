import type { CSSProperties } from "react";
import type { Mood } from "@/lib/narration/types";
import { moodStyle } from "./moods";

export function Orb({
  mood,
  muted,
  style,
}: {
  mood: Mood;
  muted: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className="companion-orb"
      data-mood={mood}
      aria-hidden="true"
      style={{
        ...moodStyle(mood),
        ...(muted ? { transform: "scale(0.6)", filter: "saturate(.7) opacity(.8)" } : null),
        ...style,
      }}
    />
  );
}
