import type { CSSProperties, Ref } from "react";
import type { Mood } from "@/lib/narration/types";
import type { Reaction } from "./reaction-state";
import { Eyes, type Gaze } from "./eyes";

export function Orb({
  mood,
  reaction,
  gaze,
  style,
  className,
  eyesRef,
}: {
  mood: Mood;
  reaction: Reaction;
  gaze: Gaze;
  style?: CSSProperties;
  className?: string;
  eyesRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={`companion-orb${className ? ` ${className}` : ""}`}
      data-mood={mood}
      data-reaction={reaction}
      aria-hidden="true"
      style={style}
    >
      <span className="companion-orb__blob b1" />
      <span className="companion-orb__blob b2" />
      <span className="companion-orb__blob b3" />
      <span className="companion-orb__spec" />
      <Eyes mood={mood} reaction={reaction} gaze={gaze} containerRef={eyesRef} />
    </div>
  );
}
