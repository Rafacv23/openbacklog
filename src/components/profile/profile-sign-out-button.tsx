"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import type { SupportedLocale } from "@/lib/locales"

import { Button } from "@/components/ui/button"

type ProfileSignOutButtonProps = {
  locale: SupportedLocale
  messages: {
    error: string
    idle: string
    pending: string
  }
}

export function ProfileSignOutButton({
  locale,
  messages,
}: ProfileSignOutButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleSignOut() {
    setErrorMessage(null)

    startTransition(async () => {
      const response = await authClient.signOut()

      if (response.error) {
        setErrorMessage(messages.error)
        return
      }

      router.replace(`/${locale}/login`)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-fit rounded-none px-3 py-2 text-[10px] tracking-[0.1em] uppercase"
        disabled={isPending}
        onClick={handleSignOut}
        size="sm"
        variant="outline"
      >
        <LogOutIcon data-icon="inline-start" />
        {isPending ? messages.pending : messages.idle}
      </Button>
      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  )
}
