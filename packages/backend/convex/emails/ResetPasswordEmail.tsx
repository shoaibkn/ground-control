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

interface ResetPasswordEmailProps {
  url: string
}

export const ResetPasswordEmail = ({ url }: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password for Ground Control</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ground Control</Heading>
        <Section style={section}>
          <Text style={text}>
            We received a request to reset your password for Ground Control.
            Click the link below to set a new password:
          </Text>
          <Link href={url} style={link}>
            Reset Password
          </Link>
          <Text style={text}>
            If you didn't request a password reset, you can safely ignore this
            email.
          </Text>
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
