import type { SupportedLocale } from "@/lib/locales"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl } from "@/lib/site"

import { getResendClient, getResendFromEmail } from "./client"
import { AuthEmailVerificationEmail } from "./templates/auth-email-verification-email"
import { AuthResetPasswordEmail } from "./templates/auth-reset-password-email"

const verifySubjectByLocale: Record<SupportedLocale, string> = {
  en: "Verify your OpenBacklog email",
  es: "Verifica tu correo de OpenBacklog",
}

const passwordResetSubjectByLocale: Record<SupportedLocale, string> = {
  en: "Reset your OpenBacklog password",
  es: "Restablece tu contrasena de OpenBacklog",
}

function resolveLocaleFromUrl(value: string): SupportedLocale | null {
  const baseUrl = getBaseUrl()

  try {
    const parsedUrl = new URL(value, baseUrl)
    const callbackURL = parsedUrl.searchParams.get("callbackURL")

    if (callbackURL) {
      const callbackUrl = new URL(decodeURIComponent(callbackURL), baseUrl)
      const callbackLocale = toSupportedLocale(
        callbackUrl.pathname.split("/")[1] ?? "",
      )

      if (callbackLocale) {
        return callbackLocale
      }
    }

    return toSupportedLocale(parsedUrl.pathname.split("/")[1] ?? "")
  } catch {
    return null
  }
}

function resolveLocaleFromRequest(request?: Request): SupportedLocale | null {
  const acceptLanguage = request?.headers.get("accept-language")?.toLowerCase() ?? ""

  if (acceptLanguage.startsWith("es")) {
    return "es"
  }

  if (acceptLanguage.startsWith("en")) {
    return "en"
  }

  return null
}

function resolveAuthEmailLocale(url: string, request?: Request): SupportedLocale {
  return resolveLocaleFromUrl(url) ?? resolveLocaleFromRequest(request) ?? "en"
}

export async function sendAuthVerificationEmail({
  email,
  verificationUrl,
  locale,
}: {
  email: string
  verificationUrl: string
  locale: SupportedLocale
}) {
  const resend = getResendClient()
  const fromEmail = getResendFromEmail()

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: verifySubjectByLocale[locale],
    react: (
      <AuthEmailVerificationEmail
        locale={locale}
        verificationUrl={verificationUrl}
      />
    ),
  })
}

export async function sendAuthPasswordResetEmail({
  email,
  resetUrl,
  locale,
}: {
  email: string
  resetUrl: string
  locale: SupportedLocale
}) {
  const resend = getResendClient()
  const fromEmail = getResendFromEmail()

  await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: passwordResetSubjectByLocale[locale],
    react: <AuthResetPasswordEmail locale={locale} resetUrl={resetUrl} />,
  })
}

export async function sendAuthVerificationEmailFromContext({
  email,
  verificationUrl,
  request,
}: {
  email: string
  verificationUrl: string
  request?: Request
}) {
  const locale = resolveAuthEmailLocale(verificationUrl, request)

  await sendAuthVerificationEmail({
    email,
    verificationUrl,
    locale,
  })
}

export async function sendAuthPasswordResetEmailFromContext({
  email,
  resetUrl,
  request,
}: {
  email: string
  resetUrl: string
  request?: Request
}) {
  const locale = resolveAuthEmailLocale(resetUrl, request)

  await sendAuthPasswordResetEmail({
    email,
    resetUrl,
    locale,
  })
}
