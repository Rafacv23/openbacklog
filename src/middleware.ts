import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { REQUEST_LOCALE_HEADER, toSupportedLocale } from "@/lib/locales";

function resolveLocaleFromPathname(pathname: string): string {
  const [, candidate] = pathname.split("/");
  return toSupportedLocale(candidate ?? "") ?? "en";
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    REQUEST_LOCALE_HEADER,
    resolveLocaleFromPathname(request.nextUrl.pathname),
  );

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)",
  ],
};
