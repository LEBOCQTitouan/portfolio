/** The orb's resting "home" in the hero: a large, soft aura (viewport %). */
export const HERO_HOME = { size: 240, x: 70, y: 34 };
const TRAVEL_SIZE = 92;

export type OrbGeometry = {
  size: number;
  x: number;
  y: number;
  blur: number;
  opacity: number;
  bubble: boolean;
  front: boolean;
};

/** 0 while the hero fills the viewport, 1 once it has scrolled a full hero height. */
export function scrollProgress(scrollY: number, heroHeight: number): number {
  if (heroHeight <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / heroHeight));
}

/** Interpolate the orb from the hero aura (p=0) to the travel companion (p=1). */
export function interpolateOrb(p: number, travel: { x: number; y: number }): OrbGeometry {
  const lerp = (a: number, b: number) => a + (b - a) * p;
  return {
    size: lerp(HERO_HOME.size, TRAVEL_SIZE),
    x: lerp(HERO_HOME.x, travel.x),
    y: lerp(HERO_HOME.y, travel.y),
    blur: lerp(3, 0),
    opacity: lerp(0.6, 1),
    bubble: p > 0.6,
    front: p > 0.5,
  };
}
