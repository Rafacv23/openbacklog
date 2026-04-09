"use client"

import Link from "next/link"
import { useState, useTransition } from "react"

import { authClient } from "@/lib/auth-client"
import type { AuthPageDictionary } from "@/lib/i18n/auth-dictionary"
import type { SupportedLocale } from "@/lib/locales"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type ForgotPasswordFormProps = {
  locale: SupportedLocale
  dictionary: AuthPageDictionary
}

function resolveAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") {
    return path
  }

  return new URL(path, window.location.origin).toString()
}

export function ForgotPasswordForm({ locale, dictionary }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const normalizedEmail = email.trim().toLowerCase()

    startTransition(async () => {
      const response = await authClient.requestPasswordReset({
        email: normalizedEmail,
        redirectTo: resolveAbsoluteUrl(`/${locale}/reset-password`),
      })

      if (response.error) {
        setErrorMessage(dictionary.errors.generic)
        return
      }

      setSuccessMessage(dictionary.messages.passwordResetEmailSent)
    })
  }

  return (
    <Card className="w-full max-w-md border border-border/60 bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="font-display text-3xl text-foreground">
          {dictionary.forgotPassword.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {dictionary.forgotPassword.subtitle}
        </p>
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

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {successMessage ? (
            <p className="text-sm text-primary">{successMessage}</p>
          ) : null}

          <Button className="h-10 w-full font-headline uppercase" disabled={isPending}>
            {isPending ? dictionary.states.sending : dictionary.forgotPassword.submit}
          </Button>
        </form>

        <Link
          className="text-sm text-primary underline-offset-4 hover:underline"
          href={`/${locale}/login`}
        >
          {dictionary.forgotPassword.backToLogin}
        </Link>
      </CardContent>
    </Card>
  )
}
