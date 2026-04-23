import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { getFriendsWithGame } from "@/server/friends/get-friends-with-game"
import { getGameByIgdbId } from "@/server/games/get-game-by-id"
import { getUserLibraryEntryForGame } from "@/server/library/service"
import {
  getRecentReviewsForGame,
  getUserReviewForGame,
} from "@/server/reviews/service"

import { GameLibraryReviewPanel } from "@/components/game/game-library-review-panel"
import { GameShareButton } from "@/components/game/game-share-button"
import { GameUserReviewsList } from "@/components/game/game-user-reviews-list"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type GamePageProps = {
  params: Promise<{ locale: string; id: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

function parseGameId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) {
    return null
  }

  const parsedId = Number(rawId)

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null
  }

  return parsedId
}

function formatHoursFromSeconds(seconds: number | null, fallback: string): string {
  if (!Number.isFinite(seconds) || !seconds || seconds < 1) {
    return fallback
  }

  const hours = seconds / 3600

  if (hours >= 10) {
    return `${Math.round(hours)}h`
  }

  return `${hours.toFixed(1)}h`
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)
  const parsedId = parseGameId(rawId)
  const game = parsedId ? await getGameByIgdbId(parsedId) : null

  const title = game?.name
    ? `${game.name} | OpenBacklog`
    : dictionary.gameDetail.metaFallbackTitle
  const description =
    game?.summary ?? dictionary.gameDetail.metaDescriptionFallback
  const imageUrl = game?.coverUrl ?? DEFAULT_SOCIAL_IMAGE_URL

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/${locale}/game/${rawId}`,
      languages: {
        en: `/en/game/${rawId}`,
        es: `/es/game/${rawId}`,
        "x-default": `/en/game/${rawId}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/game/${rawId}`,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: game?.name ?? dictionary.gameDetail.metaFallbackTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { locale: rawLocale, id: rawId } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const session = await getAuthSession()
  const sessionUserId = typeof session?.user.id === "string" ? session.user.id : null
  const sessionUsername = getSessionUsername(session)

  const gameId = parseGameId(rawId)

  if (!gameId) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const profileHref = sessionUsername
    ? `/${locale}/profile/${encodeURIComponent(sessionUsername)}`
    : `/${locale}/login`
  const game = await getGameByIgdbId(gameId)

  if (!game) {
    notFound()
  }

  const [libraryEntry, userReview, recentReviews, friendsWithGame] = await Promise.all([
    sessionUserId
      ? getUserLibraryEntryForGame({
          userId: sessionUserId,
          gameIgdbId: game.igdbId,
        })
      : Promise.resolve(null),
    sessionUserId
      ? getUserReviewForGame({
          userId: sessionUserId,
          gameIgdbId: game.igdbId,
        })
      : Promise.resolve(null),
    getRecentReviewsForGame({
      gameIgdbId: game.igdbId,
      limit: 12,
    }),
    sessionUserId
      ? getFriendsWithGame({
          userId: sessionUserId,
          gameIgdbId: game.igdbId,
          limit: 8,
        })
      : Promise.resolve([]),
  ])

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const releaseDate = game.firstReleaseDate
    ? dateFormatter.format(new Date(game.firstReleaseDate))
    : dictionary.gameDetail.unknownValue
  const lastSyncedDate = dateTimeFormatter.format(new Date(game.lastSyncedAt))
  const mainTimeToBeat = formatHoursFromSeconds(
    game.timeToBeatMainSeconds,
    dictionary.gameDetail.unknownValue,
  )
  const completionistTimeToBeat = formatHoursFromSeconds(
    game.timeToBeatCompletionistSeconds,
    dictionary.gameDetail.unknownValue,
  )

  const gameUrl = `${BASE_URL}/${locale}/game/${game.igdbId}`

  const gameJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    url: gameUrl,
    description: game.summary ?? dictionary.gameDetail.metaDescriptionFallback,
    image: game.coverUrl ?? DEFAULT_SOCIAL_IMAGE_URL,
    inLanguage: locale,
    genre: game.genres,
    gamePlatform: game.platforms,
    datePublished: game.firstReleaseDate ?? undefined,
  }

  if (typeof game.rating === "number") {
    gameJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(game.rating.toFixed(1)),
      bestRating: 100,
      worstRating: 0,
      ratingCount: 1,
    }
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(gameJsonLd),
        }}
      />
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-muted/40 blur-[110px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-wrap items-center gap-3">
          <GameShareButton
            labels={{
              share: dictionary.gameDetail.sharePage,
              shared: dictionary.gameDetail.sharedPage,
            }}
            text={dictionary.gameDetail.shareText.replace("{game}", game.name)}
            title={game.name}
            url={gameUrl}
          />
        </div>

        <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <Card className="h-fit border border-border/60 bg-card/80 py-0">
            <CardContent className="p-4">
              <div
                aria-hidden="true"
                className="aspect-[3/4] w-full rounded-md border border-border/60 bg-muted bg-cover bg-center"
                style={
                  game.coverUrl
                    ? {
                        backgroundImage: `url(${game.coverUrl})`,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-none border-primary/40 bg-card px-2 py-0.5 font-body text-[10px] tracking-[0.1em] text-primary uppercase"
                >
                  {dictionary.gameDetail.heroBadge}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {dictionary.gameDetail.idLabel} {game.igdbId}
                </span>
                <span className="text-xs text-muted-foreground">/{game.slug}</span>
              </div>

              <h1 className="font-display text-4xl italic text-primary md:text-5xl">
                {game.name}
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {game.summary ?? dictionary.gameDetail.noSummary}
              </p>

              {friendsWithGame.length > 0 ? (
                <div className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                    {dictionary.gameDetail.friendsOwnThis}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {friendsWithGame.map((friend) => (
                      <Badge
                        key={friend.userId}
                        variant="outline"
                        className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase"
                      >
                        @{friend.username}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </header>

            <Card className="border border-border/60 bg-card/80 py-0">
              <CardContent className="grid gap-3 p-4 text-sm sm:grid-cols-2">
                <p className="text-muted-foreground">
                  {dictionary.gameDetail.firstReleaseDateLabel}:{" "}
                  <span className="text-foreground">{releaseDate}</span>
                </p>
                <p className="text-muted-foreground">
                  {dictionary.gameDetail.ratingLabel}:{" "}
                  <span className="text-foreground">
                    {typeof game.rating === "number"
                      ? game.rating.toFixed(1)
                      : dictionary.gameDetail.unknownValue}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {dictionary.gameDetail.platformsLabel}:{" "}
                  <span className="text-foreground">
                    {game.platforms.join(", ") || dictionary.gameDetail.unknownValue}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {dictionary.gameDetail.genresLabel}:{" "}
                  <span className="text-foreground">
                    {game.genres.join(", ") || dictionary.gameDetail.unknownValue}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  {dictionary.gameDetail.estimatedMainLabel}:{" "}
                  <span className="text-foreground">{mainTimeToBeat}</span>
                </p>
                <p className="text-muted-foreground">
                  {dictionary.gameDetail.estimatedCompletionistLabel}:{" "}
                  <span className="text-foreground">{completionistTimeToBeat}</span>
                </p>
                <p className="text-muted-foreground sm:col-span-2">
                  {dictionary.gameDetail.lastSyncedLabel}:{" "}
                  <span className="text-foreground">{lastSyncedDate}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {sessionUserId ? (
          <GameLibraryReviewPanel
            copy={dictionary.gameDetail}
            game={{
              igdbId: game.igdbId,
              platforms: game.platforms,
            }}
            initialLibraryState={libraryEntry?.state ?? null}
            initialReview={
              userReview
                ? {
                    body: userReview.body,
                    containsSpoilers: userReview.containsSpoilers,
                    recommend: userReview.recommend,
                    platformPlayed: userReview.platformPlayed,
                    hoursToComplete: userReview.hoursToComplete,
                  }
                : null
            }
          />
        ) : null}

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.gameDetail.similarGamesTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.gameDetail.similarGamesDescription}
            </p>
          </div>

          {game.similarGames.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {game.similarGames.map((similarGame) => {
                const similarRelease = similarGame.firstReleaseDate
                  ? dateFormatter.format(new Date(similarGame.firstReleaseDate))
                  : dictionary.gameDetail.unknownValue

                return (
                  <Link
                    key={similarGame.igdbId}
                    className="block h-full"
                    href={`/${locale}/game/${similarGame.igdbId}`}
                  >
                    <Card className="h-full border border-border/60 bg-card/80 py-0 transition-colors hover:border-primary/60">
                      <CardContent className="flex h-full flex-col gap-3 p-4">
                        <div className="flex items-start gap-3">
                          <div
                            aria-hidden="true"
                            className="h-20 w-14 shrink-0 rounded-md border border-border/60 bg-muted bg-cover bg-center"
                            style={
                              similarGame.coverUrl
                                ? { backgroundImage: `url(${similarGame.coverUrl})` }
                                : undefined
                            }
                          />
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="truncate text-sm font-semibold">{similarGame.name}</p>
                            <p className="text-xs text-muted-foreground">/{similarGame.slug}</p>
                            <p className="text-xs text-muted-foreground">
                              {dictionary.gameDetail.firstReleaseDateLabel}: {similarRelease}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dictionary.gameDetail.ratingLabel}:{" "}
                              {typeof similarGame.rating === "number"
                                ? similarGame.rating.toFixed(1)
                                : dictionary.gameDetail.unknownValue}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <Card className="border border-border/60 bg-card/80 py-0">
              <CardContent className="p-4 text-sm text-muted-foreground">
                {dictionary.gameDetail.noSimilarGames}
              </CardContent>
            </Card>
          )}
        </section>

        <GameUserReviewsList
          copy={{
            title: dictionary.gameDetail.userReviewsTitle,
            description: dictionary.gameDetail.userReviewsDescription,
            noReviews: dictionary.gameDetail.noUserReviews,
            recommend: dictionary.gameDetail.labels.recommend,
            notRecommend: dictionary.gameDetail.labels.notRecommend,
            hoursLabel: dictionary.reviewPage.hoursLabel,
            platformLabel: dictionary.gameDetail.labels.platform,
            updatedLabel: dictionary.reviewPage.updatedLabel,
            revealSpoiler: dictionary.gameDetail.revealSpoiler,
            spoilerHidden: dictionary.gameDetail.spoilerLabel,
            openReview: dictionary.gameDetail.openReview,
          }}
          locale={locale}
          reviews={recentReviews}
        />
      </div>

      <AppFooter
        dictionary={dictionary.app.footer}
        locale={locale}
        profileHref={sessionUsername ? profileHref : null}
      />
    </main>
  )
}
