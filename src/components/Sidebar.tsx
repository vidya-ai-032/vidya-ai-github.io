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
  { href: "/qa", label: "Q&A", icon: "❓" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { data: session } = useSession();
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

  return (
    <aside
      className={`bg-white shadow-md border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-3">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-10 h-10 rounded-full border-2 border-blue-600 object-cover"
              />
            ) : (
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                {session?.user?.name ? session.user.name.charAt(0) : "V"}
              </span>
            )}
            <span className="text-lg font-bold text-blue-600">
              {session?.user?.name || "VidyaAI"}
            </span>
          </div>
        )}
        <button
          className="text-gray-500 hover:text-blue-600 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
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
              d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
            />
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const showBadge = link.href === "/quiz" && quizCount > 0;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? link.label : undefined}
            >
              <span className="text-xl">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
              {showBadge && !collapsed && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {quizCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-100">
        <button
          onClick={() => signOut()}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors text-gray-700 hover:bg-red-100 hover:text-red-700 ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Sign Out" : undefined}
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
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
