import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEBAPP_URL ?? "http://localhost:3000/",
  ),
  title: {
    default: "IntelliQ",
    template: "%s | IntelliQ",
  },
  description: "Test your expertise across various subjects with IntelliQ.",
  applicationName: "IntelliQ",
  creator: "@rickyraveanu @noppin7 @nikola-petro",
  openGraph: {
    title: "IntelliQ",
    description: "Test your expertise across various subjects with IntelliQ.",
    url: "www.beta.intelliq.dev",
    siteName: "IntelliQ",
    images: [
      {
        url: "https://app.intelliq.dev/intelliq_og.png",
        width: 1920,
        height: 1080,
        alt: "IntelliQ",
      },
    ],
    locale: "en-US",
    type: "website",
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
  twitter: {
    title: "IntelliQ",
    description: "Test your expertise across various subjects with IntelliQ.",
    card: "summary_large_image",
    creator: "@rickyraveanu @noppin7 @nikola-petro",
    images: [
      {
        url: "https://app.intelliq.dev/intelliq_og.png",
        width: 1920,
        height: 1080,
        alt: "IntelliQ",
      },
    ],
  },
  category: "education",
  alternates: {
    canonical: process.env.NEXT_PUBLIC_WEBAPP_URL,
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${process.env.NODE_ENV === "development" ? "debug-screens" : ""} overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="container mx-auto overflow-hidden md:overflow-visible">
            {children}
            <Toaster />
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
