import "@testing-library/jest-dom/vitest";

// Node 26 exposes an undefined experimental localStorage; patch it with a
// real in-memory store so tests that call window.localStorage work correctly.
if (typeof window !== "undefined" && !window.localStorage) {
  const store: Record<string, string> = {};
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = String(v); },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { for (const k in store) delete store[k]; },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() { return Object.keys(store).length; },
    },
    writable: true,
  });
}
