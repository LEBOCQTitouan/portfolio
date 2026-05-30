"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy code"
      className="absolute right-2 top-2 rounded-md border border-border bg-card px-2 py-1 text-xs text-muted opacity-0 transition group-hover:opacity-100 hover:text-foreground"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
