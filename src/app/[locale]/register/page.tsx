import type { Metadata } from "next"

import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AuthForm } from "@/components/auth/auth-form"
import { getAuthDictionary } from "@/lib/i18n/auth-dictionary"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"
import { enabledSocialAuthProviders } from "@/server/auth"
import { getAuthSession } from "@/server/auth/get-auth-session"

type RegisterPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getAuthDictionary(locale)

  return {
    title: dictionary.register.metaTitle,
    description: dictionary.register.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/register`,
      languages: {
        en: "/en/register",
        es: "/es/register",
        "x-default": "/en/register",
      },
    },
    openGraph: {
      title: dictionary.register.metaTitle,
      description: dictionary.register.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/register`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.register.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.register.metaTitle,
      description: dictionary.register.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const session = await getAuthSession()

  if (session) {
    redirect(`/${locale}`)
  }

  const dictionary = getAuthDictionary(locale)

  return (
    <main className="relative min-h-screen px-6 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <Link
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href={`/${locale}`}
        >
          {dictionary.common.backToHome}
        </Link>

        <div className="grid flex-1 items-center justify-items-center gap-8 lg:grid-cols-[1fr_auto] lg:items-start lg:justify-items-stretch">
          <div className="hidden space-y-4 lg:block">
            <p className="font-headline text-sm tracking-[0.14em] text-primary uppercase">
              OPENBACKLOG
            </p>
            <h1 className="font-display text-5xl leading-tight text-foreground">
              {dictionary.register.title}
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              {dictionary.register.subtitle}
            </p>
          </div>

          <AuthForm
            dictionary={dictionary}
            enabledSocialProviders={enabledSocialAuthProviders}
            locale={locale}
            mode="register"
          />
        </div>
      </div>
    </main>
  )
}
