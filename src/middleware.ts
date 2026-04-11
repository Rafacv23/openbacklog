import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import {
  REQUEST_LOCALE_HEADER,
  toSupportedLocale,
  type SupportedLocale,
} from "@/lib/locales";

const LOCALE_COOKIE_NAME = "openbacklog-locale";

function resolveLocaleFromPathname(pathname: string): SupportedLocale | null {
  const [, candidate] = pathname.split("/");
  return toSupportedLocale(candidate ?? "");
}

function resolveLocaleFromAcceptLanguage(
  rawAcceptLanguageHeader: string | null,
): SupportedLocale | null {
  if (!rawAcceptLanguageHeader) {
    return null;
  }

  const acceptedLanguages = rawAcceptLanguageHeader
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "")
    .filter(Boolean);

  for (const language of acceptedLanguages) {
    if (language.startsWith("es")) {
      return "es";
    }

    if (language.startsWith("en")) {
      return "en";
    }
  }

  return null;
}

export function middleware(request: NextRequest) {
  const localeFromPathname = resolveLocaleFromPathname(request.nextUrl.pathname);
  const localeFromCookie = toSupportedLocale(
    request.cookies.get(LOCALE_COOKIE_NAME)?.value ?? "",
  );
  const localeFromAcceptLanguage = resolveLocaleFromAcceptLanguage(
    request.headers.get("accept-language"),
  );
  const locale =
    localeFromPathname ?? localeFromCookie ?? localeFromAcceptLanguage ?? "en";

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_LOCALE_HEADER, locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (
    localeFromPathname &&
    request.cookies.get(LOCALE_COOKIE_NAME)?.value !== localeFromPathname
  ) {
    response.cookies.set({
      name: LOCALE_COOKIE_NAME,
      value: localeFromPathname,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
