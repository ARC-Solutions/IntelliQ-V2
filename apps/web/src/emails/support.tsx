import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
} from "@react-email/components";

interface SupportEmailTemplateProps {
  email: string;
  fullName: string;
  socialMedia: string;
  message: string;
  imageInstructions: boolean;
}

export const SupportEmailTemplate: React.FC<Readonly<SupportEmailTemplateProps>> = ({
  email,
  fullName,
  socialMedia,
  message,
  imageInstructions,
}) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New Feedback Received</Heading>
        <Section>
          <Text style={text}>Name: {fullName}</Text>
          <Text style={text}>Email: {email}</Text>
          <Text style={text}>Social Media: {socialMedia}</Text>
          <Text style={text}>Message: {message}</Text>
          {imageInstructions && (
            <Text style={text}>
              Note: The user has been instructed that they can reply to the feedback email
              with an image for their testimonial. Please check for any follow-up emails
              with attachments.
            </Text>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  fontFamily: "Arial, sans-serif",
  backgroundColor: "#f6f6f6",
  padding: "20px",
  color: "#333",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "20px",
  maxWidth: "600px",
  margin: "0 auto",
};

const heading = {
  color: "#c8b6ff",
  fontSize: "24px",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#333",
  marginBottom: "10px",
};

const message = {
  fontSize: "16px",
  lineHeight: "1.5",
  color: "#333",
  backgroundColor: "#f0f0f0",
  padding: "10px",
  borderRadius: "4px",
};
