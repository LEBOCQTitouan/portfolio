"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/companion/use-reduced-motion";
import { parseRgb } from "@/components/dither/dither-math";
import { createDitherRenderer, type DitherRenderer } from "@/components/dither/dither-renderer";
import type { DitherPattern, DitherParams, Rgb } from "@/components/dither/types";

export interface DitherImageProps {
  src: string;
  alt: string;
  kind?: "image" | "video";
  pattern?: DitherPattern;
  levels?: 2 | 3 | 4 | 6;
  cellSize?: number;
  threshold?: number;
  contrast?: number;
  ink?: string;
  paper?: string;
  animate?: { ambient?: number; hover?: number; speed?: number } | false;
  className?: string;
}

function resolveColor(varExpr: string, fallback: Rgb): Rgb {
  if (typeof window === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = varExpr;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  return parseRgb(rgb, fallback);
}

export function DitherImage({
  src, alt, kind, pattern = "bayer", levels = 2, cellSize = 2,
  threshold = 0.5, contrast = 1.25, ink = "var(--foreground)", paper = "var(--background)",
  animate, className,
}: DitherImageProps) {
  const isVideo = kind === "video" || /\.(mp4|webm)$/i.test(src);
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DitherRenderer | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);

  const animateOff = animate === false;
  const aAmbient = animate === false ? null : (animate?.ambient ?? 0.15);
  const aHover = animate === false ? null : (animate?.hover ?? 0.5);
  const aSpeed = animate === false ? null : (animate?.speed ?? 1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const inkRgb = resolveColor(ink, [16, 30, 56]);
    const paperRgb = resolveColor(paper, [236, 236, 239]);
    const params: DitherParams = { pattern, levels, cellSize, threshold, contrast, ink: inkRgb, paper: paperRgb };

    let source: HTMLImageElement | HTMLVideoElement;
    let ready = false;
    if (isVideo) {
      const v = document.createElement("video");
      v.src = src; v.muted = true; v.loop = true; v.playsInline = true; v.crossOrigin = "anonymous";
      v.oncanplay = () => { ready = true; void v.play(); renderer?.refresh(); };
      source = v;
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { ready = true; renderer?.refresh(); };
      img.src = src;
      source = img;
    }

    const anim = reduced ? false
      : (animateOff ? false
        : { ambient: aAmbient!, hover: aHover!, speed: aSpeed! });

    const renderer: DitherRenderer = createDitherRenderer(canvas, {
      getParams: () => params,
      getSource: () => (ready ? source : null),
      animate: anim,
      isVideo,
    });
    rendererRef.current = renderer;
    setSupported(renderer.supported);
    return () => { renderer.destroy(); rendererRef.current = null; };
  }, [src, isVideo, pattern, levels, cellSize, threshold, contrast, ink, paper, animateOff, aAmbient, aHover, aSpeed, reduced]);

  if (supported === false) {
    return isVideo
      ? <video className={className} src={src} aria-label={alt} role="img" muted loop playsInline autoPlay />
      // eslint-disable-next-line @next/next/no-img-element
      : <img className={className} src={src} alt={alt} />;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
      onPointerEnter={() => rendererRef.current?.setHovered(true)}
      onPointerLeave={() => rendererRef.current?.setHovered(false)}
    />
  );
}
