import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import { getAuthSession } from "@/server/auth/get-auth-session"
import { getGameByIgdbId } from "@/server/games/get-game-by-id"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

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
      index: false,
      follow: false,
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

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const gameId = parseGameId(rawId)

  if (!gameId) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const game = await getGameByIgdbId(gameId)

  if (!game) {
    notFound()
  }

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

  const gameJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name,
    url: `${BASE_URL}/${locale}/game/${game.igdbId}`,
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
    <main className="relative min-h-screen px-6 py-12 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(gameJsonLd),
        }}
      />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 h-80 w-80 rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute right-0 bottom-10 h-72 w-72 rounded-full bg-muted/40 blur-[110px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${locale}/search`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.gameDetail.backToSearch}
            </Button>
          </Link>

          <Link href={`/${locale}`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.gameDetail.backHome}
            </Button>
          </Link>
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

          <div className="space-y-6">
            <header className="space-y-3">
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
                <span className="text-xs text-muted-foreground">
                  /{game.slug}
                </span>
              </div>

              <h1 className="font-display text-4xl italic text-primary md:text-5xl">
                {game.name}
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {game.summary ?? dictionary.gameDetail.noSummary}
              </p>
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
                <p className="text-muted-foreground sm:col-span-2">
                  {dictionary.gameDetail.lastSyncedLabel}:{" "}
                  <span className="text-foreground">{lastSyncedDate}</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-xl uppercase">
              {dictionary.gameDetail.actionsTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.gameDetail.actionsDescription}
            </p>
          </header>

          <Card className="border border-border/60 bg-card/80 py-0">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
              <Button type="button" variant="outline">
                {dictionary.gameDetail.actions.wishlist}
              </Button>
              <Button type="button" variant="outline">
                {dictionary.gameDetail.actions.backlog}
              </Button>
              <Button type="button" variant="outline">
                {dictionary.gameDetail.actions.completed}
              </Button>
              <Button type="button" variant="outline">
                {dictionary.gameDetail.actions.recommend}
              </Button>
              <Button type="button" variant="outline">
                {dictionary.gameDetail.actions.notRecommend}
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-xl uppercase">
              {dictionary.gameDetail.commentsTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.gameDetail.commentsDescription}
            </p>
          </header>

          <Card className="border border-border/60 bg-card/80 py-0">
            <CardContent className="space-y-3 p-4">
              <label className="text-sm font-medium" htmlFor="game-comment-input">
                {dictionary.gameDetail.commentsInputLabel}
              </label>
              <Textarea
                className="min-h-24"
                id="game-comment-input"
                placeholder={dictionary.gameDetail.commentsInputPlaceholder}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {dictionary.gameDetail.commentsComingSoon}
                </p>
                <Button type="button">{dictionary.gameDetail.commentsSubmit}</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {dictionary.gameDetail.commentsListTitle}
            </p>

            {dictionary.gameDetail.commentsList.map((comment) => (
              <Card
                key={`${comment.author}-${comment.timeAgo}-${comment.body}`}
                className="border border-border/60 bg-card/80 py-0"
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{comment.author}</p>
                    <p className="text-xs text-muted-foreground">{comment.timeAgo}</p>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {comment.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
