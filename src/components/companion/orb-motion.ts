/**
 * Pure, deterministic motion helpers for the companion orb.
 * The component runs these inside a requestAnimationFrame loop and writes the
 * results to the DOM as transforms. Keeping the math here makes it testable.
 */

/** Approved "Playful + hover" feel (validated in .context/mascot-motion-demo.html). */
export const MOTION = {
  k: 180, // spring stiffness
  c: 14, // spring damping (under-damped → slight overshoot + settle)
  squashMax: 0.08, // max stretch fraction (volume-preserving)
  leanMax: 0.05, // max tilt fraction
  hoverAmp: 9, // idle-drift amplitude (px)
  hoverSpeed: 1.0, // idle-drift rate
  velSat: 900, // velocity saturation for squash (px/s)
  smoothRate: 12, // low-pass rate for squash/lean
  dtMax: 0.032, // rAF loop clamps each frame's delta to this so a stalled tab can't explode the spring
} as const;

/** leanMax (0.05) × this → ≤ 2° of tilt at full lean. */
const LEAN_TO_DEG = 40;

/** Horizontal idle drift is gentler than vertical (60%). */
const HOVER_X_SCALE = 0.6;

export type SpringState = { pos: number; vel: number };

/** One semi-implicit (symplectic) Euler step of a unit-mass damped spring. */
export function stepSpring(
  s: SpringState,
  target: number,
  dt: number,
  k = MOTION.k,
  c = MOTION.c,
): SpringState {
  const a = (target - s.pos) * k - s.vel * c;
  const vel = s.vel + a * dt;
  const pos = s.pos + vel * dt;
  return { pos, vel };
}

/**
 * Idle hover: two non-harmonic sine waves per axis → an organic drift that
 * never visibly repeats. Bounded to ±amp on each axis.
 */
export function hoverOffset(timeMs: number, amp = MOTION.hoverAmp, speed = MOTION.hoverSpeed) {
  const ts = (timeMs / 1000) * speed;
  // Each axis sums two non-harmonic sines whose peaks total 1.5; scale by
  // (amp / 1.5) so vertical drift peaks at ±amp. Horizontal is gentler (×0.6).
  return {
    x: (Math.sin(ts * 0.9) + Math.sin(ts * 0.37 + 1.7) * 0.5) * (amp / 1.5) * HOVER_X_SCALE,
    y: (Math.sin(ts * 1.3 + 0.6) + Math.sin(ts * 0.53) * 0.5) * (amp / 1.5),
  };
}

export type SquashResult = {
  scaleX: number;
  scaleY: number;
  tilt: number; // degrees
  smoothSquash: number;
  smoothLean: number;
};

/**
 * Velocity-driven squash & lean, made tasteful:
 *  - saturate velocity with tanh so fast scroll can't blow it up,
 *  - low-pass smooth so it eases in/out (no per-frame jitter),
 *  - volume-preserving: scaleY=1+s, scaleX=1/(1+s) — squishes, never balloons.
 */
export function stepSquash(
  vy: number,
  prevSquash: number,
  prevLean: number,
  dt: number,
): SquashResult {
  const drive = Math.tanh(vy / MOTION.velSat); // −1..1
  const rate = Math.min(1, dt * MOTION.smoothRate);
  const smoothSquash = prevSquash + (drive * MOTION.squashMax - prevSquash) * rate;
  const smoothLean = prevLean + (drive * MOTION.leanMax - prevLean) * rate;
  const scaleY = 1 + smoothSquash;
  const scaleX = 1 / (1 + smoothSquash);
  const tilt = smoothLean * LEAN_TO_DEG;
  return { scaleX, scaleY, tilt, smoothSquash, smoothLean };
}
