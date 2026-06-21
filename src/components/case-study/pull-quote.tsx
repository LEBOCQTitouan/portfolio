import type { ReactNode } from "react";
import { panelClass } from "@/components/ui/styles";

export function PullQuote({ children, cite }: { children: ReactNode; cite?: string }) {
  return (
    <figure className={panelClass({ extra: "my-6 border-l-2 border-l-accent" })}>
      <blockquote className="text-lg font-medium italic text-accent">{children}</blockquote>
      {cite && <figcaption className="mt-2 text-sm text-muted">— {cite}</figcaption>}
    </figure>
  );
}
