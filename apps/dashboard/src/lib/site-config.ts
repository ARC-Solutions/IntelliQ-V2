import type { Metadata } from "next";

const TITLE = "IntelliQ";
const DESCRIPTION =
  "Test your expertise across various subjects with IntelliQ.";

export const siteConfig: Metadata = {
  title: { default: TITLE, template: "%s | IntelliQ" },
  description: DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
  },
  applicationName: TITLE,
  creator: "@rickyraveanu @noppin7 @nikola-petro",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: TITLE,
    type: "website",
    locale: "en-US",
    url: process.env.NEXT_PUBLIC_WEBAPP_URL,
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/intelliq_og.png`,
        width: 1920,
        height: 1080,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@rickyraveanu @noppin7 @nikola-petro",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_WEBAPP_URL}/intelliq_og.png`,
        width: 1920,
        height: 1080,
        alt: TITLE,
      },
    ],
  },
  category: "education",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_WEBAPP_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  keywords: [
    "Quiz",
    "AI Quiz",
    "Interactive Quiz",
    "Custom Quiz",
    "Personalized Learning",
    "Educational Platform",
    "Document Quizzes",
    "Multiplayer Quizzes",
    "Single Player Quizzes",
    "Random Quizzes",
    "Knowledge Testing",
    "Education",
    "Learn",
    "AI Powered",
    "Trivia",
    "Self Assessment",
    "Quiz Creator",
    "Quiz Builder",
    "Learning Platform",
    "Smart Quiz",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEBAPP_URL ?? "http://localhost:3000",
  ),
};
