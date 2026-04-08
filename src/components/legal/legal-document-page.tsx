import Link from "next/link"

import type { Dictionary } from "@/lib/i18n"
import type { SupportedLocale } from "@/lib/locales"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type LegalDocument = {
  title: string
  intro: string
  sections: ReadonlyArray<{
    title: string
    body: ReadonlyArray<string>
  }>
}

type LegalDocumentPageProps = {
  dictionary: Dictionary
  document: LegalDocument
  locale: SupportedLocale
}

export function LegalDocumentPage({
  dictionary,
  document,
  locale,
}: LegalDocumentPageProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-20 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/${locale}`}>
            <Button
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
              variant="outline"
            >
              {dictionary.legal.common.backHome}
            </Button>
          </Link>
          <Link href={`/${locale}/privacy`}>
            <Button
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
              variant="outline"
            >
              {dictionary.legal.navigation.privacy}
            </Button>
          </Link>
          <Link href={`/${locale}/terms`}>
            <Button
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
              variant="outline"
            >
              {dictionary.legal.navigation.terms}
            </Button>
          </Link>
          <Link href={`/${locale}/cookies`}>
            <Button
              className="rounded-none font-body text-[10px] tracking-[0.12em] uppercase"
              variant="outline"
            >
              {dictionary.legal.navigation.cookies}
            </Button>
          </Link>
        </div>

        <header className="space-y-4">
          <h1 className="font-display text-5xl italic text-primary">
            {document.title}
          </h1>
          <p className="max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            {document.intro}
          </p>
          <p className="font-body text-xs tracking-[0.08em] text-muted-foreground uppercase">
            {dictionary.legal.common.effectiveDateLabel}{" "}
            {dictionary.legal.common.lastUpdated}
          </p>
        </header>

        <div className="space-y-4">
          {document.sections.map((section) => (
            <Card
              key={section.title}
              className="rounded-none border border-border bg-card/80 p-0"
            >
              <CardContent className="space-y-4 p-8">
                <h2 className="font-headline text-xl uppercase">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="font-body text-sm leading-relaxed text-muted-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
