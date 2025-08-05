import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ResponsiveHeader from "../components/ResponsiveHeader";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
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
        className={`${inter.variable} font-sans antialiased bg-white text-black`}
      >
        <ErrorBoundary>
          <ThemeClientWrapper>
            <AppClientWrapper>
              <Providers>
                <ResponsiveHeader />
                <div className="flex w-full min-h-[calc(100vh-4rem)] bg-white overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 flex flex-col min-w-0 lg:ml-0 overflow-x-hidden">
                    <div className="flex-1 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
                      {children}
                    </div>
                    <Footer />
                  </main>
                </div>
                <EnvironmentCheck />
              </Providers>
            </AppClientWrapper>
          </ThemeClientWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
