import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ResponsiveHeader from "../components/ResponsiveHeader";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import ThemeClientWrapper from "./theme-client-wrapper";
import AppClientWrapper from "./AppClientWrapper";

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
        <style dangerouslySetInnerHTML={{
          __html: `
            /* CRITICAL INLINE STYLES - Override everything */
            header nav a, header nav button, .nav-container a, .nav-container button, nav a, nav button {
              margin-right: 12px !important;
              padding-right: 8px !important;
              padding-left: 8px !important;
              white-space: nowrap !important;
              display: inline-block !important;
            }
            a[href="/"], .logo, header a[href="/"], .w-10.h-10.bg-blue-500, .w-10.h-10.rounded-full.bg-blue-600, aside span.w-10.h-10.rounded-full, .bg-blue-500, .bg-blue-600 {
              background-color: #3b82f6 !important;
              color: white !important;
            }
            a[href="/"], .logo, header a[href="/"], .w-10.h-10.bg-blue-500 {
              width: 40px !important;
              height: 40px !important;
              border-radius: 8px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-weight: bold !important;
              font-size: 20px !important;
            }
            .w-10.h-10.rounded-full.bg-blue-600, aside span.w-10.h-10.rounded-full {
              width: 40px !important;
              height: 40px !important;
              border-radius: 50% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-weight: bold !important;
              font-size: 20px !important;
            }
          `
        }} />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-black`}
      >
        <ThemeClientWrapper>
          <AppClientWrapper>
            <Providers>
              <ResponsiveHeader />
              <div className="flex w-full min-h-[calc(100vh-4rem)] bg-white">
                <Sidebar />
                <main className="flex-1 flex flex-col">
                  {children}
                  <Footer />
                </main>
              </div>
            </Providers>
          </AppClientWrapper>
        </ThemeClientWrapper>
      </body>
    </html>
  );
}
