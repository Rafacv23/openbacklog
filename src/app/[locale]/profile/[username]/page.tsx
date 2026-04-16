import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight } from "lucide-react"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { ProfileSignOutButton } from "@/components/profile/profile-sign-out-button"
import { LibraryStateBadge } from "@/components/library/library-state-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import {
  getAuthSession,
  getSessionUsername,
} from "@/server/auth/get-auth-session"
import { getPublicProfileByUsername } from "@/server/profile/get-public-profile"

type ProfilePageProps = {
  params: Promise<{ locale: string; username: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

function parseUsername(rawUsername: string): string | null {
  let normalized = ""

  try {
    normalized = decodeURIComponent(rawUsername).trim().toLowerCase()
  } catch {
    return null
  }

  if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
    return null
  }

  return normalized
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { locale: rawLocale, username: rawUsername } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const username = parseUsername(rawUsername)

  if (!username) {
    return {}
  }

  const dictionary = getDictionary(locale)
  const profile = await getPublicProfileByUsername(username)

  if (!profile) {
    return {}
  }

  const title = `${profile.displayName} (@${profile.username}) · ${dictionary.profile.metaTitleSuffix}`
  const canonicalPath = `/${locale}/profile/${profile.username}`

  return {
    title,
    description: dictionary.profile.metaDescription,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: `/en/profile/${profile.username}`,
        es: `/es/profile/${profile.username}`,
        "x-default": `/en/profile/${profile.username}`,
      },
    },
    openGraph: {
      title,
      description: dictionary.profile.metaDescription,
      type: "profile",
      locale,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dictionary.profile.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale, username: rawUsername } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const username = parseUsername(rawUsername)

  if (!username) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const profile = await getPublicProfileByUsername(username)
  const session = await getAuthSession()
  const sessionUsername = session ? getSessionUsername(session) : null

  if (!profile) {
    notFound()
  }

  const isOwnProfile = Boolean(
    sessionUsername && sessionUsername === profile.username,
  )

  const profileHref = `/${locale}/profile/${encodeURIComponent(sessionUsername ?? profile.username)}`

  const joinedDate = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(new Date(profile.joinedAt))

  const lastActivityDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(profile.lastActivityAt))
  const compactDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const numberFormatter = new Intl.NumberFormat(locale)
  const totalLibraryEntries = Object.values(profile.libraryStats).reduce(
    (sum, value) => sum + value,
    0,
  )
  const completedEntries = profile.libraryStats.completed
  const activeEntries =
    profile.libraryStats.playing + profile.libraryStats.on_hold
  const completionRate =
    totalLibraryEntries > 0
      ? Math.round((completedEntries / totalLibraryEntries) * 100)
      : 0
  const recentReviewCount = profile.recentReviews.length
  const profileHighlights = [
    {
      label: dictionary.profile.followersLabel,
      value: numberFormatter.format(profile.followerCount),
    },
    {
      label: dictionary.profile.followingLabel,
      value: numberFormatter.format(profile.followingCount),
    },
    {
      label: dictionary.profile.totalLibraryLabel,
      value: numberFormatter.format(totalLibraryEntries),
    },
    {
      label: dictionary.profile.activeLibraryLabel,
      value: numberFormatter.format(activeEntries),
    },
    {
      label: dictionary.profile.recentReviewsCountLabel,
      value: numberFormatter.format(recentReviewCount),
    },
  ]
  const featureCards = [
    {
      href: `/${locale}/feed`,
      title: dictionary.profile.featureCards.feed.title,
      description: dictionary.profile.featureCards.feed.description,
      cta: dictionary.profile.featureCards.feed.cta,
    },
    {
      href: `/${locale}/upcoming`,
      title: dictionary.profile.featureCards.upcoming.title,
      description: dictionary.profile.featureCards.upcoming.description,
      cta: dictionary.profile.featureCards.upcoming.cta,
    },
    {
      href: `/${locale}/popular`,
      title: dictionary.profile.featureCards.popular.title,
      description: dictionary.profile.featureCards.popular.description,
      cta: dictionary.profile.featureCards.popular.cta,
    },
    {
      href: `/${locale}/library`,
      title: dictionary.profile.featureCards.library.title,
      description: dictionary.profile.featureCards.library.description,
      cta: dictionary.profile.featureCards.library.cta,
    },
  ]

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${profile.displayName} | ${SITE_NAME}`,
    url: `${BASE_URL}/${locale}/profile/${profile.username}`,
    inLanguage: locale,
    mainEntity: {
      "@type": "Person",
      identifier: profile.userId,
      additionalName: profile.username,
      name: profile.displayName,
      description: dictionary.profile.metaDescription,
    },
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd),
        }}
      />
      <AppHeader
        dictionary={dictionary.app.header}
        locale={locale}
        profileHref={profileHref}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[26rem] bg-[radial-gradient(circle_at_15%_18%,hsl(var(--primary)/0.22),transparent_48%),radial-gradient(circle_at_88%_0%,hsl(var(--primary)/0.16),transparent_38%)]"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-10">
        <section className="grid gap-6">
          <Card className="overflow-hidden border border-border/60 bg-card/85 py-0">
            <CardContent className="relative p-6 md:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,hsl(var(--primary)/0.16),transparent_45%)]"
              />
              <div className="relative space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="grid size-16 place-items-center rounded-full border border-primary/30 bg-background/80 font-display text-2xl text-primary">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h1 className="font-display text-3xl italic text-primary md:text-4xl">
                      {profile.displayName}
                    </h1>
                    <p className="text-xs tracking-[0.08em] text-muted-foreground">
                      @{profile.username}
                    </p>
                  </div>
                </div>

                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                  {dictionary.profile.heroDescription}
                </p>

                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>
                    {dictionary.profile.joinedLabel}:{" "}
                    <span className="text-foreground">{joinedDate}</span>
                  </p>
                  <p>
                    {dictionary.profile.lastActivityLabel}:{" "}
                    <span className="text-foreground">{lastActivityDate}</span>
                  </p>
                </div>

                {isOwnProfile ? (
                  <ProfileSignOutButton
                    locale={locale}
                    messages={{
                      error: dictionary.profile.signOutError,
                      idle: dictionary.profile.signOutCta,
                      pending: dictionary.profile.signOutSubmitting,
                    }}
                  />
                ) : null}

                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background/70">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs tracking-[0.06em] text-muted-foreground uppercase">
                    {dictionary.profile.completionRateLabel}:{" "}
                    <span className="text-foreground">{completionRate}%</span>
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {profileHighlights.map((item) => (
                    <article
                      className="rounded-lg border border-border/60 bg-background/70 px-3 py-3"
                      key={item.label}
                    >
                      <p className="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                        {item.label}
                      </p>
                      <p className="mt-1 font-display text-2xl italic text-primary">
                        {item.value}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card/80 py-0">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="font-headline text-xl uppercase">
                  {dictionary.profile.libraryTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dictionary.profile.libraryDescription}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(profile.libraryStats).map(([state, value]) => (
                  <article
                    key={state}
                    className="rounded-md border border-border/60 bg-background/70 p-4"
                  >
                    <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                      {
                        dictionary.profile.stateLabels[
                          state as keyof typeof dictionary.profile.stateLabels
                        ]
                      }
                    </p>
                    <p className="mt-2 font-display text-3xl italic text-primary">
                      {numberFormatter.format(value)}
                    </p>
                  </article>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/80 py-0">
            <CardContent className="space-y-4 p-6">
              <div className="space-y-1">
                <h2 className="font-headline text-xl uppercase">
                  {dictionary.profile.recentReviewsTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dictionary.profile.recentReviewsDescription}
                </p>
              </div>

              {profile.recentReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {dictionary.profile.noRecentReviews}
                </p>
              ) : (
                <div className="space-y-3">
                  {profile.recentReviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-md border border-border/60 bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-headline text-base uppercase">
                          {review.game.name}
                        </h3>
                        <Link
                          className="text-xs text-primary underline-offset-4 hover:underline"
                          href={`/${locale}/review/${review.id}`}
                        >
                          {dictionary.profile.openReview}
                        </Link>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {review.body}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-none border-primary/40 bg-background px-2 py-0.5 text-[10px] uppercase"
                        >
                          {review.recommend === "recommend"
                            ? dictionary.profile.recommend
                            : dictionary.profile.notRecommend}
                        </Badge>
                        {review.platformPlayed ? (
                          <Badge
                            variant="outline"
                            className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase"
                          >
                            {review.platformPlayed}
                          </Badge>
                        ) : null}
                        {review.hoursToComplete ? (
                          <span className="text-xs text-muted-foreground">
                            {dictionary.profile.hoursLabel.replace(
                              "{hours}",
                              String(review.hoursToComplete),
                            )}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {dictionary.profile.updatedLabel}:{" "}
                          {compactDate.format(new Date(review.updatedAt))}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.profile.recentLibraryTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.profile.recentLibraryDescription}
            </p>
          </header>

          {profile.recentLibrary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {dictionary.profile.noRecentLibrary}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.recentLibrary.map((entry) => (
                <Card
                  key={entry.entryId}
                  className="border border-border/60 bg-card/80 py-0"
                >
                  <CardContent className="space-y-3 p-4">
                    <div
                      aria-hidden="true"
                      className="aspect-[4/3] rounded-md border border-border/60 bg-muted bg-cover bg-center"
                      style={
                        entry.game.coverUrl
                          ? {
                              backgroundImage: `url(${entry.game.coverUrl})`,
                            }
                          : undefined
                      }
                    />
                    <div className="space-y-2">
                      <h3 className="font-headline text-lg uppercase">
                        {entry.game.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <LibraryStateBadge
                          labels={dictionary.profile.stateLabels}
                          state={entry.state}
                        />
                        {entry.game.platform ? (
                          <Badge
                            variant="outline"
                            className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase"
                          >
                            {entry.game.platform}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dictionary.profile.updatedLabel}:{" "}
                        {compactDate.format(new Date(entry.updatedAt))}
                      </p>
                      <Link
                        className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                        href={`/${locale}/game/${entry.game.igdbId}`}
                      >
                        {dictionary.profile.openGame}
                        <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <AppFooter
        dictionary={dictionary.app.footer}
        locale={locale}
        profileHref={profileHref}
      />
    </main>
  )
}
