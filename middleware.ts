import { NextResponse, type NextRequest } from "next/server";
import { locales, negotiateLocale } from "@/i18n/negotiate";

const LOCALE_COOKIE = "NEXT_LOCALE";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) {
    const current = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))!;
    const res = NextResponse.next();
    res.cookies.set("NEXT_LOCALE", current, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value ?? null;
  const locale = negotiateLocale(cookie, request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  // Skip Next internals, API, and any file with an extension (assets, og images, rss, sitemap…)
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
