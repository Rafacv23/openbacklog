import type { Metadata } from "next"

import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"

import { LegalDocumentPage } from "@/components/legal/legal-document-page"

type TermsPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.legal.terms.metaTitle,
    description: dictionary.legal.terms.metaDescription,
    alternates: {
      canonical: `/${locale}/terms`,
      languages: {
        en: "/en/terms",
        es: "/es/terms",
        "x-default": "/en/terms",
      },
    },
    openGraph: {
      title: dictionary.legal.terms.metaTitle,
      description: dictionary.legal.terms.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/terms`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: dictionary.legal.terms.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.legal.terms.metaTitle,
      description: dictionary.legal.terms.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)

  return (
    <LegalDocumentPage
      dictionary={dictionary}
      document={dictionary.legal.terms}
      locale={locale}
    />
  )
}
