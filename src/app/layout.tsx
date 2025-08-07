import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Providers from "./providers";
import LayoutWrapper from "../components/LayoutWrapper";
import ThemeClientWrapper from "./theme-client-wrapper";
import AppClientWrapper from "./AppClientWrapper";
import { EnvironmentCheck } from "../components/EnvironmentCheck";
import { ErrorBoundary } from "../components/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VidyaAI - AI-Powered Learning Platform",
  description:
    "Revolutionize your learning experience with voice-first AI tutoring, personalized content processing, and intelligent quiz generation powered by Google&apos;s Gemini AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-black min-h-screen`}
      >
        <ErrorBoundary>
          <ThemeClientWrapper>
            <AppClientWrapper>
              <Providers>
                <LayoutWrapper>{children}</LayoutWrapper>
                <EnvironmentCheck />
              </Providers>
            </AppClientWrapper>
          </ThemeClientWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
