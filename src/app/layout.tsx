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
        <style
          dangerouslySetInnerHTML={{
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
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // DEBUG: Log what elements we find
              function debugElements() {
                console.log('=== DEBUG: Element Analysis ===');
                
                // Check navigation elements
                const navLinks = document.querySelectorAll('header nav a, header nav button, .nav-container a, .nav-container button, nav a, nav button');
                console.log('Navigation links found:', navLinks.length);
                navLinks.forEach((link, index) => {
                  console.log('Nav link', index, ':', link.textContent, 'Classes:', link.className);
                });
                
                // Check logo elements
                const logos = document.querySelectorAll('a[href="/"], .logo, header a[href="/"], .w-10.h-10.bg-blue-500, .w-10.h-10.rounded-lg.bg-blue-500');
                console.log('Logo elements found:', logos.length);
                logos.forEach((logo, index) => {
                  console.log('Logo', index, ':', logo.textContent, 'Classes:', logo.className, 'Background:', logo.style.backgroundColor);
                });
                
                // Check avatar elements
                const avatars = document.querySelectorAll('.w-10.h-10.rounded-full.bg-blue-600, aside span.w-10.h-10.rounded-full');
                console.log('Avatar elements found:', avatars.length);
                avatars.forEach((avatar, index) => {
                  console.log('Avatar', index, ':', avatar.textContent, 'Classes:', avatar.className, 'Background:', avatar.style.backgroundColor);
                });
                
                console.log('=== END DEBUG ===');
              }

              // Force apply styles after page loads
              function applyCriticalStyles() {
                console.log('Applying critical styles...');
                
                // Force navigation spacing
                const navLinks = document.querySelectorAll('header nav a, header nav button, .nav-container a, .nav-container button, nav a, nav button');
                console.log('Found', navLinks.length, 'navigation links');
                navLinks.forEach((link, index) => {
                  link.style.marginRight = '12px';
                  link.style.marginLeft = '0';
                  link.style.whiteSpace = 'nowrap';
                  link.style.display = 'inline-block';
                  console.log('Applied styles to nav link', index, ':', link.textContent);
                });

                // Force blue logo
                const logos = document.querySelectorAll('a[href="/"], .logo, header a[href="/"], .w-10.h-10.bg-blue-500, .w-10.h-10.rounded-lg.bg-blue-500');
                console.log('Found', logos.length, 'logo elements');
                logos.forEach((logo, index) => {
                  logo.style.backgroundColor = '#3b82f6';
                  logo.style.color = 'white';
                  logo.style.width = '40px';
                  logo.style.height = '40px';
                  logo.style.borderRadius = '8px';
                  logo.style.display = 'flex';
                  logo.style.alignItems = 'center';
                  logo.style.justifyContent = 'center';
                  logo.style.fontWeight = 'bold';
                  logo.style.fontSize = '20px';
                  console.log('Applied styles to logo', index, ':', logo.textContent);
                });

                // Force blue user avatar
                const avatars = document.querySelectorAll('.w-10.h-10.rounded-full.bg-blue-600, aside span.w-10.h-10.rounded-full');
                console.log('Found', avatars.length, 'avatar elements');
                avatars.forEach((avatar, index) => {
                  avatar.style.backgroundColor = '#3b82f6';
                  avatar.style.color = 'white';
                  avatar.style.width = '40px';
                  avatar.style.height = '40px';
                  avatar.style.borderRadius = '50%';
                  avatar.style.display = 'flex';
                  avatar.style.alignItems = 'center';
                  avatar.style.justifyContent = 'center';
                  avatar.style.fontWeight = 'bold';
                  avatar.style.fontSize = '20px';
                  console.log('Applied styles to avatar', index, ':', avatar.textContent);
                });
              }

              // Debug first, then apply styles
              debugElements();
              
              // Apply immediately and also after delays
              applyCriticalStyles();
              setTimeout(() => { debugElements(); applyCriticalStyles(); }, 100);
              setTimeout(() => { debugElements(); applyCriticalStyles(); }, 500);
              setTimeout(() => { debugElements(); applyCriticalStyles(); }, 1000);
              setTimeout(() => { debugElements(); applyCriticalStyles(); }, 2000);

              // Also apply when DOM changes
              const observer = new MutationObserver(() => {
                console.log('DOM changed, reapplying styles...');
                applyCriticalStyles();
              });
              observer.observe(document.body, { childList: true, subtree: true });
            `,
          }}
        />
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
