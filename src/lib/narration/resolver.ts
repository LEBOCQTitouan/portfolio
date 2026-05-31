import { script } from "./script";
import type { NarrationLine } from "./types";

/** Returns the ordered narration lines for a route, or [] if none. */
export function getNarration(route: string): NarrationLine[] {
  if (route in script) return script[route];
  if (route.startsWith("/work/") && route !== "/work") {
    return script["/work/[slug]"] ?? [];
  }
  return [];
}
