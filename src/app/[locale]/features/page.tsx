import { notFound, redirect } from "next/navigation"

import { toSupportedLocale } from "@/lib/locales"

type LocaleFeaturesRedirectPageProps = {
  params: Promise<{ locale: string }>
}

export default async function FeaturesRedirectPage({
  params,
}: LocaleFeaturesRedirectPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  redirect(`/${locale}/roadmap`)
}
