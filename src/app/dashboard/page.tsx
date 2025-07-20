"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Topic {
  label: string;
  content: string;
  summary?: string;
  keyPoints?: string[];
  subject?: string;
  rawContent?: string;
  lastStudied?: string;
  progress?: number;
}

interface QuizQuestion {
  question: string;
  type: "multiple_choice" | "subjective" | "creative";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  subject?: string;
}

interface QuizHistory {
  date: string;
  questions: QuizQuestion[];
  answers: Record<number, string>;
  aiFeedback: Record<
    number,
    { score: number; feedback: string; suggestions: string[] }
  >;
  totalScore: number;
  maxScore: number;
  correctCount: number;
  topicLabel: string;
  userEmail: string;
}

// Add TopicMap type
interface TopicMap {
  [topicLabel: string]: {
    id: string;
    title: string;
    subject: string;
    progress: number;
    lastStudied: string;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
    logout,
    // isAuthenticated,
    // isLoading,
  } = useAuth();

  const [user] = useState({
    name: session?.user?.name || "User",
    avatar: session?.user?.image || session?.user?.name?.charAt(0) || "U",
  });

  // Load stats from localStorage for the current user
  const [stats, setStats] = useState({
    topicsCompleted: 0,
    quizzesTaken: 0,
    totalScore: 0,
    studyTime: "0 hours",
    streak: 0,
  });
  useEffect(() => {
    if (!session?.user?.email) return;
    // Example: Load stats from localStorage (replace with real backend in production)
    const quizHistory = JSON.parse(
      localStorage.getItem(`vidyaai_quiz_history_${session.user.email}`) || "[]"
    );
    setStats({
      topicsCompleted: quizHistory.length,
      quizzesTaken: quizHistory.length,
      totalScore:
        quizHistory.length > 0
          ? Math.round(
              quizHistory.reduce(
                (sum: number, q: QuizHistory) => sum + (q.totalScore || 0),
                0
              ) / quizHistory.length
            )
          : 0,
      studyTime:
        quizHistory.length > 0
          ? `${quizHistory.length * 0.5} hours`
          : "0 hours",
      streak: 0, // Implement streak logic if needed
    });
  }, [session?.user?.email]);

  // Load recent topics for the current user
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  useEffect(() => {
    if (!session?.user?.email) return;
    const quizHistory = JSON.parse(
      localStorage.getItem(`vidyaai_quiz_history_${session.user.email}`) || "[]"
    );
    // Get last 3 unique topics
    const topicsMap: TopicMap = {};
    quizHistory.forEach((q: QuizHistory) => {
      if (!topicsMap[q.topicLabel]) {
        topicsMap[q.topicLabel] = {
          id: q.topicLabel,
          title: q.topicLabel,
          subject: q.questions[0]?.subject || "",
          progress: 100, // Placeholder
          lastStudied: new Date(q.date).toLocaleString(),
        };
      }
    });
    setRecentTopics(
      Object.values(topicsMap)
        .slice(0, 3)
        .map((t) => ({
          label: t.title,
          content: "",
          subject: t.subject,
          lastStudied: t.lastStudied,
          progress: t.progress,
          // Optionally add more fields if needed
        }))
    );
  }, [session?.user?.email]);

  const [quickActions] = useState([
    {
      title: "Start Learning",
      description: "Continue with your AI tutor",
      icon: "🎓",
      href: "/tutor",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Upload Materials",
      description: "Add new study content",
      icon: "📁",
      href: "/upload",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Take Quiz",
      description: "Test your knowledge",
      icon: "📝",
      href: "/quiz",
      color: "from-green-500 to-green-600",
    },
    {
      title: "View Progress",
      description: "Check your analytics",
      icon: "📊",
      href: "/progress",
      color: "from-orange-500 to-orange-600",
    },
  ]);

  const [showApiBanner, setShowApiBanner] = useState(false);
  useEffect(() => {
    // Only show if Gemini API key is not set
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("vidyaai_gemini_api_key");
      setShowApiBanner(!key);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* API Key Banner */}
      {showApiBanner && (
        <div
          className="bg-yellow-200 border-2 border-yellow-500 text-yellow-900 px-6 py-4 rounded-xl flex items-center justify-between max-w-2xl mx-auto mt-8 mb-6 shadow-xl animate-slideDown"
          style={{ zIndex: 50, position: "relative" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-bounce">⚡</span>
            <span className="font-bold text-lg">
              Set your Gemini API key to unlock AI features!
            </span>
            <button
              className="ml-4 underline text-yellow-900 hover:text-yellow-800 font-semibold px-3 py-1 rounded transition border border-yellow-500 bg-yellow-100 hover:bg-yellow-200"
              onClick={() => router.push("/dashboard/settings")}
            >
              Go to Settings
            </button>
          </div>
          <button
            className="ml-4 text-2xl font-bold text-yellow-700 hover:text-yellow-900 transition"
            onClick={() => setShowApiBanner(false)}
            aria-label="Dismiss API key banner"
          >
            ×
          </button>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VidyaAI
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
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
                    d="M15 17h5l-5 5v-5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.avatar}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {/* {user.grade} • {user.curriculum} */}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Sign out"
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Ready to continue your learning journey? Here&apos;s what
            you&apos;ve accomplished and what&apos;s next.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl">📚</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-2">
              Topics Completed
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {stats.topicsCompleted}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl">📝</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-2">
              Quizzes Taken
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {stats.quizzesTaken}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl">🎯</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-2">
              Average Score
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {stats.totalScore}%
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl">⏱️</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-2">
              Study Time
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {stats.studyTime}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 flex flex-col items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-xl sm:text-2xl">🔥</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-2">
              Day Streak
            </p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              {stats.streak}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 hover:shadow-md transition-all duration-200 group flex flex-col items-center"
              >
                <div className="flex items-center mb-2 sm:mb-4">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${action.color} rounded-lg flex items-center justify-center text-white text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-200`}
                  >
                    {action.icon}
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm text-center">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Topics and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Recent Topics */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Recent Topics
              </h2>
              <Link
                href="/progress"
                className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {recentTopics.map((topic) => (
                <div
                  key={topic.label}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 mb-2 sm:mb-0">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                      {topic.label}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {topic.subject} • {topic.lastStudied}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${topic.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {topic.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Study Recommendations */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              AI Recommendations
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-1">
                    <span className="text-white text-xs sm:text-sm">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                      Continue Algebra
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      You&apos;re doing great with algebra! Continue with
                      quadratic equations to strengthen your foundation.
                    </p>
                    <Link
                      href="/tutor"
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium mt-2 inline-block"
                    >
                      Start learning →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-1">
                    <span className="text-white text-xs sm:text-sm">📝</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                      Take Biology Quiz
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Test your knowledge on photosynthesis with a quick quiz to
                      reinforce your learning.
                    </p>
                    <Link
                      href="/quiz"
                      className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium mt-2 inline-block"
                    >
                      Start quiz →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 mt-1">
                    <span className="text-white text-xs sm:text-sm">📊</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                      Review Progress
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      You&apos;ve improved 15% this week! Check your detailed
                      progress analytics.
                    </p>
                    <Link
                      href="/progress"
                      className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium mt-2 inline-block"
                    >
                      View analytics →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 -z-10">
        {/* Abstract SVG background */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1440 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="bg-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#f3e8ff" />
            </linearGradient>
          </defs>
          <rect width="1440" height="900" fill="url(#bg-gradient)" />
          <ellipse
            cx="1200"
            cy="200"
            rx="300"
            ry="120"
            fill="#a5b4fc"
            fillOpacity="0.15"
          />
          <ellipse
            cx="300"
            cy="700"
            rx="250"
            ry="100"
            fill="#c4b5fd"
            fillOpacity="0.12"
          />
        </svg>
        {/* Science/atom accent */}
        <svg
          className="absolute left-8 top-8 opacity-10"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="40"
            cy="40"
            r="12"
            stroke="#6366f1"
            strokeWidth="3"
            fill="#fff"
            fillOpacity="0.7"
          />
          <ellipse
            cx="40"
            cy="40"
            rx="30"
            ry="12"
            stroke="#6366f1"
            strokeWidth="2"
          />
          <ellipse
            cx="40"
            cy="40"
            rx="12"
            ry="30"
            stroke="#6366f1"
            strokeWidth="2"
          />
        </svg>
        {/* World heritage accent (globe) */}
        <svg
          className="absolute right-8 bottom-8 opacity-10"
          width="90"
          height="90"
          viewBox="0 0 90 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="45"
            cy="45"
            r="40"
            stroke="#10b981"
            strokeWidth="3"
            fill="#fff"
            fillOpacity="0.7"
          />
          <ellipse
            cx="45"
            cy="45"
            rx="30"
            ry="12"
            stroke="#10b981"
            strokeWidth="2"
          />
          <ellipse
            cx="45"
            cy="45"
            rx="12"
            ry="30"
            stroke="#10b981"
            strokeWidth="2"
          />
        </svg>
        {/* Bharatanatyam accent (dancer silhouette) */}
        <svg
          className="absolute left-8 bottom-8 opacity-10"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M40 70 Q38 60 45 55 Q50 50 40 45 Q30 40 35 30 Q40 20 45 30 Q50 40 40 45"
            stroke="#f59e42"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="40" cy="20" r="6" fill="#f59e42" />
        </svg>
      </div>
    </div>
  );
}
