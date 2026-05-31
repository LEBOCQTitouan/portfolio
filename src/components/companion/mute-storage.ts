const KEY = "companion-muted";
const listeners = new Set<() => void>();

export function getMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "true";
  } catch {
    return false;
  }
}

export function setMuted(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(value));
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
  listeners.forEach((listener) => listener());
}

/** Subscribe to mute changes (same-tab). Returns an unsubscribe function. */
export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
