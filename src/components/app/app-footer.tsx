import Link from "next/link"

import type { Dictionary } from "@/lib/i18n"
import { OPENBACKLOG_REPO_URL } from "@/lib/github"
import type { SupportedLocale } from "@/lib/locales"
import { FooterLocaleDropdown } from "@/components/app/footer-locale-dropdown"

type AppFooterProps = {
  dictionary: Dictionary["app"]["footer"]
  locale: SupportedLocale
  profileHref?: string | null
}

type FooterLink = {
  href: string
  label: string
  external: boolean
}

type FooterLinkGroup = {
  title: string
  links: FooterLink[]
}

export function AppFooter({
  dictionary,
  locale,
  profileHref = null,
}: AppFooterProps) {
  const productLinks: FooterLink[] = [
    {
      href: `/${locale}/feed`,
      label: dictionary.usefulLinks.feed,
      external: false,
    },
    {
      href: `/${locale}/library`,
      label: dictionary.usefulLinks.library,
      external: false,
    },
    {
      href: `/${locale}/search`,
      label: dictionary.usefulLinks.search,
      external: false,
    },
    {
      href: `/${locale}/popular`,
      label: dictionary.usefulLinks.popular,
      external: false,
    },
    {
      href: `/${locale}/upcoming`,
      label: dictionary.usefulLinks.upcoming,
      external: false,
    },
  ]

  const accountLinks: FooterLink[] = []

  if (profileHref) {
    accountLinks.push({
      href: profileHref,
      label: dictionary.usefulLinks.profile,
      external: false,
    })
  }

  accountLinks.push(
    {
      href: `/${locale}/roadmap`,
      label: dictionary.usefulLinks.roadmap,
      external: false,
    },
    {
      href: `/${locale}/changelog`,
      label: dictionary.usefulLinks.changelog,
      external: false,
    },
  )

  const communityLinks: FooterLink[] = [
    {
      href: OPENBACKLOG_REPO_URL,
      label: dictionary.usefulLinks.github,
      external: true,
    },
    {
      href: `${OPENBACKLOG_REPO_URL}/blob/main/CONTRIBUTING.md`,
      label: dictionary.usefulLinks.contribute,
      external: true,
    },
    {
      href: `${OPENBACKLOG_REPO_URL}/issues`,
      label: dictionary.usefulLinks.issues,
      external: true,
    },
  ]

  const legalLinks: FooterLink[] = [
    {
      href: `/${locale}/privacy`,
      label: dictionary.usefulLinks.privacy,
      external: false,
    },
    {
      href: `/${locale}/terms`,
      label: dictionary.usefulLinks.terms,
      external: false,
    },
  ]

  const linkGroups: FooterLinkGroup[] = [
    {
      title: dictionary.sections.product,
      links: productLinks,
    },
    {
      title: dictionary.sections.account,
      links: accountLinks,
    },
    {
      title: dictionary.sections.community,
      links: communityLinks,
    },
    {
      title: dictionary.sections.legal,
      links: legalLinks,
    },
  ].filter((group) => group.links.length > 0)

  return (
    <footer
      aria-label={dictionary.aria.footer}
      className="mt-10 border-t border-border/20 bg-popover/70"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
        <div>
          <div className="font-headline text-xl tracking-[0.08em] text-primary uppercase md:text-2xl">
            {dictionary.title}
          </div>
          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            {dictionary.description}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {linkGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <h2 className="mb-2 font-headline text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                {group.title}
              </h2>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      aria-label={`${dictionary.aria.footerLink}: ${link.label}`}
                      className="inline-flex text-[11px] tracking-[0.1em] text-foreground uppercase transition-colors hover:text-primary"
                      href={link.href}
                      rel={link.external ? "noreferrer" : undefined}
                      target={link.external ? "_blank" : undefined}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="border-t border-border/20 pt-5">
          <div className="flex flex-col gap-2 font-body text-[11px] text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>{dictionary.copyright}</span>
            <div className="flex flex-wrap items-center gap-3">
              <FooterLocaleDropdown
                currentLocale={locale}
                labels={{
                  ariaLabel: dictionary.languageSwitcher.ariaLabel,
                  locales: dictionary.languageSwitcher.locales,
                  trigger: dictionary.languageSwitcher.label,
                }}
              />

              <div className="flex items-center gap-2">
                <span>{dictionary.madeBy}</span>
                <Link
                  className="text-primary underline underline-offset-4 hover:text-primary/85"
                  href="https://www.rafacanosa.dev/en"
                  rel="noreferrer"
                  target="_blank"
                >
                  {dictionary.websiteLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
