import type { DitherBackend, DitherParams } from "@/components/dither/types";
import { ditherFrame } from "@/components/dither/dither-math";

export function createCanvas2DDither(canvas: HTMLCanvasElement): DitherBackend | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  return {
    render(source, params: DitherParams, width, height) {
      canvas.width = width; canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      let img: ImageData;
      try {
        ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
        img = ctx.getImageData(0, 0, width, height);
      } catch { return; }
      ditherFrame({ data: img.data, width, height }, params);
      ctx.putImageData(img, 0, 0);
    },
    destroy() {},
  };
}
