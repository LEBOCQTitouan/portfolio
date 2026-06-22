// Single source of truth for blueprint-field geometry + motion.
// Mono colour policy: ink colours live in CSS (--bp-ink / --bp-ink-a) so they
// follow light/dark; only geometry + motion numbers live here.
export const BP = {
  PITCH: 24, // px — design-system base unit
  MAJOR: 8, // cells between major intersections → 192px; 768 column edges land on majors
  COLUMN: 768, // max-w-3xl content column
  GUTTER: 24, // px-6 side gutter
  warp: { strength: 2.6, reach: 230 }, // ambient whole-scheme flex (mono)
  converge: { radius: 108, pull: 0.24 }, // action-element convergence (tinted)
  reveal: { follow: 0.11, coarse: 18, scaleMin: 0.92, offset: { x: 26, y: -96 } },
  clear: { text: 16, pillar: 18, button: 28, row: 14 }, // keep-out margins
} as const;

// Title-block fields for the blueprint frame (mono drafting plate).
export const BP_FRAME = {
  name: "TITOUAN LEBOCQ",
  title: "Portfolio",
  rev: "2026.06",
  sheet: "01 / 04",
  scale: "1 : 1",
  status: "LIVE",
} as const;
