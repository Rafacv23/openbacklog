import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

import type { SupportedLocale } from "@/lib/locales"

const styles = {
  body: {
    backgroundColor: "#101010",
    color: "#f8f8f1",
    fontFamily: "Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#181818",
    border: "1px solid #2b2b2b",
    margin: "0 auto",
    maxWidth: "620px",
    padding: "28px",
  },
  title: {
    color: "#c9f25a",
    fontSize: "22px",
    lineHeight: "1.3",
    margin: "0 0 18px",
  },
  label: {
    color: "#8f8f8f",
    fontSize: "12px",
    letterSpacing: "0.08em",
    margin: "0 0 4px",
    textTransform: "uppercase" as const,
  },
  value: {
    color: "#ffffff",
    fontSize: "15px",
    margin: "0 0 14px",
  },
  message: {
    backgroundColor: "#111111",
    border: "1px solid #2f2f2f",
    color: "#f4f4f0",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: "0",
    padding: "14px",
    whiteSpace: "pre-wrap" as const,
  },
} as const

export type RoadmapSuggestionAdminEmailProps = {
  email: string
  locale: SupportedLocale
  message: string
  submittedAtIso: string
  title: string
}

export function RoadmapSuggestionAdminEmail({
  email,
  locale,
  message,
  submittedAtIso,
  title,
}: RoadmapSuggestionAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New roadmap suggestion received</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.title}>New roadmap suggestion</Heading>

          <Section>
            <Text style={styles.label}>From</Text>
            <Text style={styles.value}>{email}</Text>
          </Section>

          <Section>
            <Text style={styles.label}>Locale</Text>
            <Text style={styles.value}>{locale}</Text>
          </Section>

          <Section>
            <Text style={styles.label}>Title</Text>
            <Text style={styles.value}>{title}</Text>
          </Section>

          <Section>
            <Text style={styles.label}>Submitted at</Text>
            <Text style={styles.value}>{submittedAtIso}</Text>
          </Section>

          <Section>
            <Text style={styles.label}>Message</Text>
            <Text style={styles.message}>{message}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
