import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"
import * as React from "react"

interface NotificationEmailProps {
  previewText: string
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
}

export const NotificationEmail = ({
  previewText,
  title,
  message,
  actionUrl,
  actionLabel,
}: NotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>{previewText}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ground Control</Heading>
        <Section style={section}>
          <Heading style={h2}>{title}</Heading>
          <Text style={text}>{message}</Text>
          {actionUrl && actionLabel && (
            <Link href={actionUrl} style={link}>
              {actionLabel}
            </Link>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
}

const section = {
  padding: "0 48px",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
}

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "20px 0 10px 0",
}

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
}

const link = {
  color: "#2754C5",
  fontSize: "16px",
  textDecoration: "underline",
  display: "block",
  margin: "16px 0",
}
