"use client";

import { useEffect, useRef, useState } from "react";

/** Reveals `text` one char at a time when enabled; full text immediately otherwise. */
export function useTypewriter(text: string, enabled: boolean, speedMs = 22): string {
  const [shown, setShown] = useState("");
  const iRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    iRef.current = 0;
    const id = setInterval(() => {
      iRef.current += 1;
      setShown(text.slice(0, iRef.current));
      if (iRef.current >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, enabled, speedMs]);

  if (!enabled) return text;
  return shown;
}
