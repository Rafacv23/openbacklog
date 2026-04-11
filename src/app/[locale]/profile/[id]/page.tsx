import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, getDefaultSocialImageUrl, SITE_NAME } from "@/lib/site"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ProfilePageProps = {
  params: Promise<{ locale: string; id: string }>
}

const BASE_URL = getBaseUrl()
const DEFAULT_SOCIAL_IMAGE_URL = getDefaultSocialImageUrl()
const JOINED_AT = "2025-03-15T00:00:00.000Z"
const LAST_ACTIVE_AT = "2026-04-08T18:30:00.000Z"

function parseProfileId(rawId: string): string | null {
  let profileId = ""

  try {
    profileId = decodeURIComponent(rawId).trim()
  } catch {
    return null
  }

  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(profileId)) {
    return null
  }

  return profileId
}

function formatDisplayName(profileId: string): string {
  return profileId
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { locale: rawLocale, id: rawId } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const profileId = parseProfileId(rawId)

  if (!profileId) {
    return {}
  }

  const dictionary = getDictionary(locale)
  const displayName = formatDisplayName(profileId)
  const title = `${displayName} · ${dictionary.profile.metaTitleSuffix}`
  const canonicalPath = `/${locale}/profile/${profileId}`

  return {
    title,
    description: dictionary.profile.metaDescription,
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: `/en/profile/${profileId}`,
        es: `/es/profile/${profileId}`,
        "x-default": `/en/profile/${profileId}`,
      },
    },
    openGraph: {
      title,
      description: dictionary.profile.metaDescription,
      type: "profile",
      locale,
      url: `${BASE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_SOCIAL_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: dictionary.profile.metaDescription,
      images: [DEFAULT_SOCIAL_IMAGE_URL],
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale: rawLocale, id: rawId } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const profileId = parseProfileId(rawId)

  if (!profileId) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const displayName = formatDisplayName(profileId)
  const joinedDateFormatter = new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  })
  const activityDateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  const joinedDate = joinedDateFormatter.format(new Date(JOINED_AT))
  const lastActivityDate = activityDateFormatter.format(new Date(LAST_ACTIVE_AT))

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${displayName} | ${SITE_NAME}`,
    url: `${BASE_URL}/${locale}/profile/${profileId}`,
    inLanguage: locale,
    mainEntity: {
      "@type": "Person",
      identifier: profileId,
      name: displayName,
      description: dictionary.profile.metaDescription,
    },
  }

  return (
    <main className="relative min-h-screen px-6 py-12 text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(profileJsonLd),
        }}
      />

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-muted/40 blur-[130px]" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${locale}`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.profile.backHome}
            </Button>
          </Link>
          <Badge
            variant="outline"
            className="rounded-none border-primary/40 bg-card px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase"
          >
            {dictionary.profile.previewBadge}
          </Badge>
        </div>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit border border-border/60 bg-card/80 py-0">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-4">
                <div className="grid size-16 place-items-center rounded-full border border-border/80 bg-muted font-display text-2xl text-primary">
                  {displayName.charAt(0)}
                </div>
                <div>
                  <h1 className="font-display text-3xl italic text-primary">
                    {displayName}
                  </h1>
                  <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                    {dictionary.profile.idLabel}: {profileId}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {dictionary.profile.heroDescription}
              </p>

              <div className="grid gap-3 text-sm text-muted-foreground">
                <p>
                  {dictionary.profile.joinedLabel}:{" "}
                  <span className="text-foreground">{joinedDate}</span>
                </p>
                <p>
                  {dictionary.profile.lastActivityLabel}:{" "}
                  <span className="text-foreground">{lastActivityDate}</span>
                </p>
              </div>

              <Button
                disabled
                className="w-full rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
              >
                {dictionary.profile.editButton}
              </Button>

              <p className="text-xs text-muted-foreground">
                {dictionary.profile.editNote}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-border/60 bg-card/80 py-0">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-1">
                  <h2 className="font-headline text-xl uppercase">
                    {dictionary.profile.libraryTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.profile.libraryDescription}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {dictionary.profile.libraryStats.map((item) => (
                    <article
                      key={item.label}
                      className="rounded-md border border-border/60 bg-background/70 p-4"
                    >
                      <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                        {item.label}
                      </p>
                      <p className="mt-2 font-display text-3xl italic text-primary">
                        {item.value}
                      </p>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80 py-0">
              <CardContent className="space-y-4 p-6">
                <div className="space-y-1">
                  <h2 className="font-headline text-xl uppercase">
                    {dictionary.profile.focusTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {dictionary.profile.focusDescription}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {dictionary.profile.focusCards.map((item) => (
                    <article
                      key={item.game}
                      className="rounded-md border border-border/60 bg-background/70 p-4"
                    >
                      <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                        {item.label}
                      </p>
                      <p className="mt-2 font-headline text-lg uppercase">{item.game}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.profile.galleryTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.profile.galleryDescription}
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dictionary.profile.galleryItems.map((item) => (
              <Card key={item.title} className="border border-border/60 bg-card/80 py-0">
                <CardContent className="space-y-3 p-4">
                  <div className="aspect-[4/3] rounded-md border border-border/60 bg-gradient-to-br from-primary/20 via-background to-muted/80" />
                  <div className="space-y-2">
                    <h3 className="font-headline text-lg uppercase">{item.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="rounded-none border-border/60 bg-background px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase"
                      >
                        {item.platform}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-none border-primary/40 bg-background px-2 py-0.5 text-[10px] tracking-[0.08em] text-primary uppercase"
                      >
                        {item.state}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.progress}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <header className="space-y-1">
            <h2 className="font-headline text-2xl uppercase">
              {dictionary.profile.collectionsTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {dictionary.profile.collectionsDescription}
            </p>
          </header>

          <div className="flex flex-wrap gap-2">
            {dictionary.profile.collections.map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="rounded-none border-border/60 bg-card px-3 py-1 font-body text-[10px] tracking-[0.1em] uppercase"
              >
                {item}
              </Badge>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
