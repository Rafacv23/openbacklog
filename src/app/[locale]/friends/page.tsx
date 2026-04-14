import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { FollowToggleButton } from "@/components/friends/follow-toggle-button"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { cn } from "@/lib/utils"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { getFriendsHub } from "@/server/friends/service"
import { parsePeopleSearch } from "@/server/friends/validation"

type FriendsPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ search?: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: FriendsPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.app.friends.metaTitle,
    description: dictionary.app.friends.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/friends`,
      languages: {
        en: "/en/friends",
        es: "/es/friends",
        "x-default": "/en/friends",
      },
    },
    openGraph: {
      title: dictionary.app.friends.metaTitle,
      description: dictionary.app.friends.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/friends`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.app.friends.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.app.friends.metaTitle,
      description: dictionary.app.friends.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function FriendsPage({ params, searchParams }: FriendsPageProps) {
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
  const resolvedSearchParams = await searchParams
  const search = parsePeopleSearch(resolvedSearchParams.search)

  const friendsHub = await getFriendsHub({
    viewerUserId: session.user.id,
    search,
    limit: 24,
  })

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-10">
        <header className="space-y-2">
          <h1 className="font-display text-4xl italic text-primary md:text-5xl">
            {dictionary.app.friends.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            {dictionary.app.friends.description}
          </p>
        </header>

        <section className="rounded-lg border border-border/60 bg-card/70 p-4">
          <form action={`/${locale}/friends`} className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-2 text-xs" htmlFor="friends-search">
              <span className="tracking-[0.08em] text-muted-foreground uppercase">
                {dictionary.app.friends.searchLabel}
              </span>
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={friendsHub.search}
                id="friends-search"
                name="search"
                placeholder={dictionary.app.friends.searchPlaceholder}
                type="search"
              />
            </label>
            <button className={cn(buttonVariants({ size: "sm" }))} type="submit">
              {dictionary.app.friends.searchAction}
            </button>
            {friendsHub.search.length > 0 ? (
              <Link
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                href={`/${locale}/friends`}
              >
                {dictionary.app.friends.clearSearch}
              </Link>
            ) : null}
          </form>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">{dictionary.app.friends.followingTitle}</h2>
            <p className="text-sm text-muted-foreground">{dictionary.app.friends.followingDescription}</p>
          </header>

          {friendsHub.following.length === 0 ? (
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="space-y-2 p-6">
                <h3 className="font-headline text-xl uppercase">{dictionary.app.friends.emptyFollowingTitle}</h3>
                <p className="text-sm text-muted-foreground">{dictionary.app.friends.emptyFollowingBody}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {friendsHub.following.map((entry) => (
                <article
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/80 p-4"
                  key={entry.userId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        className="font-headline text-lg uppercase text-foreground hover:text-primary"
                        href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
                      >
                        {entry.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{entry.username}</p>
                    </div>

                    <FollowToggleButton
                      initiallyFollowing
                      labels={dictionary.app.friends.actions}
                      username={entry.username}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-border/60 bg-background/70 p-2">
                      <p className="text-muted-foreground">{dictionary.app.friends.followersLabel}</p>
                      <p className="font-headline text-sm text-foreground uppercase">{entry.followersCount}</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/70 p-2">
                      <p className="text-muted-foreground">{dictionary.app.friends.followingLabel}</p>
                      <p className="font-headline text-sm text-foreground uppercase">{entry.followingCount}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">{dictionary.app.friends.discoverTitle}</h2>
            <p className="text-sm text-muted-foreground">{dictionary.app.friends.discoverDescription}</p>
          </header>

          {friendsHub.discover.length === 0 ? (
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="space-y-2 p-6">
                <h3 className="font-headline text-xl uppercase">{dictionary.app.friends.emptyDiscoverTitle}</h3>
                <p className="text-sm text-muted-foreground">{dictionary.app.friends.emptyDiscoverBody}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {friendsHub.discover.map((entry) => (
                <article
                  className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card/80 p-4"
                  key={entry.userId}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        className="font-headline text-lg uppercase text-foreground hover:text-primary"
                        href={`/${locale}/profile/${encodeURIComponent(entry.username)}`}
                      >
                        {entry.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{entry.username}</p>
                    </div>

                    <FollowToggleButton
                      initiallyFollowing={false}
                      labels={dictionary.app.friends.actions}
                      username={entry.username}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md border border-border/60 bg-background/70 p-2">
                      <p className="text-muted-foreground">{dictionary.app.friends.followersLabel}</p>
                      <p className="font-headline text-sm text-foreground uppercase">{entry.followersCount}</p>
                    </div>
                    <div className="rounded-md border border-border/60 bg-background/70 p-2">
                      <p className="text-muted-foreground">{dictionary.app.friends.followingLabel}</p>
                      <p className="font-headline text-sm text-foreground uppercase">{entry.followingCount}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AppFooter dictionary={dictionary.app.footer} locale={locale} profileHref={profileHref} />
    </main>
  )
}
