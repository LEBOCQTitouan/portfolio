"use client";

import { useEffect, useRef } from "react";
import { BP } from "@/design/blueprint";
import { useReducedMotion } from "@/components/companion/use-reduced-motion";
import {
  DPR_CAP, alignedOriginX, suppression, warpOffset, type Rect,
} from "./geometry";

// Reads a CSS custom property off <body> (theme-aware).
function cssVar(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}
function ink(): [number, number, number] {
  return cssVar("--bp-ink").split(",").map((s) => parseInt(s.trim(), 10)) as [number, number, number];
}
function inkA(): number { return parseFloat(cssVar("--bp-ink-a")); }
function rgba(k: number[], a: number): string { return `rgba(${k[0] | 0},${k[1] | 0},${k[2] | 0},${a})`; }

export default function BlueprintField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;

    let W = 0, H = 0, dpr = 1;
    let baseX = 0, cMin = 0, cMax = 0, rMin = 0, rMax = 0;
    let clears: Array<Rect & { m: number }> = [];
    let col = { l: 0, r: 0 }, inner = { l: 0, r: 0 };
    const ptr = { x: -9999, y: -9999, on: false };
    let sx = -9999, sy = -9999, amp = 0;
    let raf = 0;

    const measure = () => {
      const el = document.querySelector("[data-bp-column]") ?? document.querySelector("main");
      const r = el?.getBoundingClientRect();
      const cx = W / 2;
      col = r ? { l: r.left, r: r.right } : { l: cx - BP.COLUMN / 2, r: cx + BP.COLUMN / 2 };
      inner = { l: col.l + BP.GUTTER, r: col.r - BP.GUTTER };
      clears = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-clear]")).map((e) => {
        const b = e.getBoundingClientRect();
        return { l: b.left, t: b.top, r: b.right, b: b.bottom, m: Number(e.dataset.bpClear) || BP.clear.text };
      });
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const major = BP.PITCH * BP.MAJOR;
      baseX = alignedOriginX(W, major);
      cMin = Math.floor((0 - baseX) / BP.PITCH) - 1;
      cMax = Math.ceil((W - baseX) / BP.PITCH) + 1;
      rMin = -1;
      rMax = Math.ceil(H / BP.PITCH) + 1;
      measure();
      if (reduced) draw(false);
    };

    const warpAt = (px: number, py: number) => warpOffset(px, py, sx, sy, amp, BP.warp);

    const vline = (x: number, a: number, k: number[]) => {
      ctx.beginPath();
      let started = false;
      for (let y = 0; y <= H; y += 14) {
        const w = warpAt(x, y); const lx = x + w.dx, ly = y + w.dy;
        if (!started) { ctx.moveTo(lx, ly); started = true; } else ctx.lineTo(lx, ly);
      }
      ctx.strokeStyle = rgba(k, a); ctx.lineWidth = 1; ctx.stroke();
    };

    const hatch = (outerX: number, innerX: number, dir: number, k: number[], a: number) => {
      const lo = Math.min(outerX, innerX), hi = Math.max(outerX, innerX), bw = hi - lo, S = 11;
      ctx.save(); ctx.beginPath(); ctx.rect(lo - 1, 0, bw + 2, H); ctx.clip();
      ctx.lineWidth = 1; ctx.strokeStyle = rgba(k, Math.min(0.09, a * 0.3));
      for (let y = -bw; y < H + bw; y += S) {
        const [x1, y1, x2, y2] = dir > 0 ? [lo - 2, y, hi + 2, y - bw] : [lo - 2, y - bw, hi + 2, y];
        const w1 = warpAt(x1, y1), w2 = warpAt(x2, y2);
        ctx.beginPath(); ctx.moveTo(x1 + w1.dx, y1 + w1.dy); ctx.lineTo(x2 + w2.dx, y2 + w2.dy); ctx.stroke();
      }
      ctx.restore();
    };

    function draw(animate: boolean) {
      const k = ink(), a = inkA();
      ctx.clearRect(0, 0, W, H);
      for (let r = rMin; r <= rMax; r++) for (let c = cMin; c <= cMax; c++) {
        const hx = baseX + c * BP.PITCH, hy = r * BP.PITCH;
        const sup = suppression(hx, hy, clears);
        if (sup >= 0.98) continue;
        const isMajor = c % BP.MAJOR === 0 && r % BP.MAJOR === 0;
        const al = Math.min(0.85, a * (isMajor ? 1.5 : 1) * (1 - sup));
        if (al <= 0.004) continue;
        const w = animate ? warpAt(hx, hy) : { dx: 0, dy: 0 };
        const x = hx + w.dx, y = hy + w.dy;
        if (isMajor) {
          ctx.strokeStyle = rgba(k, Math.min(1, al * 1.5)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.fillStyle = rgba(k, al); ctx.arc(x, y, 1, 0, 6.283); ctx.fill();
        }
      }
      vline(col.l, Math.min(0.45, a * 1.5), k); vline(col.r, Math.min(0.45, a * 1.5), k);
      hatch(col.l, inner.l, +1, k, a); hatch(col.r, inner.r, -1, k, a);
    }

    const frame = () => {
      if (ptr.on) { if (sx < -9000) { sx = ptr.x; sy = ptr.y; } sx += (ptr.x - sx) * 0.2; sy += (ptr.y - sy) * 0.2; }
      amp += ((ptr.on ? 1 : 0) - amp) * 0.08;
      draw(true);
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true;
    };
    const onLeave = () => { ptr.on = false; };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", measure, { passive: true });
    if (!reduced) {
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      draw(false);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
