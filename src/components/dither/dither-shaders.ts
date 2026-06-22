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
