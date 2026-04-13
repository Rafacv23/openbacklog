import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { LibraryEntryStateForm } from "@/components/library/library-entry-state-form"
import { LibraryStateBadge } from "@/components/library/library-state-badge"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { LIBRARY_STATES } from "@/server/library/states"
import { getUserLibrary } from "@/server/library/service"

type LibraryPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
    state?: string
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
}): string {
  const params = new URLSearchParams()

  if (input.page && String(input.page) !== "1") {
    params.set("page", String(input.page))
  }

  if (input.search && input.search.trim().length > 0) {
    params.set("search", input.search.trim())
  }

  if (input.sort && input.sort.trim().length > 0) {
    params.set("sort", input.sort)
  }

  if (input.state && input.state.trim().length > 0) {
    params.set("state", input.state)
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

  const activeState = query.state ?? ""
  const activeSort = query.sort ?? "updated_desc"
  const activeSearch = query.search ?? ""

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="space-y-2">
          <h1 className="font-display text-4xl italic text-primary md:text-5xl">
            {dictionary.library.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {dictionary.library.description}
          </p>
        </header>

        <form className="grid gap-3 rounded-md border border-border/60 bg-card/70 p-4 md:grid-cols-[1fr_180px_180px_auto]">
          <input
            className="h-10 border border-border/70 bg-background px-3 text-sm"
            defaultValue={activeSearch}
            name="search"
            placeholder={dictionary.library.filters.searchPlaceholder}
            type="search"
          />

          <select
            className="h-10 border border-border/70 bg-background px-3 text-sm"
            defaultValue={activeState}
            name="state"
          >
            <option value="">{dictionary.library.filters.allStates}</option>
            {LIBRARY_STATES.map((state) => (
              <option key={state} value={state}>
                {dictionary.library.states[state]}
              </option>
            ))}
          </select>

          <select
            className="h-10 border border-border/70 bg-background px-3 text-sm"
            defaultValue={activeSort}
            name="sort"
          >
            <option value="updated_desc">{dictionary.library.sort.updatedDesc}</option>
            <option value="release_desc">{dictionary.library.sort.releaseDesc}</option>
            <option value="rating_desc">{dictionary.library.sort.ratingDesc}</option>
          </select>

          <button
            className="h-10 rounded-none border border-primary/40 bg-primary/20 px-4 text-xs font-semibold tracking-[0.08em] uppercase"
            type="submit"
          >
            {dictionary.library.filters.apply}
          </button>
        </form>

        {library.items.length === 0 ? (
          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="space-y-2 p-6">
              <h2 className="font-headline text-xl uppercase">{dictionary.library.emptyTitle}</h2>
              <p className="text-sm text-muted-foreground">{dictionary.library.emptyBody}</p>
              <Link className="text-sm text-primary underline-offset-4 hover:underline" href={`/${locale}/search`}>
                {dictionary.library.emptyCta}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {library.items.map((item) => (
              <Card key={item.entryId} className="border border-border/60 bg-card/80 py-0">
                <CardContent className="grid gap-4 p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
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

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <LibraryStateBadge labels={dictionary.library.states} state={item.state} />
                      {item.review ? (
                        <Link
                          className="text-xs text-primary underline-offset-4 hover:underline"
                          href={`/${locale}/review/${item.review.id}`}
                        >
                          {dictionary.library.openReview}
                        </Link>
                      ) : null}
                    </div>

                    <h2 className="font-headline text-xl uppercase">{item.game.name}</h2>
                    <p className="text-xs text-muted-foreground">/{item.game.slug}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.game.summary ?? dictionary.library.noSummary}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        {dictionary.library.labels.release}: {item.game.firstReleaseDate ? new Intl.DateTimeFormat(locale).format(new Date(item.game.firstReleaseDate)) : dictionary.library.unknownValue}
                      </span>
                      <span>
                        {dictionary.library.labels.rating}: {typeof item.game.rating === "number" ? item.game.rating.toFixed(1) : dictionary.library.unknownValue}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <LibraryEntryStateForm
                      entryId={item.entryId}
                      labels={dictionary.library.states}
                      messages={dictionary.library.update}
                      state={item.state}
                    />
                    <Link
                      className="block text-xs text-primary underline-offset-4 hover:underline"
                      href={`/${locale}/game/${item.game.igdbId}`}
                    >
                      {dictionary.library.openGame}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {library.totalPages > 1 ? (
          <nav className="flex items-center justify-between gap-3">
            <Link
              aria-disabled={library.page <= 1}
              className={`text-sm underline-offset-4 hover:underline ${library.page <= 1 ? "pointer-events-none opacity-40" : ""}`}
              href={buildQueryString({
                page: library.page - 1,
                search: activeSearch,
                sort: activeSort,
                state: activeState,
              })}
            >
              {dictionary.library.pagination.previous}
            </Link>

            <p className="text-xs text-muted-foreground">
              {dictionary.library.pagination.pageLabel
                .replace("{page}", String(library.page))
                .replace("{total}", String(library.totalPages))}
            </p>

            <Link
              aria-disabled={library.page >= library.totalPages}
              className={`text-sm underline-offset-4 hover:underline ${library.page >= library.totalPages ? "pointer-events-none opacity-40" : ""}`}
              href={buildQueryString({
                page: library.page + 1,
                search: activeSearch,
                sort: activeSort,
                state: activeState,
              })}
            >
              {dictionary.library.pagination.next}
            </Link>
          </nav>
        ) : null}
      </div>
    </main>
  )
}
