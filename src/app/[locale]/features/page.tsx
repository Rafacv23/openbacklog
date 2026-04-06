import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, SITE_NAME } from "@/lib/site"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type LocaleFeaturesPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()

export async function generateMetadata({
  params,
}: LocaleFeaturesPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.features.metaTitle,
    description: dictionary.features.metaDescription,
    alternates: {
      canonical: `/${locale}/features`,
      languages: {
        en: "/en/features",
        es: "/es/features",
      },
    },
    openGraph: {
      title: dictionary.features.metaTitle,
      description: dictionary.features.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/features`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.features.metaTitle,
      description: dictionary.features.metaDescription,
    },
  }
}

export default async function FeaturesPage({
  params,
}: LocaleFeaturesPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-4">
          <Badge
            variant="outline"
            className="w-fit rounded-none border-primary/40 bg-card px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase"
          >
            {dictionary.changelog.currentVersionValue}
          </Badge>
          <h1 className="font-display text-5xl italic text-primary">
            {dictionary.features.title}
          </h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            {dictionary.features.description}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="rounded-none border border-border bg-card/80 p-0">
            <CardContent className="space-y-3 p-8">
              <h2 className="font-headline text-2xl uppercase">
                {dictionary.features.voteTitle}
              </h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                {dictionary.features.voteBody}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-none border border-border bg-card/80 p-0">
            <CardContent className="space-y-3 p-8">
              <h2 className="font-headline text-2xl uppercase">
                {dictionary.features.proposeTitle}
              </h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                {dictionary.features.proposeBody}
              </p>
            </CardContent>
          </Card>
        </div>

        <Link href={`/${locale}/changelog`}>
          <Button
            variant="outline"
            className="w-fit rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
          >
            {dictionary.features.changelogLink}
          </Button>
        </Link>
      </div>
    </main>
  )
}
