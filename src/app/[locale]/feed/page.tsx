import type { Metadata } from "next"

import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { AppHeader } from "@/components/app/app-header"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { REQUEST_LOCALE_HEADER, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"
import { getAuthSession } from "@/server/auth/get-auth-session"
import { ArrowUpRight } from "lucide-react"

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

async function getRequestLocale() {
  const requestHeaders = await headers()
  return (
    toSupportedLocale(requestHeaders.get(REQUEST_LOCALE_HEADER) ?? "") ?? "en"
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const canonicalPath = `/${locale}/feed`

  return {
    title: dictionary.app.metaTitle,
    description: dictionary.app.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/en/feed",
        es: "/es/feed",
        "x-default": "/en/feed",
      },
    },
    openGraph: {
      title: dictionary.app.metaTitle,
      description: dictionary.app.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.app.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.app.metaTitle,
      description: dictionary.app.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function AppEntryPage() {
  const locale = await getRequestLocale()
  const session = await getAuthSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const dictionary = getDictionary(locale)
  const profileId = session.user?.id?.trim()
  const profileHref = profileId
    ? `/${locale}/profile/${encodeURIComponent(profileId)}`
    : `/${locale}`

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader
        dictionary={dictionary.app.header}
        locale={locale}
        profileHref={profileHref}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 md:py-10">
        <section className="space-y-5">
          <div className="space-y-2">
            <h1 className="font-display text-4xl italic text-primary md:text-5xl">
              {dictionary.app.hero.title}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              {dictionary.app.hero.description}
            </p>
          </div>
        </section>

        <section id="recommendations" className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.app.recommendations.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.app.recommendations.description}
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            {dictionary.app.recommendations.items.map((item) => (
              <Card
                key={item.title}
                className="border border-border/60 bg-card/80 py-0"
              >
                <CardContent className="space-y-3 p-5">
                  <p className="text-xs tracking-[0.09em] text-muted-foreground uppercase">
                    {item.state}
                  </p>
                  <h3 className="font-headline text-xl uppercase">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.reason}
                  </p>
                  <p className="text-xs text-primary">{item.timeHint}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="feed" className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.app.feed.title}
            </h2>
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                {dictionary.app.feed.description}
              </p>
              <Link
                href={`/${locale}/friends`}
                title="Friends activity"
                className="flex gap-2 items-center hover:text-primary transition-colors"
              >
                Watch more
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </header>

          <div className="space-y-3">
            {dictionary.app.feed.items.map((item) => (
              <article
                key={`${item.friend}-${item.timeAgo}-${item.action}`}
                className="rounded-md border border-border/60 bg-card/70 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-headline text-sm uppercase text-foreground">
                    {item.friend}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.timeAgo}
                  </p>
                </div>
                <p className="mt-2 text-sm text-foreground">{item.action}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
