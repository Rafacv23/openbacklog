"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type FollowToggleButtonProps = {
  username: string
  initiallyFollowing: boolean
  labels: {
    follow: string
    unfollow: string
    followSubmitting: string
    unfollowSubmitting: string
    genericError: string
  }
}

type FollowApiResponse = {
  status?: string
  data?: {
    following?: boolean
  }
}

export function FollowToggleButton({ username, initiallyFollowing, labels }: FollowToggleButtonProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setIsFollowing(initiallyFollowing)
  }, [initiallyFollowing])

  function onToggleFollow() {
    setErrorMessage(null)

    startTransition(async () => {
      const method = isFollowing ? "DELETE" : "POST"

      try {
        const response = await fetch(`/api/friends/${encodeURIComponent(username)}`, {
          method,
        })

        if (!response.ok) {
          setErrorMessage(labels.genericError)
          return
        }

        const payload = (await response.json()) as FollowApiResponse

        if (payload.status !== "ok") {
          setErrorMessage(labels.genericError)
          return
        }

        setIsFollowing(Boolean(payload.data?.following))
        router.refresh()
      } catch {
        setErrorMessage(labels.genericError)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={isPending}
        onClick={onToggleFollow}
        size="sm"
        type="button"
        variant={isFollowing ? "outline" : "default"}
      >
        {isPending
          ? isFollowing
            ? labels.unfollowSubmitting
            : labels.followSubmitting
          : isFollowing
            ? labels.unfollow
            : labels.follow}
      </Button>

      {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
    </div>
  )
}
