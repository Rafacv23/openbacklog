"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

import type { SupportedLocale } from "@/lib/locales"
import { GameCard, GameCardSkeleton, type GameCardCopy, type GameCardData } from "@/components/app/game-card"
import { Input } from "@/components/ui/input"

type SearchCopy = GameCardCopy & {
  cooldown: string
  clearSearchAriaLabel: string
  emptyBody: string
  emptyTitle: string
  errorGeneric: string
  errorRateLimited: string
  errorUnauthorized: string
  inputLabel: string
  inputPlaceholder: string
  loading: string
  minQuery: string
  resultsLabel: string
}

type SearchGameResult = GameCardData & {
  lastSyncedAt: string
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

export function GameSearchClient({ dictionary, locale }: GameSearchClientProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<SearchGameResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
              <GameCardSkeleton key={`game-search-skeleton-${index}`} />
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
            {results.map((game) => (
              <GameCard copy={dictionary} game={game} key={game.igdbId} locale={locale} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
