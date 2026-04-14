"use client"

import { useState } from "react"

import { Share2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

type GameShareButtonProps = {
  title: string
  text: string
  url: string
  labels: {
    share: string
    shared: string
  }
}

export function GameShareButton({ labels, text, title, url }: GameShareButtonProps) {
  const [wasShared, setWasShared] = useState(false)

  async function handleShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
        setWasShared(true)
        return
      } catch {
        // User cancelled, continue to fallback.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url)
        setWasShared(true)
        return
      } catch {
        // Continue to URL fallback.
      }
    }

    const shareUrl = new URL("https://x.com/intent/post")
    shareUrl.searchParams.set("text", `${text} ${url}`)

    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer")
  }

  return (
    <Button
      className="rounded-none text-[10px] tracking-[0.12em] uppercase"
      onClick={handleShare}
      type="button"
      variant="outline"
    >
      <Share2Icon data-icon="inline-start" />
      {wasShared ? labels.shared : labels.share}
    </Button>
  )
}
