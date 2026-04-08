import type { Metadata } from "next"

import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"
import { toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, SITE_NAME } from "@/lib/site"

import { RoadmapSuggestionDialog } from "@/components/roadmap/roadmap-suggestion-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type LocaleRoadmapPageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()
const ROADMAP_SUGGESTION_FALLBACK = {
  title: "Send a roadmap suggestion",
  description:
    "Tell us what feature would help you finish more games. Your suggestion goes directly to the product inbox.",
  trigger: "SEND SUGGESTION",
  modalTitle: "Send roadmap suggestion",
  modalDescription:
    "Share one concrete idea with enough context so we can evaluate impact and implementation cost.",
  close: "CANCEL",
  submit: "SUBMIT SUGGESTION",
  submitSubmitting: "SENDING...",
  fields: {
    emailLabel: "Email",
    emailPlaceholder: "you@email.com",
    titleLabel: "Suggestion title",
    titlePlaceholder: "Example: Weekly backlog planning view",
    messageLabel: "Suggestion details",
    messagePlaceholder:
      "Describe the problem, your proposed solution, and why it matters.",
  },
  feedback: {
    created: "Suggestion sent. Check your inbox for a confirmation email.",
    createdEmailPending: "Suggestion received. Confirmation email is pending.",
    invalidEmail: "Enter a valid email address.",
    invalidPayload:
      "Complete title and details so we can review your suggestion.",
    genericError: "Something went wrong. Please try again.",
  },
}

export async function generateMetadata({
  params,
}: LocaleRoadmapPageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.features.metaTitle,
    description: dictionary.features.metaDescription,
    alternates: {
      canonical: `/${locale}/roadmap`,
      languages: {
        en: "/en/roadmap",
        es: "/es/roadmap",
      },
    },
    openGraph: {
      title: dictionary.features.metaTitle,
      description: dictionary.features.metaDescription,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}/roadmap`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.features.metaTitle,
      description: dictionary.features.metaDescription,
    },
  }
}

export default async function RoadmapPage({
  params,
}: LocaleRoadmapPageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const featureSuggestion =
    (
      dictionary.features as {
        suggestion?: Partial<typeof ROADMAP_SUGGESTION_FALLBACK> & {
          fields?: Partial<typeof ROADMAP_SUGGESTION_FALLBACK.fields>
          feedback?: Partial<typeof ROADMAP_SUGGESTION_FALLBACK.feedback>
        }
      }
    ).suggestion ?? {}

  const suggestion = {
    ...ROADMAP_SUGGESTION_FALLBACK,
    ...featureSuggestion,
    fields: {
      ...ROADMAP_SUGGESTION_FALLBACK.fields,
      ...(featureSuggestion.fields ?? {}),
    },
    feedback: {
      ...ROADMAP_SUGGESTION_FALLBACK.feedback,
      ...(featureSuggestion.feedback ?? {}),
    },
  }

  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${locale}`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.features.backHome}
            </Button>
          </Link>
          <Link href={`/${locale}/changelog`}>
            <Button
              variant="outline"
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
            >
              {dictionary.features.changelogLink}
            </Button>
          </Link>
        </div>

        <header className="space-y-4">
          <h1 className="font-display text-5xl italic text-primary">
            {dictionary.features.title}
          </h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            {dictionary.features.description}
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-none border-primary/40 bg-card px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase"
          >
            {dictionary.features.statusLive}
          </Badge>
          <span className="font-body text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
            {dictionary.features.statusCommunity}
          </span>
        </div>

        <Card className="rounded-none border border-border bg-popover/70 p-0">
          <CardContent className="flex flex-col gap-4 p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-headline text-xl uppercase">
                {suggestion.title}
              </h2>
              <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
                {suggestion.description}
              </p>
            </div>
            <RoadmapSuggestionDialog
              locale={locale}
              messages={{
                trigger: suggestion.trigger,
                modalTitle: suggestion.modalTitle,
                modalDescription: suggestion.modalDescription,
                close: suggestion.close,
                submit: suggestion.submit,
                submitSubmitting: suggestion.submitSubmitting,
                fields: {
                  emailLabel: suggestion.fields.emailLabel,
                  emailPlaceholder: suggestion.fields.emailPlaceholder,
                  titleLabel: suggestion.fields.titleLabel,
                  titlePlaceholder: suggestion.fields.titlePlaceholder,
                  messageLabel: suggestion.fields.messageLabel,
                  messagePlaceholder: suggestion.fields.messagePlaceholder,
                },
                feedback: {
                  created: suggestion.feedback.created,
                  createdEmailPending: suggestion.feedback.createdEmailPending,
                  invalidEmail: suggestion.feedback.invalidEmail,
                  invalidPayload: suggestion.feedback.invalidPayload,
                  genericError: suggestion.feedback.genericError,
                },
              }}
            />
          </CardContent>
        </Card>

      </div>
    </main>
  )
}
