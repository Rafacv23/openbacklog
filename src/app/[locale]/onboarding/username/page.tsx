import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AppFooter } from "@/components/app/app-footer"
import { UsernameOnboardingForm } from "@/components/onboarding/username-onboarding-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n"
import { getAuthDictionary } from "@/lib/i18n/auth-dictionary"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { getAuthSession, getSessionUsername } from "@/server/auth/get-auth-session"

type UsernameOnboardingPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: UsernameOnboardingPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getAuthDictionary(locale)

  return {
    title: dictionary.usernameOnboarding.metaTitle,
    description: dictionary.usernameOnboarding.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/onboarding/username`,
      languages: {
        en: "/en/onboarding/username",
        es: "/es/onboarding/username",
        "x-default": "/en/onboarding/username",
      },
    },
    openGraph: {
      title: dictionary.usernameOnboarding.metaTitle,
      description: dictionary.usernameOnboarding.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/onboarding/username`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.usernameOnboarding.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.usernameOnboarding.metaTitle,
      description: dictionary.usernameOnboarding.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function UsernameOnboardingPage({ params }: UsernameOnboardingPageProps) {
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

  if (username) {
    redirect(`/${locale}/feed`)
  }

  const appDictionary = getDictionary(locale)
  const dictionary = getAuthDictionary(locale)

  return (
    <main className="relative min-h-screen px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <Link
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href={`/${locale}`}
        >
          {dictionary.common.backToHome}
        </Link>

        <Card className="w-full max-w-lg border border-border/60 bg-card/95">
          <CardHeader className="space-y-2">
            <CardTitle className="font-display text-3xl text-foreground">
              {dictionary.usernameOnboarding.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{dictionary.usernameOnboarding.subtitle}</p>
          </CardHeader>
          <CardContent>
            <UsernameOnboardingForm copy={dictionary.usernameOnboarding} locale={locale} />
          </CardContent>
        </Card>
      </div>

      <AppFooter dictionary={appDictionary.app.footer} locale={locale} />
    </main>
  )
}
