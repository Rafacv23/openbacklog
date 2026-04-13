import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { REQUEST_LOCALE_HEADER, toSupportedLocale } from "@/lib/locales";
import { getAuthSession } from "@/server/auth/get-auth-session";

export default async function RootRedirectPage() {
  const session = await getAuthSession();
  const requestHeaders = await headers();
  const locale =
    toSupportedLocale(requestHeaders.get(REQUEST_LOCALE_HEADER) ?? "") ?? "en";

  if (session) {
    redirect(`/${locale}/feed`);
  }

  redirect("/en");
}
