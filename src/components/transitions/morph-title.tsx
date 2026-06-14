import * as React from "react";

type VTProps = { name?: string; share?: string; children: React.ReactNode };

/** Next's vendored React (App Router bundle) exports ViewTransition; the
 *  standalone react used by Vitest/tsc does not. Resolve it defensively. */
const NativeViewTransition = (
  React as unknown as { ViewTransition?: React.ComponentType<VTProps> }
).ViewTransition;

/** Fallback for environments without ViewTransition. A plain function (NOT
 *  React.Fragment, which warns on extra props) that just renders children. */
function Passthrough({ children }: VTProps) {
  return <>{children}</>;
}

const VT = NativeViewTransition ?? Passthrough;

/** Wrap a page's primary heading. In the Next bundle the browser morphs the
 *  named element (position + size + color) across navigations; elsewhere it
 *  renders children unchanged. `share="morph"` assigns the `.morph` class for
 *  the CSS in globals.css. */
export function MorphTitle({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <VT name={name} share="morph">
      {children}
    </VT>
  );
}
