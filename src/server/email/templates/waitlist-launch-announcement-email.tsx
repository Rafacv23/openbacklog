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

const styles = {
  body: {
    backgroundColor: "#eef2e1",
    color: "#161616",
    fontFamily: "Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    border: "1px solid #dadfcb",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "28px",
  },
  heading: {
    fontSize: "26px",
    lineHeight: "1.2",
    margin: "0 0 14px",
  },
  text: {
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 14px",
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
  separator: {
    borderTop: "1px solid #dadfcb",
    margin: "16px 0",
  },
} as const

export type WaitlistLaunchAnnouncementEmailProps = {
  appUrl: string
}

export function WaitlistLaunchAnnouncementEmail({
  appUrl,
}: WaitlistLaunchAnnouncementEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>OpenBacklog is live. Your access is ready.</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>OpenBacklog is live</Heading>
          <Text style={styles.text}>
            Thanks for joining the waitlist. You can now access OpenBacklog and
            start organizing your backlog to finish more games.
          </Text>
          <Section>
            <Button href={appUrl} style={styles.button}>
              Open OpenBacklog
            </Button>
          </Section>

          <Section style={styles.separator} />

          <Heading style={styles.heading}>OpenBacklog ya esta disponible</Heading>
          <Text style={styles.text}>
            Gracias por unirte a la waitlist. Ya puedes entrar en OpenBacklog y
            empezar a organizar tu backlog para terminar mas juegos.
          </Text>
          <Section>
            <Button href={appUrl} style={styles.button}>
              Entrar en OpenBacklog
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
