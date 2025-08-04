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

  // Force apply styles after component mounts
  useEffect(() => {
    // Force blue user avatar
    const avatars = document.querySelectorAll('.w-10.h-10.rounded-full.bg-blue-600, aside span.w-10.h-10.rounded-full');
    avatars.forEach(avatar => {
      (avatar as HTMLElement).style.backgroundColor = '#3b82f6';
      (avatar as HTMLElement).style.color = 'white';
      (avatar as HTMLElement).style.width = '40px';
      (avatar as HTMLElement).style.height = '40px';
      (avatar as HTMLElement).style.borderRadius = '50%';
      (avatar as HTMLElement).style.display = 'flex';
      (avatar as HTMLElement).style.alignItems = 'center';
      (avatar as HTMLElement).style.justifyContent = 'center';
      (avatar as HTMLElement).style.fontWeight = 'bold';
      (avatar as HTMLElement).style.fontSize = '20px';
    });
  }, []);

  // Helper to clear all user-related localStorage keys
  function clearUserLocalStorage(email?: string) {
    if (!email || typeof window === "undefined") return;
    const keysToRemove = [
      `vidyaai_quiz_history_${email}`,
      `vidyaai_library_${email}`,
      `vidyaai_library_expanded_${email}`,
      `vidyaai_qa_history_${email}`,
      `vidyaai_uploaded_topics_${email}`,
      `vidyaai_last_quiz_result_${email}`,
      // Remove all per-subtopic quiz keys
    ];
    // Remove per-subtopic quiz keys
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(`vidyaai_quiz_${email}_`) ||
        key.startsWith(`vidyaai_subtopics_${email}_`)
      ) {
        localStorage.removeItem(key);
      }
    });
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

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

  // Only show user info if authenticated
  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <aside
      className={`bg-white shadow-md border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        {!collapsed && isAuthenticated && (
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-10 h-10 rounded-full border-2 border-blue-600 object-cover"
              />
            ) : (
              <span
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl"
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "20px",
                }}
              >
                {session.user.name ? session.user.name.charAt(0) : "V"}
              </span>
            )}
            <span className="text-lg font-bold text-blue-600">
              {session.user.name || "VidyaAI"}
            </span>
          </div>
        )}
        <button
          className="text-gray-500 hover:text-blue-500 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
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
        {isAuthenticated ? (
          <button
            onClick={() => {
              clearUserLocalStorage(session.user.email);
              signOut();
            }}
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
        ) : null}
      </div>
    </aside>
  );
}
