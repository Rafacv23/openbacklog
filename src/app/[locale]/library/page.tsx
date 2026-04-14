import type { Metadata } from "next"

import Link from "next/link"
import { ArrowRight, ArrowUpRight, MessageSquareText } from "lucide-react"
import { notFound, redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { LibraryEntryStateForm } from "@/components/library/library-entry-state-form"
import { LibraryFilters } from "@/components/library/library-filters"
import { LibraryStateBadge } from "@/components/library/library-state-badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { cn } from "@/lib/utils"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { isLibraryState } from "@/server/library/states"
import { getUserLibrary } from "@/server/library/service"

type LibraryPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
    state?: string
    view?: string
  }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LibraryPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.library.metaTitle,
    description: dictionary.library.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/library`,
      languages: {
        en: "/en/library",
        es: "/es/library",
        "x-default": "/en/library",
      },
    },
    openGraph: {
      title: dictionary.library.metaTitle,
      description: dictionary.library.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/library`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.library.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.library.metaTitle,
      description: dictionary.library.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

function buildQueryString(input: {
  page?: number | string | null
  search?: string | null
  sort?: string | null
  state?: string | null
  view?: string | null
}): string {
  const params = new URLSearchParams()

  if (input.page && String(input.page) !== "1") {
    params.set("page", String(input.page))
  }

  if (input.search && input.search.trim().length > 0) {
    params.set("search", input.search.trim())
  }

  if (input.sort && input.sort.trim().length > 0 && input.sort !== "updated_desc") {
    params.set("sort", input.sort)
  }

  if (input.state && input.state.trim().length > 0) {
    params.set("state", input.state)
  }

  if (input.view && input.view.trim().length > 0 && input.view !== "rows") {
    params.set("view", input.view)
  }

  const value = params.toString()

  return value.length > 0 ? `?${value}` : ""
}

export default async function LibraryPage({ params, searchParams }: LibraryPageProps) {
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
  const query = await searchParams

  const library = await getUserLibrary({
    userId: session.user.id,
    page: query.page,
    search: query.search,
    sort: query.sort,
    state: query.state,
  })

  const activeState = query.state && isLibraryState(query.state) ? query.state : ""
  const activeSort =
    query.sort === "release_desc" || query.sort === "rating_desc" || query.sort === "updated_desc"
      ? query.sort
      : "updated_desc"
  const activeSearch = query.search ?? ""
  const activeView = query.view === "grid" ? "grid" : "rows"

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-4xl italic text-primary md:text-5xl">{dictionary.library.title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{dictionary.library.description}</p>
        </header>

        <LibraryFilters
          key={`${activeSearch}:${activeSort}:${activeState}:${activeView}`}
          filters={dictionary.library.filters}
          sortLabels={dictionary.library.sort}
          stateLabels={dictionary.library.states}
          values={{
            search: activeSearch,
            sort: activeSort,
            state: activeState,
            view: activeView,
          }}
        />

        {library.items.length === 0 ? (
          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="flex flex-col gap-3 p-6">
              <h2 className="font-headline text-xl uppercase">{dictionary.library.emptyTitle}</h2>
              <p className="text-sm text-muted-foreground">{dictionary.library.emptyBody}</p>
              <Link className={cn(buttonVariants({ size: "sm" }), "w-fit")} href={`/${locale}/search`}>
                <ArrowRight data-icon="inline-start" />
                {dictionary.library.emptyCta}
              </Link>
            </CardContent>
          </Card>
        ) : activeView === "rows" ? (
          <div className="grid gap-4">
            {library.items.map((item) => {
              const releaseDate = item.game.firstReleaseDate
                ? new Intl.DateTimeFormat(locale).format(new Date(item.game.firstReleaseDate))
                : dictionary.library.unknownValue
              const ratingValue =
                typeof item.game.rating === "number" ? item.game.rating.toFixed(1) : dictionary.library.unknownValue

              return (
                <Card key={item.entryId} className="border border-border/60 bg-card/80 py-0">
                  <CardContent className="grid gap-4 p-4 md:grid-cols-[120px_minmax(0,1fr)_320px]">
                    <div
                      aria-hidden="true"
                      className="aspect-[3/4] w-full rounded-md border border-border/60 bg-muted bg-cover bg-center"
                      style={
                        item.game.coverUrl
                          ? {
                              backgroundImage: `url(${item.game.coverUrl})`,
                            }
                          : undefined
                      }
                    />

                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <LibraryStateBadge labels={dictionary.library.states} state={item.state} />
                        {item.review ? (
                          <Link
                            className={buttonVariants({ size: "xs", variant: "ghost" })}
                            href={`/${locale}/review/${item.review.id}`}
                          >
                            <MessageSquareText data-icon="inline-start" />
                            {dictionary.library.openReview}
                          </Link>
                        ) : null}
                      </div>

                      <h2 className="truncate font-headline text-xl uppercase">{item.game.name}</h2>
                      <p className="truncate text-xs text-muted-foreground">/{item.game.slug}</p>
                      <p className="text-sm text-muted-foreground">{item.game.summary ?? dictionary.library.noSummary}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>
                          {dictionary.library.labels.release}: {releaseDate}
                        </span>
                        <span>
                          {dictionary.library.labels.rating}: {ratingValue}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <LibraryEntryStateForm
                        entryId={item.entryId}
                        labels={dictionary.library.states}
                        messages={dictionary.library.update}
                        state={item.state}
                      />
                      <Link
                        className={buttonVariants({ size: "sm", variant: "outline" })}
                        href={`/${locale}/game/${item.game.igdbId}`}
                      >
                        <ArrowUpRight data-icon="inline-start" />
                        {dictionary.library.openGame}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {library.items.map((item) => {
              const releaseDate = item.game.firstReleaseDate
                ? new Intl.DateTimeFormat(locale).format(new Date(item.game.firstReleaseDate))
                : dictionary.library.unknownValue
              const ratingValue =
                typeof item.game.rating === "number" ? item.game.rating.toFixed(1) : dictionary.library.unknownValue

              return (
                <Card key={item.entryId} className="border border-border/60 bg-card/80 py-0">
                  <CardContent className="flex flex-col gap-3 p-3">
                    <div
                      aria-hidden="true"
                      className="aspect-[3/4] w-full rounded-md border border-border/60 bg-muted bg-cover bg-center"
                      style={
                        item.game.coverUrl
                          ? {
                              backgroundImage: `url(${item.game.coverUrl})`,
                            }
                          : undefined
                      }
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <LibraryStateBadge labels={dictionary.library.states} state={item.state} />
                      {item.review ? (
                        <Link
                          className={buttonVariants({ size: "xs", variant: "ghost" })}
                          href={`/${locale}/review/${item.review.id}`}
                        >
                          <MessageSquareText data-icon="inline-start" />
                          {dictionary.library.openReview}
                        </Link>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-1">
                      <h2 className="truncate font-headline text-lg uppercase">{item.game.name}</h2>
                      <p className="truncate text-xs text-muted-foreground">/{item.game.slug}</p>
                    </div>

                    <p className="truncate text-xs text-muted-foreground">{item.game.summary ?? dictionary.library.noSummary}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span>
                        {dictionary.library.labels.release}: {releaseDate}
                      </span>
                      <span>
                        {dictionary.library.labels.rating}: {ratingValue}
                      </span>
                    </div>

                    <LibraryEntryStateForm
                      entryId={item.entryId}
                      labels={dictionary.library.states}
                      messages={dictionary.library.update}
                      state={item.state}
                    />

                    <Link
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                      href={`/${locale}/game/${item.game.igdbId}`}
                    >
                      <ArrowUpRight data-icon="inline-start" />
                      {dictionary.library.openGame}
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {library.totalPages > 1 ? (
          <nav className="flex items-center justify-between gap-3">
            <Link
              aria-disabled={library.page <= 1}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                library.page <= 1 && "pointer-events-none opacity-40"
              )}
              href={buildQueryString({
                page: library.page - 1,
                search: activeSearch,
                sort: activeSort,
                state: activeState,
                view: activeView,
              })}
            >
              <ArrowRight data-icon="inline-start" className="rotate-180" />
              {dictionary.library.pagination.previous}
            </Link>

            <p className="text-xs text-muted-foreground">
              {dictionary.library.pagination.pageLabel
                .replace("{page}", String(library.page))
                .replace("{total}", String(library.totalPages))}
            </p>

            <Link
              aria-disabled={library.page >= library.totalPages}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                library.page >= library.totalPages && "pointer-events-none opacity-40"
              )}
              href={buildQueryString({
                page: library.page + 1,
                search: activeSearch,
                sort: activeSort,
                state: activeState,
                view: activeView,
              })}
            >
              <ArrowRight data-icon="inline-start" />
              {dictionary.library.pagination.next}
            </Link>
          </nav>
        ) : null}
      </div>
    </main>
  )
}
