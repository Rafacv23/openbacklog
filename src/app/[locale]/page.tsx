import type { Metadata } from "next"

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getDictionary } from "@/lib/i18n"

import { LandingFooter } from "@/components/landing/footer"
import { LandingHeader } from "@/components/landing/header"
import { SmoothScrollLink } from "@/components/landing/smooth-scroll-link"
import { WaitlistForm } from "@/components/landing/waitlist-form"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SUPPORTED_LOCALES, toSupportedLocale } from "@/lib/locales"
import { getBaseUrl, SITE_NAME } from "@/lib/site"
import { cn } from "@/lib/utils"

type LocalePageProps = {
  params: Promise<{ locale: string }>
}

const BASE_URL = getBaseUrl()

const GAME_CARD_LAYOUTS = [
  {
    wrapper:
      "absolute left-0 top-12 w-64 cursor-crosshair -rotate-6 border-l-4 border-destructive/70 bg-card transition-transform hover:z-40 hover:rotate-0 md:w-80",
    badgeClass: "bg-destructive/20 text-destructive",
  },
  {
    wrapper:
      "absolute top-0 left-1/2 z-20 w-64 -translate-x-1/2 cursor-crosshair border-l-4 border-primary bg-card shadow-2xl transition-transform hover:z-40 hover:scale-105 md:w-80",
    badgeClass: "bg-secondary text-secondary-foreground",
  },
  {
    wrapper:
      "absolute top-16 right-0 z-10 w-64 cursor-crosshair rotate-12 border-l-4 border-border bg-card transition-transform hover:z-40 hover:rotate-0 md:w-80",
    badgeClass: "bg-muted text-muted-foreground",
  },
] as const

const TESTIMONIAL_ACCENTS = [
  "bg-primary text-primary-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-border text-foreground",
] as const

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    return {}
  }

  const dictionary = getDictionary(locale)

  return {
    title: dictionary.seo.title,
    description: dictionary.seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        es: "/es",
      },
    },
    openGraph: {
      title: dictionary.seo.title,
      description: dictionary.seo.description,
      type: "website",
      locale,
      url: `${BASE_URL}/${locale}`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.seo.title,
      description: dictionary.seo.description,
    },
  }
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale: rawLocale } = await params
  const locale = toSupportedLocale(rawLocale)

  if (!locale) {
    notFound()
  }

  const dictionary = getDictionary(locale)
  const faq = dictionary.home.faq ?? {
    eyebrow: "FAQ",
    title: "Frequently Asked Questions",
    description: "",
    items: [] as Array<{ question: string; answer: string }>,
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: `${BASE_URL}/${locale}`,
        inLanguage: locale,
        description: dictionary.seo.description,
      },
      {
        "@type": "SoftwareApplication",
        name: dictionary.home.jsonLd.name,
        alternateName: dictionary.home.jsonLd.alternateName,
        applicationCategory: dictionary.home.jsonLd.applicationCategory,
        operatingSystem: dictionary.home.jsonLd.operatingSystem,
        slogan: dictionary.home.jsonLd.slogan,
        offers: {
          "@type": "Offer",
          name: dictionary.home.jsonLd.offers,
        },
        description: dictionary.home.jsonLd.description,
        featureList: dictionary.home.jsonLd.featureList,
        screenshot: dictionary.home.jsonLd.screenshot,
      },
    ],
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-background text-foreground xl:pl-64">
      <LandingHeader dictionary={dictionary} locale={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <aside
        aria-label={dictionary.home.aria.sideNavigation}
        className="fixed top-0 left-0 z-40 hidden h-screen w-64 flex-col border-r border-border/20 bg-card pt-16 xl:flex"
      >
        <div className="px-6 py-8">
          <h4 className="font-body text-xs tracking-[0.3em] text-primary uppercase">
            {dictionary.home.nav.side.operator}
          </h4>
          <p className="mt-1 font-body text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
            {dictionary.home.nav.side.status}
          </p>
        </div>

        <nav className="flex-1">
          {dictionary.home.nav.side.links.map((item, index) => (
            <Link
              key={item}
              href="#"
              className={cn(
                "flex items-center px-4 py-3 font-body text-sm tracking-[0.1em] uppercase transition-transform hover:scale-[0.98]",
                index === 0
                  ? "border-l-4 border-primary bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="mr-3 inline-block h-2 w-2 border border-current" />
              {item}
            </Link>
          ))}
        </nav>

        <div className="border-y border-border/20 px-6 py-6">
          <Button
            aria-label={dictionary.home.nav.side.newEntry}
            className="h-auto w-full rounded-none py-3 font-headline text-xs font-bold tracking-[0.1em] uppercase"
            type="button"
          >
            {dictionary.home.nav.side.newEntry}
          </Button>
        </div>

        <div className="mt-auto">
          <Link
            href="#"
            className="flex items-center px-4 py-3 font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:bg-muted"
          >
            <span className="mr-3 inline-block h-2 w-2 rounded-full border border-current" />
            {dictionary.home.nav.side.help}
          </Link>
          <Link
            href="#"
            className="flex items-center px-4 py-3 font-body text-xs tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:bg-muted"
          >
            <span className="mr-3 inline-block h-2 w-2 rounded-full border border-current" />
            {dictionary.home.nav.side.logout}
          </Link>
        </div>
      </aside>

      <section
        id="hero"
        aria-label={dictionary.home.aria.heroSection}
        className="relative flex min-h-screen scroll-mt-24 flex-col items-center justify-center overflow-hidden px-6 pt-28"
      >
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary blur-[120px]" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-chart-2 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl text-center">
          <Link
            aria-label={dictionary.home.aria.releaseBadge}
            className="mb-6 inline-flex"
            href={`/${locale}/changelog`}
          >
            <Badge
              variant="outline"
              className="rounded-none border-primary/40 bg-card/70 px-3 py-1 font-body text-[10px] tracking-[0.12em] text-primary uppercase hover:bg-primary/10"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {dictionary.home.hero.releaseBadgeLabel}
              <span className="text-foreground">
                {dictionary.home.hero.releaseBadgeValue}
              </span>
            </Badge>
          </Link>

          <h1 className="font-headline text-6xl leading-tight tracking-tight md:text-7xl">
            {dictionary.home.hero.titleLead}
            <br />
            <span className="font-display italic font-bold tracking-[0.02em] text-primary uppercase">
              {dictionary.home.hero.titleHighlight}
            </span>
          </h1>

          <div className="mt-12 flex flex-col justify-center gap-4 md:flex-row">
            <SmoothScrollLink
              aria-label={dictionary.home.aria.primaryCta}
              className={cn(
                buttonVariants(),
                "h-auto rounded-none px-8 py-4 font-headline text-sm font-bold tracking-[0.12em] uppercase transition-all hover:shadow-[0_0_20px_rgba(201,242,90,0.35)] active:scale-95",
              )}
              href="#join"
            >
              {dictionary.home.hero.primaryCta}
            </SmoothScrollLink>
            <Link
              aria-label={dictionary.home.aria.secondaryCta}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-auto rounded-none px-8 py-4 font-headline text-sm font-bold tracking-[0.12em] uppercase transition-all active:scale-95",
              )}
              href={`/${locale}/roadmap`}
            >
              {dictionary.home.hero.secondaryCta}
            </Link>
          </div>
        </div>

        <div className="relative mt-20 h-[450px] w-full max-w-4xl md:h-[550px]">
          {dictionary.home.cards.map((card, index) => {
            const layout = GAME_CARD_LAYOUTS[index] ?? GAME_CARD_LAYOUTS[0]
            return (
              <Card
                key={card.title}
                className={cn(layout.wrapper, "rounded-none p-0 ring-0")}
              >
                <CardContent className="p-4">
                  <Image
                    alt={card.imageAlt}
                    className="mb-4 h-48 w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                    height={192}
                    src={card.imageSrc}
                    unoptimized
                    width={320}
                  />
                  <h3 className="font-headline text-xl font-bold tracking-tight text-primary uppercase">
                    {card.title}
                  </h3>
                  <div className="mt-4 flex justify-between font-body text-[11px] text-muted-foreground">
                    <span>
                      {card.playtimeLabel}: {card.playtimeValue}
                    </span>
                    <span>
                      {card.progressLabel}: {card.progressValue}
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${card.progressNumber}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <section
        id="capabilities"
        aria-label={dictionary.home.aria.capabilitiesSection}
        className="mx-auto max-w-7xl scroll-mt-24 px-6 py-24"
      >
        <div className="mb-16">
          <h2 className="font-headline text-4xl">
            <span className="font-display italic">
              {dictionary.home.capabilities.title}
            </span>
          </h2>
          <Separator className="mt-2 h-1 w-24 bg-primary" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="relative gap-0 overflow-hidden rounded-none bg-card/90 p-0 ring-0 md:col-span-2">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span
                aria-label={dictionary.home.labels.inventory}
                className="inline-block h-10 w-10 border-2 border-primary"
                role="img"
              />
            </div>
            <CardContent className="relative z-10 flex h-full flex-col justify-between p-8">
              <div>
                <Badge className="mb-4 rounded-none bg-primary/15 text-primary">
                  <span className="h-2 w-2 animate-pulse bg-primary" />
                  {dictionary.home.capabilities.protocol}
                </Badge>
                <h3 className="font-headline text-3xl font-black tracking-tight uppercase">
                  {dictionary.home.capabilities.archivistTitle}
                </h3>
                <p className="mt-4 max-w-lg font-body text-sm leading-relaxed text-muted-foreground">
                  {dictionary.home.capabilities.archivistBody}
                </p>
              </div>
              <div className="mt-12 flex items-center gap-4">
                <Separator className="flex-1 bg-border/30" />
                <span className="font-body text-xs text-muted-foreground">
                  {dictionary.home.capabilities.latencyLabel}{" "}
                  {dictionary.home.capabilities.latencyValue}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-l-4 border-primary bg-muted p-0 ring-0">
            <CardContent className="p-8">
              <div className="mb-8">
                <span
                  aria-label={dictionary.home.labels.curation}
                  className="inline-block h-8 w-8 rounded-full border-2 border-primary"
                  role="img"
                />
              </div>
              <h3 className="font-headline text-2xl font-black tracking-tight uppercase">
                {dictionary.home.capabilities.neuralTitle}
              </h3>
              <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
                {dictionary.home.capabilities.neuralBody}
              </p>
              <div className="mt-8 pt-8">
                <Separator className="mb-8 bg-border/20" />
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-body text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                    {dictionary.home.capabilities.efficiencyLabel}
                  </span>
                  <span className="font-body text-sm text-primary">
                    {dictionary.home.capabilities.efficiencyValue}
                  </span>
                </div>
                <div className="h-0.5 w-full bg-background">
                  <div className="h-full w-[99.8%] bg-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col items-center justify-center rounded-none bg-popover p-8 text-center ring-0">
            <span
              aria-label={dictionary.home.labels.database}
              className="mb-6 inline-block h-9 w-9 rounded-full border-2 border-primary"
              role="img"
            />
            <h3 className="font-headline text-2xl font-black tracking-tight uppercase">
              {dictionary.home.capabilities.globalTitle}
            </h3>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
              {dictionary.home.capabilities.globalBody}
            </p>
            <Link
              aria-label={dictionary.home.aria.repository}
              className="mt-8 font-body text-xs tracking-[0.2em] text-primary uppercase hover:underline"
              href="#"
            >
              {dictionary.home.capabilities.repository}
            </Link>
          </Card>

          <Card className="flex flex-col items-center gap-8 rounded-none border-r-4 border-primary/20 bg-card p-8 ring-0 md:col-span-2 md:flex-row">
            <div className="flex-1">
              <h3 className="font-headline text-2xl font-black tracking-tight uppercase">
                {dictionary.home.capabilities.metadataTitle}
              </h3>
              <p className="mt-4 font-body text-sm leading-relaxed text-muted-foreground">
                {dictionary.home.capabilities.metadataBody}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                {dictionary.home.capabilities.metadataTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="rounded-none bg-card text-[10px]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-popover md:w-1/3">
              <Image
                alt={dictionary.home.capabilities.circuitImageAlt}
                className="absolute inset-0 h-full w-full object-cover opacity-30"
                height={180}
                src={dictionary.home.capabilities.circuitImageSrc}
                unoptimized
                width={320}
              />
              <span className="relative font-body text-[10px] tracking-[0.1em] text-primary uppercase">
                {dictionary.home.capabilities.decrypting}
              </span>
            </div>
          </Card>
        </div>
      </section>

      <section
        id="testimonials"
        aria-label={dictionary.home.aria.testimonialSection}
        className="scroll-mt-24 bg-popover py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col items-end justify-between gap-4 md:flex-row">
            <div>
              <span className="font-body text-sm tracking-[0.3em] text-primary uppercase">
                {dictionary.home.testimonials.eyebrow}
              </span>
              <h2 className="mt-2 font-headline text-5xl">
                <span className="font-display italic">
                  {dictionary.home.testimonials.title}
                </span>
              </h2>
            </div>
            <div className="bg-card px-4 py-2 font-body text-xs tracking-[0.1em] text-muted-foreground uppercase">
              {dictionary.home.testimonials.activeOperators}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
            {dictionary.home.testimonials.items.map((item, index) => (
              <Card
                key={item.handle}
                className="rounded-none bg-card p-8 ring-0 transition-colors hover:bg-muted"
              >
                <div className="mb-6 flex items-center gap-4">
                  <Badge
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-none font-headline text-sm font-black",
                      TESTIMONIAL_ACCENTS[index],
                    )}
                  >
                    {item.initial}
                  </Badge>
                  <div>
                    <div className="font-headline text-sm font-bold tracking-tight uppercase">
                      {item.handle}
                    </div>
                    <div className="font-body text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                      {item.stats}
                    </div>
                  </div>
                </div>
                <p className="font-body text-xl leading-relaxed italic text-muted-foreground">
                  {item.quote}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="faq"
        aria-label={dictionary.home.aria.faqSection ?? "Frequently asked questions section"}
        className="scroll-mt-24 border-y border-border/20 bg-card/40 py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <span className="font-body text-sm tracking-[0.24em] text-primary uppercase">
              {faq.eyebrow}
            </span>
            <h2 className="mt-3 font-headline text-4xl">
              <span className="font-display italic">
                {faq.title}
              </span>
            </h2>
            <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-muted-foreground">
              {faq.description}
            </p>
          </div>

          <Card className="rounded-none border border-border bg-popover/80 p-0">
            <CardContent className="p-6 md:p-8">
              <Accordion
                defaultValue={["item-1"]}
                className="w-full"
              >
                {faq.items.map((item, index) => (
                  <AccordionItem key={item.question} value={`item-${index + 1}`}>
                    <AccordionTrigger className="font-headline text-xs tracking-[0.1em] uppercase hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="join"
        aria-label={dictionary.home.aria.ctaSection}
        className="relative scroll-mt-24 py-0"
      >
        <div className="ob-join-grid">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center md:px-10 md:py-28">
            <h2 className="mx-auto max-w-[10ch] font-display text-6xl leading-[0.9] font-bold tracking-tight text-black uppercase md:text-8xl">
              {dictionary.home.cta.title}
            </h2>
            <p className="mx-auto mt-8 max-w-xl font-body text-lg leading-relaxed text-black/85">
              {dictionary.home.cta.body}
            </p>

            <WaitlistForm
              locale={locale}
              messages={{
                emailPlaceholder: dictionary.home.cta.emailPlaceholder,
                button: dictionary.home.cta.button,
                buttonSubmitting: dictionary.home.cta.buttonSubmitting,
                ariaEmail: dictionary.home.aria.email,
                ariaSubmit: dictionary.home.aria.submitEmail,
                feedback: {
                  success: dictionary.home.cta.feedback.success,
                  createdEmailPending:
                    dictionary.home.cta.feedback.createdEmailPending,
                  alreadyRegistered:
                    dictionary.home.cta.feedback.alreadyRegistered,
                  invalidEmail: dictionary.home.cta.feedback.invalidEmail,
                  genericError: dictionary.home.cta.feedback.genericError,
                },
              }}
            />

            <div className="mt-6 font-body text-[10px] tracking-[0.1em] text-black/55 uppercase">
              {dictionary.home.cta.security}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter dictionary={dictionary} locale={locale} />
    </main>
  )
}
