// Primitive style recipes — the single source for buttons and pills so the
// same control can't drift between call sites. Microinteractions live here
// too (press/lift), gated behind motion-safe so reduced-motion users get only
// color changes. Timing routes through the motion tokens in globals.css.

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ── Button ──────────────────────────────────────────────────────── */

const buttonBase = cn(
  "inline-flex items-center justify-center gap-2 rounded-input px-4 py-2 text-sm font-medium",
  "transition-[transform,opacity,color,border-color,box-shadow]",
  "duration-[var(--dur-micro)] ease-[var(--ease-standard)]",
  // press + lift — skipped under reduced motion
  "motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.97]",
);

const buttonVariants = {
  primary: "bg-foreground text-background hover:opacity-90 motion-safe:hover:shadow-[0_6px_20px_rgba(0,0,0,0.13)]",
  secondary: "border border-border hover:border-accent hover:text-accent",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export function buttonClass(variant: ButtonVariant = "primary", extra?: string): string {
  return cn(buttonBase, buttonVariants[variant], extra);
}

/* ── Pill / Badge ────────────────────────────────────────────────── */

const pillBase = "inline-flex items-center rounded-pill border px-2 py-0.5 text-xs transition-colors duration-[var(--dur-micro)]";

const pillTones = {
  muted: "border-border text-muted",
  accent: "border-accent/20 bg-[var(--accent-soft)] text-accent",
} as const;

const pillHover = {
  muted: "hover:border-accent hover:text-accent",
  accent: "hover:border-accent/40",
} as const;

export type PillTone = keyof typeof pillTones;

export function pillClass(tone: PillTone = "muted", opts?: { interactive?: boolean; extra?: string }): string {
  return cn(pillBase, pillTones[tone], opts?.interactive && pillHover[tone], opts?.extra);
}
