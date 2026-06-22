import type { AnimateOpts, DitherParams, DitherBackend } from "@/components/dither/types";
import { createWebGLDither } from "@/components/dither/dither-gpu";
import { createCanvas2DDither } from "@/components/dither/dither-canvas2d";
import { computeBackingSize, resolvePrecision, precisionToCell } from "@/components/dither/dither-runtime";

export type { DitherBackend };
export type BackendFactory = (canvas: HTMLCanvasElement) => DitherBackend | null;

export function selectBackend(canvas: HTMLCanvasElement, factories: BackendFactory[]): DitherBackend | null {
  for (const make of factories) {
    const b = make(canvas);
    if (b) return b;
  }
  return null;
}

export interface RendererOpts {
  getParams(): DitherParams;
  getSource(): TexImageSource | null;
  animate: AnimateOpts | false;
  isVideo: boolean;
  factories?: BackendFactory[];
}

export interface DitherRenderer {
  setHovered(h: boolean): void;
  refresh(): void;
  destroy(): void;
  readonly supported: boolean;
}

const DEFAULT_FACTORIES: BackendFactory[] = [createWebGLDither, createCanvas2DDither];

export function createDitherRenderer(canvas: HTMLCanvasElement, opts: RendererOpts): DitherRenderer {
  const backend = selectBackend(canvas, opts.factories ?? DEFAULT_FACTORIES);
  if (!backend) {
    return { setHovered() {}, refresh() {}, destroy() {}, supported: false };
  }

  let hovered = false;
  let visible = true;
  let raf = 0;
  let running = false;
  let dirty = true;

  const draw = (timeMs: number) => {
    const source = opts.getSource();
    if (!source) return;
    const params = { ...opts.getParams() };
    if (opts.animate) {
      const precision = resolvePrecision(opts.animate, timeMs, hovered);
      params.cellSize = precisionToCell(params.cellSize, precision);
    }
    const rect = canvas.getBoundingClientRect();
    const { width, height } = computeBackingSize(rect.width, rect.height, window.devicePixelRatio || 1);
    backend.render(source, params, width, height);
  };

  const loop = (t: number) => {
    if (!running) return;
    const animating = !!opts.animate || opts.isVideo;
    if (visible && (animating || dirty)) { draw(t); dirty = false; }
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const ro = new ResizeObserver(() => { dirty = true; });
  ro.observe(canvas);
  const io = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start(); else stop();
  });
  io.observe(canvas);
  start();

  return {
    setHovered(h) { hovered = h; dirty = true; },
    refresh() { dirty = true; },
    destroy() { stop(); ro.disconnect(); io.disconnect(); backend.destroy(); },
    supported: true,
  };
}
