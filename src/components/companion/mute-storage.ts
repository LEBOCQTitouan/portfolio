const KEY = "companion-muted";

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
}
