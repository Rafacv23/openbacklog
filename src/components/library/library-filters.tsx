"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

import type { LibraryState } from "@/server/library/states"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

const SEARCH_DEBOUNCE_MS = 450

type LibraryViewMode = "rows" | "grid"

type LibraryFiltersProps = {
  filters: {
    allStates: string
    autoApplyHint: string
    clearSearchAriaLabel: string
    gridView: string
    rowView: string
    searchLabel: string
    searchPlaceholder: string
    sortLabel: string
    stateLabel: string
    viewToggleLabel: string
  }
  sortLabels: {
    releaseDesc: string
    ratingDesc: string
    updatedDesc: string
  }
  stateLabels: Record<LibraryState, string>
  values: {
    search: string
    sort: string
    state: string
    view: LibraryViewMode
  }
}

function getNormalizedSearch(value: string) {
  return value.trim()
}

export function LibraryFilters({
  filters,
  sortLabels,
  stateLabels,
  values,
}: LibraryFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(values.search)

  const updateQueryParams = useCallback(
    (updates: Partial<Record<"page" | "search" | "sort" | "state" | "view", string | null>>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, rawValue]) => {
        const value = typeof rawValue === "string" ? rawValue.trim() : rawValue

        if (!value) {
          params.delete(key)
          return
        }

        if (key === "sort" && value === "updated_desc") {
          params.delete(key)
          return
        }

        if (key === "view" && value === "rows") {
          params.delete(key)
          return
        }

        params.set(key, value)
      })

      params.delete("page")

      const nextQuery = params.toString()
      const currentQuery = searchParams.toString()

      if (nextQuery === currentQuery) {
        return
      }

      startTransition(() => {
        router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, {
          scroll: false,
        })
      })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    const normalizedSearch = getNormalizedSearch(searchValue)

    if (normalizedSearch === getNormalizedSearch(values.search)) {
      return
    }

    const timeoutId = setTimeout(() => {
      updateQueryParams({
        search: normalizedSearch,
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [searchValue, updateQueryParams, values.search])

  function handleStateChange(nextState: string) {
    updateQueryParams({ state: nextState })
  }

  function handleSortChange(nextSort: string) {
    updateQueryParams({ sort: nextSort })
  }

  function handleViewChange(checked: boolean) {
    updateQueryParams({ view: checked ? "grid" : "rows" })
  }

  return (
    <section aria-busy={isPending} className="rounded-xl border border-border/70 bg-card/70 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
        <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-1">
          <label className="text-xs font-medium tracking-[0.06em] uppercase" htmlFor="library-search-input">
            {filters.searchLabel}
          </label>
          <div className="relative">
            <Input
              autoComplete="off"
              className="h-10 pr-10"
              id="library-search-input"
              name="search"
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={filters.searchPlaceholder}
              type="search"
              value={searchValue}
            />

            {searchValue.length > 0 ? (
              <Button
                aria-label={filters.clearSearchAriaLabel}
                className="absolute top-1/2 right-1.5 -translate-y-1/2"
                onClick={() => setSearchValue("")}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{filters.autoApplyHint}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium tracking-[0.06em] uppercase" htmlFor="library-state-filter">
            {filters.stateLabel}
          </label>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            id="library-state-filter"
            name="state"
            onChange={(event) => handleStateChange(event.target.value)}
            value={values.state}
          >
            <option value="">{filters.allStates}</option>
            {Object.entries(stateLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium tracking-[0.06em] uppercase" htmlFor="library-sort-filter">
            {filters.sortLabel}
          </label>
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            id="library-sort-filter"
            name="sort"
            onChange={(event) => handleSortChange(event.target.value)}
            value={values.sort}
          >
            <option value="updated_desc">{sortLabels.updatedDesc}</option>
            <option value="release_desc">{sortLabels.releaseDesc}</option>
            <option value="rating_desc">{sortLabels.ratingDesc}</option>
          </select>
        </div>

        <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-2 xl:self-end">
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-medium tracking-[0.06em] uppercase">{filters.viewToggleLabel}</span>
            <span className="text-xs text-muted-foreground">
              {values.view === "grid" ? filters.gridView : filters.rowView}
            </span>
          </span>
          <Switch checked={values.view === "grid"} onCheckedChange={handleViewChange} />
        </label>
      </div>
    </section>
  )
}
