import type { SupportedLocale } from "@/lib/locales"
import { getBaseUrl } from "@/lib/site"

import {
  getResendClient,
  getResendFromEmail,
  getRoadmapSuggestionsAdminEmail,
} from "./client"
import { RoadmapSuggestionAdminEmail } from "./templates/roadmap-suggestion-admin-email"
import { RoadmapSuggestionConfirmationEmail } from "./templates/roadmap-suggestion-confirmation-email"

const userSubjectByLocale: Record<SupportedLocale, string> = {
  en: "We received your OpenBacklog roadmap suggestion",
  es: "Hemos recibido tu sugerencia para el roadmap de OpenBacklog",
}

const adminSubject = "New roadmap suggestion - OpenBacklog"

export type SendRoadmapSuggestionEmailsInput = {
  email: string
  locale: SupportedLocale
  message: string
  title: string
}

export type SendRoadmapSuggestionEmailsResult = {
  adminNotificationSent: boolean
  userConfirmationSent: boolean
}

export async function sendRoadmapSuggestionEmails({
  email,
  locale,
  message,
  title,
}: SendRoadmapSuggestionEmailsInput): Promise<SendRoadmapSuggestionEmailsResult> {
  const resend = getResendClient()
  const fromEmail = getResendFromEmail()
  const adminEmail = getRoadmapSuggestionsAdminEmail()
  const appUrl = getBaseUrl()
  const submittedAtIso = new Date().toISOString()

  const [userResult, adminResult] = await Promise.allSettled([
    resend.emails.send({
      from: fromEmail,
      to: email,
      subject: userSubjectByLocale[locale],
      react: (
        <RoadmapSuggestionConfirmationEmail
          appUrl={appUrl}
          locale={locale}
          suggestionTitle={title}
        />
      ),
    }),
    resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: adminSubject,
      react: (
        <RoadmapSuggestionAdminEmail
          email={email}
          locale={locale}
          message={message}
          submittedAtIso={submittedAtIso}
          title={title}
        />
      ),
    }),
  ])

  if (userResult.status === "rejected") {
    console.error("[roadmap] Failed to send user confirmation email", {
      email,
      error: userResult.reason,
    })
  }

  if (adminResult.status === "rejected") {
    console.error("[roadmap] Failed to send admin notification email", {
      email,
      error: adminResult.reason,
    })
  }

  return {
    userConfirmationSent: userResult.status === "fulfilled",
    adminNotificationSent: adminResult.status === "fulfilled",
  }
}
