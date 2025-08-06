"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/upload", label: "Upload", icon: "📁" },
  { href: "/tutor", label: "Tutor", icon: "🎓" },
  { href: "/quiz", label: "Quiz", icon: "📝" },
  { href: "/library", label: "Library", icon: "📚" },
  { href: "/subjective-qa", label: "Subjective QA", icon: "❓" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [quizCount, setQuizCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && session?.user?.email) {
      const data = localStorage.getItem(
        `vidyaai_quiz_history_${session.user.email}`
      );
      if (data) {
        const history = JSON.parse(data);
        setQuizCount(Array.isArray(history) ? history.length : 0);
      } else {
        setQuizCount(0);
      }
    } else {
      setQuizCount(0);
    }
  }, [session?.user?.email]);

  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <aside
      className={`
        group/sidebar
        fixed lg:static top-0 left-0 z-40 h-screen lg:h-auto
        flex flex-col items-center bg-white/90 backdrop-blur-md shadow-xl border-r border-gray-100/50
        transition-all duration-300
        ${collapsed ? "w-16" : "w-56"}
        overflow-hidden
        select-none
      `}
      style={{ minWidth: collapsed ? 64 : 220, maxWidth: collapsed ? 64 : 220 }}
    >
      {/* App Icon at the very top left */}
      {/* <Link
        href="/"
        className={`flex items-center justify-center mt-4 mb-2 ${
          collapsed ? "mx-0" : "mx-2"
        }`}
        aria-label="Home"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow">
          V
        </div>
        {!collapsed && (
          <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            VidyaAI
          </span>
        )}
      </Link> */}

      {/* Profile section below app icon */}
      <div
        className={`flex items-center w-full px-2 py-4 ${
          collapsed ? "justify-center" : "gap-3"
        }`}
      >
        {isAuthenticated ? (
          <>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-9 h-9 rounded-full border-2 border-blue-400 object-cover shadow"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow">
                {session.user.name ? session.user.name.charAt(0) : "V"}
              </span>
            )}
            {!collapsed && (
              <span className="font-semibold text-gray-900 truncate max-w-[110px]">
                {session.user.name || "VidyaAI"}
              </span>
            )}
          </>
        ) : (
          <span className="w-9 h-9 rounded-full bg-gray-200" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 w-full items-center overflow-hidden mt-2">
        {navLinks.map((link) => {
          const isActive = pathname?.startsWith(link.href) || false;
          const showBadge = link.href === "/quiz" && quizCount > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`
                group flex items-center w-[90%] mx-auto my-1 rounded-xl transition-all duration-200
                ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600"
                }
                h-12 min-h-[48px] relative
              `}
              title={link.label}
            >
              <span className="text-xl flex-shrink-0">{link.icon}</span>
              {!collapsed && (
                <span className="truncate text-base font-medium">
                  {link.label}
                </span>
              )}
              {showBadge && !collapsed && (
                <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-0.5 shadow-lg">
                  {quizCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse/Expand and Sign Out at the bottom */}
      <div className="w-full flex flex-col items-center gap-2 pb-4 mt-auto">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-blue-100 text-blue-600 transition-all duration-200 mb-2"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-6 h-6 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>
        {isAuthenticated && (
          <button
            onClick={() => signOut()}
            className={`w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-600 hover:bg-red-200 transition-all duration-200 ${
              collapsed ? "" : "w-[90%]"
            }`}
            title="Sign Out"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            {!collapsed && <span className="ml-2 font-medium">Sign Out</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
