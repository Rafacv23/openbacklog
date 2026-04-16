import Link from "next/link"

import { DICTIONARIES, type Dictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/locales"
import { cn } from "@/lib/utils"
import { getOpenBacklogRepoStars } from "@/server/github/get-repo-stars"

import { GitHubStarsLink } from "@/components/landing/github-stars-link"
import { SmoothScrollLink } from "@/components/landing/smooth-scroll-link"
import { buttonVariants } from "@/components/ui/button"
import { LanguageDropdown } from "@/components/landing/language-dropdown"

type LandingHeaderProps = {
  dictionary: Dictionary
  locale: SupportedLocale
  sections: ReadonlyArray<Dictionary["home"]["nav"]["sections"][number]>
}

export async function LandingHeader({
  dictionary,
  locale,
  sections,
}: LandingHeaderProps) {
  const stars = await getOpenBacklogRepoStars()

  const localeOptions = SUPPORTED_LOCALES.map((supportedLocale) => ({
    href: `/${supportedLocale}`,
    label: DICTIONARIES[supportedLocale].localeName,
    locale: supportedLocale,
  }))

  return (
    <nav
      aria-label={dictionary.home.aria.topNavigation}
      className="fixed top-0 left-0 z-50 flex w-full items-center justify-between gap-3 border-b border-border/20 bg-popover/95 px-4 py-3 backdrop-blur xl:px-6"
    >
      <Link
        className="font-headline text-xl font-black tracking-[0.08em] md:text-2xl"
        href={`/${locale}`}
      >
        {dictionary.home.nav.brand}
      </Link>

      <div className="hidden items-center justify-center gap-6 md:flex lg:gap-8">
        {sections.map((section) => (
          <SmoothScrollLink
            key={section.href}
            className="px-1 py-1 font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors duration-150 hover:text-primary"
            href={section.href}
          >
            {section.label}
          </SmoothScrollLink>
        ))}
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <LanguageDropdown
          ariaLabel={dictionary.home.aria.languageSwitcher}
          currentLocale={locale}
          label={dictionary.common.languageSwitcherLabel}
          options={localeOptions}
        />
        <GitHubStarsLink
          ariaLabel={dictionary.home.aria.githubRepository}
          githubLabel={dictionary.home.nav.github}
          initialStars={stars}
          locale={locale}
          starsLabel={dictionary.home.nav.stars}
        />
        <Link
          aria-label={dictionary.home.aria.secondaryCta}
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-auto rounded-none px-3 py-2 font-headline text-[10px] font-bold tracking-[0.12em] uppercase lg:px-4 lg:text-[11px]",
          )}
          href={`/${locale}/login`}
        >
          {dictionary.home.hero.secondaryCta}
        </Link>
      </div>
    </nav>
  )
}
