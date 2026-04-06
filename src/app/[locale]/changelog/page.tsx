import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, SITE_NAME } from "@/lib/site"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type LocaleChangelogPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()

export async function generateMetadata({
  params,
}: LocaleChangelogPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.changelog.metaTitle,
    description: dictionary.changelog.metaDescription,
    alternates: {
      canonical: `/${locale}/changelog`,
      languages: {
        en: "/en/changelog",
        es: "/es/changelog",
      },
    },
    openGraph: {
      title: dictionary.changelog.metaTitle,
      description: dictionary.changelog.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/changelog`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.changelog.metaTitle,
      description: dictionary.changelog.metaDescription,
    },
  }
}

export default async function ChangelogPage({
  params,
}: LocaleChangelogPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-none border-primary/40 bg-card px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase"
          >
            {dictionary.changelog.currentVersionLabel}{" "}
            {dictionary.changelog.currentVersionValue}
          </Badge>
          <Link href={`/${locale}`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.changelog.backHome}
            </Button>
          </Link>
        </div>

        <header className="space-y-4">
          <h1 className="font-display text-5xl italic text-primary">
            {dictionary.changelog.title}
          </h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            {dictionary.changelog.description}
          </p>
        </header>

        <Card className="rounded-none border border-border bg-card/80 p-0">
          <CardContent className="space-y-4 p-8">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.changelog.statusTitle}
            </h2>
            <p className="font-body text-sm leading-relaxed text-muted-foreground">
              {dictionary.changelog.statusBody}
            </p>
            <Link href={`/${locale}/features`}>
              <Button className="h-auto rounded-none px-5 py-2 font-headline text-xs tracking-[0.12em] uppercase">
                {dictionary.changelog.featuresLink}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
