import { describe, it, expect } from "vitest";
import { initialReactionState, reduceReaction, CFG } from "./reaction-state";

const t0 = 1_000_000;

describe("reduceReaction", () => {
  it("starts active", () => {
    expect(initialReactionState(t0).reaction).toBe("active");
  });

  it("mute → sleeping, overriding everything; unmute → active", () => {
    let s = initialReactionState(t0);
    s = reduceReaction(s, { type: "mute" });
    expect(s.reaction).toBe("sleeping");
    s = reduceReaction(s, { type: "tick", now: t0 + 999_999 });
    expect(s.reaction).toBe("sleeping");
    s = reduceReaction(s, { type: "unmute", now: t0 + 1_000_000 });
    expect(s.reaction).toBe("active");
  });

  it("idle → sleepy then asleep; activity wakes", () => {
    let s = initialReactionState(t0);
    s = reduceReaction(s, { type: "tick", now: t0 + CFG.sleepyAfter + 1 });
    expect(s.reaction).toBe("sleepy");
    s = reduceReaction(s, { type: "tick", now: t0 + CFG.asleepAfter + 1 });
    expect(s.reaction).toBe("asleep");
    s = reduceReaction(s, { type: "activity", now: t0 + CFG.asleepAfter + 2 });
    expect(s.reaction).toBe("active");
  });

  it("spam pokes escalate active → annoyed → angry within the window", () => {
    let s = initialReactionState(t0);
    let now = t0;
    for (let i = 0; i < CFG.annoyAt; i++) s = reduceReaction(s, { type: "poke", now: (now += 100) });
    expect(s.reaction).toBe("annoyed");
    for (let i = CFG.annoyAt; i < CFG.angerAt; i++) s = reduceReaction(s, { type: "poke", now: (now += 100) });
    expect(s.reaction).toBe("angry");
  });

  it("anger cools to active by time only (not by mere activity)", () => {
    let s = initialReactionState(t0);
    let now = t0;
    for (let i = 0; i < CFG.angerAt; i++) s = reduceReaction(s, { type: "poke", now: (now += 100) });
    expect(s.reaction).toBe("angry");
    s = reduceReaction(s, { type: "activity", now: now + 10 });
    expect(s.reaction).toBe("angry");
    s = reduceReaction(s, { type: "tick", now: now + CFG.cooldown + 1 });
    expect(s.reaction).toBe("active");
  });

  it("a single poke after the window resets the counter (no escalation)", () => {
    let s = initialReactionState(t0);
    s = reduceReaction(s, { type: "poke", now: t0 + 100 });
    expect(s.reaction).toBe("active");
    s = reduceReaction(s, { type: "poke", now: t0 + 100 + CFG.pokeWindow + 1 });
    expect(s.reaction).toBe("active");
    expect(s.pokes).toBe(1);
  });
});
