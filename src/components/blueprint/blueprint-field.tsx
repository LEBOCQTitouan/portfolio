"use client";

import { useEffect, useRef } from "react";
import { BP } from "@/design/blueprint";
import { useReducedMotion } from "@/components/companion/use-reduced-motion";
import {
  DPR_CAP, alignedOriginX, suppression, warpOffset, convergeOffset, rasterBlock, type Rect,
} from "./geometry";

// Reads a CSS custom property off <body> (theme-aware).
function cssVar(name: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}
function hexRgb(h: string): [number, number, number] {
  h = h.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lerp3(k: number[], c: number[], t: number): number[] {
  t = Math.min(1, Math.max(0, t));
  return [k[0] + (c[0] - k[0]) * t, k[1] + (c[1] - k[1]) * t, k[2] + (c[2] - k[2]) * t];
}
function ink(): [number, number, number] {
  return cssVar("--bp-ink").split(",").map((s) => parseInt(s.trim(), 10)) as [number, number, number];
}
function inkA(): number { return parseFloat(cssVar("--bp-ink-a")); }
function rgba(k: number[], a: number): string { return `rgba(${k[0] | 0},${k[1] | 0},${k[2] | 0},${a})`; }

export default function BlueprintField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const floatRef = useRef<HTMLCanvasElement>(null);
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
    let attract: Array<Rect & { rgb: [number, number, number] }> = [];
    let actRgb: [number, number, number] = [0, 113, 227];
    let over = 0;
    let col = { l: 0, r: 0 }, inner = { l: 0, r: 0 };
    const ptr = { x: -9999, y: -9999, on: false };
    let sx = -9999, sy = -9999, amp = 0;
    let raf = 0;

    // Floating preview state
    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const fcanvas = floatRef.current;
    const fctx = fcanvas?.getContext("2d") ?? null;
    const off = document.createElement("canvas");
    let reveal: { img: HTMLImageElement; cap: string } | null = null;
    let fprog = 0, fx = -9999, fy = -9999;

    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-reveal]"));
    const imgCache = new Map<string, HTMLImageElement>();
    const rowHandlers: Array<[HTMLElement, () => void, () => void]> = [];
    if (!reduced && fineHover && fcanvas && fctx) {
      for (const row of rows) {
        const src = row.dataset.revealSrc; if (!src) continue;
        let img = imgCache.get(src);
        if (!img) { img = new Image(); img.decoding = "async"; img.src = src; imgCache.set(src, img); }
        const cap = row.dataset.revealCap ?? "";
        const enter = () => { reveal = { img: img!, cap }; };
        const leave = () => { if (reveal?.img === img) reveal = null; };
        row.addEventListener("pointerenter", enter);
        row.addEventListener("pointerleave", leave);
        rowHandlers.push([row, enter, leave]);
      }
    }

    const drawCover = (octx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) => {
      const ir = img.width / img.height, rr = w / h; let sw, sh, ix, iy;
      if (ir > rr) { sh = img.height; sw = sh * rr; ix = (img.width - sw) / 2; iy = 0; }
      else { sw = img.width; sh = sw / rr; ix = 0; iy = (img.height - sh) / 2; }
      octx.drawImage(img, ix, iy, sw, sh, 0, 0, w, h);
    };

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
      attract = Array.from(document.querySelectorAll<HTMLElement>("[data-bp-attract]")).map((e) => {
        const b = e.getBoundingClientRect();
        return { l: b.left, t: b.top, r: b.right, b: b.bottom, rgb: hexRgb(getComputedStyle(e).getPropertyValue("--accent").trim()) };
      });
      if (reduced) draw(false);
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
        const w = animate ? warpAt(hx, hy) : { dx: 0, dy: 0 };
        const cv = animate ? convergeOffset(hx, hy, sx, sy, over, BP.converge) : { dx: 0, dy: 0, infl: 0 };
        const x = hx + w.dx + cv.dx, y = hy + w.dy + cv.dy;
        let cc = k as number[]; let al = a * (isMajor ? 1.5 : 1) * (1 - sup);
        if (cv.infl > 0) {
          const t = Math.min(1, cv.infl * 1.4);
          cc = lerp3(k, actRgb, t);
          al = Math.max(al, (a + (0.8 - a) * t) * (1 - sup));
        }
        al = Math.min(al, 0.85);
        if (al <= 0.004) continue;
        if (isMajor) {
          const s = 3 + cv.infl * 1.6;
          ctx.strokeStyle = rgba(cc, Math.min(1, al * 1.5)); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.fillStyle = rgba(cc, al); ctx.arc(x, y, 1 + cv.infl * 1.5, 0, 6.283); ctx.fill();
        }
      }
      vline(col.l, Math.min(0.45, a * 1.5), k); vline(col.r, Math.min(0.45, a * 1.5), k);
      hatch(col.l, inner.l, +1, k, a); hatch(col.r, inner.r, -1, k, a);
    }

    const frame = () => {
      if (ptr.on) { if (sx < -9000) { sx = ptr.x; sy = ptr.y; } sx += (ptr.x - sx) * 0.2; sy += (ptr.y - sy) * 0.2; }
      amp += ((ptr.on ? 1 : 0) - amp) * 0.08;
      let hot: typeof attract[number] | null = null;
      for (const r of attract) {
        if (sx >= r.l && sx < r.r && sy >= r.t && sy < r.b) hot = r;
      }
      if (hot) actRgb = hot.rgb;
      over += ((hot ? 1 : 0) - over) * 0.12;
      draw(true);
      // Floating preview — fine pointer + non-reduced-motion only
      if (!reduced && fineHover && fcanvas && fctx) {
        const active = !!reveal && reveal.img.complete && reveal.img.naturalWidth > 0;
        fprog += ((active ? 1 : 0) - fprog) * 0.12;
        if (fx < -9000) { fx = ptr.x; fy = ptr.y; }
        fx += (ptr.x - fx) * BP.reveal.follow; fy += (ptr.y - fy) * BP.reveal.follow;
        const sc = BP.reveal.scaleMin + (1 - BP.reveal.scaleMin) * fprog;
        fcanvas.style.transform = `translate(${fx + BP.reveal.offset.x}px,${fy + BP.reveal.offset.y}px) scale(${sc})`;
        fcanvas.style.filter = `grayscale(${(1 - fprog).toFixed(2)})`;
        fcanvas.style.opacity = active || fprog > 0.02 ? "1" : "0";
        if (reveal) {
          const w = fcanvas.clientWidth, h = fcanvas.clientHeight;
          if (w >= 2) {
            if (fcanvas.width !== Math.round(w * dpr)) { fcanvas.width = Math.round(w * dpr); fcanvas.height = Math.round(h * dpr); }
            const block = rasterBlock(fprog, BP.reveal.coarse);
            const sw = Math.max(1, Math.round(w / block)), sh = Math.max(1, Math.round(h / block));
            off.width = sw; off.height = sh;
            const octx = off.getContext("2d")!; octx.imageSmoothingEnabled = true; drawCover(octx, reveal.img, sw, sh);
            fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.imageSmoothingEnabled = false;
            fctx.clearRect(0, 0, w, h); fctx.drawImage(off, 0, 0, sw, sh, 0, 0, w, h);
          }
        }
      }
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
      document.addEventListener("pointerleave", onLeave);
      raf = requestAnimationFrame(frame);
    } else {
      draw(false);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      for (const [row, enter, leave] of rowHandlers) {
        row.removeEventListener("pointerenter", enter);
        row.removeEventListener("pointerleave", leave);
      }
    };
  }, [reduced]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
      />
      <canvas
        ref={floatRef}
        aria-hidden="true"
        style={{
          position: "fixed", left: 0, top: 0, width: 320, height: 200, borderRadius: 10,
          zIndex: 6, pointerEvents: "none", opacity: 0, transition: "opacity .2s ease",
          boxShadow: "0 14px 34px rgba(16,32,64,0.18)",
        }}
      />
    </>
  );
}
