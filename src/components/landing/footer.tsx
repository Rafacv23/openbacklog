import Link from "next/link"

import type { Dictionary } from "@/lib/i18n"
import { OPENBACKLOG_REPO_URL } from "@/lib/github"
import type { SupportedLocale } from "@/lib/locales"
import { cn } from "@/lib/utils"

type LandingFooterProps = {
  dictionary: Dictionary
  locale: SupportedLocale
}

export function LandingFooter({ dictionary, locale }: LandingFooterProps) {
  const usefulLinks = [
    {
      href: `/${locale}/changelog`,
      label: dictionary.home.footer.usefulLinks.changelog,
      external: false,
    },
    {
      href: `/${locale}/features`,
      label: dictionary.home.footer.usefulLinks.features,
      external: false,
    },
    {
      href: "#faq",
      label: dictionary.home.footer.usefulLinks.faq,
      external: false,
    },
    {
      href: OPENBACKLOG_REPO_URL,
      label: dictionary.home.footer.usefulLinks.github,
      external: true,
    },
  ] as const

  return (
    <>
      <footer
        aria-label={dictionary.home.aria.footer}
        className="z-50 border-t border-border/20 bg-popover"
      >
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
          <div>
            <div className="font-headline text-xs tracking-[0.14em] text-primary uppercase">
              {dictionary.home.footer.usefulLinksTitle}
            </div>
            <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
              {dictionary.home.footer.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {usefulLinks.map((link) => (
              <Link
                key={link.label}
                aria-label={`${dictionary.home.aria.footerLink}: ${link.label}`}
                className="inline-flex rounded-none border border-border bg-card px-3 py-1.5 font-body text-[10px] tracking-[0.1em] text-foreground uppercase transition-colors hover:border-primary/50 hover:text-primary"
                href={link.href}
                rel={link.external ? "noreferrer" : undefined}
                target={link.external ? "_blank" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border/20 pt-5">
            <div className="flex flex-col gap-2 font-body text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>{dictionary.home.footer.copyright}</span>
              <div className="flex items-center gap-2">
                <span>{dictionary.home.footer.madeBy}</span>
                <Link
                  className="text-primary underline underline-offset-4 hover:text-primary/85"
                  href="https://www.rafacanosa.dev/en"
                  target="_blank"
                >
                  {dictionary.home.footer.websiteLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <nav
        aria-label={dictionary.home.aria.mobileNavigation}
        className="fixed bottom-0 z-[60] flex w-full items-center justify-around border-t border-border/30 bg-popover py-4 md:hidden"
      >
        {dictionary.home.footer.mobileLinks.map((item, index) => (
          <div
            key={item}
            className={cn(
              "flex flex-col items-center",
              index === 0 ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className="inline-block h-3 w-3 border border-current" />
            <span className="mt-1 font-body text-[8px]">{item}</span>
          </div>
        ))}
      </nav>
    </>
  )
}
