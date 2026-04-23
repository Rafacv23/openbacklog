import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { GameCard } from "@/components/app/game-card"
import { Card, CardContent } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale, type SupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { cn } from "@/lib/utils"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"
import {
  getPopularGamesByFacet,
  toPopularFacetType,
  type PopularFacetType,
} from "@/server/games/get-popular-games"

type PopularFacetPageProps = {
  params: Promise<{ facetSlug: string; facetType: string; locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const MAX_RESULTS = 12

function safeDecodeValue(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function toReadableFacetLabel(rawValue: string): string {
  const decodedValue = safeDecodeValue(rawValue)

  return decodedValue
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getFacetTypeLabel(locale: SupportedLocale, facetType: PopularFacetType): string {
  const dictionary = getDictionary(locale)

  return facetType === "platform"
    ? dictionary.app.popular.filters.platformSingular
    : dictionary.app.popular.filters.genreSingular
}

function applyTemplate(template: string, values: Record<string, string>): string {
  let output = template

  for (const [key, value] of Object.entries(values)) {
    output = output.replace(new RegExp(`\\{${key}\\}`, "g"), value)
  }

  return output
}

export async function generateMetadata({ params }: PopularFacetPageProps): Promise<Metadata> {
  const { locale: rawLocale, facetType: rawFacetType, facetSlug } = await params
  const locale = toSupportedLocale(rawLocale)
  const facetType = toPopularFacetType(rawFacetType)

  if (!locale || !facetType) {
    return {}
  }

  const dictionary = getDictionary(locale)
  const facetLabel = toReadableFacetLabel(facetSlug)
  const facetTypeLabel = getFacetTypeLabel(locale, facetType)
  const title = applyTemplate(dictionary.app.popular.filters.metaTitle, {
    facet: facetLabel,
    type: facetTypeLabel,
  })
  const description = applyTemplate(dictionary.app.popular.filters.metaDescription, {
    facet: facetLabel,
    type: facetTypeLabel,
  })
  const canonicalPath = `/${locale}/popular/${facetType}/${facetSlug}`

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: `/en/popular/${facetType}/${facetSlug}`,
        es: `/es/popular/${facetType}/${facetSlug}`,
        "x-default": `/en/popular/${facetType}/${facetSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale,
      url: `${BASE_URL}${canonicalPath}`,
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
      description,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function PopularFacetPage({ params }: PopularFacetPageProps) {
  const { locale: rawLocale, facetType: rawFacetType, facetSlug } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const facetType = toPopularFacetType(rawFacetType)

  if (!facetType) {
    notFound()
  }

  const session = await getAuthSession()
  const sessionUsername = getSessionUsername(session)

  const dictionary = getDictionary(locale)
  const profileHref = sessionUsername
    ? `/${locale}/profile/${encodeURIComponent(sessionUsername)}`
    : `/${locale}/login`
  const { activeFacet, games, options } = await getPopularGamesByFacet({
    facetSlug,
    facetType,
    limit: MAX_RESULTS,
  })

  if (!activeFacet) {
    notFound()
  }

  const detailTitle = applyTemplate(dictionary.app.popular.filters.detailTitle, {
    facet: activeFacet.label,
    type:
      facetType === "platform"
        ? dictionary.app.popular.filters.platformSingular
        : dictionary.app.popular.filters.genreSingular,
  })

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:py-10">
        <header className="space-y-3">
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-fit")}
            href={`/${locale}/popular`}
          >
            {dictionary.app.popular.filters.backToPopular}
          </Link>

          <div className="space-y-2">
            <h1 className="font-display text-4xl italic text-primary md:text-5xl">{detailTitle}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              {dictionary.app.popular.filters.detailDescription}
            </p>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="font-headline text-xl uppercase">
            {dictionary.app.popular.filters.switcherTitle}
          </h2>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const isActive = option.slug === activeFacet.slug

              return (
                <Link
                  className={cn(
                    buttonVariants({
                      size: "sm",
                      variant: isActive ? "default" : "outline",
                    }),
                  )}
                  href={`/${locale}/popular/${facetType}/${option.slug}`}
                  key={`${facetType}-${option.slug}`}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          {games.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <GameCard copy={dictionary.search} game={game} key={game.igdbId} locale={locale} />
              ))}
            </div>
          ) : (
            <Card className="border border-border/60 bg-card/70 py-0">
              <CardContent className="space-y-2 p-6">
                <h2 className="font-headline text-xl uppercase">
                  {dictionary.app.popular.filters.emptyTitle}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dictionary.app.popular.filters.emptyBody}
                </p>
                <Link
                  className="text-sm text-primary underline-offset-4 hover:underline"
                  href={`/${locale}/search`}
                >
                  {dictionary.app.popular.emptyCta}
                </Link>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      <AppFooter
        dictionary={dictionary.app.footer}
        locale={locale}
        profileHref={sessionUsername ? profileHref : null}
      />
    </main>
  )
}
