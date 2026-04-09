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
    preview: "Verify your OpenBacklog email",
    title: "Verify your email",
    body: "Confirm your email address to keep your account secure and complete sign in.",
    cta: "Verify email",
    footer:
      "If you did not create this account, you can ignore this message.",
  },
  es: {
    preview: "Verifica tu correo de OpenBacklog",
    title: "Verifica tu correo",
    body: "Confirma tu correo para mantener tu cuenta segura y completar el acceso.",
    cta: "Verificar correo",
    footer:
      "Si no creaste esta cuenta, puedes ignorar este mensaje.",
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

export type AuthEmailVerificationEmailProps = {
  locale: SupportedLocale
  verificationUrl: string
}

export function AuthEmailVerificationEmail({
  locale,
  verificationUrl,
}: AuthEmailVerificationEmailProps) {
  const copy = emailCopy[locale]

  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.title}>{copy.title}</Heading>
          <Text style={styles.text}>{copy.body}</Text>
          <Section>
            <Button href={verificationUrl} style={styles.button}>
              {copy.cta}
            </Button>
          </Section>
          <Text style={styles.footer}>{copy.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}
