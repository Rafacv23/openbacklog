import type { Metadata } from "next"

import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { GameCard, type GameCardData } from "@/components/app/game-card"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { REQUEST_LOCALE_HEADER, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { getFriendFeedActivity } from "@/server/friends/get-feed-activity"

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const GAMES_PER_FEED_SECTION = 3
const POPULAR_GAME_QUERIES = ["Elden Ring", "Fortnite", "Minecraft"]
const UPCOMING_GAME_QUERIES = ["Grand Theft Auto VI", "Death Stranding 2", "Fable"]

type GamesSearchApiResponse = {
  status: string
  data?: GameCardData[]
}

type FeedCopy = {
  justNow: string
  actions: {
    libraryUpdated: string
    reviewRecommended: string
    reviewNotRecommended: string
  }
  details: {
    libraryUpdated: string
    reviewPublished: string
  }
}

async function getRequestLocale() {
  const requestHeaders = await headers()
  return toSupportedLocale(requestHeaders.get(REQUEST_LOCALE_HEADER) ?? "") ?? "en"
}

function interpolateTemplate(template: string, values: Record<string, string>): string {
  let output = template

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, value)
  }

  return output
}

function formatRelativeTime(input: {
  locale: string
  isoDate: string
  justNowLabel: string
}): string {
  const eventTime = new Date(input.isoDate).getTime()

  if (!Number.isFinite(eventTime)) {
    return input.justNowLabel
  }

  const diffSeconds = Math.round((eventTime - Date.now()) / 1_000)
  const absSeconds = Math.abs(diffSeconds)

  if (absSeconds < 45) {
    return input.justNowLabel
  }

  const rtf = new Intl.RelativeTimeFormat(input.locale, {
    numeric: "auto",
  })

  if (absSeconds < 3_600) {
    return rtf.format(Math.round(diffSeconds / 60), "minute")
  }

  if (absSeconds < 86_400) {
    return rtf.format(Math.round(diffSeconds / 3_600), "hour")
  }

  if (absSeconds < 2_592_000) {
    return rtf.format(Math.round(diffSeconds / 86_400), "day")
  }

  return rtf.format(Math.round(diffSeconds / 2_592_000), "month")
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
  const friendFeedItems = getFriendFeedActivity({
    userId: session.user.id,
    limit: 12,
  })

  const [popularGames, recommendationGames, upcomingGames, feedItems] = await Promise.all([
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
    friendFeedItems,
  ])

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader
        dictionary={dictionary.app.header}
        locale={locale}
        profileHref={profileHref}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-10">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <p className="text-sm text-muted-foreground">
                What other players are adding to their backlogs and playing the
                most.
              </p>
              <Link
                href={`/${locale}/popular`}
                title="Popular games"
                className="inline-flex items-center gap-2 self-start text-sm transition-colors hover:text-primary sm:self-auto"
              >
                Watch more
                <ArrowUpRight size={16} />
              </Link>
            </div>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <p className="text-sm text-muted-foreground">
                {dictionary.app.recommendations.description}
              </p>
              <Link
                href={`/${locale}/popular`}
                title="Game recommendations"
                className="inline-flex items-center gap-2 self-start text-sm transition-colors hover:text-primary sm:self-auto"
              >
                Watch more
                <ArrowUpRight size={16} />
              </Link>
            </div>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <p className="text-sm text-muted-foreground">
                Games that are coming out soon and are being added to players
                backlogs.
              </p>
              <Link
                href={`/${locale}/upcoming`}
                title="Upcoming games"
                className="inline-flex items-center gap-2 self-start text-sm transition-colors hover:text-primary sm:self-auto"
              >
                Watch more
                <ArrowUpRight size={16} />
              </Link>
            </div>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <p className="text-sm text-muted-foreground">
                {dictionary.app.feed.description}
              </p>
              <Link
                href={`/${locale}/friends`}
                title="Friends activity"
                className="inline-flex items-center gap-2 self-start text-sm transition-colors hover:text-primary sm:self-auto"
              >
                Watch more
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>

          {feedItems.length === 0 ? (
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="space-y-2 p-6">
                <h3 className="font-headline text-xl uppercase">{dictionary.app.feed.emptyTitle}</h3>
                <p className="text-sm text-muted-foreground">{dictionary.app.feed.emptyDescription}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {feedItems.map((item) => {
                const feedCopy = dictionary.app.feed as FeedCopy
                const action =
                  item.kind === "library_update"
                    ? interpolateTemplate(feedCopy.actions.libraryUpdated, {
                        game: item.game.name,
                        state: dictionary.library.states[item.state],
                      })
                    : item.recommend === "recommend"
                      ? interpolateTemplate(feedCopy.actions.reviewRecommended, {
                          game: item.game.name,
                        })
                      : interpolateTemplate(feedCopy.actions.reviewNotRecommended, {
                          game: item.game.name,
                        })

                const detail =
                  item.kind === "library_update"
                    ? feedCopy.details.libraryUpdated
                    : feedCopy.details.reviewPublished

                const itemTime = formatRelativeTime({
                  locale,
                  isoDate: item.updatedAt,
                  justNowLabel: feedCopy.justNow,
                })

                return (
                  <article
                    key={item.id}
                    className="rounded-md border border-border/60 bg-card/70 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        className="font-headline text-sm uppercase text-foreground hover:text-primary"
                        href={`/${locale}/profile/${encodeURIComponent(item.actor.username)}`}
                      >
                        {item.actor.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {itemTime}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-foreground">{action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                    <Link
                      className="mt-2 inline-flex text-xs text-primary underline-offset-4 hover:underline"
                      href={`/${locale}/game/${item.game.igdbId}`}
                    >
                      {item.game.name}
                    </Link>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <AppFooter dictionary={dictionary.app.footer} locale={locale} profileHref={profileHref} />
    </main>
  )
}
