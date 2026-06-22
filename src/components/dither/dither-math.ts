import type { DitherFrame, DitherParams, Rgb } from "@/components/dither/types";

/** Recursive ordered (Bayer) matrix. n must be a power of two. Values 0..n*n-1. */
export function genBayerMatrix(n: number): number[][] {
  if (n === 1) return [[0]];
  const half = n / 2;
  const s = genBayerMatrix(half);
  const m: number[][] = [];
  for (let y = 0; y < n; y++) {
    m[y] = [];
    for (let x = 0; x < n; x++) {
      const quad = x < half ? (y < half ? 0 : 3) : (y < half ? 2 : 1);
      m[y][x] = 4 * s[y % half][x % half] + quad;
    }
  }
  return m;
}

export function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function applyContrast(l: number, contrast: number): number {
  const v = (l - 0.5) * contrast + 0.5;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Ordered multi-level quantization given a 0..1 threshold sample. */
export function orderedTone(l: number, levels: number, threshold: number): number {
  const steps = levels - 1;
  const v = l * steps;
  const fl = Math.floor(v);
  let lev = fl + ((v - fl) > threshold ? 1 : 0);
  if (lev < 0) lev = 0;
  if (lev > steps) lev = steps;
  return lev / steps;
}

function ign(px: number, py: number): number {
  const v = 0.06711056 * px + 0.00583715 * py;
  const f = 52.9829189 * (v - Math.floor(v));
  return f - Math.floor(f);
}

export function ditherFrame(frame: DitherFrame, params: DitherParams): DitherFrame {
  const { data, width: W, height: H } = frame;
  const { pattern, levels, cellSize, contrast, ink, paper } = params;
  const cell = Math.max(1, cellSize);
  const matrix = genBayerMatrix(4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let l = luminance(data[i], data[i + 1], data[i + 2]);
      l = applyContrast(l, contrast);
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      const threshold = pattern === "blue-noise"
        ? ign(cx, cy)
        : (matrix[cy & 3][cx & 3] + 0.5) / 16;
      const tone = orderedTone(l, levels, threshold);
      data[i] = ink[0] + (paper[0] - ink[0]) * tone;
      data[i + 1] = ink[1] + (paper[1] - ink[1]) * tone;
      data[i + 2] = ink[2] + (paper[2] - ink[2]) * tone;
      data[i + 3] = 255;
    }
  }
  return frame;
}

export function parseRgb(css: string, fallback: Rgb): Rgb {
  const m = css.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!m) return fallback;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
