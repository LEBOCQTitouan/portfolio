"use client";

import { useEffect, useRef, useState } from "react";

/** Reveals `text` one char at a time when enabled; full text immediately otherwise. */
export function useTypewriter(text: string, enabled: boolean, speedMs = 22): string {
  // Track the text currently being animated alongside how much has been shown.
  // Storing them together lets a render detect a mid-animation text change and
  // return "" immediately, without calling setState synchronously inside an effect.
  const [state, setState] = useState<{ animating: string; shown: string }>({
    animating: text,
    shown: "",
  });
  const iRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    iRef.current = 0;
    const id = setInterval(() => {
      iRef.current += 1;
      setState({ animating: text, shown: text.slice(0, iRef.current) });
      if (iRef.current >= text.length) clearInterval(id);
    }, speedMs);
    return () => clearInterval(id);
  }, [text, enabled, speedMs]);

  if (!enabled) return text;
  // If the text has changed since the last interval tick, return "" immediately.
  if (state.animating !== text) return "";
  return state.shown;
}
