"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
// import { useRouter } from "next/navigation"; // Removed unused import
import { FaTrash } from "react-icons/fa";

interface QuizHistory {
  date: string;
  totalScore: number;
  topicLabel: string;
}

interface Topic {
  label: string;
  subject?: string;
  lastStudied?: string;
  progress?: number;
}

const quickActions = [
  {
    title: "Start Learning",
    description: "Continue with your AI tutor",
    icon: "🎓",
    href: "/tutor",
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Upload Materials",
    description: "Add new study content",
    icon: "📁",
    href: "/upload",
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Take a Quiz",
    description: "Test your knowledge",
    icon: "📝",
    href: "/quiz",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    title: "Subjective QA",
    description: "Get answers from the AI",
    icon: "❓",
    href: "/subjective-qa",
    color: "bg-purple-100 text-purple-700",
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  // const router = useRouter(); // Removed unused variable

  const [stats, setStats] = useState({
    topicsCompleted: 0,
    quizzesTaken: 0,
    averageScore: 0,
    studyTime: "0h 0m",
  });

  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [showApiBanner, setShowApiBanner] = useState(false);
  const [viewedTopic, setViewedTopic] = useState<Topic | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalSubtopics, setModalSubtopics] = useState<any[]>([]);
  const [tutorState, setTutorState] = useState<{
    [subtopicTitle: string]: any;
  }>({});
  const [tutorLoading, setTutorLoading] = useState<string | null>(null);
  const [tutorError, setTutorError] = useState<string | null>(null);

  // Helper to load recent topics from both quiz history and library
  const loadRecentTopics = useCallback(() => {
    if (status === "authenticated" && session?.user?.email) {
      // 1. Load quiz history
      const quizHistory: QuizHistory[] = JSON.parse(
        localStorage.getItem(`vidyaai_quiz_history_${session.user.email}`) ||
          "[]"
      );
      // 2. Load library
      const library: Array<{ name: string; date: string }> = JSON.parse(
        localStorage.getItem(`vidyaai_library_${session.user.email}`) || "[]"
      );
      // 3. Build a map of topics from quiz history (for lastStudied/progress)
      const quizTopicsMap = new Map<string, Topic>();
      quizHistory.forEach((q) => {
        if (!quizTopicsMap.has(q.topicLabel)) {
          quizTopicsMap.set(q.topicLabel, {
            label: q.topicLabel,
            lastStudied: new Date(q.date).toLocaleDateString(),
            progress: 100, // Assuming completed if in history
          });
        }
      });
      // 4. Build a map of topics from library (by doc name)
      const libTopicsMap = new Map<string, Topic>();
      library.forEach((doc) => {
        // Try to get subtopics for this doc
        const subKey = `vidyaai_subtopics_${session.user.email}_${doc.name}`;
        const subtopics = JSON.parse(localStorage.getItem(subKey) || "[]");
        if (subtopics && subtopics.length > 0) {
          // Each subtopic is a topic
          subtopics.forEach((sub: { title: string }) => {
            if (!libTopicsMap.has(sub.title)) {
              libTopicsMap.set(sub.title, {
                label: sub.title,
                lastStudied: new Date(doc.date).toLocaleDateString(),
                progress: quizTopicsMap.has(sub.title)
                  ? quizTopicsMap.get(sub.title)?.progress
                  : 0,
              });
            }
          });
        } else {
          // If no subtopics, use doc name as topic
          if (!libTopicsMap.has(doc.name)) {
            libTopicsMap.set(doc.name, {
              label: doc.name,
              lastStudied: new Date(doc.date).toLocaleDateString(),
              progress: 0,
            });
          }
        }
      });
      // 5. Merge quiz topics and library topics, preferring quiz info for progress/lastStudied
      const mergedTopics = new Map<string, Topic>();
      // Add quiz topics first (most recent quiz date)
      quizHistory.forEach((q) => {
        mergedTopics.set(q.topicLabel, {
          label: q.topicLabel,
          lastStudied: new Date(q.date).toLocaleDateString(),
          progress: 100,
        });
      });
      // Add/merge library topics (if not already present)
      libTopicsMap.forEach((topic, label) => {
        if (!mergedTopics.has(label)) {
          mergedTopics.set(label, topic);
        }
      });
      // 6. Sort by lastStudied (most recent first)
      const sortedTopics = Array.from(mergedTopics.values()).sort((a, b) => {
        const aDate = new Date(a.lastStudied || "1970-01-01");
        const bDate = new Date(b.lastStudied || "1970-01-01");
        return bDate.getTime() - aDate.getTime();
      });
      // 7. Update stats (quizzes only)
      const totalScore = quizHistory.reduce(
        (sum, q) => sum + (q.totalScore || 0),
        0
      );
      const averageScore =
        quizHistory.length > 0
          ? Math.round(totalScore / quizHistory.length)
          : 0;
      setStats({
        topicsCompleted: quizTopicsMap.size,
        quizzesTaken: quizHistory.length,
        averageScore: averageScore,
        studyTime: `${Math.round((quizHistory.length * 15) / 60)}h ${
          (quizHistory.length * 15) % 60
        }m`,
      });
      setRecentTopics(sortedTopics.slice(0, 3));
    }
  }, [status, session?.user?.email]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("vidyaai_gemini_api_key");
      setShowApiBanner(!key);
    }
    loadRecentTopics();
  }, [status, session?.user?.email]);

  // Load subtopics for the viewed topic when modal opens
  useEffect(() => {
    if (showModal && viewedTopic && session?.user?.email) {
      const key = `vidyaai_subtopics_${session.user.email}_${viewedTopic.label}`;
      const data = localStorage.getItem(key);
      if (data) {
        setModalSubtopics(JSON.parse(data));
      } else {
        setModalSubtopics([]);
      }
      setTutorState({});
      setTutorLoading(null);
      setTutorError(null);
    }
  }, [showModal, viewedTopic, session?.user?.email]);

  // Delete topic from recentTopics, quiz history, and library
  const handleDeleteTopic = (topicLabel: string) => {
    setRecentTopics((prev) => prev.filter((t) => t.label !== topicLabel));
    // Remove from quiz history
    if (session?.user?.email) {
      const quizKey = `vidyaai_quiz_history_${session.user.email}`;
      const quizHistory = JSON.parse(localStorage.getItem(quizKey) || "[]");
      const updatedQuiz = quizHistory.filter(
        (q: QuizHistory) => q.topicLabel !== topicLabel
      );
      localStorage.setItem(quizKey, JSON.stringify(updatedQuiz));
      // Remove from library
      const libraryKey = `vidyaai_library_${session.user.email}`;
      const prevLib = JSON.parse(localStorage.getItem(libraryKey) || "[]");
      const updatedLib = prevLib.filter(
        (d: { name: string }) => d.name !== topicLabel
      );
      localStorage.setItem(libraryKey, JSON.stringify(updatedLib));
      // Remove subtopics
      const subKey = `vidyaai_subtopics_${session.user.email}_${topicLabel}`;
      localStorage.removeItem(subKey);
    }
    // Reload recent topics
    loadRecentTopics();
  };

  // Teach Me This handler for subtopics in modal
  const handleTeachMeThis = async (subtopic: {
    title: string;
    summary: string;
    keyPoints?: string[];
  }) => {
    setTutorLoading(subtopic.title);
    setTutorError(null);
    setTutorState((prev) => ({ ...prev, [subtopic.title]: { loading: true } }));
    try {
      const context =
        subtopic.summary +
        (subtopic.keyPoints?.length ? "\n" + subtopic.keyPoints.join(" ") : "");
      const userMessage =
        "Explain this topic in detail, suggest further related topics, and provide model questions.";
      const res = await fetch("/api/tutor/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          context,
          conversationHistory: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get explanation");
      setTutorState((prev) => ({
        ...prev,
        [subtopic.title]: { ...data, loading: false },
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setTutorError(errorMessage);
      setTutorState((prev) => ({
        ...prev,
        [subtopic.title]: {
          error: errorMessage,
          loading: false,
        },
      }));
    } finally {
      setTutorLoading(null);
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4">Sign in required</h2>
          <button
            className="bg-white border border-gray-300 rounded-lg shadow-sm flex items-center gap-2 px-6 py-2 text-gray-700 hover:bg-gray-50 transition-colors mx-auto"
            onClick={() => signIn("google", { prompt: "select_account" })}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6 xl:p-8">
      {showApiBanner && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md flex items-center justify-between shadow-sm">
          <div>
            <span className="font-bold">⚡️ Set your Gemini API key!</span>
            <p className="text-sm">
              Unlock all AI features by adding your API key in the settings.
            </p>
          </div>
          <div className="flex items-center">
            <Link
              href="/dashboard/settings"
              className="font-bold text-sm text-yellow-800 hover:underline mr-4"
            >
              Go to Settings
            </Link>
            <button
              onClick={() => setShowApiBanner(false)}
              className="text-yellow-500 hover:text-yellow-700"
              aria-label="Dismiss API key banner"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Welcome back, {session?.user?.name?.split(" ")[0] || "User"}! 👋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Here&apos;s your learning dashboard for today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatCard
          title="Topics Completed"
          value={stats.topicsCompleted}
          icon="📚"
        />
        <StatCard title="Quizzes Taken" value={stats.quizzesTaken} icon="📝" />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon="🎯"
        />
        <StatCard title="Study Time" value={stats.studyTime} icon="⏱️" />
      </div>

      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {quickActions.map((action) => (
            <ActionCard key={action.title} {...action} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            Recent Topics
          </h2>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-3 sm:space-y-4">
            {recentTopics.length > 0 ? (
              recentTopics.map((topic) => (
                <TopicItem
                  key={topic.label}
                  {...topic}
                  onView={() => {
                    setViewedTopic(topic);
                    setShowModal(true);
                  }}
                  onDelete={() => handleDeleteTopic(topic.label)}
                />
              ))
            ) : (
              <p className="text-gray-500">
                No recent topics to show. Start by uploading some material!
              </p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
            AI Recommendations
          </h2>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-3 sm:space-y-4">
            <RecommendationItem
              title="Review Photosynthesis"
              description="Your last quiz score was a bit low. A quick review could help."
              href="/tutor"
              icon="🌿"
            />
            <RecommendationItem
              title="Challenge Yourself"
              description="Try a subjective Q&A on 'Cellular Respiration' to deepen your knowledge."
              href="/subjective-qa"
              icon="🧠"
            />
          </div>
        </div>
      </div>
      {/* Modal for viewing topic details */}
      {showModal && viewedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
              onClick={() => setShowModal(false)}
              aria-label="Close topic modal"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-blue-700">
              {viewedTopic.label}
            </h2>
            <p className="text-gray-600 mb-2">
              Last studied: {viewedTopic.lastStudied}
            </p>
            <p className="text-gray-600 mb-4">
              Progress: {viewedTopic.progress}%
            </p>
            {/* Subtopics section */}
            {modalSubtopics.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Subtopics
                </h3>
                {modalSubtopics.map((sub, idx) => (
                  <div
                    key={idx}
                    className="mb-4 p-3 border border-blue-100 rounded-lg bg-blue-50"
                  >
                    <div className="font-bold text-blue-700 mb-1">
                      {sub.title}
                    </div>
                    <div className="text-gray-700 mb-2">{sub.summary}</div>
                    {sub.keyPoints && sub.keyPoints.length > 0 && (
                      <ul className="list-disc pl-5 text-gray-600 text-sm mb-2">
                        {sub.keyPoints.map((kp: string, i: number) => (
                          <li key={i}>{kp}</li>
                        ))}
                      </ul>
                    )}
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded font-semibold hover:bg-yellow-600 transition-colors text-sm"
                      onClick={() => handleTeachMeThis(sub)}
                      disabled={tutorLoading === sub.title}
                    >
                      {tutorLoading === sub.title
                        ? "Loading..."
                        : "Teach Me This"}
                    </button>
                    {/* AI Tutor/Teach Me This output */}
                    {tutorState[sub.title] &&
                      !tutorState[sub.title].loading && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                          {tutorState[sub.title].error && (
                            <div className="text-red-600 mb-2">
                              {tutorState[sub.title].error}
                            </div>
                          )}
                          {tutorState[sub.title].response && (
                            <>
                              <div className="mb-2">
                                <h4 className="font-semibold mb-1">
                                  AI Tutor Explanation:
                                </h4>
                                <div className="mb-2 whitespace-pre-line">
                                  {tutorState[sub.title].response}
                                </div>
                              </div>
                              {tutorState[sub.title].suggestions &&
                                tutorState[sub.title].suggestions.length >
                                  0 && (
                                  <div className="mb-2">
                                    <span className="font-medium">
                                      Related Topics:
                                    </span>
                                    <ul className="list-disc ml-6">
                                      {tutorState[sub.title].suggestions.map(
                                        (s: string, i: number) => (
                                          <li key={i}>{s}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {tutorState[sub.title].followUpQuestions &&
                                tutorState[sub.title].followUpQuestions.length >
                                  0 && (
                                  <div>
                                    <span className="font-medium">
                                      Model Questions:
                                    </span>
                                    <ul className="list-disc ml-6">
                                      {tutorState[
                                        sub.title
                                      ].followUpQuestions.map(
                                        (fq: string, i: number) => (
                                          <li key={i}>{fq}</li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">
                No subtopics found for this topic.
              </div>
            )}
            <div className="text-center">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex items-center">
    <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">{icon}</div>
    <div>
      <p className="text-gray-600 text-xs sm:text-sm">{title}</p>
      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  </div>
);

const ActionCard = ({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}) => (
  <Link
    href={href}
    className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-start"
  >
    <div className={`text-xl sm:text-2xl mr-3 sm:mr-4 p-2 rounded-lg ${color}`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-gray-900 text-sm sm:text-base">{title}</h3>
      <p className="text-gray-600 text-xs sm:text-sm">{description}</p>
    </div>
  </Link>
);

const TopicItem = ({
  label,
  lastStudied,
  progress,
  onView,
  onDelete,
}: {
  label: string;
  lastStudied?: string;
  progress?: number;
  onView: () => void;
  onDelete: () => void;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3 sm:gap-0">
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">
        {label}
      </h4>
      <p className="text-xs sm:text-sm text-gray-500">
        Last studied: {lastStudied}
      </p>
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="font-semibold text-gray-700 text-xs sm:text-sm">
        {progress}%
      </span>
      <button
        className="bg-blue-400 text-white px-2 sm:px-3 py-1 rounded hover:bg-blue-500 font-semibold text-xs sm:text-sm"
        onClick={onView}
      >
        View
      </button>
      <button
        className="text-red-600 hover:text-red-800 p-1"
        onClick={onDelete}
        title="Delete topic"
      >
        <FaTrash className="w-3 h-3 sm:w-4 sm:h-4" />
      </button>
    </div>
  </div>
);

const RecommendationItem = ({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) => (
  <div className="flex items-start">
    <div className="text-xl mr-4">{icon}</div>
    <div>
      <h4 className="font-bold text-gray-800">{title}</h4>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      <Link
        href={href}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Start Now &rarr;
      </Link>
    </div>
  </div>
);
