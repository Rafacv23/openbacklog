"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import type { SupportedLocale } from "@/lib/locales"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type UsernameOnboardingFormProps = {
  copy: {
    description: string
    helper: string
    inputLabel: string
    inputPlaceholder: string
    submit: string
    submitting: string
    errors: {
      generic: string
      invalid: string
      alreadyTaken: string
      tooShort: string
      tooLong: string
    }
  }
  locale: SupportedLocale
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

function mapUsernameError(code: string, messages: UsernameOnboardingFormProps["copy"]["errors"]): string {
  if (code === "USERNAME_IS_ALREADY_TAKEN") {
    return messages.alreadyTaken
  }

  if (code === "USERNAME_TOO_SHORT") {
    return messages.tooShort
  }

  if (code === "USERNAME_TOO_LONG") {
    return messages.tooLong
  }

  if (code === "INVALID_USERNAME") {
    return messages.invalid
  }

  return messages.generic
}

export function UsernameOnboardingForm({ copy, locale }: UsernameOnboardingFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedUsername = normalizeUsername(username)

    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      setErrorMessage(copy.errors.invalid)
      return
    }

    setErrorMessage(null)

    startTransition(async () => {
      const response = await authClient.updateUser({
        username: normalizedUsername,
        displayUsername: normalizedUsername,
      })

      if (response.error) {
        const code = String(response.error.code ?? "").toUpperCase()
        setErrorMessage(mapUsernameError(code, copy.errors))
        return
      }

      router.replace(`/${locale}/feed`)
      router.refresh()
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">{copy.description}</p>

      <div className="space-y-2">
        <label className="text-xs tracking-wide text-muted-foreground uppercase" htmlFor="username-input">
          {copy.inputLabel}
        </label>
        <Input
          autoComplete="username"
          className="h-10"
          disabled={isPending}
          id="username-input"
          maxLength={20}
          minLength={3}
          onChange={(event) => setUsername(event.target.value)}
          pattern="[a-z0-9_]{3,20}"
          placeholder={copy.inputPlaceholder}
          required
          value={username}
        />
      </div>

      <p className="text-xs text-muted-foreground">{copy.helper}</p>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <Button className="h-10 w-full font-headline uppercase" disabled={isPending}>
        {isPending ? copy.submitting : copy.submit}
      </Button>
    </form>
  )
}
