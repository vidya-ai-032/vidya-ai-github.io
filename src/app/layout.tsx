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
