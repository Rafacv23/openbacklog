"use client"

import { MenuIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import type { Dictionary } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/locales"
import { cn } from "@/lib/utils"

import { buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type AppHeaderProps = {
  dictionary: Dictionary["app"]["header"]
  locale: SupportedLocale
  profileHref: string
}

export function AppHeader({ dictionary, locale, profileHref }: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav
      aria-label={dictionary.aria}
      className="sticky max-w-7xl mx-auto top-0 z-40 flex w-full items-center justify-between gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur xl:px-6"
    >
      <Link
        className="font-headline text-sm tracking-[0.12em] text-primary uppercase md:text-base"
        href={`/${locale}/feed`}
      >
        {dictionary.brand}
      </Link>

      <div className="hidden items-center gap-6 md:flex">
        <Link
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href={`/${locale}/popular`}
        >
          {dictionary.popular}
        </Link>
        <Link
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href={`/${locale}/upcoming`}
        >
          {dictionary.upcoming}
        </Link>
        <Link
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href={`/${locale}/library`}
        >
          {dictionary.library}
        </Link>
        <Link
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href={`/${locale}/recommendations`}
        >
          {dictionary.recommendations}
        </Link>
        <Link
          className="font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          href={`/${locale}/friends`}
        >
          {dictionary.friends}
        </Link>
      </div>

      <div className="hidden items-center gap-2 md:flex">
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
      </div>

      <Dialog onOpenChange={setIsMobileMenuOpen} open={isMobileMenuOpen}>
        <DialogTrigger
          render={
            <button
              aria-label={dictionary.menu}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                "h-auto rounded-none px-3 py-2 text-[10px] tracking-[0.1em] uppercase md:hidden",
              )}
              type="button"
            />
          }
        >
          <MenuIcon aria-hidden="true" className="size-4" />
          {dictionary.menu}
        </DialogTrigger>

        <DialogContent className="top-0 left-0 h-dvh w-[min(22rem,86vw)] max-w-none -translate-x-0 -translate-y-0 border-y-0 border-l-0 border-r border-border/60 bg-background p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <DialogTitle className="font-headline text-sm tracking-[0.12em] uppercase">
                {dictionary.menu}
              </DialogTitle>
              <DialogClose
                render={
                  <button
                    aria-label={dictionary.closeMenu}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "ghost" }),
                      "h-auto rounded-none px-2 py-2",
                    )}
                    type="button"
                  />
                }
              >
                <XIcon aria-hidden="true" className="size-4" />
              </DialogClose>
            </div>

            <div className="flex flex-1 flex-col px-4 py-4">
              <Link
                className="border-b border-border/40 py-3 text-xs tracking-[0.1em] text-foreground uppercase"
                href={`/${locale}/feed`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.feed}
              </Link>
              <Link
                className="border-b border-border/40 py-3 text-xs tracking-[0.1em] text-foreground uppercase"
                href={`/${locale}/popular`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.popular}
              </Link>
              <Link
                className="border-b border-border/40 py-3 text-xs tracking-[0.1em] text-foreground uppercase"
                href={`/${locale}/upcoming`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.upcoming}
              </Link>
              <Link
                className="border-b border-border/40 py-3 text-xs tracking-[0.1em] text-foreground uppercase"
                href={`/${locale}/library`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.library}
              </Link>
              <Link
                className="border-b border-border/40 py-3 text-xs tracking-[0.1em] text-foreground uppercase"
                href={`/${locale}/recommendations`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.recommendations}
              </Link>
              <Link
                className="border-b border-border/40 py-3 text-xs tracking-[0.1em] text-foreground uppercase"
                href={`/${locale}/friends`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.friends}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border/50 px-4 py-4">
              <Link
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "h-auto rounded-none px-3 py-2 text-[10px] tracking-[0.1em] uppercase",
                )}
                href={`/${locale}/search`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.search}
              </Link>
              <Link
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-auto rounded-none px-3 py-2 text-[10px] tracking-[0.1em] uppercase",
                )}
                href={profileHref}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {dictionary.profile}
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  )
}
