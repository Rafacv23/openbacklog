"use client"

import type { MouseEvent, ReactNode } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

type SmoothScrollLinkProps = {
  href: `#${string}`
  className?: string
  children: ReactNode
  ariaLabel?: string
}

export function SmoothScrollLink({
  href,
  className,
  children,
  ariaLabel,
}: SmoothScrollLinkProps) {
  const pathname = usePathname()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector<HTMLElement>(href)

    if (!target) {
      return
    }

    event.preventDefault()
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    window.history.replaceState(window.history.state, "", `${pathname}${href}`)
  }

  return (
    <Link aria-label={ariaLabel} className={className} href={href} onClick={handleClick}>
      {children}
    </Link>
  )
}
