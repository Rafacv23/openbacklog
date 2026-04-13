import Link from "next/link"

import type { Dictionary } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/locales"
import { cn } from "@/lib/utils"

import { buttonVariants } from "@/components/ui/button"

type AppHeaderProps = {
  dictionary: Dictionary["app"]["header"]
  locale: SupportedLocale
  profileHref: string
}

export function AppHeader({ dictionary, locale, profileHref }: AppHeaderProps) {
  return (
    <nav
      aria-label={dictionary.aria}
      className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur xl:px-6"
    >
      <Link
        className="font-headline text-sm tracking-[0.12em] text-primary uppercase md:text-base"
        href={`/${locale}/feed`}
      >
        {dictionary.brand}
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        <a
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href="#recommendations"
        >
          {dictionary.recommendations}
        </a>
        <a
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href="#feed"
        >
          {dictionary.feed}
        </a>
      </div>

      <div className="flex items-center gap-2">
        <Link
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "h-auto rounded-none px-3 py-2 text-[10px] tracking-[0.1em] uppercase",
          )}
          href={`/${locale}/search`}
        >
          {dictionary.search}
        </Link>
        <Link
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-auto rounded-none px-3 py-2 text-[10px] tracking-[0.1em] uppercase",
          )}
          href={profileHref}
        >
          {dictionary.profile}
        </Link>
        <Link
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href={`/${locale}`}
        >
          {dictionary.landing}
        </Link>
      </div>
    </nav>
  )
}
