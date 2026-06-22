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
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return null;
  }
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
