import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

afterEach(() => vi.useRealTimers());

describe("useTypewriter", () => {
  it("returns the full text immediately when disabled", () => {
    const { result } = renderHook(() => useTypewriter("hello", false));
    expect(result.current).toBe("hello");
  });

  it("reveals the text one character at a time when enabled", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useTypewriter("hi", true, 10));
    expect(result.current).toBe("");
    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe("h");
    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe("hi");
  });

  it("resets to empty when the text changes mid-animation", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text, true, 10),
      { initialProps: { text: "hello" } },
    );
    act(() => { vi.advanceTimersByTime(20); }); // "he"
    expect(result.current).toBe("he");
    rerender({ text: "world" });
    expect(result.current).toBe(""); // immediately reset, no stale "he"
    act(() => { vi.advanceTimersByTime(10); });
    expect(result.current).toBe("w");
  });
});
