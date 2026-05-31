export type Mood = "calm" | "warm" | "focused";

export type Anchor = {
  /** horizontal position as a percent of the viewport width (0–100) */
  x: number;
  /** vertical position as a percent of the viewport height (0–100) */
  y: number;
  /** which side of the orb the bubble sits on */
  side: "left" | "right";
};

export type NarrationLine = {
  id: string;
  mood: Mood;
  text: string;
  anchor: Anchor;
};

export type NarrationMap = Record<string, NarrationLine[]>;
