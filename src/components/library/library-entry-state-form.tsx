"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"

import type { LibraryState } from "@/server/library/states"
import { Button } from "@/components/ui/button"

type LibraryEntryStateFormProps = {
  entryId: number
  labels: Record<LibraryState, string>
  messages: {
    currentState: string
    invalidPayload: string
    genericError: string
    stateHelp: string
    stateLabel: string
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
  const router = useRouter()
  const [selectedState, setSelectedState] = useState<LibraryState>(state)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const hasStateChanged = selectedState !== state

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

        router.refresh()
      } catch {
        setErrorMessage(messages.genericError)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/70 p-3">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-[0.08em] uppercase">{messages.stateLabel}</p>
        <p className="text-xs text-muted-foreground">{messages.currentState.replace("{state}", labels[state])}</p>
        <p className="text-xs text-muted-foreground">{messages.stateHelp}</p>
      </div>

      <div className="flex flex-col gap-2">
        <select
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
          className="h-9"
          disabled={isPending || !hasStateChanged}
          onClick={handleSubmit}
          size="sm"
          type="button"
        >
          <Check data-icon="inline-start" />
          {isPending ? messages.submitting : messages.submit}
        </Button>
      </div>

      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
