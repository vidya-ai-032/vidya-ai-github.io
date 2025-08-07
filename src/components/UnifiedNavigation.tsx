"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";
import SignInModal from "./SignInModal";

const landingNavLinks = [
  { href: "/", label: "Home" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#support", label: "Support" },
];

export default function UnifiedNavigation() {
  const [open, setOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { logout } = useAuth();
  const isAuthenticated = status === "authenticated";
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Determine if we're on the landing page
  const isLandingPage = pathname === "/";

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSignOut = async () => {
    setOpen(false); // Close mobile menu if open
    await logout(); // Use the proper logout function with redirect
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // If authenticated, go to library
      window.location.href = "/library";
    } else {
      // If not authenticated, open sign in modal
      setIsSignInModalOpen(true);
    }
  };

  return (
    <header
      className={`${
        isLandingPage ? "bg-white shadow-sm border-b" : "bg-transparent"
      } sticky top-0 z-50`}
    >
      <div
        className={`${
          isLandingPage ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" : "px-4"
        }`}
      >
        <div className="flex justify-between items-center h-16">
          {/* Logo - Fixed position for consistency */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                V
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                Vidya AI
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation - Only for landing page */}
          {isLandingPage && (
            <nav className="hidden md:flex space-x-8">
              {landingNavLinks.map((link) => {
                const isActive = pathname?.startsWith(link.href) || false;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${
                      isActive
                        ? "text-blue-600 font-semibold"
                        : "text-gray-700 hover:text-blue-600"
                    } font-medium transition-colors`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Desktop Auth Buttons - Only for landing page */}
          {isLandingPage && (
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/library"
                    className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    My Library
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={handleGetStarted}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          )}

          {/* Mobile menu button - Only for landing page */}
          {isLandingPage && (
            <div className="md:hidden">
              <button
                onClick={() => setOpen(!open)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${open ? "hidden" : "block"} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                <svg
                  className={`${open ? "block" : "hidden"} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu - Only for landing page */}
        {isLandingPage && (
          <div
            ref={mobileMenuRef}
            className={`md:hidden transition-all duration-300 ease-in-out ${
              open
                ? "max-h-screen opacity-100 pb-4"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100/50 mt-2">
              {landingNavLinks.map((link) => {
                const isActive = pathname?.startsWith(link.href) || false;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/library"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all duration-300"
                  >
                    My Library
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleGetStarted();
                    setOpen(false);
                  }}
                  className="w-full text-left block px-4 py-3 rounded-xl text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </header>
  );
}
