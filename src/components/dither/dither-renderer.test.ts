import { describe, it, expect, vi } from "vitest";
import { selectBackend } from "@/components/dither/dither-renderer";
import type { DitherBackend } from "@/components/dither/dither-renderer";

const fakeBackend = (): DitherBackend => ({ render: vi.fn(), destroy: vi.fn() });

describe("selectBackend", () => {
  it("returns the first factory that yields a backend", () => {
    const canvas = document.createElement("canvas");
    const a = vi.fn(() => null);
    const b = vi.fn(() => fakeBackend());
    const c = vi.fn(() => fakeBackend());
    const chosen = selectBackend(canvas, [a, b, c]);
    expect(chosen).not.toBeNull();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(c).not.toHaveBeenCalled();
  });
  it("returns null when every factory fails (e.g. jsdom)", () => {
    const canvas = document.createElement("canvas");
    expect(selectBackend(canvas, [() => null, () => null])).toBeNull();
  });
});
