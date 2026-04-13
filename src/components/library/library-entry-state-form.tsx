"use client"

import { useState, useTransition } from "react"

import type { LibraryState } from "@/server/library/states"
import { Button } from "@/components/ui/button"

type LibraryEntryStateFormProps = {
  entryId: number
  labels: Record<LibraryState, string>
  messages: {
    invalidPayload: string
    genericError: string
    submit: string
    submitting: string
  }
  state: LibraryState
}

const ORDERED_STATES: LibraryState[] = [
  "planned",
  "playing",
  "completed",
  "dropped",
  "on_hold",
]

export function LibraryEntryStateForm({
  entryId,
  labels,
  messages,
  state,
}: LibraryEntryStateFormProps) {
  const [selectedState, setSelectedState] = useState<LibraryState>(state)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!selectedState) {
      setErrorMessage(messages.invalidPayload)
      return
    }

    setErrorMessage(null)

    startTransition(async () => {
      try {
        const response = await fetch(`/api/library/${entryId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            state: selectedState,
          }),
        })

        if (!response.ok) {
          setErrorMessage(messages.genericError)
          return
        }

        window.location.reload()
      } catch {
        setErrorMessage(messages.genericError)
      }
    })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <select
          className="h-9 rounded-none border border-border/70 bg-background px-2 text-xs uppercase"
          disabled={isPending}
          onChange={(event) => setSelectedState(event.target.value as LibraryState)}
          value={selectedState}
        >
          {ORDERED_STATES.map((option) => (
            <option key={option} value={option}>
              {labels[option]}
            </option>
          ))}
        </select>

        <Button
          className="h-9 rounded-none px-3 text-[10px] tracking-[0.08em] uppercase"
          disabled={isPending}
          onClick={handleSubmit}
          type="button"
          variant="outline"
        >
          {isPending ? messages.submitting : messages.submit}
        </Button>
      </div>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
