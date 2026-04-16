import type { Metadata } from "next"

import { notFound, redirect } from "next/navigation"

import { AppFooter } from "@/components/app/app-footer"
import { AppHeader } from "@/components/app/app-header"
import { getDictionary } from "@/lib/i18n"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"

import { GameSearchClient } from "@/components/games/game-search-client"

type SearchPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.search.metaTitle,
    description: dictionary.search.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/search`,
      languages: {
        en: "/en/search",
        es: "/es/search",
        "x-default": "/en/search",
      },
    },
    openGraph: {
      title: dictionary.search.metaTitle,
      description: dictionary.search.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/search`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.search.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.search.metaTitle,
      description: dictionary.search.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const session = await getAuthSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  const username = getSessionUsername(session)

  if (!username) {
    redirect(`/${locale}/onboarding/username`)
  }

  const dictionary = getDictionary(locale)
  const profileHref = `/${locale}/profile/${encodeURIComponent(username)}`

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <AppHeader dictionary={dictionary.app.header} locale={locale} profileHref={profileHref} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">

        <header className="space-y-2">
          <h1 className="font-display text-4xl leading-tight text-foreground">
            {dictionary.search.title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {dictionary.search.description}
          </p>
        </header>

        <GameSearchClient dictionary={dictionary.search} locale={locale} />
      </div>

      <AppFooter dictionary={dictionary.app.footer} locale={locale} profileHref={profileHref} />
    </main>
  )
}
