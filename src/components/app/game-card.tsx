"use client"

import Link from "next/link"

import type { SupportedLocale } from "@/lib/locales"
import { Card, CardContent } from "@/components/ui/card"

export type GameCardData = {
  coverUrl: string | null
  firstReleaseDate: string | null
  genres: string[]
  igdbId: number
  name: string
  platforms: string[]
  rating: number | null
  slug: string
  summary: string | null
}

export type GameCardCopy = {
  firstReleaseDateLabel: string
  genresLabel: string
  noGenres: string
  noPlatforms: string
  noReleaseDate: string
  noSummary: string
  platformsLabel: string
  ratingLabel: string
  viewDetails: string
  viewDetailsAriaLabel: string
}

type GameCardProps = {
  copy: GameCardCopy
  game: GameCardData
  locale: SupportedLocale
}

export function GameCard({ copy, game, locale }: GameCardProps) {
  const releaseDate = game.firstReleaseDate
    ? new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(game.firstReleaseDate))
    : copy.noReleaseDate

  return (
    <Link
      aria-label={`${copy.viewDetailsAriaLabel}: ${game.name}`}
      className="block h-full"
      href={`/${locale}/game/${game.igdbId}`}
    >
      <Card className="h-full border border-border/60 bg-card/90 py-0 transition-all hover:border-primary/60 hover:bg-card">
        <CardContent className="flex h-full min-h-[20rem] flex-col p-4 sm:min-h-[18.5rem]">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className="h-28 w-[4.6rem] shrink-0 rounded-md border border-border/60 bg-muted bg-cover bg-center sm:h-24 sm:w-16"
                style={
                  game.coverUrl
                    ? {
                        backgroundImage: `url(${game.coverUrl})`,
                      }
                    : undefined
                }
              />

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="line-clamp-2 text-base font-semibold">
                  {game.name}
                </h3>
                <p className="text-xs text-muted-foreground">/{game.slug}</p>
                <p className="text-xs text-muted-foreground">
                  {copy.firstReleaseDateLabel}: {releaseDate}
                </p>
                <p className="text-xs text-muted-foreground">
                  {copy.ratingLabel}:{" "}
                  {game.rating ? game.rating.toFixed(1) : "-"}
                </p>
              </div>
            </div>

            <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
              {game.summary ?? copy.noSummary}
            </p>
          </div>

          <div className="mt-auto space-y-3">
            <div className="space-y-1 text-xs text-muted-foreground">
              <p className="line-clamp-1">
                {copy.platformsLabel}:{" "}
                {game.platforms.join(", ") || copy.noPlatforms}
              </p>
              <p className="line-clamp-1">
                {copy.genresLabel}: {game.genres.join(", ") || copy.noGenres}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function GameCardSkeleton() {
  return (
    <Card
      aria-hidden="true"
      className="border border-border/60 bg-card/90 py-0"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="h-24 w-16 shrink-0 animate-pulse rounded-md border border-border/60 bg-muted" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}
