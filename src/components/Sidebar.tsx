"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const featureCards = [
  {
    id: "document-upload",
    icon: "📁",
    iconBg: "bg-blue-500",
    title: "Document Upload",
    description: "Upload PDFs, videos, audio files, and text documents for enhanced learning",
    supportedTypes: ["PDF", "Video", "Audio", "Text"],
    href: "/upload"
  },
  {
    id: "interactive-quizzes",
    icon: "❓",
    iconBg: "bg-green-500",
    title: "Interactive Quizzes",
    description: "Auto-generate quizzes from your uploaded documents to test understanding",
    successRate: "87%",
    href: "/quiz"
  },
  {
    id: "ai-tutor",
    icon: "🎓",
    iconBg: "bg-purple-500",
    title: "AI Tutor",
    description: "Get personalized tutoring with voice-first AI powered by Google Gemini",
    href: "/tutor"
  },
  {
    id: "content-library",
    icon: "📚",
    iconBg: "bg-orange-500",
    title: "Content Library",
    description: "Access your uploaded materials and generated content in organized collections",
    href: "/library"
  },
  {
    id: "subjective-qa",
    icon: "💭",
    iconBg: "bg-pink-500",
    title: "Subjective Q&A",
    description: "Get detailed answers to complex questions with AI-powered analysis",
    href: "/subjective-qa"
  },
  {
    id: "dashboard",
    icon: "📊",
    iconBg: "bg-indigo-500",
    title: "Learning Dashboard",
    description: "Track your progress and access personalized learning insights",
    href: "/dashboard"
  }
];

export default function Sidebar() {
  const { data: session, status } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated" && session?.user;

  return (
    <aside
      className={`
        group/sidebar
        fixed lg:static top-0 left-0 z-40 h-screen lg:h-auto
        flex flex-col bg-white/70 backdrop-blur-xl shadow-2xl border-r border-gray-200/50
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-80"}
        overflow-hidden
        select-none
      `}
      style={{ minWidth: collapsed ? 64 : 320, maxWidth: collapsed ? 64 : 320 }}
    >
      {/* Header with collapse toggle in top-right corner */}
      <div className="flex items-center justify-between w-full px-4 py-3 relative border-b border-gray-200/30">
        {!collapsed && (
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">Premium Features</h2>
            <p className="text-sm text-gray-600 mt-1">Unlock powerful learning tools</p>
          </div>
        )}
        
        {/* Collapse/Expand toggle button in top-right corner */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100/80 hover:bg-blue-100 text-blue-600 transition-all duration-200 flex-shrink-0 shadow-sm"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
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
      </div>

      {/* User Profile Section (only when expanded) */}
      {!collapsed && isAuthenticated && (
        <div className="flex items-center w-full px-4 py-3 border-b border-gray-200/30">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-10 h-10 rounded-full border-2 border-blue-400 object-cover shadow-sm"
            />
          ) : (
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {session.user.name ? session.user.name.charAt(0) : "V"}
            </span>
          )}
          <div className="ml-3">
            <p className="font-semibold text-gray-900 truncate max-w-[180px]">
              {session.user.name || "VidyaAI User"}
            </p>
            <p className="text-sm text-gray-500 truncate max-w-[180px]">
              {session.user.email}
            </p>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-4'} space-y-3`}>
        {featureCards.map((feature) => {
          const isActive = pathname?.startsWith(feature.href) || false;
          
          if (collapsed) {
            return (
              <Link
                key={feature.id}
                href={feature.href}
                className={`
                  group flex items-center justify-center w-full h-12 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "bg-white/50 hover:bg-white/80 text-gray-700 hover:shadow-md border border-gray-200/50"
                  }
                `}
                title={feature.title}
              >
                <span className="text-xl">{feature.icon}</span>
              </Link>
            );
          }

          return (
            <Link
              key={feature.id}
              href={feature.href}
              className={`
                group block w-full rounded-2xl transition-all duration-300 transform hover:scale-[1.02]
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl"
                    : "bg-white/60 hover:bg-white/80 text-gray-700 hover:shadow-lg border border-gray-200/50"
                }
              `}
            >
              <div className="p-4">
                {/* Feature Icon and Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${isActive ? 'bg-white/20' : feature.iconBg} flex items-center justify-center shadow-sm`}>
                    <span className={`text-lg ${isActive ? 'text-white' : 'text-white'}`}>
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                    {feature.title}
                  </h3>
                </div>

                {/* Feature Description */}
                <p className={`text-xs leading-relaxed mb-3 ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                  {feature.description}
                </p>

                {/* Feature-specific metadata */}
                {feature.supportedTypes && (
                  <div className="flex flex-wrap gap-1">
                    {feature.supportedTypes.map((type) => (
                      <span
                        key={type}
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}

                {feature.successRate && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                        Success Rate
                      </span>
                      <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-green-600'}`}>
                        {feature.successRate}
                      </span>
                    </div>
                    <div className={`w-full bg-gray-200/50 rounded-full h-2 ${isActive ? 'bg-white/20' : ''}`}>
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          isActive ? 'bg-white/80' : 'bg-green-500'
                        }`}
                        style={{ width: feature.successRate }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Settings Link at Bottom */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200/30">
          <Link
            href="/dashboard/settings"
            className={`
              flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200
              ${
                pathname?.startsWith("/dashboard/settings")
                  ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                  : "bg-white/50 hover:bg-white/80 text-gray-700 hover:shadow-md border border-gray-200/50"
              }
            `}
          >
            <div className={`w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center`}>
              <span className="text-white text-sm">⚙️</span>
            </div>
            <span className="font-medium text-sm">Settings</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
