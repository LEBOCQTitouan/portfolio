# DitherImage Effect — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable `<DitherImage>` component that renders images and animated media as a real-time, always-on 1-bit Bayer dither, crisp at any frame size, with coarse⇄fine precision animation, wired into `<Figure>`.

**Architecture:** Pure pixel math (`dither-math`) is shared by a WebGL2 fragment-shader backend (`dither-gpu`) and a Canvas 2D fallback. A renderer (`dither-renderer`) owns the canvas, sizes the backing store to on-screen pixels × DPR, re-renders on resize, pauses offscreen, and drives the precision animation. A thin React adapter (`dither-image.tsx`) resolves props + CSS-var colors + reduced-motion and mounts the renderer, degrading to a plain `<img>`/`<video>` when WebGL/Canvas are unavailable.

**Tech Stack:** TypeScript, React (client component), raw WebGL2 + GLSL ES 3.00 (no Three.js), Canvas 2D fallback, Vitest + @testing-library/react, Storybook 10.

## Global Constraints

- **No new runtime dependencies.** Raw WebGL2 only; do not add Three.js/ogl/regl.
- **Modified Next.js.** Before writing the client component (Task 5), read `node_modules/next/dist/docs/` for the current `"use client"` / ref conventions; SSR-guard all canvas/WebGL access (`typeof window`/`useEffect`).
- **Path alias:** import via `@/...` (maps to `src/...`).
- **Tests:** `npm run test` (`vitest run`); test files `src/**/*.test.{ts,tsx}`. `vitest.setup.ts` auto-loads and installs `window.matchMedia` + `MockIntersectionObserver` mocks for every test. To *drive* reduced-motion in a test, import the helper: `import { setMatchMedia } from "../../../vitest.setup"` (relative path from a test in `src/components/dither/`).
- **Pure core must not touch the DOM/canvas** (jsdom has no WebGL and no 2D context): `dither-math` operates on `{ data: Uint8ClampedArray, width, height }`, never a real `ImageData`/canvas.
- **Reduced motion:** `prefers-reduced-motion: reduce` ⇒ static single-precision dither, no rAF. Reuse `useReducedMotion` from `@/components/companion/use-reduced-motion`.
- **Color inheritance:** `ink`/`paper` default to `var(--foreground)` / `var(--background)`.
- **Commit trailer:** end every commit body with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **Default look (must reproduce the approved reference):** `pattern="bayer"`, `levels=2`, `cellSize=2`, `threshold=0.5`, `contrast=1.25`, monochrome from page scheme.

---

## File Structure

- `src/components/dither/types.ts` — shared types.
- `src/components/dither/dither-math.ts` — pure pixel math (Bayer, IGN, luminance, contrast, quantize, `ditherFrame`, `parseRgb`). **+ test**
- `src/components/dither/dither-runtime.ts` — pure renderer helpers (`computeBackingSize`, `resolvePrecision`, `precisionToCell`). **+ test**
- `src/components/dither/dither-shaders.ts` — GLSL vertex/fragment source strings.
- `src/components/dither/dither-gpu.ts` — `createWebGLDither` (WebGL2 backend).
- `src/components/dither/dither-canvas2d.ts` — `createCanvas2DDither` (fallback backend).
- `src/components/dither/dither-renderer.ts` — `createDitherRenderer` (orchestration, observers, loop). **+ test (backend selection)**
- `src/components/dither/dither-image.tsx` — React component. **+ test**
- `src/components/dither/dither-image.stories.tsx` — Storybook stories.
- `src/components/case-study/figure.tsx` — **modified** to use `DitherImage`.
- `src/components/case-study/figure.test.tsx` — **modified**.

---

## Task 1: Pure pixel math (`dither-math`) + types

**Files:**
- Create: `src/components/dither/types.ts`
- Create: `src/components/dither/dither-math.ts`
- Test: `src/components/dither/dither-math.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Rgb = readonly [number, number, number]` (0–255)
  - `type DitherPattern = "bayer" | "blue-noise"`
  - `interface DitherFrame { data: Uint8ClampedArray; width: number; height: number }`
  - `interface DitherParams { pattern: DitherPattern; levels: number; cellSize: number; threshold: number; contrast: number; ink: Rgb; paper: Rgb }`
  - `interface DitherBackend { render(source: TexImageSource, params: DitherParams, width: number, height: number): void; destroy(): void }`
  - `genBayerMatrix(n: number): number[][]`
  - `luminance(r: number, g: number, b: number): number` (returns 0–1)
  - `applyContrast(l: number, contrast: number): number` (0–1, clamped)
  - `orderedTone(l: number, levels: number, threshold: number): number` (0–1 quantized)
  - `ditherFrame(frame: DitherFrame, params: DitherParams): DitherFrame` (mutates + returns)
  - `parseRgb(css: string, fallback: Rgb): Rgb`

- [ ] **Step 1: Write the failing test**

`src/components/dither/dither-math.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  genBayerMatrix, luminance, applyContrast, orderedTone, ditherFrame, parseRgb,
} from "@/components/dither/dither-math";
import type { DitherFrame, DitherParams } from "@/components/dither/types";

describe("genBayerMatrix", () => {
  it("builds the canonical 2x2 matrix", () => {
    expect(genBayerMatrix(2)).toEqual([[0, 2], [3, 1]]);
  });
  it("builds a 4x4 matrix with values 0..15", () => {
    const m = genBayerMatrix(4).flat().sort((a, b) => a - b);
    expect(m).toEqual([...Array(16).keys()]);
  });
});

describe("luminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1, 5);
  });
});

describe("applyContrast", () => {
  it("pushes values away from 0.5 and clamps", () => {
    expect(applyContrast(0.5, 2)).toBeCloseTo(0.5, 5);
    expect(applyContrast(0.75, 2)).toBeCloseTo(1, 5);
    expect(applyContrast(1, 5)).toBe(1);
    expect(applyContrast(0, 5)).toBe(0);
  });
});

describe("orderedTone", () => {
  it("is binary for 2 levels", () => {
    expect(orderedTone(0.9, 2, 0.5)).toBe(1);
    expect(orderedTone(0.1, 2, 0.5)).toBe(0);
  });
  it("returns intermediate steps for >2 levels", () => {
    // 4 levels => steps at 0, 1/3, 2/3, 1
    expect(orderedTone(0.0, 4, 0.5)).toBeCloseTo(0, 5);
    expect(orderedTone(1.0, 4, 0.5)).toBeCloseTo(1, 5);
  });
});

describe("ditherFrame", () => {
  it("maps a 2x2 mid-grey frame to ink/paper per the bayer threshold", () => {
    // all pixels mid-grey (128) -> lum ~0.5; bayer 2x2 thresholds vary -> mix of ink/paper
    const data = new Uint8ClampedArray(2 * 2 * 4);
    for (let i = 0; i < data.length; i += 4) { data[i] = 128; data[i + 1] = 128; data[i + 2] = 128; data[i + 3] = 255; }
    const frame: DitherFrame = { data, width: 2, height: 2 };
    const params: DitherParams = {
      pattern: "bayer", levels: 2, cellSize: 1, threshold: 0.5, contrast: 1,
      ink: [0, 0, 0], paper: [255, 255, 255],
    };
    ditherFrame(frame, params);
    // every output pixel must be pure black or pure white
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      expect(v === 0 || v === 255).toBe(true);
      expect(data[i + 1]).toBe(v);
      expect(data[i + 2]).toBe(v);
    }
    // and not ALL the same (the bayer matrix splits mid-grey)
    const first = data[0];
    const mixed = [0, 4, 8, 12].some((o) => data[o] !== first);
    expect(mixed).toBe(true);
  });
});

describe("parseRgb", () => {
  it("parses rgb() and rgba() strings", () => {
    expect(parseRgb("rgb(16, 30, 56)", [0, 0, 0])).toEqual([16, 30, 56]);
    expect(parseRgb("rgba(255, 0, 10, 0.5)", [0, 0, 0])).toEqual([255, 0, 10]);
  });
  it("returns the fallback for unparseable input", () => {
    expect(parseRgb("var(--nope)", [1, 2, 3])).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dither-math`
Expected: FAIL — cannot resolve `@/components/dither/dither-math`.

- [ ] **Step 3: Write the types**

`src/components/dither/types.ts`:
```ts
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
```

- [ ] **Step 4: Write the implementation**

`src/components/dither/dither-math.ts`:
```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- dither-math`
Expected: PASS (all cases).

- [ ] **Step 6: Commit**

```bash
git add src/components/dither/types.ts src/components/dither/dither-math.ts src/components/dither/dither-math.test.ts
git commit -m "feat(dither): pure pixel math (bayer, luminance, contrast, dither)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Pure renderer helpers (`dither-runtime`)

**Files:**
- Create: `src/components/dither/dither-runtime.ts`
- Test: `src/components/dither/dither-runtime.test.ts`

**Interfaces:**
- Consumes: `AnimateOpts` from `@/components/dither/types`.
- Produces:
  - `computeBackingSize(clientW: number, clientH: number, dpr: number, maxDpr?: number): { width: number; height: number }`
  - `resolvePrecision(opts: AnimateOpts, timeMs: number, hovered: boolean): number` (0..1)
  - `precisionToCell(baseCell: number, precision: number, coarse?: number): number`

- [ ] **Step 1: Write the failing test**

`src/components/dither/dither-runtime.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeBackingSize, resolvePrecision, precisionToCell } from "@/components/dither/dither-runtime";

describe("computeBackingSize", () => {
  it("multiplies by dpr, clamped to maxDpr", () => {
    expect(computeBackingSize(100, 50, 2)).toEqual({ width: 200, height: 100 });
    expect(computeBackingSize(100, 50, 3, 2)).toEqual({ width: 200, height: 100 });
    expect(computeBackingSize(100, 50, 1.5, 2)).toEqual({ width: 150, height: 75 });
  });
  it("never returns zero", () => {
    expect(computeBackingSize(0, 0, 2)).toEqual({ width: 1, height: 1 });
  });
});

describe("resolvePrecision", () => {
  it("stays within [0,1] and is larger when hovered", () => {
    const opts = { ambient: 0.2, hover: 0.6, speed: 1 };
    const rest = resolvePrecision(opts, 1570, false); // sin peak near here
    const hov = resolvePrecision(opts, 1570, true);
    expect(rest).toBeGreaterThanOrEqual(0);
    expect(hov).toBeLessThanOrEqual(1);
    expect(hov).toBeGreaterThanOrEqual(rest);
  });
});

describe("precisionToCell", () => {
  it("returns the base cell at full precision and coarser at low precision", () => {
    expect(precisionToCell(2, 1)).toBe(2);
    expect(precisionToCell(2, 0, 4)).toBe(6);
    expect(precisionToCell(2, 0.5, 4)).toBe(4);
  });
  it("never returns less than 1", () => {
    expect(precisionToCell(1, 1, 0)).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dither-runtime`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`src/components/dither/dither-runtime.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- dither-runtime`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/dither/dither-runtime.ts src/components/dither/dither-runtime.test.ts
git commit -m "feat(dither): pure renderer helpers (sizing, precision)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Backends — GLSL shaders, WebGL2, Canvas 2D

This task has no jsdom-testable unit (no WebGL/canvas in jsdom); it is verified live in Task 7 and via Storybook in Task 6. Keep each backend behind the same interface so the renderer (Task 4) can select between them.

**Files:**
- Create: `src/components/dither/dither-shaders.ts`
- Create: `src/components/dither/dither-gpu.ts`
- Create: `src/components/dither/dither-canvas2d.ts`

**Interfaces:**
- Consumes: `DitherParams` from `@/components/dither/types`; `ditherFrame` from `@/components/dither/dither-math`.
- Produces (shared backend shape):
  - `interface DitherBackend { render(source: TexImageSource, params: DitherParams, width: number, height: number): void; destroy(): void }`
  - `createWebGLDither(canvas: HTMLCanvasElement): DitherBackend | null`
  - `createCanvas2DDither(canvas: HTMLCanvasElement): DitherBackend | null`

- [ ] **Step 1: Write the GLSL**

`src/components/dither/dither-shaders.ts`:
```ts
export const VERTEX_SRC = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 1.0 - (aPos.y * 0.5 + 0.5));
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAGMENT_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uCell;
uniform int uPattern;   // 0 = bayer, 1 = blue-noise
uniform int uLevels;
uniform float uContrast;
uniform vec3 uInk;       // 0..1
uniform vec3 uPaper;     // 0..1
in vec2 vUv;
out vec4 frag;

const int B[16] = int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);

float bayer(vec2 px) {
  ivec2 c = ivec2(mod(floor(px / uCell), 4.0));
  return (float(B[c.y * 4 + c.x]) + 0.5) / 16.0;
}
float ign(vec2 px) {
  vec2 p = floor(px / uCell);
  float v = 0.06711056 * p.x + 0.00583715 * p.y;
  return fract(52.9829189 * fract(v));
}
void main() {
  vec3 c = texture(uTex, vUv).rgb;
  float l = clamp((dot(c, vec3(0.299, 0.587, 0.114)) - 0.5) * uContrast + 0.5, 0.0, 1.0);
  vec2 px = vUv * uRes;
  float t = (uPattern == 1) ? ign(px) : bayer(px);
  float steps = float(uLevels - 1);
  float v = l * steps;
  float fl = floor(v);
  float lev = clamp(fl + ((v - fl) > t ? 1.0 : 0.0), 0.0, steps);
  frag = vec4(mix(uInk, uPaper, lev / steps), 1.0);
}`;
```

- [ ] **Step 2: Write the WebGL backend**

`src/components/dither/dither-gpu.ts`:
```ts
import type { DitherBackend, DitherParams, Rgb } from "@/components/dither/types";
import { VERTEX_SRC, FRAGMENT_SRC } from "@/components/dither/dither-shaders";

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
  return sh;
}
const n = (c: Rgb): [number, number, number] => [c[0] / 255, c[1] / 255, c[2] / 255];

export function createWebGLDither(canvas: HTMLCanvasElement): DitherBackend | null {
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  const uTex = u("uTex"), uRes = u("uRes"), uCell = u("uCell"), uPattern = u("uPattern"),
    uLevels = u("uLevels"), uContrast = u("uContrast"), uInk = u("uInk"), uPaper = u("uPaper");

  return {
    render(source, params: DitherParams, width, height) {
      canvas.width = width; canvas.height = height;
      gl.viewport(0, 0, width, height);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      } catch { return; }
      gl.uniform1i(uTex, 0);
      gl.uniform2f(uRes, width, height);
      gl.uniform1f(uCell, Math.max(1, params.cellSize));
      gl.uniform1i(uPattern, params.pattern === "blue-noise" ? 1 : 0);
      gl.uniform1i(uLevels, params.levels);
      gl.uniform1f(uContrast, params.contrast);
      const ink = n(params.ink), paper = n(params.paper);
      gl.uniform3f(uInk, ink[0], ink[1], ink[2]);
      gl.uniform3f(uPaper, paper[0], paper[1], paper[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      gl.deleteTexture(tex); gl.deleteBuffer(buf);
      gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs);
    },
  };
}
```

- [ ] **Step 3: Write the Canvas 2D backend**

`src/components/dither/dither-canvas2d.ts`:
```ts
import type { DitherBackend, DitherParams } from "@/components/dither/types";
import { ditherFrame } from "@/components/dither/dither-math";

export function createCanvas2DDither(canvas: HTMLCanvasElement): DitherBackend | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  return {
    render(source, params: DitherParams, width, height) {
      canvas.width = width; canvas.height = height;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
      let img: ImageData;
      try { img = ctx.getImageData(0, 0, width, height); } catch { return; }
      ditherFrame({ data: img.data, width, height }, params);
      ctx.putImageData(img, 0, 0);
    },
    destroy() {},
  };
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (No unit test — backends require a real GPU/canvas; validated in Tasks 6–7.)

- [ ] **Step 5: Commit**

```bash
git add src/components/dither/dither-shaders.ts src/components/dither/dither-gpu.ts src/components/dither/dither-canvas2d.ts
git commit -m "feat(dither): webgl2 + canvas2d dither backends

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Renderer orchestration (`dither-renderer`)

**Files:**
- Create: `src/components/dither/dither-renderer.ts`
- Test: `src/components/dither/dither-renderer.test.ts`

**Interfaces:**
- Consumes: backends from Task 3; helpers from `dither-runtime`; `DitherParams`/`AnimateOpts`.
- Produces:
  - re-exports `DitherBackend` (defined in `types.ts`)
  - `type BackendFactory = (canvas: HTMLCanvasElement) => DitherBackend | null`
  - `selectBackend(canvas: HTMLCanvasElement, factories: BackendFactory[]): DitherBackend | null`
  - `interface RendererOpts { getParams(): DitherParams; getSource(): TexImageSource | null; animate: AnimateOpts | false; isVideo: boolean; factories?: BackendFactory[] }`
  - `interface DitherRenderer { setHovered(h: boolean): void; refresh(): void; destroy(): void; readonly supported: boolean }`
  - `createDitherRenderer(canvas: HTMLCanvasElement, opts: RendererOpts): DitherRenderer`

- [ ] **Step 1: Write the failing test** (tests only the jsdom-safe seam: backend selection)

`src/components/dither/dither-renderer.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { selectBackend } from "@/components/dither/dither-renderer";
import type { DitherBackend } from "@/components/dither/dither-renderer";

const fakeBackend = (): DitherBackend => ({ render: vi.fn(), destroy: vi.fn() });

describe("selectBackend", () => {
  it("returns the first factory that yields a backend", () => {
    const canvas = document.createElement("canvas");
    const a = vi.fn(() => null);
    const b = vi.fn(() => fakeBackend());
    const c = vi.fn(() => fakeBackend());
    const chosen = selectBackend(canvas, [a, b, c]);
    expect(chosen).not.toBeNull();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
    expect(c).not.toHaveBeenCalled();
  });
  it("returns null when every factory fails (e.g. jsdom)", () => {
    const canvas = document.createElement("canvas");
    expect(selectBackend(canvas, [() => null, () => null])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dither-renderer`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

`src/components/dither/dither-renderer.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- dither-renderer`
Expected: PASS. (The full render loop is validated live in Task 7; in jsdom both factories return null so `supported` is false — exercised via the component test in Task 5.)

- [ ] **Step 5: Commit**

```bash
git add src/components/dither/dither-renderer.ts src/components/dither/dither-renderer.test.ts
git commit -m "feat(dither): renderer orchestration (backend select, resize, loop)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: React component (`DitherImage`)

**Files:**
- Create: `src/components/dither/dither-image.tsx`
- Test: `src/components/dither/dither-image.test.tsx`

**Interfaces:**
- Consumes: `createDitherRenderer`, `DitherRenderer` (Task 4); `parseRgb` (Task 1); `useReducedMotion` (`@/components/companion/use-reduced-motion`); `DitherPattern`, `Rgb`.
- Produces: `DitherImage(props: DitherImageProps): JSX.Element`, `interface DitherImageProps`.

- [ ] **Step 1: Write the failing test**

`src/components/dither/dither-image.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { setMatchMedia } from "../../../vitest.setup";
import { DitherImage } from "@/components/dither/dither-image";

describe("DitherImage", () => {
  it("falls back to an accessible <img> when WebGL/Canvas are unavailable (jsdom)", async () => {
    render(<DitherImage src="/work/atlas.jpg" alt="Atlas hero" />);
    const img = await screen.findByRole("img", { name: /atlas hero/i });
    expect(img.tagName).toBe("IMG");
    expect(img).toHaveAttribute("src", "/work/atlas.jpg");
  });

  it("exposes the alt text on the rendered surface", async () => {
    render(<DitherImage src="/x.jpg" alt="meaningful caption" />);
    expect(await screen.findByRole("img", { name: /meaningful caption/i })).toBeInTheDocument();
  });

  it("renders the reduced-motion fallback without throwing", async () => {
    setMatchMedia("(prefers-reduced-motion: reduce)", true);
    render(<DitherImage src="/y.jpg" alt="reduced" />);
    expect(await screen.findByRole("img", { name: /reduced/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dither-image`
Expected: FAIL — module not found.

- [ ] **Step 3: Read the Next.js client-component guidance**

Run: `ls node_modules/next/dist/docs/` and read the entry covering client components / `"use client"`. Confirm the ref + `useEffect` mount pattern below is current. (No code change if it matches.)

- [ ] **Step 4: Write the implementation**

`src/components/dither/dither-image.tsx`:
```tsx
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
  const [supported, setSupported] = useState<boolean | null>(null);

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
      : (animate === false ? false
        : { ambient: animate?.ambient ?? 0.15, hover: animate?.hover ?? 0.5, speed: animate?.speed ?? 1 });

    const renderer: DitherRenderer = createDitherRenderer(canvas, {
      getParams: () => params,
      getSource: () => (ready ? source : null),
      animate: anim,
      isVideo,
    });
    setSupported(renderer.supported);
    return () => renderer.destroy();
  }, [src, isVideo, pattern, levels, cellSize, threshold, contrast, ink, paper, animate, reduced]);

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
    />
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- dither-image`
Expected: PASS (jsdom → `supported === false` → `<img>` fallback with `alt`).

- [ ] **Step 6: Commit**

```bash
git add src/components/dither/dither-image.tsx src/components/dither/dither-image.test.tsx
git commit -m "feat(dither): DitherImage React component with a11y + fallback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Storybook stories

**Files:**
- Create: `src/components/dither/dither-image.stories.tsx`

**Interfaces:**
- Consumes: `DitherImage` (Task 5).
- Produces: stories (no runtime exports relied on by other tasks).

- [ ] **Step 1: Write the stories**

`src/components/dither/dither-image.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DitherImage } from "@/components/dither/dither-image";

// A reliable, CORS-friendly demo image. If offline, swap for a local /public asset.
const SRC = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=70&fm=jpg";

const meta: Meta<typeof DitherImage> = {
  title: "Effects/DitherImage",
  component: DitherImage,
  args: { src: SRC, alt: "Mountain landscape", pattern: "bayer", levels: 2, cellSize: 2, contrast: 1.25 },
  parameters: { layout: "centered" },
  decorators: [(S) => <div style={{ width: 640 }}><S /></div>],
};
export default meta;
type Story = StoryObj<typeof DitherImage>;

export const Default: Story = {};
export const BlueNoise: Story = { args: { pattern: "blue-noise" } };
export const SixTone: Story = { args: { levels: 6 } };
export const CoarseCells: Story = { args: { cellSize: 5 } };
export const Small: Story = { decorators: [(S) => <div style={{ width: 200 }}><S /></div>] };
export const AccentDuotone: Story = { args: { ink: "var(--accent)" } };
export const Static: Story = { args: { animate: false } };
```

- [ ] **Step 2: Verify Storybook builds**

Run: `npm run build-storybook`
Expected: build completes with no errors referencing `dither-image`.

- [ ] **Step 3: Commit**

```bash
git add src/components/dither/dither-image.stories.tsx
git commit -m "docs(dither): Storybook stories for DitherImage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Integrate into `<Figure>` + live validation

**Files:**
- Modify: `src/components/case-study/figure.tsx`
- Modify: `src/components/case-study/figure.test.tsx`

**Interfaces:**
- Consumes: `DitherImage` (Task 5).
- Produces: unchanged `Figure` public API.

- [ ] **Step 1: Update the test to assert DitherImage is used when src is present**

Replace `src/components/case-study/figure.test.tsx` with:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Figure } from "@/components/case-study/figure";

describe("Figure", () => {
  it("renders an accessible dithered image when src is provided", () => {
    render(<Figure src="/work/arch.svg" alt="architecture" caption="Write path" />);
    // jsdom has no WebGL → DitherImage falls back to <img>, preserving the contract
    const img = screen.getByRole("img", { name: /architecture/i });
    expect(img).toHaveAttribute("src", "/work/arch.svg");
    expect(screen.getByText(/write path/i)).toBeInTheDocument();
  });

  it("renders a placeholder with the caption when src is absent", () => {
    render(<Figure caption="Event-sourced write path" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getAllByText(/event-sourced write path/i).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- case-study/figure`
Expected: still PASS for placeholder; the image case may still pass via the old `<img>` — proceed to wire `DitherImage` so the component is actually exercised. (If it passes already, Step 3 keeps it passing while switching the implementation.)

- [ ] **Step 3: Wire DitherImage into Figure**

Replace the `src` branch in `src/components/case-study/figure.tsx`. Full file:
```tsx
import { DitherImage } from "@/components/dither/dither-image";

export function Figure({
  src,
  alt,
  caption,
}: {
  src?: string;
  alt?: string;
  caption?: string;
}) {
  return (
    <figure className="my-6">
      {src ? (
        <DitherImage
          src={src}
          alt={alt ?? caption ?? ""}
          className="w-full rounded-panel border border-border"
        />
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-panel border border-dashed border-accent/40 bg-[var(--accent-soft)] p-6 text-center text-sm text-muted">
          {caption ?? "Figure"}
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
```

- [ ] **Step 4: Run the full test suite + typecheck + lint**

Run: `npm run test`
Expected: PASS (all dither + figure tests).
Run: `npx tsc --noEmit`
Expected: no errors.
Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Live validation (mandatory — taste rule: validate live, do not trust screenshots)**

Run: `npm run storybook` and open `Effects/DitherImage`. Verify on the real GPU:
1. **Default** reads as crisp 1-bit B&W Bayer on the photo (matches the reference screenshot).
2. **Small** (200px) story is just as crisp as Default — no grey mush (proves display-resolution dithering).
3. Drag the Storybook canvas / resize the window → re-dithers and stays crisp (ResizeObserver).
4. Precision visibly breathes coarse⇄fine at rest, and shifts more on hover.
5. **Static** story does not animate; toggle OS reduced-motion and reload Default → no animation.
6. **AccentDuotone** picks up `--accent`. Note: colours resolve at mount, so *reload* after switching dark mode / `data-subject` to see ink/paper update (live theme re-read is a deliberate follow-up per the spec's open notes).
7. No console errors; check GPU/CPU stays reasonable with several instances.

Then add a temporary local image to a case-study MDX `<Figure src="/some-local.jpg" />`, run `npm run dev`, and confirm it renders dithered in-page. Remove the temporary edit before finishing.

- [ ] **Step 6: Commit**

```bash
git add src/components/case-study/figure.tsx src/components/case-study/figure.test.tsx
git commit -m "feat(dither): render case-study figures with DitherImage

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notes / non-goals

- Applying `DitherImage` to project/post cards and case-study heroes is **out of scope** (no media exists yet); the component is ready for them.
- Sourcing/creating real site imagery is **out of scope** (Option A).
- If many instances prove heavy on low-end GPUs, a follow-up can add a shared WebGL context or a Canvas2D tier above N instances; not built now (YAGNI).
