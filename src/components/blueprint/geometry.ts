// Pure geometry + motion math for the blueprint field. No DOM, no canvas — testable.
export const DPR_CAP = 2;

export interface Rect { l: number; t: number; r: number; b: number; }

// Origin so a grid line sits on the viewport centre (→ centred column edges land on lines).
export function alignedOriginX(viewportW: number, pitch: number): number {
  const cx = viewportW / 2;
  return cx - Math.round(cx / pitch) * pitch;
}

export function distToRect(px: number, py: number, r: Rect): number {
  const dx = Math.max(r.l - px, 0, px - r.r);
  const dy = Math.max(r.t - py, 0, py - r.b);
  return Math.hypot(dx, dy);
}

export function suppression(
  x: number, y: number, clears: Array<Rect & { m: number }>,
): number {
  let s = 0;
  for (const c of clears) {
    const d = distToRect(x, y, c);
    if (d < c.m) {
      const v = 1 - d / c.m;
      if (v > s) s = v;
      if (s >= 1) return 1;
    }
  }
  return s;
}

export function warpOffset(
  px: number, py: number, sx: number, sy: number, amp: number,
  cfg: { strength: number; reach: number },
): { dx: number; dy: number } {
  if (amp <= 0) return { dx: 0, dy: 0 };
  const vx = sx - px, vy = sy - py;
  const d = Math.hypot(vx, vy) || 1e-4;
  const ai = Math.max(0, 1 - d / cfg.reach);
  const m = ai * ai * cfg.strength * amp;
  return { dx: (vx / d) * m, dy: (vy / d) * m };
}

export function convergeOffset(
  px: number, py: number, sx: number, sy: number, over: number,
  cfg: { radius: number; pull: number },
): { dx: number; dy: number; infl: number } {
  if (over <= 0) return { dx: 0, dy: 0, infl: 0 };
  const vx = sx - px, vy = sy - py;
  const d = Math.hypot(vx, vy);
  if (d >= cfg.radius) return { dx: 0, dy: 0, infl: 0 };
  const infl = 1 - d / cfg.radius;
  const pull = infl * infl * cfg.pull * over;
  return { dx: vx * pull, dy: vy * pull, infl: infl * over };
}

export function rasterBlock(prog: number, coarse: number): number {
  return 1 + (1 - Math.min(1, Math.max(0, prog))) * (coarse - 1);
}
