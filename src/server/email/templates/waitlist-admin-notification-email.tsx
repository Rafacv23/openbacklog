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
    maxWidth: "560px",
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
} as const

export type WaitlistAdminNotificationEmailProps = {
  email: string
  registeredAtIso: string
}

export function WaitlistAdminNotificationEmail({
  email,
  registeredAtIso,
}: WaitlistAdminNotificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Nuevo registro en la waitlist</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.title}>Nuevo registro en OpenBacklog</Heading>
          <Section>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{email}</Text>
          </Section>
          <Section>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>{registeredAtIso}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
