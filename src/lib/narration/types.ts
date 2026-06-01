export type Mood = "calm" | "warm" | "focused";

export type NarrationLine = {
  id: string;
  mood: Mood;
  text: string;
};

export type NarrationMap = Record<string, NarrationLine[]>;
