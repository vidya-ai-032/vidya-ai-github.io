"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function ResponsiveHeader() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  return (
    <header
      className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50"
      role="banner"
      aria-label="Site header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
              aria-label="Home"
            >
              <span className="text-white font-bold text-xl">V</span>
            </Link>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VidyaAI
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <nav
              className="hidden md:flex space-x-8"
              aria-label="Main navigation"
              role="navigation"
            >
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Dashboard
              </Link>
              <Link
                href="/upload"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Upload
              </Link>
              <Link
                href="/tutor"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Tutor
              </Link>
              <Link
                href="/quiz"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Quiz
              </Link>
              <Link
                href="/progress"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Progress
              </Link>
              <Link
                href="/qa"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Q&amp;A
              </Link>
              <Link
                href="/summary"
                className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                tabIndex={0}
              >
                Summary
              </Link>
            </nav>
            {/* Auth/Profile controls */}
            {isAuthenticated ? (
              <div
                className="relative group"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded="false"
              >
                <button
                  className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded="false"
                  tabIndex={0}
                >
                  <Image
                    src={session.user?.image || "/window.svg"}
                    alt="User avatar"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border border-gray-300"
                  />
                  <span className="hidden sm:inline text-gray-700 font-medium">
                    {session.user?.name?.split(" ")[0] || "User"}
                  </span>
                </button>
                <div
                  className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-50"
                  role="menu"
                  aria-label="User menu dropdown"
                >
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg focus:bg-blue-100 focus:text-blue-900"
                    tabIndex={0}
                    role="menuitem"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg focus:bg-blue-100 focus:text-blue-900"
                    tabIndex={0}
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-base font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Sign in"
              >
                Sign In
              </button>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={
                open ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={open}
              aria-controls="mobile-nav"
              tabIndex={0}
            >
              <svg
                className="w-7 h-7 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile nav */}
      {open && (
        <nav
          id="mobile-nav"
          className="md:hidden bg-white border-t border-gray-200 px-4 pb-4 pt-2 flex flex-col space-y-2"
          aria-label="Mobile navigation"
        >
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setOpen(false)}
            tabIndex={0}
          >
            Dashboard
          </Link>
          <Link
            href="/upload"
            className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setOpen(false)}
            tabIndex={0}
          >
            Upload
          </Link>
          <Link
            href="/tutor"
            className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setOpen(false)}
            tabIndex={0}
          >
            Tutor
          </Link>
          <Link
            href="/quiz"
            className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setOpen(false)}
            tabIndex={0}
          >
            Quiz
          </Link>
          <Link
            href="/progress"
            className="text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={() => setOpen(false)}
            tabIndex={0}
          >
            Progress
          </Link>
          <div className="mt-2 flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Image
                  src={session.user?.image || "/window.svg"}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full border border-gray-300"
                />
                <span className="text-gray-700 font-medium">
                  {session.user?.name?.split(" ")[0] || "User"}
                </span>
                <button
                  onClick={() => signOut()}
                  className="ml-2 text-sm text-blue-600 hover:underline"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-base font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Sign in"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
