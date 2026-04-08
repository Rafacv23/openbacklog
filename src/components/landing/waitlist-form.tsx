"use client"

import { type FormEvent, useState } from "react"

import type { SupportedLocale } from "@/lib/locales"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type WaitlistFormMessages = {
  ariaEmail: string
  ariaSubmit: string
  button: string
  buttonSubmitting: string
  emailPlaceholder: string
  feedback: {
    alreadyRegistered: string
    createdEmailPending: string
    genericError: string
    invalidEmail: string
    success: string
  }
}

type WaitlistResponseStatus =
  | "already_registered"
  | "created"
  | "created_email_pending"
  | "error"
  | "invalid_email"

type WaitlistFormProps = {
  locale: SupportedLocale
  messages: WaitlistFormMessages
}

export function WaitlistForm({ locale, messages }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function getFeedbackMessage(status: WaitlistResponseStatus): string {
    if (status === "created") {
      return messages.feedback.success
    }

    if (status === "created_email_pending") {
      return messages.feedback.createdEmailPending
    }

    if (status === "already_registered") {
      return messages.feedback.alreadyRegistered
    }

    if (status === "invalid_email") {
      return messages.feedback.invalidEmail
    }

    return messages.feedback.genericError
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setFeedbackMessage(messages.feedback.invalidEmail)
      return
    }

    setIsSubmitting(true)
    setFeedbackMessage("")

    try {
      const response = await fetch("/api/pre-registrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          locale,
        }),
      })

      const payload = (await response.json()) as { status?: WaitlistResponseStatus }
      const status = payload.status ?? "error"

      setFeedbackMessage(getFeedbackMessage(status))

      if (status === "created" || status === "created_email_pending") {
        setEmail("")
      }
    } catch {
      setFeedbackMessage(messages.feedback.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mx-auto mt-10 w-full max-w-[560px]" onSubmit={handleSubmit}>
      <Card className="rounded-none border-0 bg-black py-0 ring-0">
        <CardContent className="flex flex-col gap-0 p-0 md:flex-row">
          <Input
            aria-label={messages.ariaEmail}
            autoComplete="email"
            className="h-14 flex-1 rounded-none border-0 bg-transparent px-5 font-body text-xs tracking-[0.1em] text-primary placeholder:text-white/35 focus-visible:ring-0"
            disabled={isSubmitting}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={messages.emailPlaceholder}
            required
            type="email"
            value={email}
          />
          <Button
            aria-label={messages.ariaSubmit}
            className="h-14 rounded-none border-l border-white/15 bg-black px-7 font-headline text-xs font-bold tracking-[0.12em] text-primary uppercase hover:bg-white/5 disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
            variant="default"
          >
            {isSubmitting ? messages.buttonSubmitting : messages.button}
          </Button>
        </CardContent>
      </Card>

      <p
        aria-live="polite"
        className="mt-4 min-h-5 text-center font-body text-[11px] tracking-[0.03em] text-black/70"
        role="status"
      >
        {feedbackMessage}
      </p>
    </form>
  )
}
