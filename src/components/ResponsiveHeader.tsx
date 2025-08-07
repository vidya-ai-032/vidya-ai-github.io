"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tutor", label: "Tutor" },
  { href: "/quiz", label: "Quiz" },
  { href: "/subjective-qa", label: "Subjective QA" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function ResponsiveHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { logout } = useAuth();
  const isAuthenticated = status === "authenticated";
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-100/50 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2 flex-1 justify-center">
            {navLinks.map((link) => {
              const isActive = pathname?.startsWith(link.href) || false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${
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
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-300"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn("google", { prompt: "select_account" })}
                className="btn-modern text-sm px-4 py-2"
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden">
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
        </div>

        {/* Mobile Navigation Menu */}
        <div
          ref={mobileMenuRef}
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            open
              ? "max-h-screen opacity-100 pb-4"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100/50 mt-2">
            {navLinks.map((link) => {
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
              <button
                onClick={handleSignOut}
                className="w-full text-left block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-300"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  signIn("google", { prompt: "select_account" });
                  setOpen(false);
                }}
                className="w-full text-left block px-4 py-3 rounded-xl text-base font-medium btn-modern"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
