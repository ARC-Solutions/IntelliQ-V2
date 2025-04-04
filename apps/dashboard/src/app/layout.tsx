import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
//import Navbar from '@/components/ui/navbar';
import { AuthProvider } from "@/contexts/user-context";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SupabaseProvider } from "@/contexts/supabase-context";
import { QuizProvider } from "@/contexts/quiz-context";
import QuizLogicContextProvider from "@/contexts/quiz-logic-context";
import { Toaster } from "@/components/ui/toaster";
import { QuizCreationProvider } from "@/contexts/quiz-creation-context";
import { MultiplayerProvider } from "@/contexts/multiplayer-context";
import { NuqsAdapter } from "nuqs/adapters/next/app";

// const geistSans = localFont({
//   src: './fonts/GeistVF.woff',
//   variable: '--font-geist-sans',
//   weight: '100 900',
// });
// const geistMono = localFont({
//   src: './fonts/GeistMonoVF.woff',
//   variable: '--font-geist-mono',
//   weight: '100 900',
// });

export const revalidate = 0;
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_WEBAPP_URL ?? "http://localhost:3000/"
  ),
  title: {
    default: "IntelliQ",
    template: "%s | IntelliQ",
  },
  description: "Test your expertise across various subjects with IntelliQ",
  openGraph: {
    title: "IntelliQ",
    description: "Test your expertise across various subjects with IntelliQ",
    url: "www.intelliq.dev",
    siteName: "IntelliQ",
    images: [
      {
        url: "https://www.intelliq.dev/intelliq_og.png",
        width: 1920,
        height: 1080,
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
    card: "summary_large_image",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body
        className={cn(
          process.env.NODE_ENV === "development" ? "debug-screens" : "",
          "overflow-x-hidden"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <SupabaseProvider>
              <AuthProvider>
                <QuizProvider>
                  <MultiplayerProvider>
                    <QuizCreationProvider>
                      <QuizLogicContextProvider>
                        {/*className="container mx-auto overflow-visible"*/}

                        <main>{children}</main>
                        <Toaster />
                      </QuizLogicContextProvider>
                    </QuizCreationProvider>
                  </MultiplayerProvider>
                </QuizProvider>
              </AuthProvider>
            </SupabaseProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
