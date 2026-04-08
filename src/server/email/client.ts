import { Resend } from "resend"

let resendClient: Resend | null = null

function getRequiredEnvValue(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing ${name}`)
  }

  return value
}

export function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(getRequiredEnvValue("RESEND_API_KEY"))
  }

  return resendClient
}

export function getResendFromEmail(): string {
  return getRequiredEnvValue("RESEND_FROM_EMAIL")
}

export function getWaitlistAdminEmail(): string {
  return getRequiredEnvValue("WAITLIST_ADMIN_EMAIL")
}

export function getRoadmapSuggestionsAdminEmail(): string {
  const dedicatedInbox = process.env.ROADMAP_SUGGESTIONS_ADMIN_EMAIL?.trim()

  if (dedicatedInbox) {
    return dedicatedInbox
  }

  return getWaitlistAdminEmail()
}
