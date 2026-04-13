import type { Metadata } from "next"

import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { AppHeader } from "@/components/app/app-header"
import { GameCard, type GameCardData } from "@/components/app/game-card"
import { getDictionary } from "@/lib/i18n"
import { REQUEST_LOCALE_HEADER, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const GAMES_PER_FEED_SECTION = 3
const POPULAR_GAME_QUERIES = ["Elden Ring", "Fortnite", "Minecraft"]
const UPCOMING_GAME_QUERIES = ["Grand Theft Auto VI", "Death Stranding 2", "Fable"]

type GamesSearchApiResponse = {
  status: string
  data?: GameCardData[]
}

async function getRequestLocale() {
  const requestHeaders = await headers()
  return toSupportedLocale(requestHeaders.get(REQUEST_LOCALE_HEADER) ?? "") ?? "en"
}

async function fetchGamesByQuery({
  cookieHeader,
  forwardedFor,
  limit = GAMES_PER_FEED_SECTION,
  query,
  realIp,
}: {
  cookieHeader: string
  forwardedFor: string
  limit?: number
  query: string
  realIp: string
}): Promise<GameCardData[]> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
  })

  const response = await fetch(`${BASE_URL}/api/games/search?${params.toString()}`, {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
      ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    },
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as GamesSearchApiResponse

  if (payload.status !== "ok" || !Array.isArray(payload.data)) {
    return []
  }

  return payload.data
}

async function fetchGamesByQueries({
  cookieHeader,
  forwardedFor,
  limitPerQuery = 1,
  maxResults = GAMES_PER_FEED_SECTION,
  queries,
  realIp,
}: {
  cookieHeader: string
  forwardedFor: string
  limitPerQuery?: number
  maxResults?: number
  queries: string[]
  realIp: string
}): Promise<GameCardData[]> {
  const resultsPerQuery = await Promise.all(
    queries.map((query) =>
      fetchGamesByQuery({
        cookieHeader,
        forwardedFor,
        query,
        limit: limitPerQuery,
        realIp,
      }),
    ),
  )

  const uniqueGames: GameCardData[] = []
  const seenGameIds = new Set<number>()

  for (const game of resultsPerQuery.flat()) {
    if (seenGameIds.has(game.igdbId)) {
      continue
    }

    seenGameIds.add(game.igdbId)
    uniqueGames.push(game)

    if (uniqueGames.length >= maxResults) {
      break
    }
  }

  return uniqueGames
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const canonicalPath = `/${locale}/feed`

  return {
    title: dictionary.app.metaTitle,
    description: dictionary.app.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/en/feed",
        es: "/es/feed",
        "x-default": "/en/feed",
      },
    },
    openGraph: {
      title: dictionary.app.metaTitle,
      description: dictionary.app.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.app.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.app.metaTitle,
      description: dictionary.app.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function AppEntryPage() {
  const locale = await getRequestLocale()
  const session = await getAuthSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const username = getSessionUsername(session)

  if (!username) {
    redirect(`/${locale}/onboarding/username`)
  }

  const dictionary = getDictionary(locale)
  const requestHeaders = await headers()
  const cookieHeader = requestHeaders.get("cookie") ?? ""
  const forwardedFor = requestHeaders.get("x-forwarded-for") ?? ""
  const realIp = requestHeaders.get("x-real-ip") ?? ""
  const recommendationQueries = dictionary.app.recommendations.items.map((item) => item.title)
  const profileHref = `/${locale}/profile/${encodeURIComponent(username)}`
  const [popularGames, recommendationGames, upcomingGames] = await Promise.all([
    fetchGamesByQueries({
      cookieHeader,
      forwardedFor,
      queries: POPULAR_GAME_QUERIES,
      realIp,
    }),
    fetchGamesByQueries({
      cookieHeader,
      forwardedFor,
      queries: recommendationQueries,
      realIp,
    }),
    fetchGamesByQueries({
      cookieHeader,
      forwardedFor,
      queries: UPCOMING_GAME_QUERIES,
      realIp,
    }),
  ])

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader
        dictionary={dictionary.app.header}
        locale={locale}
        profileHref={profileHref}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:py-10">
        <section className="space-y-5">
          <div className="space-y-2">
            <h1 className="font-display text-4xl italic text-primary md:text-5xl">
              {dictionary.app.hero.title}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              {dictionary.app.hero.description}
            </p>
          </div>
        </section>

        <section id="popular-games" className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">Popular games</h2>
            <p className="text-sm text-muted-foreground">
              What other players are adding to their backlogs and playing the
              most.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {popularGames.map((game) => (
              <GameCard copy={dictionary.search} game={game} key={game.igdbId} locale={locale} />
            ))}
          </div>

          {popularGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dictionary.search.emptyBody}</p>
          ) : null}
        </section>

        <section id="recommendations" className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.app.recommendations.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.app.recommendations.description}
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {recommendationGames.map((game) => (
              <GameCard copy={dictionary.search} game={game} key={game.igdbId} locale={locale} />
            ))}
          </div>

          {recommendationGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dictionary.search.emptyBody}</p>
          ) : null}
        </section>

        <section id="upcoming-games" className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">Upcoming games</h2>
            <p className="text-sm text-muted-foreground">
              Games that are coming out soon and are being added to players
              backlogs.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {upcomingGames.map((game) => (
              <GameCard copy={dictionary.search} game={game} key={game.igdbId} locale={locale} />
            ))}
          </div>

          {upcomingGames.length === 0 ? (
            <p className="text-sm text-muted-foreground">{dictionary.search.emptyBody}</p>
          ) : null}
        </section>

        <section id="feed" className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.app.feed.title}
            </h2>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {dictionary.app.feed.description}
              </p>
              <Link
                href={`/${locale}/friends`}
                title="Friends activity"
                className="flex gap-2 items-center hover:text-primary transition-colors"
              >
                Watch more
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>

          <div className="space-y-3">
            {dictionary.app.feed.items.map((item) => (
              <article
                key={`${item.friend}-${item.timeAgo}-${item.action}`}
                className="rounded-md border border-border/60 bg-card/70 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-headline text-sm uppercase text-foreground">
                    {item.friend}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.timeAgo}
                  </p>
                </div>
                <p className="mt-2 text-sm text-foreground">{item.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
