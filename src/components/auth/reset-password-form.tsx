"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { authClient } from "@/lib/auth-client"
import type { AuthPageDictionary } from "@/lib/i18n/auth-dictionary"
import type { SupportedLocale } from "@/lib/locales"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type ResetPasswordFormProps = {
  locale: SupportedLocale
  dictionary: AuthPageDictionary
  token?: string
  tokenError?: string
}

function getErrorCode(error: unknown): string {
  const candidate = error as {
    code?: string
    message?: string
    error?: {
      code?: string
      message?: string
    }
  }

  return (
    candidate?.code ??
    candidate?.error?.code ??
    candidate?.error?.message ??
    candidate?.message ??
    ""
  ).toUpperCase()
}

function getResetErrorMessage(error: unknown, dictionary: AuthPageDictionary): string {
  const code = getErrorCode(error)

  if (code === "INVALID_TOKEN" || code === "TOKEN_EXPIRED") {
    return dictionary.errors.invalidResetToken
  }

  if (code === "PASSWORD_TOO_SHORT") {
    return dictionary.errors.passwordTooShort
  }

  if (code === "PASSWORD_TOO_LONG") {
    return dictionary.errors.passwordTooLong
  }

  return dictionary.errors.generic
}

export function ResetPasswordForm({
  locale,
  dictionary,
  token,
  tokenError,
}: ResetPasswordFormProps) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(
    tokenError ? dictionary.errors.invalidResetToken : null,
  )
  const [isPending, startTransition] = useTransition()

  const hasValidToken = Boolean(token) && !tokenError

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    if (!token) {
      setErrorMessage(dictionary.errors.invalidResetToken)
      return
    }

    if (password.length < 10) {
      setErrorMessage(dictionary.errors.passwordTooShort)
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage(dictionary.errors.passwordMismatch)
      return
    }

    startTransition(async () => {
      const response = await authClient.resetPassword({
        token,
        newPassword: password,
      })

      if (response.error) {
        setErrorMessage(getResetErrorMessage(response.error, dictionary))
        return
      }

      router.replace(`/${locale}/login?passwordReset=success`)
      router.refresh()
    })
  }

  return (
    <Card className="w-full max-w-md border border-border/60 bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-3xl text-foreground">
          {dictionary.resetPassword.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {dictionary.resetPassword.subtitle}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {hasValidToken ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs tracking-wide text-muted-foreground uppercase">
                {dictionary.form.passwordLabel}
              </label>
              <Input
                autoComplete="new-password"
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

            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}

            <Button className="h-10 w-full font-headline uppercase" disabled={isPending}>
              {isPending ? dictionary.states.resetting : dictionary.resetPassword.submit}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-destructive">
            {errorMessage ?? dictionary.errors.invalidResetToken}
          </p>
        )}

        <Link
          className="text-sm text-primary underline-offset-4 hover:underline"
          href={`/${locale}/forgot-password`}
        >
          {dictionary.resetPassword.requestNewLink}
        </Link>
      </CardContent>
    </Card>
  )
}
