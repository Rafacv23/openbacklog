import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { getAuthDictionary } from "@/lib/i18n/auth-dictionary"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl } from "@/lib/site"

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string; error?: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getAuthDictionary(locale)

  return {
    title: dictionary.resetPassword.metaTitle,
    description: dictionary.resetPassword.metaDescription,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `/${locale}/reset-password`,
      languages: {
        en: "/en/reset-password",
        es: "/es/reset-password",
        "x-default": "/en/reset-password",
      },
    },
    openGraph: {
      title: dictionary.resetPassword.metaTitle,
      description: dictionary.resetPassword.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/reset-password`,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.resetPassword.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.resetPassword.metaTitle,
      description: dictionary.resetPassword.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const resolvedSearchParams = await searchParams
  const token =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
      : undefined
  const tokenError =
    typeof resolvedSearchParams.error === "string"
      ? resolvedSearchParams.error
      : undefined

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
          <ResetPasswordForm
            dictionary={dictionary}
            locale={locale}
            token={token}
            tokenError={tokenError}
          />
        </div>
      </div>
    </main>
  )
}
