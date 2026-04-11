"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import Link from "next/link"

import type { SupportedLocale } from "@/lib/locales"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type SearchCopy = {
  cooldown: string
  clearSearchAriaLabel: string
  emptyBody: string
  emptyTitle: string
  errorGeneric: string
  errorRateLimited: string
  errorUnauthorized: string
  firstReleaseDateLabel: string
  genresLabel: string
  inputLabel: string
  inputPlaceholder: string
  loading: string
  minQuery: string
  noGenres: string
  noPlatforms: string
  noReleaseDate: string
  noSummary: string
  platformsLabel: string
  ratingLabel: string
  resultsLabel: string
  viewDetails: string
  viewDetailsAriaLabel: string
}

type SearchGameResult = {
  coverUrl: string | null
  firstReleaseDate: string | null
  genres: string[]
  igdbId: number
  lastSyncedAt: string
  name: string
  platforms: string[]
  rating: number | null
  slug: string
  summary: string | null
}

type SearchResponse = {
  status: string
  data?: SearchGameResult[]
}

type GameSearchClientProps = {
  dictionary: SearchCopy
  locale: SupportedLocale
}

const SEARCH_COOLDOWN_MS = 450
const SKELETON_CARD_COUNT = 6

function GameSearchCardSkeleton() {
  return (
    <Card aria-hidden="true" className="border border-border/60 bg-card/90 py-0">
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

export function GameSearchClient({ dictionary, locale }: GameSearchClientProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<SearchGameResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale],
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, SEARCH_COOLDOWN_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([])
      setIsLoading(false)
      setErrorMessage(null)
      return
    }

    const controller = new AbortController()

    async function runSearch() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const params = new URLSearchParams({
          query: debouncedQuery,
          limit: "12",
        })

        const response = await fetch(`/api/games/search?${params.toString()}`, {
          signal: controller.signal,
        })

        if (response.status === 401) {
          setErrorMessage(dictionary.errorUnauthorized)
          setResults([])
          return
        }

        if (response.status === 429) {
          setErrorMessage(dictionary.errorRateLimited)
          setResults([])
          return
        }

        if (!response.ok) {
          setErrorMessage(dictionary.errorGeneric)
          setResults([])
          return
        }

        const payload = (await response.json()) as SearchResponse

        if (payload.status !== "ok" || !Array.isArray(payload.data)) {
          setErrorMessage(dictionary.errorGeneric)
          setResults([])
          return
        }

        setResults(payload.data)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }

        setErrorMessage(dictionary.errorGeneric)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    void runSearch()

    return () => {
      controller.abort()
    }
  }, [debouncedQuery, dictionary.errorGeneric, dictionary.errorRateLimited, dictionary.errorUnauthorized])

  const hasMinQueryLength = query.trim().length >= 2

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="game-search-input">
          {dictionary.inputLabel}
        </label>
        <div className="relative">
          <Input
            autoComplete="off"
            className="ob-search-input h-11 pr-10"
            id="game-search-input"
            name="query"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={dictionary.inputPlaceholder}
            type="search"
            value={query}
          />

          {query.length > 0 ? (
            <button
              aria-label={dictionary.clearSearchAriaLabel}
              className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              onClick={() => setQuery("")}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{dictionary.cooldown}</p>
      </div>

      {!hasMinQueryLength ? (
        <p className="text-sm text-muted-foreground">{dictionary.minQuery}</p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{dictionary.loading}</p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
              <GameSearchCardSkeleton key={`game-search-skeleton-${index}`} />
            ))}
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      {!isLoading && !errorMessage && hasMinQueryLength && results.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-5">
          <h2 className="text-base font-semibold">{dictionary.emptyTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{dictionary.emptyBody}</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {results.length} {dictionary.resultsLabel}
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {results.map((game) => {
              const releaseDate = game.firstReleaseDate
                ? formatter.format(new Date(game.firstReleaseDate))
                : dictionary.noReleaseDate

              return (
                <Link
                  aria-label={`${dictionary.viewDetailsAriaLabel}: ${game.name}`}
                  href={`/${locale}/game/${game.igdbId}`}
                  key={game.igdbId}
                >
                  <Card className="border border-border/60 bg-card/90 py-0 transition-all hover:border-primary/60 hover:bg-card">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start gap-3">
                        <div
                          aria-hidden="true"
                          className="h-24 w-16 shrink-0 rounded-md border border-border/60 bg-muted bg-cover bg-center"
                          style={
                            game.coverUrl
                              ? {
                                  backgroundImage: `url(${game.coverUrl})`,
                                }
                              : undefined
                          }
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="truncate text-base font-semibold">{game.name}</h3>
                          <p className="text-xs text-muted-foreground">/{game.slug}</p>
                          <p className="text-xs text-muted-foreground">
                            {dictionary.firstReleaseDateLabel}: {releaseDate}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dictionary.ratingLabel}: {game.rating ? game.rating.toFixed(1) : "-"}
                          </p>
                        </div>
                      </div>

                      <p className="line-clamp-3 text-sm text-muted-foreground">
                        {game.summary ?? dictionary.noSummary}
                      </p>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>
                          {dictionary.platformsLabel}: {game.platforms.join(", ") || dictionary.noPlatforms}
                        </p>
                        <p>
                          {dictionary.genresLabel}: {game.genres.join(", ") || dictionary.noGenres}
                        </p>
                      </div>

                      <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
                        {dictionary.viewDetails}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
