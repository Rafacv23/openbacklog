import type { Metadata } from "next"

import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"

import { LegalDocumentPage } from "@/components/legal/legal-document-page"

type CookiesPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export async function generateMetadata({
  params,
}: CookiesPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.legal.cookies.metaTitle,
    description: dictionary.legal.cookies.metaDescription,
    alternates: {
      canonical: `/${locale}/cookies`,
      languages: {
        en: "/en/cookies",
        es: "/es/cookies",
        "x-default": "/en/cookies",
      },
    },
    openGraph: {
      title: dictionary.legal.cookies.metaTitle,
      description: dictionary.legal.cookies.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/cookies`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.legal.cookies.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.legal.cookies.metaTitle,
      description: dictionary.legal.cookies.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <LegalDocumentPage
      dictionary={dictionary}
      document={dictionary.legal.cookies}
      locale={locale}
    />
  )
}
