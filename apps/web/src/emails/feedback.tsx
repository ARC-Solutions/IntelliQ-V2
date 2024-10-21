import * as React from 'react';
import { Html, Head, Body, Container, Heading, Text, Section } from '@react-email/components';

interface EmailTemplateProps {
  name: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ name }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>Thank You, {name}!</Heading>
        <Section>
          <Text style={text}>
            We appreciate your feedback on IntelliQ, powered by ARC Solutions.
          </Text>
          <Text style={text}>
            Your insights help us continuously improve our platform to deliver the best quiz
            experience. We're grateful for your time and input!
          </Text>
          <Text style={text}>
            Feel free to reach out if you have any further suggestions or questions.
          </Text>
          <Text style={text}>
            If you'd like to include an image with your testimonial, simply reply to this email
            with your image attached. We'd love to feature it alongside your feedback!
          </Text>
          <Text style={signature}>Best regards,</Text>
          <Text style={signature}>The IntelliQ Team at ARC Solutions</Text>
        </Section>
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} ARC Solutions. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

const main = {
  fontFamily: 'Arial, sans-serif',
  backgroundColor: '#f6f6f6',
  padding: '20px',
  color: '#333',
};

const container = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '600px',
  margin: '0 auto',
};

const heading = {
  color: '#c8b6ff',
  fontSize: '24px',
};

const text = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#333',
};

const signature = {
  marginTop: '30px',
  fontSize: '16px',
  color: '#555',
};

const footer = {
  marginTop: '40px',
};

const footerText = {
  fontSize: '12px',
  color: '#999',
};
