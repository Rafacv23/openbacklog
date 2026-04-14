import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { GameCard } from "@/components/app/game-card"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { getUpcomingReleases } from "@/server/games/get-upcoming-releases"

type UpcomingPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const MAX_UPCOMING_RESULTS = 9

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: UpcomingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.app.upcoming.metaTitle,
    description: dictionary.app.upcoming.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/upcoming`,
      languages: {
        en: "/en/upcoming",
        es: "/es/upcoming",
        "x-default": "/en/upcoming",
      },
    },
    openGraph: {
      title: dictionary.app.upcoming.metaTitle,
      description: dictionary.app.upcoming.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/upcoming`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.app.upcoming.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.app.upcoming.metaTitle,
      description: dictionary.app.upcoming.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function UpcomingPage({ params }: UpcomingPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const session = await getAuthSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const username = getSessionUsername(session)

  if (!username) {
    redirect(`/${locale}/onboarding/username`)
  }

  const dictionary = getDictionary(locale)
  const profileHref = `/${locale}/profile/${encodeURIComponent(username)}`
  const now = new Date()
  const { generalReleases, monthReleases, weekReleases } = await getUpcomingReleases({
    limit: MAX_UPCOMING_RESULTS,
    referenceDate: now,
  })
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(now)
  const sections = [
    {
      id: "week",
      title: dictionary.app.upcoming.weekLabel,
      description: dictionary.app.upcoming.weekHint,
      games: weekReleases,
    },
    {
      id: "month",
      title: dictionary.app.upcoming.monthLabel.replace("{month}", monthLabel),
      description: dictionary.app.upcoming.monthHint,
      games: monthReleases,
    },
    {
      id: "general",
      title: dictionary.app.upcoming.generalLabel,
      description: dictionary.app.upcoming.generalHint,
      games: generalReleases,
    },
  ] as const
  const hasAnyReleases = sections.some((section) => section.games.length > 0)

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:py-10">
        <header className="space-y-2">
          <h1 className="font-display text-4xl italic text-primary md:text-5xl">
            {dictionary.app.upcoming.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {dictionary.app.upcoming.description}
          </p>
        </header>

        {hasAnyReleases ? (
          <div className="space-y-8">
            {sections.map((section) => (
              <section className="space-y-4" key={section.id}>
                <header className="space-y-1">
                  <h2 className="font-headline text-2xl uppercase">{section.title}</h2>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </header>

                {section.games.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {section.games.map((game) => (
                      <GameCard
                        copy={dictionary.search}
                        game={game}
                        key={`${section.id}-${game.igdbId}`}
                        locale={locale}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border border-border/60 bg-card/70 py-0">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground">
                        {dictionary.app.upcoming.sectionEmpty}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </section>
            ))}
          </div>
        ) : (
          <section>
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="space-y-2 p-6">
                <h2 className="font-headline text-xl uppercase">
                  {dictionary.app.upcoming.emptyTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dictionary.app.upcoming.emptyBody}
                </p>
                <Link
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  href={`/${locale}/search`}
                >
                  {dictionary.app.upcoming.emptyCta}
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      <AppFooter dictionary={dictionary.app.footer} locale={locale} profileHref={profileHref} />
    </main>
  )
}
