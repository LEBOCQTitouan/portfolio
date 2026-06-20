import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function request(
  path: string,
  init?: { cookie?: string; acceptLanguage?: string },
) {
  const headers = new Headers();
  if (init?.acceptLanguage) headers.set("accept-language", init.acceptLanguage);
  if (init?.cookie) headers.set("cookie", `NEXT_LOCALE=${init.cookie}`);
  return new NextRequest(new URL(path, "http://localhost"), { headers });
}

describe("proxy (locale routing)", () => {
  it("redirects the bare root to a locale-prefixed path", () => {
    const res = proxy(request("/"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/en");
  });

  it("redirects an un-prefixed path, preserving it", () => {
    const res = proxy(request("/work"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/en/work");
  });

  it("honors a NEXT_LOCALE cookie when negotiating", () => {
    const res = proxy(request("/work", { cookie: "fr" }));
    expect(res.headers.get("location")).toBe("http://localhost/fr/work");
  });

  it("passes an already-localized path through without redirecting", () => {
    const res = proxy(request("/en/work"));
    expect(res.headers.get("location")).toBeNull();
  });
});

// Regression guard for the Next 16 `middleware` -> `proxy` rename AND its
// required location (next to app/, i.e. src/proxy.ts). A drift back to either
// makes Next silently ignore the file, 404-ing every un-prefixed route. The
// function tests above pass regardless of where the file lives, so this
// existence check is what actually catches a misplacement.
describe("proxy file convention (Next 16)", () => {
  it("lives at src/proxy.ts with no deprecated middleware file", () => {
    const here = (rel: string) => new URL(rel, import.meta.url).pathname;
    expect(existsSync(here("./proxy.ts"))).toBe(true);
    expect(existsSync(here("./middleware.ts"))).toBe(false); // src/middleware.ts
    expect(existsSync(here("../middleware.ts"))).toBe(false); // repo-root middleware.ts
  });
});
