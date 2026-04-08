import type { SupportedLocale } from "@/lib/locales"

import { sendRoadmapSuggestionEmails } from "@/server/email/send-roadmap-suggestion-emails"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TITLE_MIN_LENGTH = 4
const TITLE_MAX_LENGTH = 120
const MESSAGE_MIN_LENGTH = 10
const MESSAGE_MAX_LENGTH = 4000

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function normalizeMessage(value: string): string {
  return value.trim()
}

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

function isValidTextLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max
}

export type SubmitRoadmapSuggestionInput = {
  email: string
  locale: SupportedLocale
  message: string
  title: string
}

export type SubmitRoadmapSuggestionResult =
  | { status: "created" }
  | { status: "created_email_pending" }
  | { status: "invalid_email" }
  | { status: "invalid_payload" }

export async function submitRoadmapSuggestion({
  email,
  locale,
  message,
  title,
}: SubmitRoadmapSuggestionInput): Promise<SubmitRoadmapSuggestionResult> {
  const normalizedEmail = normalizeEmail(email)
  const normalizedTitle = normalizeText(title)
  const normalizedMessage = normalizeMessage(message)

  if (!isValidEmail(normalizedEmail)) {
    return { status: "invalid_email" }
  }

  if (
    !isValidTextLength(normalizedTitle, TITLE_MIN_LENGTH, TITLE_MAX_LENGTH) ||
    !isValidTextLength(normalizedMessage, MESSAGE_MIN_LENGTH, MESSAGE_MAX_LENGTH)
  ) {
    return { status: "invalid_payload" }
  }

  try {
    const result = await sendRoadmapSuggestionEmails({
      email: normalizedEmail,
      locale,
      message: normalizedMessage,
      title: normalizedTitle,
    })

    if (result.userConfirmationSent && result.adminNotificationSent) {
      return { status: "created" }
    }

    return { status: "created_email_pending" }
  } catch (error) {
    console.error("[roadmap] Failed to send suggestion emails", {
      email: normalizedEmail,
      error,
    })

    return { status: "created_email_pending" }
  }
}
