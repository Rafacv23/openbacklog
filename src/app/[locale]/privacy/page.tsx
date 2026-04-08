import type { Metadata } from "next"

import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"

import { LegalDocumentPage } from "@/components/legal/legal-document-page"

type PrivacyPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.legal.privacy.metaTitle,
    description: dictionary.legal.privacy.metaDescription,
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: {
        en: "/en/privacy",
        es: "/es/privacy",
        "x-default": "/en/privacy",
      },
    },
    openGraph: {
      title: dictionary.legal.privacy.metaTitle,
      description: dictionary.legal.privacy.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/privacy`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.legal.privacy.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.legal.privacy.metaTitle,
      description: dictionary.legal.privacy.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <LegalDocumentPage
      dictionary={dictionary}
      document={dictionary.legal.privacy}
      locale={locale}
    />
  )
}
