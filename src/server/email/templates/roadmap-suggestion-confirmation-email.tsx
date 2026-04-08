import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

import type { SupportedLocale } from "@/lib/locales"

const emailCopy = {
  en: {
    preview: "We received your OpenBacklog roadmap suggestion",
    title: "Suggestion received",
    body: "Thanks for sharing your idea. We review every roadmap suggestion and use this input to prioritize what we build next.",
    suggestionLabel: "Your suggestion",
    cta: "View Roadmap",
    footer: "You can reply to this email if you want to add more context.",
  },
  es: {
    preview: "Hemos recibido tu sugerencia para el roadmap de OpenBacklog",
    title: "Sugerencia recibida",
    body: "Gracias por compartir tu idea. Revisamos cada sugerencia del roadmap y usamos este feedback para priorizar lo siguiente que construimos.",
    suggestionLabel: "Tu sugerencia",
    cta: "Ver Roadmap",
    footer: "Puedes responder a este correo si quieres anadir mas contexto.",
  },
} as const

const styles = {
  body: {
    backgroundColor: "#f4f4ef",
    color: "#111111",
    fontFamily: "Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #d6d6c8",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "28px",
  },
  title: {
    fontSize: "28px",
    lineHeight: "1.2",
    margin: "0 0 12px",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  label: {
    color: "#5f5f5f",
    fontSize: "12px",
    letterSpacing: "0.06em",
    margin: "0 0 8px",
    textTransform: "uppercase" as const,
  },
  quote: {
    backgroundColor: "#f8f8f5",
    border: "1px solid #e2e2d7",
    color: "#222222",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0 0 16px",
    padding: "12px 14px",
  },
  footer: {
    color: "#5f5f5f",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "18px 0 0",
  },
  button: {
    backgroundColor: "#111111",
    color: "#c9f25a",
    display: "inline-block",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    marginTop: "8px",
    padding: "12px 18px",
    textDecoration: "none",
    textTransform: "uppercase" as const,
  },
} as const

export type RoadmapSuggestionConfirmationEmailProps = {
  appUrl: string
  locale: SupportedLocale
  suggestionTitle: string
}

export function RoadmapSuggestionConfirmationEmail({
  appUrl,
  locale,
  suggestionTitle,
}: RoadmapSuggestionConfirmationEmailProps) {
  const copy = emailCopy[locale]

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.title}>{copy.title}</Heading>
          <Text style={styles.text}>{copy.body}</Text>
          <Text style={styles.label}>{copy.suggestionLabel}</Text>
          <Text style={styles.quote}>{suggestionTitle}</Text>
          <Section>
            <Button href={`${appUrl}/${locale}/roadmap`} style={styles.button}>
              {copy.cta}
            </Button>
          </Section>
          <Text style={styles.footer}>{copy.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}
