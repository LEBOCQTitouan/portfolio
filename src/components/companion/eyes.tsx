import type { CSSProperties, Ref } from "react";
import type { Mood } from "@/lib/narration/types";
import type { Reaction } from "./reaction-state";
import { moodParams } from "./moods";

export type Gaze = { x: number; y: number }; // each component ~[-1, 1]
export type EyeShape = "open" | "happy" | "squint" | "closed" | "angry";

/** Resolve the eye shape: reaction wins over mood where it matters. */
export function eyeShape(mood: Mood, reaction: Reaction): EyeShape {
  if (reaction === "sleeping" || reaction === "asleep") return "closed";
  if (reaction === "angry") return "angry";
  if (reaction === "annoyed") return "squint";
  return moodParams(mood).eye;
}

const MAX_OFFSET = 3; // px the eyes travel toward the gaze (CSS-var fallback)

export function Eyes({
  mood,
  reaction,
  gaze,
  containerRef,
}: {
  mood: Mood;
  reaction: Reaction;
  gaze: Gaze;
  containerRef?: Ref<HTMLDivElement>;
}) {
  const shape = eyeShape(mood, reaction);
  // CSS-var translate is the fallback used when the eye-life hook is not driving
  // these nodes (standalone Orb in stories, and reduced motion). When the hook is
  // active it overwrites each wrapper's inline transform every frame.
  const style = {
    "--gx": `${Math.max(-1, Math.min(1, gaze.x)) * MAX_OFFSET}px`,
    "--gy": `${Math.max(-1, Math.min(1, gaze.y)) * MAX_OFFSET}px`,
  } as CSSProperties;
  return (
    <div className="companion-eyes" data-shape={shape} style={style} aria-hidden="true" ref={containerRef}>
      <span className="companion-eye">
        <span className="companion-eye__lid" />
      </span>
      <span className="companion-eye">
        <span className="companion-eye__lid" />
      </span>
    </div>
  );
}
