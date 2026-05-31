import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useReducedMotion } from "./use-reduced-motion";
import { setMatchMedia } from "../../../vitest.setup";

describe("useReducedMotion", () => {
  it("is false when the user has no motion preference", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("is true when prefers-reduced-motion: reduce matches", () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
