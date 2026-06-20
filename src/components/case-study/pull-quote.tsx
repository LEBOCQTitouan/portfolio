import type { ReactNode } from "react";

export function PullQuote({
  children,
  cite,
}: {
  children: ReactNode;
  cite?: string;
}) {
  return (
    <figure className="my-6 border-l-2 border-accent pl-4">
      <blockquote className="text-lg font-medium italic text-accent">
        {children}
      </blockquote>
      {cite && <figcaption className="mt-1 text-sm text-muted">— {cite}</figcaption>}
    </figure>
  );
}
