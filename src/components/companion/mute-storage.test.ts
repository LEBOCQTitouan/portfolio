import { describe, it, expect, beforeEach } from "vitest";
import { getMuted, setMuted, subscribeMuted } from "./mute-storage";

describe("mute-storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("defaults to not muted (companion on)", () => {
    expect(getMuted()).toBe(false);
  });

  it("persists and reads back the muted flag", () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });

  it("notifies subscribers when the mute value changes", () => {
    let calls = 0;
    const unsub = subscribeMuted(() => { calls += 1; });
    setMuted(true);
    expect(calls).toBe(1);
    unsub();
    setMuted(false);
    expect(calls).toBe(1); // no longer notified after unsubscribe
  });
});
