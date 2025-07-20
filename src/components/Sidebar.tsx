"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import Image from "next/image";

const navGroups = [
  {
    label: "Main",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: "🏠" },
      { href: "/upload", label: "Upload", icon: "📁" },
      { href: "/tutor", label: "Tutor", icon: "🎓" },
    ],
  },
  {
    label: "Learning",
    links: [
      { href: "/quiz", label: "Quiz", icon: "📝" },
      { href: "/progress", label: "Progress", icon: "📊" },
      { href: "/library", label: "Library", icon: "📚" },
      { href: "/qa", label: "Q&A", icon: "❓" },
      { href: "/summary", label: "Summary", icon: "📝" },
    ],
  },
];
const settingsLinks = [
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const [quizCount, setQuizCount] = useState(0);
  useEffect(() => {
    if (!session?.user?.email) {
      setQuizCount(0);
      return;
    }
    const data = localStorage.getItem(
      `vidyaai_quiz_history_${session.user.email}`
    );
    if (data) {
      const history = JSON.parse(data);
      setQuizCount(Array.isArray(history) ? history.length : 0);
    } else {
      setQuizCount(0);
    }
  }, [session?.user?.email]);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "Main",
    "Learning",
  ]);
  const pathname = usePathname();

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <>
      {/* SVG Accent */}
      <svg
        className="fixed left-0 top-0 z-0 opacity-10 pointer-events-none hidden md:block"
        width="220"
        height="220"
        viewBox="0 0 220 220"
        fill="none"
        style={{ filter: "blur(2px)" }}
      >
        <circle cx="110" cy="110" r="100" fill="url(#sidebar-gradient)" />
        <defs>
          <linearGradient
            id="sidebar-gradient"
            x1="0"
            y1="0"
            x2="220"
            y2="220"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#6366F1" />
            <stop offset="1" stopColor="#A21CAF" />
          </linearGradient>
        </defs>
      </svg>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setOpen(true)}
        aria-label="Open sidebar"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden animate-fadeIn"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
          ${collapsed ? "w-20" : "w-64"}
          bg-gradient-to-br from-blue-50 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-800 flex flex-col
          transition-all duration-300 group/sidebar`}
        style={{ minHeight: "100vh" }}
        tabIndex={-1}
        aria-label="Sidebar navigation"
      >
        <div className="bg-white dark:bg-gray-900">
          {/* Profile section */}
          <div className="flex items-center h-16 px-4 border-b border-gray-100 relative">
            <Image
              src={session?.user?.image || "/window.svg"}
              alt="User avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full border border-gray-300 mr-3"
            />
            {!collapsed && (
              <div>
                <div className="font-bold text-gray-900">
                  {session?.user?.name || "User"}
                </div>
                <div className="text-xs text-gray-500">
                  {session?.user?.role || "User"}
                </div>
              </div>
            )}
            {/* Collapse/expand button */}
            <button
              className="ml-auto text-gray-400 hover:text-blue-600 dark:hover:text-purple-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 hidden md:block"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                className="w-5 h-5"
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
          {/* Navigation groups */}
          <nav className="flex-1 py-4 px-2 space-y-2 overflow-y-auto custom-scrollbar">
            {navGroups.map((group) => (
              <div key={group.label}>
                <button
                  className="flex items-center w-full px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide focus:outline-none focus:text-blue-700"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={expandedGroups.includes(group.label)}
                >
                  <span className="mr-2">{group.label}</span>
                  <svg
                    className={`w-3 h-3 ml-auto transition-transform ${
                      expandedGroups.includes(group.label)
                        ? "rotate-90"
                        : "rotate-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
                <div
                  className={`space-y-1 pl-1 border-l-2 border-transparent transition-all duration-200 ${
                    expandedGroups.includes(group.label)
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {group.links.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/dashboard" &&
                        pathname.startsWith(link.href));
                    // Dynamically set badge for Quiz link
                    const showBadge = link.href === "/quiz" && quizCount > 0;
                    return (
                      <div key={link.href} className="relative group">
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200
                            ${
                              isActive
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-purple-200"
                            }
                            group-hover:scale-105 group-hover:shadow-xl group-hover:bg-blue-100/60 dark:group-hover:bg-gray-800/60
                            ${collapsed ? "justify-center" : ""}`}
                          onClick={() => setOpen(false)}
                          tabIndex={0}
                          title={collapsed ? link.label : undefined}
                        >
                          <span
                            className={`text-lg transition-transform duration-200 group-hover:scale-125 ${
                              collapsed ? "mx-auto" : ""
                            }`}
                          >
                            {link.icon}
                          </span>
                          {!collapsed && <span>{link.label}</span>}
                          {showBadge && (
                            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse shadow">
                              {quizCount}
                            </span>
                          )}
                        </Link>
                        {/* Tooltip for collapsed mode */}
                        {collapsed && (
                          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            {link.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <div className="bg-blue-50 dark:bg-gray-800 flex-1">
          {/* Learning nav group */}
          {/* Settings/Logout quick actions */}
          <div className="mt-auto py-4 px-4 border-t border-gray-100 flex flex-col gap-2">
            {settingsLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-purple-200 font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                }`}
                tabIndex={0}
                title={collapsed ? link.label : undefined}
              >
                <span className="text-lg">{link.icon}</span>
                {!collapsed && <span>{link.label}</span>}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-800 font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
              tabIndex={0}
              title={collapsed ? "Logout" : undefined}
            >
              <span className="text-lg">🚪</span>
              {!collapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c7d2fe;
            border-radius: 4px;
          }
        `}</style>
      </aside>
    </>
  );
}
