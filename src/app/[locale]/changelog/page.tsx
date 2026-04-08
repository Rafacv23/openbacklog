import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, SITE_NAME } from "@/lib/site"
import { getChangelogEntries } from "@/server/changelog/get-changelog-entries"

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
  const updates = await getChangelogEntries(locale)
  const latestVersion = updates[0]?.version ?? dictionary.changelog.currentVersionValue
  const updateCount = updates.length
  const formattedCurrentVersion = latestVersion.startsWith("v")
    ? latestVersion
    : `v${latestVersion}`

  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${locale}`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.changelog.backHome}
            </Button>
          </Link>
          <Link href={`/${locale}/roadmap`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.changelog.featuresLink}
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

        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-none border-primary/40 bg-card px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase"
          >
            {dictionary.changelog.currentVersionLabel} {formattedCurrentVersion}
          </Badge>
          <span className="font-body text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {updateCount} {dictionary.changelog.updatesCountLabel}
          </span>
        </div>

        {updates.length === 0 ? (
          <Card className="rounded-none border border-border bg-card/80 p-0">
            <CardContent className="space-y-4 p-8">
              <h2 className="font-headline text-2xl uppercase">
                {dictionary.changelog.statusTitle}
              </h2>
              <p className="font-body text-sm leading-relaxed text-muted-foreground">
                {dictionary.changelog.statusBody}
              </p>
              <Link href={`/${locale}/roadmap`}>
                <Button className="h-auto rounded-none px-5 py-2 font-headline text-xs tracking-[0.12em] uppercase">
                  {dictionary.changelog.featuresLink}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {updates.map((update) => {
          const publishedDate = formatDate(update.date, locale)

          return (
            <Card
              key={update.slug}
              className="rounded-none border border-border bg-card/80 p-0"
            >
              <CardContent className="space-y-5 p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h2 className="font-headline text-2xl uppercase">
                      {update.title}
                    </h2>
                    {publishedDate ? (
                      <p className="font-body text-xs tracking-[0.08em] text-muted-foreground uppercase">
                        {dictionary.changelog.entryPublishedLabel} {publishedDate}
                      </p>
                    ) : null}
                    {update.summary ? (
                      <p className="font-body text-sm leading-relaxed text-muted-foreground">
                        {update.summary}
                      </p>
                    ) : null}
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-none border-primary/40 bg-card px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase"
                  >
                    v{update.version}
                  </Badge>
                </div>

                <div
                  className="space-y-3 font-body text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_code]:rounded-none [&_code]:bg-popover [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mt-6 [&_h1]:font-headline [&_h1]:text-2xl [&_h1]:uppercase [&_h2]:mt-6 [&_h2]:font-headline [&_h2]:text-xl [&_h2]:uppercase [&_h3]:mt-5 [&_h3]:font-headline [&_h3]:text-lg [&_h3]:uppercase [&_hr]:border-border/30 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_pre]:overflow-x-auto [&_pre]:bg-popover [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6"
                  dangerouslySetInnerHTML={{ __html: update.contentHtml }}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </main>
  )
}

function formatDate(rawDate: string, locale: "en" | "es"): string | null {
  if (!rawDate) {
    return null
  }

  const value = new Date(rawDate)

  if (Number.isNaN(value.getTime())) {
    return rawDate
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-ES" : "en-US", {
    dateStyle: "long",
  }).format(value)
}
