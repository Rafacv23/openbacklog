"use client"

import { useMemo, useState, useTransition } from "react"

import type { LibraryState } from "@/server/library/states"
import type { ReviewRecommend } from "@/server/reviews/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type GameLibraryReviewPanelProps = {
  copy: {
    libraryTitle: string
    libraryDescription: string
    reviewTitle: string
    reviewDescription: string
    states: Record<LibraryState, string>
    labels: {
      state: string
      platform: string
      hoursToComplete: string
      reviewBody: string
      recommend: string
      notRecommend: string
    }
    placeholders: {
      platform: string
      hoursToComplete: string
      reviewBody: string
    }
    submit: {
      saveLibrary: string
      savingLibrary: string
      saveReview: string
      savingReview: string
    }
    feedback: {
      librarySaved: string
      reviewSaved: string
      invalidPayload: string
      invalidPlatform: string
      genericError: string
    }
  }
  game: {
    igdbId: number
    platforms: string[]
  }
  initialLibraryState: LibraryState | null
  initialReview: {
    body: string
    hoursToComplete: number | null
    platformPlayed: string | null
    recommend: ReviewRecommend
  } | null
}

const ORDERED_STATES: LibraryState[] = [
  "planned",
  "playing",
  "completed",
  "dropped",
  "on_hold",
]

export function GameLibraryReviewPanel({
  copy,
  game,
  initialLibraryState,
  initialReview,
}: GameLibraryReviewPanelProps) {
  const [libraryState, setLibraryState] = useState<LibraryState | "">(
    initialLibraryState ?? "",
  )
  const [reviewBody, setReviewBody] = useState(initialReview?.body ?? "")
  const [recommend, setRecommend] = useState<ReviewRecommend | null>(
    initialReview?.recommend ?? null,
  )
  const [platformPlayed, setPlatformPlayed] = useState(initialReview?.platformPlayed ?? "")
  const [hoursToComplete, setHoursToComplete] = useState(
    initialReview?.hoursToComplete ? String(initialReview.hoursToComplete) : "",
  )
  const [libraryMessage, setLibraryMessage] = useState<string | null>(null)
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)
  const [isSavingLibrary, startLibraryTransition] = useTransition()
  const [isSavingReview, startReviewTransition] = useTransition()

  const platformOptions = useMemo(() => {
    const options = [...new Set(game.platforms)]

    if (!options.includes("Other")) {
      options.push("Other")
    }

    return options
  }, [game.platforms])

  function saveLibrary() {
    setLibraryMessage(null)

    if (!libraryState) {
      setLibraryMessage(copy.feedback.invalidPayload)
      return
    }

    startLibraryTransition(async () => {
      try {
        const response = await fetch("/api/library", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gameIgdbId: game.igdbId,
            state: libraryState,
          }),
        })

        const payload = (await response.json()) as { status?: string }

        if (!response.ok || payload.status !== "ok") {
          setLibraryMessage(copy.feedback.genericError)
          return
        }

        setLibraryMessage(copy.feedback.librarySaved)
      } catch {
        setLibraryMessage(copy.feedback.genericError)
      }
    })
  }

  function saveReview() {
    setReviewMessage(null)

    if (!recommend || reviewBody.trim().length < 1 || reviewBody.trim().length > 500) {
      setReviewMessage(copy.feedback.invalidPayload)
      return
    }

    startReviewTransition(async () => {
      try {
        const response = await fetch(`/api/reviews/${game.igdbId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: reviewBody,
            recommend,
            platformPlayed: platformPlayed.trim() || null,
            hoursToComplete: hoursToComplete.trim() || null,
          }),
        })

        const payload = (await response.json()) as { status?: string }

        if (!response.ok || payload.status !== "ok") {
          if (payload.status === "invalid_platform") {
            setReviewMessage(copy.feedback.invalidPlatform)
            return
          }

          if (payload.status === "invalid_payload") {
            setReviewMessage(copy.feedback.invalidPayload)
            return
          }

          setReviewMessage(copy.feedback.genericError)
          return
        }

        setReviewMessage(copy.feedback.reviewSaved)
        window.location.reload()
      } catch {
        setReviewMessage(copy.feedback.genericError)
      }
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border border-border/60 bg-card/80 py-0">
        <CardContent className="space-y-4 p-4">
          <header className="space-y-1">
            <h2 className="font-headline text-xl uppercase">{copy.libraryTitle}</h2>
            <p className="text-sm text-muted-foreground">{copy.libraryDescription}</p>
          </header>

          <div className="space-y-2">
            <label className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {copy.labels.state}
            </label>
            <select
              className="h-10 w-full border border-border/70 bg-background px-3 text-sm"
              disabled={isSavingLibrary}
              onChange={(event) => setLibraryState(event.target.value as LibraryState)}
              value={libraryState}
            >
              <option value="">{copy.labels.state}</option>
              {ORDERED_STATES.map((state) => (
                <option key={state} value={state}>
                  {copy.states[state]}
                </option>
              ))}
            </select>
          </div>

          <Button
            className="w-full rounded-none text-[10px] tracking-[0.12em] uppercase"
            disabled={isSavingLibrary}
            onClick={saveLibrary}
            type="button"
          >
            {isSavingLibrary ? copy.submit.savingLibrary : copy.submit.saveLibrary}
          </Button>

          {libraryMessage ? (
            <p className="text-xs text-muted-foreground">{libraryMessage}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card/80 py-0">
        <CardContent className="space-y-4 p-4">
          <header className="space-y-1">
            <h2 className="font-headline text-xl uppercase">{copy.reviewTitle}</h2>
            <p className="text-sm text-muted-foreground">{copy.reviewDescription}</p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {copy.labels.platform}
              </label>
              <select
                className="h-10 w-full border border-border/70 bg-background px-3 text-sm"
                disabled={isSavingReview}
                onChange={(event) => setPlatformPlayed(event.target.value)}
                value={platformPlayed}
              >
                <option value="">{copy.placeholders.platform}</option>
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                {copy.labels.hoursToComplete}
              </label>
              <Input
                disabled={isSavingReview}
                min={1}
                onChange={(event) => setHoursToComplete(event.target.value)}
                placeholder={copy.placeholders.hoursToComplete}
                type="number"
                value={hoursToComplete}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {copy.labels.reviewBody}
            </label>
            <Textarea
              className="min-h-24"
              disabled={isSavingReview}
              maxLength={500}
              onChange={(event) => setReviewBody(event.target.value)}
              placeholder={copy.placeholders.reviewBody}
              value={reviewBody}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="rounded-none text-[10px] tracking-[0.1em] uppercase"
              disabled={isSavingReview}
              onClick={() => setRecommend("recommend")}
              type="button"
              variant={recommend === "recommend" ? "default" : "outline"}
            >
              {copy.labels.recommend}
            </Button>
            <Button
              className="rounded-none text-[10px] tracking-[0.1em] uppercase"
              disabled={isSavingReview}
              onClick={() => setRecommend("not_recommend")}
              type="button"
              variant={recommend === "not_recommend" ? "default" : "outline"}
            >
              {copy.labels.notRecommend}
            </Button>
          </div>

          <Button
            className="w-full rounded-none text-[10px] tracking-[0.12em] uppercase"
            disabled={isSavingReview}
            onClick={saveReview}
            type="button"
          >
            {isSavingReview ? copy.submit.savingReview : copy.submit.saveReview}
          </Button>

          {reviewMessage ? <p className="text-xs text-muted-foreground">{reviewMessage}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
