"use client"

import { type FormEvent, useState } from "react"

import type { SupportedLocale } from "@/lib/locales"

import { Button } from "@/components/ui/button"
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

type RoadmapSuggestionMessages = {
  trigger: string
  modalTitle: string
  modalDescription: string
  close: string
  submit: string
  submitSubmitting: string
  fields: {
    emailLabel: string
    emailPlaceholder: string
    titleLabel: string
    titlePlaceholder: string
    messageLabel: string
    messagePlaceholder: string
  }
  feedback: {
    created: string
    createdEmailPending: string
    invalidEmail: string
    invalidPayload: string
    genericError: string
  }
}

type RoadmapSuggestionResponseStatus =
  | "created"
  | "created_email_pending"
  | "error"
  | "invalid_email"
  | "invalid_payload"

type RoadmapSuggestionDialogProps = {
  locale: SupportedLocale
  messages: RoadmapSuggestionMessages
}

export function RoadmapSuggestionDialog({
  locale,
  messages,
}: RoadmapSuggestionDialogProps) {
  const [email, setEmail] = useState("")
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState("")

  function mapFeedback(status: RoadmapSuggestionResponseStatus): string {
    if (status === "created") {
      return messages.feedback.created
    }

    if (status === "created_email_pending") {
      return messages.feedback.createdEmailPending
    }

    if (status === "invalid_email") {
      return messages.feedback.invalidEmail
    }

    if (status === "invalid_payload") {
      return messages.feedback.invalidPayload
    }

    return messages.feedback.genericError
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSubmitting(true)
    setFeedbackMessage("")

    try {
      const response = await fetch("/api/roadmap-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          title,
          message,
          locale,
        }),
      })

      const payload = (await response.json()) as {
        status?: RoadmapSuggestionResponseStatus
      }
      const status = payload.status ?? "error"

      setFeedbackMessage(mapFeedback(status))

      if (status === "created" || status === "created_email_pending") {
        setEmail("")
        setTitle("")
        setMessage("")
      }
    } catch {
      setFeedbackMessage(messages.feedback.genericError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="h-auto rounded-none px-5 py-2 font-headline text-xs tracking-[0.12em] uppercase" />
        }
      >
        {messages.trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{messages.modalTitle}</DialogTitle>
        <DialogDescription className="mt-2">
          {messages.modalDescription}
        </DialogDescription>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="font-body text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {messages.fields.emailLabel}
            </label>
            <Input
              autoComplete="email"
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={messages.fields.emailPlaceholder}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {messages.fields.titleLabel}
            </label>
            <Input
              disabled={isSubmitting}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={messages.fields.titlePlaceholder}
              required
              value={title}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-body text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
              {messages.fields.messageLabel}
            </label>
            <Textarea
              disabled={isSubmitting}
              maxLength={4000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={messages.fields.messagePlaceholder}
              required
              rows={7}
              value={message}
            />
          </div>

          <p
            aria-live="polite"
            className="min-h-5 font-body text-xs text-muted-foreground"
            role="status"
          >
            {feedbackMessage}
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              className="h-auto rounded-none px-5 py-2 font-headline text-xs tracking-[0.12em] uppercase"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? messages.submitSubmitting : messages.submit}
            </Button>
            <DialogClose
              render={
                <Button
                  className="h-auto rounded-none px-5 py-2 font-headline text-xs tracking-[0.12em] uppercase"
                  variant="outline"
                />
              }
            >
              {messages.close}
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
