"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { StarIcon } from "lucide-react"

import {
  GITHUB_STARS_REFRESH_INTERVAL_MS,
  OPENBACKLOG_REPO_URL,
} from "@/lib/github"
import type { SupportedLocale } from "@/lib/locales"

type GitHubStarsLinkProps = {
  ariaLabel: string
  githubLabel: string
  initialStars: number | null
  locale: SupportedLocale
  starsLabel: string
}

type StarsApiResponse = {
  stars?: number | null
}

function formatStars(stars: number | null, locale: SupportedLocale) {
  if (stars === null) {
    return "—"
  }

  return new Intl.NumberFormat(locale).format(stars)
}

export function GitHubStarsLink({
  ariaLabel,
  githubLabel,
  initialStars,
  locale,
  starsLabel,
}: GitHubStarsLinkProps) {
  const [stars, setStars] = useState<number | null>(initialStars)

  useEffect(() => {
    let active = true

    const updateStars = async () => {
      try {
        const response = await fetch("/api/github/stars", { cache: "no-store" })
        if (!response.ok) {
          return
        }

        const data = (await response.json()) as StarsApiResponse
        const nextStars = typeof data.stars === "number" ? data.stars : null

        if (active) {
          setStars(nextStars)
        }
      } catch {
        if (active) {
          setStars((current) => current)
        }
      }
    }

    void updateStars()
    const interval = setInterval(updateStars, GITHUB_STARS_REFRESH_INTERVAL_MS)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <Link
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-none px-2 py-1 font-body text-[10px] tracking-[0.08em] text-foreground uppercase transition-colors hover:border-primary hover:text-primary lg:gap-2 lg:px-2.5 lg:py-1.5 lg:text-[11px]"
      href={OPENBACKLOG_REPO_URL}
      rel="noreferrer"
      target="_blank"
    >
      <span className="hidden lg:inline">{githubLabel}</span>
      <span className="inline-flex items-center gap-1 rounded-none bg-popover px-1.5 py-0.5 text-[10px] text-primary">
        <StarIcon />
        <span>{formatStars(stars, locale)}</span>
        <span className="hidden xl:inline">{starsLabel}</span>
      </span>
    </Link>
  )
}
