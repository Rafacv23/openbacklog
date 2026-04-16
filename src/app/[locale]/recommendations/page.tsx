import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { GameCard } from "@/components/app/game-card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { cn } from "@/lib/utils"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import { getPopularCollections } from "@/server/games/get-popular-games"
import { getUpcomingReleases } from "@/server/games/get-upcoming-releases"
import {
  parseProductivityPendingSort,
  sortPendingBacklogCandidates,
  type ProductivityPendingSort,
} from "@/server/productivity/engine"
import { getProductivityOverview } from "@/server/productivity/service"

type RecommendationsPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{
    sort?: string
  }>
}

type ProductivityRecommendationsCopy = {
  title: string
  description: string
  fallbackDescription: string
  cards: {
    completionScore: string
    completionScoreHint: string
    dropRisk: string
    dropRiskHint: string
    high: string
    hoursToClear: string
    hoursToClearHint: string
    low: string
    medium: string
  }
  recommendationMeta: {
    hours: string
    reasonsTitle: string
    risk: string
    score: string
    sessions: string
  }
  pendingPicker: {
    columns: {
      game: string
      hours: string
      rating: string
      ratingPerHour: string
      state: string
    }
    empty: string
    sortLabel: string
    sorts: {
      hours: string
      rating: string
      ratingPerHour: string
    }
  }
  reasons: Record<string, string>
  releaseReminders: {
    empty: string
    inDays: string
    title: string
  }
  riskLevels: Record<string, string>
  riskSignals: {
    item: string
    none: string
    title: string
  }
  sessionPlan: {
    cadence: string
    empty: string
    focus: string
    pace: string
    title: string
  }
  watchMore: string
}

type RecommendationsPageCopy = {
  backToFeed: string
  description: string
  emptyState: string
  metaDescription: string
  metaTitle: string
  sections: {
    extendedRecommendationsDescription: string
    extendedRecommendationsTitle: string
    fallbackInsight: string
    pendingBacklogDescription: string
    pendingBacklogTitle: string
    releasePipelineDescription: string
    releasePipelineTitle: string
  }
  title: string
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const MAX_RECOMMENDATION_RESULTS = 12
const MAX_FALLBACK_UPCOMING = 6

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

function buildSortHref(input: {
  locale: string
  sort: ProductivityPendingSort
}): string {
  if (input.sort === "rating_per_hour_desc") {
    return `/${input.locale}/recommendations`
  }

  return `/${input.locale}/recommendations?sort=${encodeURIComponent(input.sort)}`
}

function interpolateTemplate(template: string, values: Record<string, string>): string {
  let output = template

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, value)
  }

  return output
}

function formatNumber(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value)
}

function dedupeAndLimitGames<T extends { igdbId: number }>(games: T[], limit: number): T[] {
  const uniqueGames: T[] = []
  const seenGameIds = new Set<number>()

  for (const game of games) {
    if (seenGameIds.has(game.igdbId)) {
      continue
    }

    seenGameIds.add(game.igdbId)
    uniqueGames.push(game)

    if (uniqueGames.length >= limit) {
      break
    }
  }

  return uniqueGames
}

function getDaysUntilRelease(input: { now: Date; releaseDateIso: string }): number {
  const releaseDate = new Date(input.releaseDateIso)

  if (!Number.isFinite(releaseDate.getTime())) {
    return 0
  }

  return Math.max(0, Math.ceil((releaseDate.getTime() - input.now.getTime()) / (24 * 60 * 60 * 1_000)))
}

export async function generateMetadata({
  params,
}: RecommendationsPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)
  const pageCopy = dictionary.app.recommendationsPage as RecommendationsPageCopy

  return {
    title: pageCopy.metaTitle,
    description: pageCopy.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/recommendations`,
      languages: {
        en: "/en/recommendations",
        es: "/es/recommendations",
        "x-default": "/en/recommendations",
      },
    },
    openGraph: {
      title: pageCopy.metaTitle,
      description: pageCopy.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/recommendations`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: pageCopy.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageCopy.metaTitle,
      description: pageCopy.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function RecommendationsPage({
  params,
  searchParams,
}: RecommendationsPageProps) {
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

  const now = new Date()
  const dictionary = getDictionary(locale)
  const recommendationsCopy = dictionary.app.recommendations as ProductivityRecommendationsCopy
  const pageCopy = dictionary.app.recommendationsPage as RecommendationsPageCopy
  const profileHref = `/${locale}/profile/${encodeURIComponent(username)}`
  const query = await searchParams
  const pendingSort = parseProductivityPendingSort(query.sort)

  const [productivityOverview, popularCollections, upcomingReleases] = await Promise.all([
    getProductivityOverview({
      userId: session.user.id,
    }),
    getPopularCollections({
      collectionLimit: MAX_RECOMMENDATION_RESULTS,
      userId: session.user.id,
    }),
    getUpcomingReleases({
      limit: MAX_RECOMMENDATION_RESULTS,
      referenceDate: now,
    }),
  ])

  const recommendationGames = dedupeAndLimitGames(
    [
      ...productivityOverview.recommendations.map((recommendation) => recommendation.game),
      ...popularCollections.friendsPopularGames,
      ...popularCollections.recentlyActiveGames,
      ...popularCollections.mostPopularGames,
      ...upcomingReleases.weekReleases,
    ],
    MAX_RECOMMENDATION_RESULTS,
  )

  const fallbackUpcomingGames = dedupeAndLimitGames(
    [
      ...upcomingReleases.weekReleases,
      ...upcomingReleases.monthReleases,
      ...upcomingReleases.generalReleases,
    ].filter((game) => Boolean(game.firstReleaseDate)),
    MAX_FALLBACK_UPCOMING,
  )

  const recommendationInsightsByGameId = new Map(
    productivityOverview.recommendations.map((recommendation) => [
      recommendation.game.igdbId,
      recommendation,
    ]),
  )
  const sortedPendingBacklog = sortPendingBacklogCandidates({
    candidates: productivityOverview.pendingBacklogCandidates,
    sortBy: pendingSort,
  })

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 md:py-10">
        <header className="space-y-3">
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit")}
            href={`/${locale}/feed`}
          >
            <ArrowLeft data-icon="inline-start" />
            {pageCopy.backToFeed}
          </Link>
          <h1 className="font-display text-4xl italic text-primary md:text-5xl">
            {pageCopy.title}
          </h1>
          <p className="max-w-4xl text-sm text-muted-foreground md:text-base">
            {pageCopy.description}
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {recommendationsCopy.cards.completionScore}
              </p>
              <p className="font-headline text-3xl text-primary">
                {productivityOverview.backlogCompletionScore}
              </p>
              <p className="text-xs text-muted-foreground">
                {recommendationsCopy.cards.completionScoreHint}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {recommendationsCopy.cards.hoursToClear}
              </p>
              <p className="font-headline text-3xl text-primary">
                {formatNumber(locale, productivityOverview.estimatedHoursToClearBacklog)}h
              </p>
              <p className="text-xs text-muted-foreground">
                {recommendationsCopy.cards.hoursToClearHint}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {recommendationsCopy.cards.dropRisk}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-none" variant="outline">
                  {recommendationsCopy.cards.high}: {productivityOverview.dropRisk.highRiskCount}
                </Badge>
                <Badge className="rounded-none" variant="outline">
                  {recommendationsCopy.cards.medium}: {productivityOverview.dropRisk.mediumRiskCount}
                </Badge>
                <Badge className="rounded-none" variant="outline">
                  {recommendationsCopy.cards.low}: {productivityOverview.dropRisk.lowRiskCount}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {recommendationsCopy.cards.dropRiskHint}
              </p>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="space-y-2 p-4">
              <h2 className="font-headline text-xl uppercase">{recommendationsCopy.sessionPlan.title}</h2>
              {productivityOverview.sessionPlan.sessionsPerWeek > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {interpolateTemplate(recommendationsCopy.sessionPlan.cadence, {
                      minutes: String(productivityOverview.sessionPlan.sessionMinutes),
                      sessions: String(productivityOverview.sessionPlan.sessionsPerWeek),
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {interpolateTemplate(recommendationsCopy.sessionPlan.pace, {
                      hours: formatNumber(locale, productivityOverview.sessionPlan.targetWeeklyHours),
                      weeks: String(productivityOverview.sessionPlan.projectedWeeksToClearBacklog ?? 0),
                    })}
                  </p>
                  {productivityOverview.recommendations[0] ? (
                    <p className="text-sm text-foreground">
                      {interpolateTemplate(recommendationsCopy.sessionPlan.focus, {
                        game: productivityOverview.recommendations[0].game.name,
                      })}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{recommendationsCopy.sessionPlan.empty}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card/70 py-0">
            <CardContent className="space-y-2 p-4">
              <h2 className="font-headline text-xl uppercase">
                {recommendationsCopy.releaseReminders.title}
              </h2>
              {productivityOverview.releaseReminders.length > 0 ? (
                <ul className="space-y-2">
                  {productivityOverview.releaseReminders.map((reminder) => (
                    <li className="text-sm text-muted-foreground" key={reminder.game.igdbId}>
                      <span className="font-medium text-foreground">{reminder.game.name}</span>{" "}
                      {interpolateTemplate(recommendationsCopy.releaseReminders.inDays, {
                        date: new Intl.DateTimeFormat(locale, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(reminder.releaseDate)),
                        days: String(reminder.daysUntilRelease),
                      })}
                    </li>
                  ))}
                </ul>
              ) : fallbackUpcomingGames.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {pageCopy.sections.releasePipelineDescription}
                  </p>
                  <ul className="space-y-2">
                    {fallbackUpcomingGames.map((game) => {
                      const releaseDateIso = game.firstReleaseDate ?? now.toISOString()
                      const daysUntilRelease = getDaysUntilRelease({
                        now,
                        releaseDateIso,
                      })

                      return (
                        <li className="text-sm text-muted-foreground" key={`fallback-${game.igdbId}`}>
                          <span className="font-medium text-foreground">{game.name}</span>{" "}
                          {interpolateTemplate(recommendationsCopy.releaseReminders.inDays, {
                            date: new Intl.DateTimeFormat(locale, {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }).format(new Date(releaseDateIso)),
                            days: String(daysUntilRelease),
                          })}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{recommendationsCopy.releaseReminders.empty}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border/60 bg-card/70 py-0">
          <CardContent className="space-y-2 p-4">
            <h2 className="font-headline text-xl uppercase">{recommendationsCopy.riskSignals.title}</h2>
            {productivityOverview.dropRisk.signals.length > 0 ? (
              <ul className="space-y-2">
                {productivityOverview.dropRisk.signals.map((signal) => (
                  <li className="text-sm text-muted-foreground" key={`risk-${signal.game.igdbId}`}>
                    {interpolateTemplate(recommendationsCopy.riskSignals.item, {
                      days: String(signal.daysSinceActivity),
                      game: signal.game.name,
                      hours: formatNumber(locale, signal.estimatedRemainingHours),
                      risk: recommendationsCopy.riskLevels[signal.level] ?? signal.level,
                    })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{recommendationsCopy.riskSignals.none}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/70 py-0">
          <CardContent className="space-y-3 p-4">
            <h2 className="font-headline text-xl uppercase">
              {pageCopy.sections.pendingBacklogTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {pageCopy.sections.pendingBacklogDescription}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {recommendationsCopy.pendingPicker.sortLabel}
              </span>
              {(
                [
                  {
                    key: "rating_per_hour_desc",
                    label: recommendationsCopy.pendingPicker.sorts.ratingPerHour,
                  },
                  {
                    key: "hours_asc",
                    label: recommendationsCopy.pendingPicker.sorts.hours,
                  },
                  {
                    key: "rating_desc",
                    label: recommendationsCopy.pendingPicker.sorts.rating,
                  },
                ] as const
              ).map((option) => (
                <Link
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      variant: pendingSort === option.key ? "default" : "outline",
                    }),
                    "h-auto rounded-none px-2 py-1 text-[10px] tracking-[0.08em] uppercase",
                  )}
                  href={buildSortHref({
                    locale,
                    sort: option.key,
                  })}
                  key={option.key}
                >
                  {option.label}
                </Link>
              ))}
            </div>

            {sortedPendingBacklog.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-2 py-2 text-left text-xs text-muted-foreground uppercase">
                        {recommendationsCopy.pendingPicker.columns.game}
                      </th>
                      <th className="px-2 py-2 text-left text-xs text-muted-foreground uppercase">
                        {recommendationsCopy.pendingPicker.columns.state}
                      </th>
                      <th className="px-2 py-2 text-left text-xs text-muted-foreground uppercase">
                        {recommendationsCopy.pendingPicker.columns.hours}
                      </th>
                      <th className="px-2 py-2 text-left text-xs text-muted-foreground uppercase">
                        {recommendationsCopy.pendingPicker.columns.rating}
                      </th>
                      <th className="px-2 py-2 text-left text-xs text-muted-foreground uppercase">
                        {recommendationsCopy.pendingPicker.columns.ratingPerHour}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPendingBacklog.map((item) => (
                      <tr className="border-b border-border/30" key={`pending-${item.game.igdbId}`}>
                        <td className="px-2 py-2">
                          <Link
                            className="font-medium text-foreground hover:text-primary"
                            href={`/${locale}/game/${item.game.igdbId}`}
                          >
                            {item.game.name}
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {dictionary.library.states[item.state]}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {formatNumber(locale, item.estimatedRemainingHours)}h
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {typeof item.game.rating === "number"
                            ? formatNumber(locale, item.game.rating)
                            : dictionary.library.unknownValue}
                        </td>
                        <td className="px-2 py-2 text-muted-foreground">
                          {typeof item.ratingPerHour === "number"
                            ? formatNumber(locale, item.ratingPerHour)
                            : dictionary.library.unknownValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {recommendationsCopy.pendingPicker.empty}
              </p>
            )}
          </CardContent>
        </Card>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {pageCopy.sections.extendedRecommendationsTitle}
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {pageCopy.sections.extendedRecommendationsDescription}
              </p>
              <Link
                className="inline-flex items-center gap-2 self-start text-sm transition-colors hover:text-primary sm:self-auto"
                href={`/${locale}/popular`}
                title={dictionary.app.popular.title}
              >
                {recommendationsCopy.watchMore}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>

          {recommendationGames.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendationGames.map((game) => {
                const insight = recommendationInsightsByGameId.get(game.igdbId)

                return (
                  <div className="space-y-2" key={`recommendation-${game.igdbId}`}>
                    <GameCard copy={dictionary.search} game={game} locale={locale} />
                    <Card className="border border-border/60 bg-card/70 py-0">
                      <CardContent className="space-y-2 p-3">
                        {insight ? (
                          <>
                            <p className="text-xs text-muted-foreground">
                              {interpolateTemplate(recommendationsCopy.recommendationMeta.score, {
                                score: String(insight.score),
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interpolateTemplate(recommendationsCopy.recommendationMeta.risk, {
                                risk: recommendationsCopy.riskLevels[insight.dropRiskLevel] ?? insight.dropRiskLevel,
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interpolateTemplate(recommendationsCopy.recommendationMeta.hours, {
                                hours: formatNumber(locale, insight.estimatedRemainingHours),
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {interpolateTemplate(recommendationsCopy.recommendationMeta.sessions, {
                                sessions: String(insight.estimatedSessionsToFinish),
                              })}
                            </p>
                            <div className="space-y-1">
                              <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                                {recommendationsCopy.recommendationMeta.reasonsTitle}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {insight.reasons.map((reason) => (
                                  <Badge
                                    className="rounded-none text-[10px]"
                                    key={`reason-${game.igdbId}-${reason}`}
                                    variant="outline"
                                  >
                                    {recommendationsCopy.reasons[reason] ?? reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {pageCopy.sections.fallbackInsight}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          ) : (
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{pageCopy.emptyState}</p>
              </CardContent>
            </Card>
          )}

          {productivityOverview.recommendations.length === 0 && recommendationGames.length > 0 ? (
            <p className="text-sm text-muted-foreground">{recommendationsCopy.fallbackDescription}</p>
          ) : null}
        </section>
      </div>

      <AppFooter dictionary={dictionary.app.footer} locale={locale} profileHref={profileHref} />
    </main>
  )
}
