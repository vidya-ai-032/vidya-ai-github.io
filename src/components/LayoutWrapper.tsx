"use client";
import { usePathname } from "next/navigation";
import UnifiedNavigation from "./UnifiedNavigation";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    // Landing page - show unified navigation, no sidebar
    return (
      <>
        <UnifiedNavigation />
        {children}
      </>
    );
  }

  // Other pages - show unified navigation without sidebar
  return (
    <>
      {/* Unified Navigation for all pages */}
      <UnifiedNavigation />

      <div className="flex w-full min-h-[calc(100vh-4rem)] overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </>
  );
}
