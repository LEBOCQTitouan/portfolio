/** Given section id → intersection ratio, return the most-visible id (or null). */
export function pickActiveSection(ratios: Record<string, number>): string | null {
  let best: string | null = null;
  let max = 0;
  for (const [id, ratio] of Object.entries(ratios)) {
    if (ratio > max) {
      max = ratio;
      best = id;
    }
  }
  return best;
}
