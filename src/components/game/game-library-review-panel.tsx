"use client"

import { useMemo, useState, useTransition } from "react"

import type { LibraryState } from "@/server/library/states"
import type { ReviewRecommend } from "@/server/reviews/constants"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type GameLibraryReviewPanelProps = {
  copy: {
    libraryTitle: string
    libraryDescription: string
    reviewTitle: string
    reviewDescription: string
    actions: {
      openLibraryModal: string
      openReviewModal: string
      closeModal: string
    }
    states: Record<LibraryState, string>
    labels: {
      state: string
      platform: string
      hoursToComplete: string
      reviewBody: string
      recommend: string
      notRecommend: string
      containsSpoilers: string
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
    containsSpoilers: boolean
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
  const [containsSpoilers, setContainsSpoilers] = useState(
    initialReview?.containsSpoilers ?? false,
  )
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
            containsSpoilers,
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
      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-primary/10 py-0">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-xl uppercase">{copy.libraryTitle}</h2>
            <p className="text-sm text-muted-foreground">{copy.libraryDescription}</p>
          </div>

          {libraryState ? (
            <Badge
              variant="outline"
              className="w-fit rounded-none border-primary/40 bg-background px-2 py-0.5 text-[10px] uppercase"
            >
              {copy.labels.state}: {copy.states[libraryState]}
            </Badge>
          ) : null}

          <Dialog>
            <DialogTrigger
              render={
                <Button className="w-full rounded-none text-[10px] tracking-[0.12em] uppercase" />
              }
            >
              {copy.actions.openLibraryModal}
            </DialogTrigger>

            <DialogContent className="border-border/60 bg-popover/95">
              <DialogTitle>{copy.libraryTitle}</DialogTitle>
              <DialogDescription>{copy.libraryDescription}</DialogDescription>

              <div className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
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

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-none text-[10px] tracking-[0.12em] uppercase"
                    disabled={isSavingLibrary}
                    onClick={saveLibrary}
                    type="button"
                  >
                    {isSavingLibrary ? copy.submit.savingLibrary : copy.submit.saveLibrary}
                  </Button>

                  <DialogClose
                    render={
                      <Button
                        className="rounded-none text-[10px] tracking-[0.12em] uppercase"
                        variant="outline"
                      />
                    }
                  >
                    {copy.actions.closeModal}
                  </DialogClose>
                </div>

                {libraryMessage ? (
                  <p className="text-xs text-muted-foreground">{libraryMessage}</p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-gradient-to-br from-card via-card to-muted/30 py-0">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="font-headline text-xl uppercase">{copy.reviewTitle}</h2>
            <p className="text-sm text-muted-foreground">{copy.reviewDescription}</p>
          </div>

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  className="w-full rounded-none text-[10px] tracking-[0.12em] uppercase"
                  variant="outline"
                />
              }
            >
              {copy.actions.openReviewModal}
            </DialogTrigger>

            <DialogContent className="max-w-2xl border-border/60 bg-popover/95">
              <DialogTitle>{copy.reviewTitle}</DialogTitle>
              <DialogDescription>{copy.reviewDescription}</DialogDescription>

              <div className="mt-6 flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
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

                  <div className="flex flex-col gap-2">
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

                <div className="flex flex-col gap-2">
                  <label className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                    {copy.labels.reviewBody}
                  </label>
                  <Textarea
                    className="min-h-28"
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

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={containsSpoilers}
                    onCheckedChange={(checked) => setContainsSpoilers(Boolean(checked))}
                  />
                  {copy.labels.containsSpoilers}
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-none text-[10px] tracking-[0.12em] uppercase"
                    disabled={isSavingReview}
                    onClick={saveReview}
                    type="button"
                  >
                    {isSavingReview ? copy.submit.savingReview : copy.submit.saveReview}
                  </Button>

                  <DialogClose
                    render={
                      <Button
                        className="rounded-none text-[10px] tracking-[0.12em] uppercase"
                        variant="outline"
                      />
                    }
                  >
                    {copy.actions.closeModal}
                  </DialogClose>
                </div>

                {reviewMessage ? (
                  <p className="text-xs text-muted-foreground">{reviewMessage}</p>
                ) : null}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
}
