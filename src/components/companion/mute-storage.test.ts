import { describe, it, expect, beforeEach } from "vitest";
import { getMuted, setMuted } from "./mute-storage";

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
});
