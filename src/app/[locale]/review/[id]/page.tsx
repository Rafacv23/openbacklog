import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import { getPublicReviewById } from "@/server/reviews/service"

type ReviewPageProps = {
  params: Promise<{ locale: string; id: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

function parseReviewId(rawValue: string): number | null {
  if (!/^\d+$/.test(rawValue)) {
    return null
  }

  const parsed = Number(rawValue)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const reviewId = parseReviewId(rawId)

  if (!reviewId) {
    return {}
  }

  const dictionary = getDictionary(locale)
  const review = await getPublicReviewById(reviewId)

  if (!review) {
    return {}
  }

  const title = `${review.game.name} · ${dictionary.reviewPage.metaTitleSuffix}`
  const description = review.body.slice(0, 160)
  const canonicalPath = `/${locale}/review/${review.id}`
  const imageUrl = review.game.coverUrl ?? DEFAULT_SOCIAL_IMAGE_URL

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: `/en/review/${review.id}`,
        es: `/es/review/${review.id}`,
        "x-default": `/en/review/${review.id}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      images: [
        {
          url: imageUrl,
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
      images: [imageUrl],
    },
  }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { locale: rawLocale, id: rawId } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const reviewId = parseReviewId(rawId)

  if (!reviewId) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const review = await getPublicReviewById(reviewId)

  if (!review) {
    notFound()
  }

  const reviewJsonLd = {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewBody: review.body,
    datePublished: review.createdAt,
    dateModified: review.updatedAt,
    author: {
      "@type": "Person",
      name: review.author.displayName,
      alternateName: review.author.username,
      url: `${BASE_URL}/${locale}/profile/${review.author.username}`,
    },
    itemReviewed: {
      "@type": "VideoGame",
      name: review.game.name,
      url: `${BASE_URL}/${locale}/game/${review.game.igdbId}`,
      image: review.game.coverUrl ?? DEFAULT_SOCIAL_IMAGE_URL,
      genre: review.game.genres,
      gamePlatform: review.game.platforms,
    },
    reviewRating: {
      "@type": "Rating",
      bestRating: 1,
      worstRating: 0,
      ratingValue: review.recommend === "recommend" ? 1 : 0,
      alternateName:
        review.recommend === "recommend"
          ? dictionary.reviewPage.recommend
          : dictionary.reviewPage.notRecommend,
    },
  }

  return (
    <main className="relative min-h-screen px-6 py-12 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewJsonLd),
        }}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href={`/${locale}/profile/${review.author.username}`}
          >
            {dictionary.reviewPage.backProfile}
          </Link>
          <Link
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            href={`/${locale}/game/${review.game.igdbId}`}
          >
            {dictionary.reviewPage.backGame}
          </Link>
        </div>

        <Card className="border border-border/60 bg-card/80 py-0">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <h1 className="font-display text-4xl italic text-primary">{review.game.name}</h1>
              <p className="text-sm text-muted-foreground">/{review.game.slug}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-none border-primary/40 bg-background px-2 py-0.5 text-[10px] uppercase"
              >
                {review.recommend === "recommend"
                  ? dictionary.reviewPage.recommend
                  : dictionary.reviewPage.notRecommend}
              </Badge>

              <Badge
                variant="outline"
                className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase"
              >
                @{review.author.username}
              </Badge>

              {review.platformPlayed ? (
                <Badge
                  variant="outline"
                  className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase"
                >
                  {review.platformPlayed}
                </Badge>
              ) : null}
            </div>

            <p className="text-base leading-relaxed text-foreground">{review.body}</p>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {review.hoursToComplete ? (
                <span>
                  {dictionary.reviewPage.hoursLabel.replace("{hours}", String(review.hoursToComplete))}
                </span>
              ) : null}
              <span>
                {dictionary.reviewPage.updatedLabel}:{" "}
                {new Intl.DateTimeFormat(locale, {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }).format(new Date(review.updatedAt))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
