import type { SupportedLocale } from "@/lib/locales"

import { db } from "@/server/db"
import { preRegistrations } from "@/server/db/schema"
import { sendWaitlistRegistrationEmails } from "@/server/email/send-waitlist-registration-emails"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes("UNIQUE constraint failed") ||
    error.message.includes("SQLITE_CONSTRAINT")
  )
}

function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}

export type RegisterPreRegistrationInput = {
  email: string
  locale: SupportedLocale
}

export type RegisterPreRegistrationResult =
  | { status: "already_registered" }
  | { status: "created" }
  | { status: "created_email_pending" }
  | { status: "invalid_email" }

export async function registerPreRegistration({
  email,
  locale,
}: RegisterPreRegistrationInput): Promise<RegisterPreRegistrationResult> {
  const normalizedEmail = normalizeEmail(email)

  if (!isValidEmail(normalizedEmail)) {
    return { status: "invalid_email" }
  }

  try {
    await db.insert(preRegistrations).values({ email: normalizedEmail })
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "already_registered" }
    }

    throw error
  }

  try {
    const result = await sendWaitlistRegistrationEmails({
      email: normalizedEmail,
      locale,
    })

    if (result.userConfirmationSent && result.adminNotificationSent) {
      return { status: "created" }
    }

    return { status: "created_email_pending" }
  } catch (error) {
    console.error("[waitlist] Failed to send registration emails", {
      email: normalizedEmail,
      error,
    })

    return { status: "created_email_pending" }
  }
}
