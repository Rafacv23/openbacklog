import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { getAuthDictionary } from "@/lib/i18n/auth-dictionary"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getAuthDictionary(locale)

  return {
    title: dictionary.forgotPassword.metaTitle,
    description: dictionary.forgotPassword.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/forgot-password`,
      languages: {
        en: "/en/forgot-password",
        es: "/es/forgot-password",
        "x-default": "/en/forgot-password",
      },
    },
    openGraph: {
      title: dictionary.forgotPassword.metaTitle,
      description: dictionary.forgotPassword.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/forgot-password`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.forgotPassword.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.forgotPassword.metaTitle,
      description: dictionary.forgotPassword.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
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

        <div className="flex items-center justify-center">
          <ForgotPasswordForm dictionary={dictionary} locale={locale} />
        </div>
      </div>
    </main>
  )
}
