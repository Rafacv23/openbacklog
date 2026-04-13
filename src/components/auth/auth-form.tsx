"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { authClient } from "@/lib/auth-client"
import type {
  AuthFormMode,
  AuthPageDictionary,
} from "@/lib/i18n/auth-dictionary"
import type { SupportedLocale } from "@/lib/locales"
import { cn } from "@/lib/utils"
import type { SocialAuthProvider } from "@/server/auth"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type AuthErrorShape = {
  status?: number
  message?: string
  code?: string
  error?: {
    code?: string
    message?: string
  }
}

type AuthFormProps = {
  mode: AuthFormMode
  locale: SupportedLocale
  dictionary: AuthPageDictionary
  enabledSocialProviders: Record<SocialAuthProvider, boolean>
}

function resolveRedirectPath(locale: SupportedLocale): string {
  return `/${locale}/feed`
}

function resolveAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") {
    return path
  }

  return new URL(path, window.location.origin).toString()
}

function buildDisplayNameFromEmail(email: string): string {
  const rawName = email.split("@")[0] ?? "player"
  const normalizedName = rawName.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40)

  if (normalizedName.length > 0) {
    return normalizedName
  }

  return "player"
}

function getErrorCode(error: unknown): string {
  const candidate = error as AuthErrorShape
  const rawCode =
    candidate?.code ??
    candidate?.error?.code ??
    candidate?.error?.message ??
    candidate?.message ??
    ""

  return rawCode.toUpperCase()
}

function getErrorMessage(
  error: unknown,
  mode: AuthFormMode,
  dictionary: AuthPageDictionary,
): string {
  const candidate = error as AuthErrorShape
  const status = candidate?.status
  const code = getErrorCode(error)
  const message =
    candidate?.message?.toLowerCase() ??
    candidate?.error?.message?.toLowerCase() ??
    ""

  if (code === "EMAIL_NOT_VERIFIED") {
    return dictionary.errors.emailNotVerified
  }

  if (code === "USER_ALREADY_EXISTS" || status === 409) {
    return dictionary.errors.emailAlreadyInUse
  }

  if (code === "INVALID_EMAIL_OR_PASSWORD") {
    return dictionary.errors.invalidCredentials
  }

  if (code === "PASSWORD_TOO_SHORT") {
    return dictionary.errors.passwordTooShort
  }

  if (code === "PASSWORD_TOO_LONG") {
    return dictionary.errors.passwordTooLong
  }

  if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") {
    return dictionary.errors.invalidResetToken
  }

  if (
    message.includes("already") &&
    (message.includes("exists") || message.includes("registered"))
  ) {
    return dictionary.errors.emailAlreadyInUse
  }

  if (status === 401 || message.includes("invalid email or password")) {
    return dictionary.errors.invalidCredentials
  }

  if (
    message.includes("password") &&
    (message.includes("at least") ||
      message.includes("minimum") ||
      message.includes("short"))
  ) {
    return dictionary.errors.passwordTooShort
  }

  if (mode === "login" && status === 400) {
    return dictionary.errors.invalidCredentials
  }

  return dictionary.errors.generic
}

function ProviderIcon({ provider }: { provider: SocialAuthProvider }) {
  if (provider === "google") {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
        <path
          d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.46a5.53 5.53 0 0 1-2.39 3.63v3h3.88c2.28-2.1 3.54-5.2 3.54-8.66Z"
          fill="#4285F4"
        />
        <path
          d="M12 24c3.24 0 5.95-1.08 7.94-2.92l-3.88-3c-1.08.73-2.45 1.17-4.06 1.17-3.12 0-5.77-2.1-6.71-4.92H1.28v3.08A12 12 0 0 0 12 24Z"
          fill="#34A853"
        />
        <path
          d="M5.29 14.33a7.2 7.2 0 0 1 0-4.66V6.59H1.28a12 12 0 0 0 0 10.82l4.01-3.08Z"
          fill="#FBBC04"
        />
        <path
          d="M12 4.77c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.95 1.14 15.24 0 12 0A12 12 0 0 0 1.28 6.59l4.01 3.08C6.23 6.87 8.88 4.77 12 4.77Z"
          fill="#EA4335"
        />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.52 0-.26-.01-1.11-.02-2.01-2.95.64-3.57-1.25-3.57-1.25-.48-1.23-1.18-1.56-1.18-1.56-.96-.66.08-.65.08-.65 1.06.08 1.62 1.09 1.62 1.09.95 1.62 2.49 1.15 3.1.88.1-.68.37-1.15.67-1.42-2.35-.27-4.83-1.17-4.83-5.22 0-1.15.41-2.09 1.08-2.83-.11-.27-.47-1.37.1-2.86 0 0 .89-.28 2.91 1.08a10.2 10.2 0 0 1 5.3 0c2.01-1.36 2.9-1.08 2.9-1.08.58 1.49.22 2.59.11 2.86.67.74 1.08 1.68 1.08 2.83 0 4.06-2.48 4.94-4.84 5.2.38.33.72.98.72 1.98 0 1.43-.01 2.58-.01 2.93 0 .29.19.63.73.52A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  )
}

export function AuthForm({
  mode,
  locale,
  dictionary,
  enabledSocialProviders,
}: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isRegister = mode === "register"
  const content = isRegister ? dictionary.register : dictionary.login
  const redirectPath = resolveRedirectPath(locale)

  const providerOptions: Array<{
    id: SocialAuthProvider
    label: string
    enabled: boolean
  }> = [
    {
      id: "google",
      label: dictionary.providers.google,
      enabled: enabledSocialProviders.google,
    },
    {
      id: "github",
      label: dictionary.providers.github,
      enabled: enabledSocialProviders.github,
    },
  ]

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setInfoMessage(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (isRegister) {
      if (password.length < 10) {
        setErrorMessage(dictionary.errors.passwordTooShort)
        return
      }

      if (password !== confirmPassword) {
        setErrorMessage(dictionary.errors.passwordMismatch)
        return
      }
    }

    startTransition(async () => {
      const response = isRegister
        ? await authClient.signUp.email({
            email: normalizedEmail,
            password,
            name: buildDisplayNameFromEmail(normalizedEmail),
            callbackURL: resolveAbsoluteUrl(`/${locale}/login?verified=1`),
          })
        : await authClient.signIn.email({
            email: normalizedEmail,
            password,
            rememberMe: true,
          })

      if (response.error) {
        const code = getErrorCode(response.error)
        setErrorMessage(getErrorMessage(response.error, mode, dictionary))

        if (code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(normalizedEmail)
        } else {
          setUnverifiedEmail(null)
        }

        return
      }

      if (isRegister) {
        setUnverifiedEmail(normalizedEmail)
        setInfoMessage(dictionary.messages.registrationCheckInbox)
        return
      }

      router.replace(redirectPath)
      router.refresh()
    })
  }

  function handleSocialSignIn(provider: SocialAuthProvider) {
    if (!enabledSocialProviders[provider]) {
      setErrorMessage(dictionary.errors.providerNotEnabled)
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)

    startTransition(async () => {
      const response = await authClient.signIn.social({
        provider,
        callbackURL: resolveAbsoluteUrl(redirectPath),
      })

      if (response.error) {
        setErrorMessage(getErrorMessage(response.error, mode, dictionary))
      }
    })
  }

  function handleResendVerificationEmail() {
    if (!unverifiedEmail) {
      return
    }

    setErrorMessage(null)
    setInfoMessage(null)

    startTransition(async () => {
      const response = await authClient.sendVerificationEmail({
        email: unverifiedEmail,
        callbackURL: resolveAbsoluteUrl(`/${locale}/login?verified=1`),
      })

      if (response.error) {
        setErrorMessage(getErrorMessage(response.error, mode, dictionary))
        return
      }

      setInfoMessage(dictionary.messages.verificationEmailSent)
    })
  }

  return (
    <Card className="w-full max-w-md border border-border/60 bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-3xl text-foreground">
          {content.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{content.subtitle}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs tracking-wide text-muted-foreground uppercase">
              {dictionary.form.emailLabel}
            </label>
            <Input
              autoComplete="email"
              className="h-10"
              disabled={isPending}
              inputMode="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={dictionary.form.emailPlaceholder}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs tracking-wide text-muted-foreground uppercase">
              {dictionary.form.passwordLabel}
            </label>
            <Input
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="h-10"
              disabled={isPending}
              minLength={10}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={dictionary.form.passwordPlaceholder}
              required
              type="password"
              value={password}
            />
          </div>

          {!isRegister ? (
            <Link
              className="text-xs text-primary underline-offset-4 hover:underline"
              href={`/${locale}/forgot-password`}
            >
              {dictionary.login.forgotPassword}
            </Link>
          ) : null}

          {isRegister ? (
            <div className="space-y-2">
              <label className="text-xs tracking-wide text-muted-foreground uppercase">
                {dictionary.form.confirmPasswordLabel}
              </label>
              <Input
                autoComplete="new-password"
                className="h-10"
                disabled={isPending}
                minLength={10}
                name="confirmPassword"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={dictionary.form.confirmPasswordPlaceholder}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
          ) : null}

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {infoMessage ? (
            <p className="text-sm text-primary">{infoMessage}</p>
          ) : null}

          {!isRegister && unverifiedEmail ? (
            <Button
              disabled={isPending}
              onClick={handleResendVerificationEmail}
              type="button"
              variant="ghost"
            >
              {isPending
                ? dictionary.states.sending
                : dictionary.login.resendVerification}
            </Button>
          ) : null}

          <Button className="h-10 w-full font-headline uppercase" disabled={isPending}>
            {isPending ? dictionary.states.submitting : content.submit}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase">
            {dictionary.common.dividerText}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-3">
          {providerOptions.map((provider) => (
            <Button
              key={provider.id}
              className={cn("h-10 w-full", !provider.enabled && "opacity-60")}
              disabled={isPending || !provider.enabled}
              onClick={() => handleSocialSignIn(provider.id)}
              type="button"
              variant="outline"
            >
              <ProviderIcon provider={provider.id} />
              {provider.label}
            </Button>
          ))}

          {!providerOptions.some((provider) => provider.enabled) ? (
            <p className="text-sm text-muted-foreground">
              {dictionary.providers.unavailable}
            </p>
          ) : null}
        </div>

        <p className="text-sm text-muted-foreground">
          {content.alternatePrompt}{" "}
          <Link
            className="font-medium text-primary underline-offset-4 hover:underline"
            href={isRegister ? `/${locale}/login` : `/${locale}/register`}
          >
            {content.alternateAction}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
