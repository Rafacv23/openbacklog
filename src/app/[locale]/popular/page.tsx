import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { GameCard } from "@/components/app/game-card"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { cn } from "@/lib/utils"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { getPopularCollections } from "@/server/games/get-popular-games"

type PopularPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const MAX_POPULAR_RESULTS = 9

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: PopularPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.app.popular.metaTitle,
    description: dictionary.app.popular.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/popular`,
      languages: {
        en: "/en/popular",
        es: "/es/popular",
        "x-default": "/en/popular",
      },
    },
    openGraph: {
      title: dictionary.app.popular.metaTitle,
      description: dictionary.app.popular.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/popular`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.app.popular.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.app.popular.metaTitle,
      description: dictionary.app.popular.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function PopularPage({ params }: PopularPageProps) {
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

  const userId = typeof session.user.id === "string" ? session.user.id : ""
  const dictionary = getDictionary(locale)
  const profileHref = `/${locale}/profile/${encodeURIComponent(username)}`

  const {
    mostPopularGames,
    recentlyActiveGames,
    friendsPopularGames,
    platformOptions,
    genreOptions,
  } = await getPopularCollections({
    collectionLimit: MAX_POPULAR_RESULTS,
    userId,
  })

  const sections = [
    {
      id: "global",
      title: dictionary.app.popular.sections.globalTitle,
      description: dictionary.app.popular.sections.globalDescription,
      games: mostPopularGames,
    },
    {
      id: "recent",
      title: dictionary.app.popular.sections.recentTitle,
      description: dictionary.app.popular.sections.recentDescription,
      games: recentlyActiveGames,
    },
    {
      id: "friends",
      title: dictionary.app.popular.sections.friendsTitle,
      description: dictionary.app.popular.sections.friendsDescription,
      games: friendsPopularGames,
    },
  ] as const

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:py-10">
        <header className="space-y-2">
          <h1 className="font-display text-4xl italic text-primary md:text-5xl">
            {dictionary.app.popular.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {dictionary.app.popular.description}
          </p>
        </header>

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
                      {dictionary.app.popular.sectionEmpty}
                    </p>
                  </CardContent>
                </Card>
              )}
            </section>
          ))}
        </div>

        <section className="space-y-5">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.app.popular.filters.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.app.popular.filters.description}
            </p>
          </header>

          <div className="grid gap-4 xl:grid-cols-2">
            <article className="space-y-3 rounded-lg border border-border/60 bg-card/70 p-4">
              <h3 className="font-headline text-lg uppercase">
                {dictionary.app.popular.filters.platformsTitle}
              </h3>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((option) => (
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`/${locale}/popular/platform/${option.slug}`}
                    key={`platform-${option.slug}`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </article>

            <article className="space-y-3 rounded-lg border border-border/60 bg-card/70 p-4">
              <h3 className="font-headline text-lg uppercase">
                {dictionary.app.popular.filters.genresTitle}
              </h3>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((option) => (
                  <Link
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`/${locale}/popular/genre/${option.slug}`}
                    key={`genre-${option.slug}`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>

        {sections.every((section) => section.games.length === 0) ? (
          <section>
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="space-y-2 p-6">
                <h2 className="font-headline text-xl uppercase">
                  {dictionary.app.popular.emptyTitle}
                </h2>
                <p className="text-sm text-muted-foreground">{dictionary.app.popular.emptyBody}</p>
                <Link
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  href={`/${locale}/search`}
                >
                  {dictionary.app.popular.emptyCta}
                </Link>
              </CardContent>
            </Card>
          </section>
        ) : null}
      </div>
    </main>
  )
}
