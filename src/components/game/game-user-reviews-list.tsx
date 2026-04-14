"use client"

import Link from "next/link"
import { useState } from "react"

import type { SupportedLocale } from "@/lib/locales"
import type { GameReviewListItem } from "@/server/reviews/service"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type GameUserReviewsListProps = {
  locale: SupportedLocale
  reviews: GameReviewListItem[]
  copy: {
    title: string
    description: string
    noReviews: string
    recommend: string
    notRecommend: string
    hoursLabel: string
    platformLabel: string
    updatedLabel: string
    revealSpoiler: string
    spoilerHidden: string
    openReview: string
  }
}

export function GameUserReviewsList({
  copy,
  locale,
  reviews,
}: GameUserReviewsListProps) {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<number>>(new Set())

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  function revealSpoiler(reviewId: number) {
    setRevealedSpoilers((previous) => {
      const next = new Set(previous)
      next.add(reviewId)
      return next
    })
  }

  if (reviews.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-headline text-2xl uppercase">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Card className="border border-border/60 bg-card/80 py-0">
          <CardContent className="p-4 text-sm text-muted-foreground">{copy.noReviews}</CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-headline text-2xl uppercase">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <div className="grid gap-3">
        {reviews.map((review) => {
          const hasHiddenSpoiler =
            review.containsSpoilers && !revealedSpoilers.has(review.id)

          return (
            <Card key={review.id} className="border border-border/60 bg-card/80 py-0">
              <CardContent className="flex flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-none border-primary/40 bg-background px-2 py-0.5 text-[10px] uppercase"
                  >
                    {review.recommend === "recommend"
                      ? copy.recommend
                      : copy.notRecommend}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase"
                  >
                    @{review.author.username}
                  </Badge>

                  {review.containsSpoilers ? (
                    <Badge
                      variant="outline"
                      className="rounded-none border-amber-600/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase"
                    >
                      {copy.spoilerHidden}
                    </Badge>
                  ) : null}

                  {review.platformPlayed ? (
                    <Badge
                      variant="outline"
                      className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] uppercase"
                    >
                      {copy.platformLabel}: {review.platformPlayed}
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <p
                    className={
                      hasHiddenSpoiler
                        ? "cursor-pointer select-none rounded-md border border-border/60 bg-muted/50 p-3 text-sm leading-relaxed text-muted-foreground blur-[6px]"
                        : "text-sm leading-relaxed text-foreground"
                    }
                  >
                    {review.body}
                  </p>

                  {hasHiddenSpoiler ? (
                    <Button
                      className="w-fit rounded-none text-[10px] tracking-[0.1em] uppercase"
                      onClick={() => revealSpoiler(review.id)}
                      type="button"
                      variant="outline"
                    >
                      {copy.revealSpoiler}
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {review.hoursToComplete ? (
                    <span>
                      {copy.hoursLabel.replace("{hours}", String(review.hoursToComplete))}
                    </span>
                  ) : null}
                  <span>
                    {copy.updatedLabel}: {dateFormatter.format(new Date(review.updatedAt))}
                  </span>
                </div>

                <Link href={`/${locale}/review/${review.id}`}>
                  <Button
                    className="rounded-none text-[10px] tracking-[0.12em] uppercase"
                    type="button"
                    variant="outline"
                  >
                    {copy.openReview}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
