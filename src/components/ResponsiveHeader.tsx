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
      className="bg-white sticky top-0 z-50 shadow-sm"
      role="banner"
      aria-label="Site header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl hover:bg-blue-600 transition-colors shadow-sm logo"
              aria-label="Home"
            >
              V
            </Link>
            <span className="text-2xl font-bold text-blue-600 tracking-tight">
              VidyaAI
            </span>
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
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap nav-link mr-3 ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-500"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAuthenticated ? (
              <button
                onClick={() => signOut()}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn("google", { prompt: "select_account" })}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md btn-primary"
              >
                Sign In
              </button>
            )}
          </nav>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-blue-50 transition-colors"
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
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav
            ref={mobileMenuRef}
            className="md:hidden bg-white px-4 pb-4 pt-2 space-y-1 border-t border-gray-200 shadow-lg relative z-50"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
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
                className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  signIn("google", { prompt: "select_account" });
                  setOpen(false);
                }}
                className="w-full text-left block px-3 py-2 rounded-lg text-base font-medium bg-blue-400 text-white hover:bg-blue-500 transition-colors"
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
