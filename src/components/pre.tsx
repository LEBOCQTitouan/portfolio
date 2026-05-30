"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { CopyButton } from "@/components/copy-button";

export function Pre(props: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const text = () => ref.current?.textContent ?? "";

  return (
    <div className="group relative">
      <CopyButton text={text()} />
      <pre
        ref={ref}
        {...props}
        className="overflow-x-auto rounded-lg border border-border p-4 text-sm"
      />
    </div>
  );
}
