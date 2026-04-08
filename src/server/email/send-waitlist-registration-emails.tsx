import { getBaseUrl } from "@/lib/site"
import type { SupportedLocale } from "@/lib/locales"

import {
  getResendClient,
  getResendFromEmail,
  getWaitlistAdminEmail,
} from "./client"
import { WaitlistAdminNotificationEmail } from "./templates/waitlist-admin-notification-email"
import { WaitlistConfirmationEmail } from "./templates/waitlist-confirmation-email"

const userSubjectByLocale: Record<SupportedLocale, string> = {
  en: "You are on the OpenBacklog waitlist",
  es: "Ya estás en la waitlist de OpenBacklog",
}

const adminSubject = "Nuevo registro en la waitlist de OpenBacklog"

export type SendWaitlistRegistrationEmailsInput = {
  email: string
  locale: SupportedLocale
}

export type SendWaitlistRegistrationEmailsResult = {
  adminNotificationSent: boolean
  userConfirmationSent: boolean
}

export async function sendWaitlistRegistrationEmails({
  email,
  locale,
}: SendWaitlistRegistrationEmailsInput): Promise<SendWaitlistRegistrationEmailsResult> {
  const resend = getResendClient()
  const appUrl = getBaseUrl()
  const fromEmail = getResendFromEmail()
  const adminEmail = getWaitlistAdminEmail()
  const registeredAtIso = new Date().toISOString()

  const [userResult, adminResult] = await Promise.allSettled([
    resend.emails.send({
      from: fromEmail,
      to: email,
      subject: userSubjectByLocale[locale],
      react: <WaitlistConfirmationEmail appUrl={appUrl} locale={locale} />,
    }),
    resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: adminSubject,
      react: (
        <WaitlistAdminNotificationEmail
          email={email}
          registeredAtIso={registeredAtIso}
        />
      ),
    }),
  ])

  if (userResult.status === "rejected") {
    console.error("[waitlist] Failed to send user confirmation email", {
      email,
      error: userResult.reason,
    })
  }

  if (adminResult.status === "rejected") {
    console.error("[waitlist] Failed to send admin notification email", {
      email,
      error: adminResult.reason,
    })
  }

  return {
    userConfirmationSent: userResult.status === "fulfilled",
    adminNotificationSent: adminResult.status === "fulfilled",
  }
}
