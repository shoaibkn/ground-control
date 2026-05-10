import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  url: string;
}

export const VerificationEmail = ({ url }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email for Ground Control</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Verify your email</Heading>
        <Section style={section}>
          <Text style={text}>
            Welcome to Ground Control! Click the button below to verify your email address and get started.
          </Text>
          <Button style={button} href={url}>
            Verify Email
          </Button>
          <Text style={text}>
            If the button doesn't work, you can also click on this link:
          </Text>
          <Link href={url} style={link}>
            {url}
          </Link>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this email, you can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const section = {
  padding: "0 48px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 48px",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
  marginTop: "25px",
};

const text = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const link = {
  color: "#000000",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 48px",
};
