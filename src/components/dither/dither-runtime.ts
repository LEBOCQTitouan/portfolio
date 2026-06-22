import type { AnimateOpts } from "@/components/dither/types";

export function computeBackingSize(
  clientW: number, clientH: number, dpr: number, maxDpr = 2,
): { width: number; height: number } {
  const scale = Math.min(dpr || 1, maxDpr);
  return {
    width: Math.max(1, Math.round(clientW * scale)),
    height: Math.max(1, Math.round(clientH * scale)),
  };
}

export function resolvePrecision(opts: AnimateOpts, timeMs: number, hovered: boolean): number {
  const wave = 0.5 + 0.5 * Math.sin(timeMs * 0.001 * opts.speed);
  const amp = opts.ambient + (hovered ? opts.hover : 0);
  const p = amp * wave;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

export function precisionToCell(baseCell: number, precision: number, coarse = 4): number {
  return Math.max(1, Math.round(baseCell + (1 - precision) * coarse));
}
