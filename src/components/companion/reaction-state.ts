export type Reaction = "active" | "sleepy" | "asleep" | "annoyed" | "angry" | "sleeping";

export type ReactionState = {
  reaction: Reaction;
  muted: boolean;
  pokes: number;
  lastPokeAt: number;
  lastActivityAt: number;
};

export type ReactionEvent =
  | { type: "tick"; now: number }
  | { type: "poke"; now: number }
  | { type: "activity"; now: number }
  | { type: "mute" }
  | { type: "unmute"; now: number };

/** Tunable thresholds (ms / counts). */
export const CFG = {
  annoyAt: 3,
  angerAt: 6,
  pokeWindow: 1500,
  cooldown: 4000,
  sleepyAfter: 20000,
  asleepAfter: 30000,
} as const;

export function initialReactionState(now: number): ReactionState {
  return { reaction: "active", muted: false, pokes: 0, lastPokeAt: -Infinity, lastActivityAt: now };
}

function escalation(pokes: number): Reaction {
  if (pokes >= CFG.angerAt) return "angry";
  if (pokes >= CFG.annoyAt) return "annoyed";
  return "active";
}

export function reduceReaction(s: ReactionState, e: ReactionEvent): ReactionState {
  switch (e.type) {
    case "mute":
      return { ...s, muted: true, reaction: "sleeping" };
    case "unmute":
      return { ...s, muted: false, reaction: "active", lastActivityAt: e.now, pokes: 0 };
    case "poke": {
      if (s.muted) return s;
      const pokes = e.now - s.lastPokeAt <= CFG.pokeWindow ? s.pokes + 1 : 1;
      return { ...s, pokes, lastPokeAt: e.now, lastActivityAt: e.now, reaction: escalation(pokes) };
    }
    case "activity": {
      if (s.muted) return s;
      const next = s.reaction === "sleepy" || s.reaction === "asleep" ? "active" : s.reaction;
      return { ...s, lastActivityAt: e.now, reaction: next };
    }
    case "tick": {
      if (s.muted) return { ...s, reaction: "sleeping" };
      if (s.reaction === "annoyed" || s.reaction === "angry") {
        if (e.now - s.lastPokeAt >= CFG.cooldown) return { ...s, reaction: "active", pokes: 0 };
        return s;
      }
      const idle = e.now - s.lastActivityAt;
      const next: Reaction = idle >= CFG.asleepAfter ? "asleep" : idle >= CFG.sleepyAfter ? "sleepy" : "active";
      return next === s.reaction ? s : { ...s, reaction: next };
    }
  }
}
