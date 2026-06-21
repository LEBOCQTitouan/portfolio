/**
 * Pure, deterministic helpers for the companion's eye "life" (blink, saccades,
 * reactivity). The hook (use-eye-life.ts) runs these inside a requestAnimationFrame
 * loop and writes the results to the DOM as transforms. Keeping the math here makes
 * it testable — randomness is always injected as `rand: () => number`.
 */

/** Eye shapes, structurally identical to eyeShape()'s return union (eyes.tsx). */
export type EyeShape = "open" | "happy" | "squint" | "closed" | "angry";

/** Blink timing + shape, derived from animation research (Disney/ILM/Bloop).
 *  Asymmetric: fast accelerating close, slower settling open. ~260ms total. */
export const BLINK = {
  closeMs: 85, // open → shut (ease-in)
  holdMs: 45, // held shut (a real beat)
  openMs: 130, // shut → open (ease-out), ~1.5× the close
  totalMs: 260,
  minY: 0.1, // closed height: a slit, never a flat line
  squintMinY: 0.5, // a squint eye is already short → shallower collapse
  squashX: 1.08, // width bulge at closure (volume preservation)
  overshootY: 0.05, // height overshoot on reopen, then settle
} as const;

const easeIn = (u: number) => u * u; // accelerate into the close
const easeOut = (u: number) => 1 - (1 - u) * (1 - u); // decelerate / settle open
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

/** scaleX/scaleY for the lid at `elapsedMs` into a blink, plus `done`. */
export function blinkTransform(
  elapsedMs: number,
  shape: EyeShape,
): { scaleX: number; scaleY: number; done: boolean } {
  const minY = shape === "squint" ? BLINK.squintMinY : BLINK.minY;
  const { closeMs, holdMs, openMs, totalMs, squashX, overshootY } = BLINK;

  if (elapsedMs <= 0) return { scaleX: 1, scaleY: 1, done: false };
  if (elapsedMs >= totalMs) return { scaleX: 1, scaleY: 1, done: true };

  // Close
  if (elapsedMs < closeMs) {
    const e = easeIn(elapsedMs / closeMs);
    return { scaleX: lerp(1, squashX, e), scaleY: lerp(1, minY, e), done: false };
  }
  // Hold shut
  if (elapsedMs < closeMs + holdMs) {
    return { scaleX: squashX, scaleY: minY, done: false };
  }
  // Open (with overshoot bump that returns to 0 at the end)
  const u = (elapsedMs - closeMs - holdMs) / openMs;
  const e = easeOut(u);
  const bump = Math.sin(Math.PI * u); // 0 → 1 → 0
  return {
    scaleX: lerp(squashX, 1, e) - 0.01 * bump,
    scaleY: lerp(minY, 1, e) + overshootY * bump,
    done: false,
  };
}

import type { Reaction } from "./reaction-state";

/** Px the eyes travel toward the gaze vector (matches the old MAX_OFFSET). */
export const EYE_GAZE_PX = 3;
/** Curious saccade calibration. */
export const SACCADE = { ampPx: 2.4, smooth: 0.16 } as const;
/** Startle widen on poke (fraction added to lid scale, decays away). */
export const STARTLE_AMP = 0.22;
/** Eye scale while hovering the orb (a focused narrowing on the user). */
export const FOCUS_SCALE = 0.72;

/** Randomized idle cadence: one blink every 3–6s. */
export function nextBlinkDelay(rand: () => number): number {
  return 3000 + rand() * 3000;
}

/** ~10% of blinks are double-blinks. */
export function wantsDoubleBlink(rand: () => number): boolean {
  return rand() < 0.1;
}

/** Next micro-dart offset (px). Amplitude scales with `intensity`. */
export function saccadeTarget(rand: () => number, intensity: number): { x: number; y: number } {
  const ang = rand() * Math.PI * 2;
  const mag = rand() * SACCADE.ampPx * intensity;
  return { x: Math.cos(ang) * mag, y: Math.sin(ang) * mag * 0.7 };
}

/** Calmer eyes while actively scrolling (reading), wandering when idle. */
export function saccadeIntensity(msSinceScroll: number): number {
  return msSinceScroll < 1200 ? 0.35 : 1;
}

/** Blink only when the eyes are alertly open. */
export function blinkAllowed(reaction: Reaction, shape: EyeShape): boolean {
  if (shape === "closed" || shape === "angry") return false;
  if (reaction === "asleep" || reaction === "sleeping" || reaction === "angry" || reaction === "annoyed") {
    return false;
  }
  return true;
}

/** Steady-state eye scale from hover (startle is a separate transient pulse). */
export function focusScale(hovering: boolean): number {
  return hovering ? FOCUS_SCALE : 1;
}
