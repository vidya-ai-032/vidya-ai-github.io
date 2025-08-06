"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/tutor", label: "Tutor" },
  { href: "/quiz", label: "Quiz" },
  { href: "/subjective-qa", label: "Subjective QA" },
  { href: "/dashboard/settings", label: "Settings" },
];

export default function ResponsiveHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
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

  return (
    <header
      className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-gray-100/50"
      role="banner"
      aria-label="Site header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Logo removed from here */}
          </div>

          <nav
            className="hidden md:flex items-center nav-container"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap nav-link mr-2 ${
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
                onClick={() => signOut()}
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

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-xl text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            ref={mobileMenuRef}
            className="md:hidden bg-white/95 backdrop-blur-md px-4 pb-4 pt-2 space-y-1 border-t border-gray-100/50 shadow-xl relative z-50"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
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
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
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
                className="w-full text-left block px-4 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                Sign In
              </button>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
