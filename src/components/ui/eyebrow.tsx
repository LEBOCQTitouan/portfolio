import { cn } from "./styles";

// One eyebrow/kicker recipe — replaces the three divergent
// uppercase-label strings that were scattered across pages. Size, weight,
// and tracking come from the `text-eyebrow` type token.
export function Eyebrow({
  tone = "accent",
  className,
  children,
}: {
  tone?: "accent" | "muted";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn("text-eyebrow uppercase", tone === "accent" ? "text-accent" : "text-muted", className)}>
      {children}
    </p>
  );
}
