export type Rgb = readonly [number, number, number];
export type DitherPattern = "bayer" | "blue-noise";

export interface DitherFrame {
  data: Uint8ClampedArray; // RGBA, length = width*height*4
  width: number;
  height: number;
}

export interface DitherParams {
  pattern: DitherPattern;
  levels: number;    // 2..6
  cellSize: number;  // device px per dither cell
  threshold: number; // 0..1 (reserved; bayer/ign supply the per-pixel threshold)
  contrast: number;
  ink: Rgb;          // 0..255 (dark)
  paper: Rgb;        // 0..255 (light)
}

export interface AnimateOpts {
  ambient: number; // 0..1 amplitude at rest
  hover: number;   // 0..1 amplitude added on hover
  speed: number;   // breathing speed multiplier
}

export interface DitherBackend {
  render(source: TexImageSource, params: DitherParams, width: number, height: number): void;
  destroy(): void;
}
