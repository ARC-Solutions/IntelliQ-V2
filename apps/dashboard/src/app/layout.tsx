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
import { siteConfig } from "@/lib/site-config";

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
export const metadata: Metadata = siteConfig;

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
