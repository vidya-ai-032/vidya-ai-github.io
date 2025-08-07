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
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    title: "Upload Materials",
    description: "Add new study content",
    icon: "📁",
    href: "/library",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    title: "Document Summary",
    description: "Generate educational summaries",
    icon: "📋",
    href: "/summary",
    color: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  },
  {
    title: "Test Upload",
    description: "Debug upload functionality",
    icon: "🧪",
    href: "/test-upload",
    color: "bg-gradient-to-br from-red-500 to-red-600",
  },
  {
    title: "Take a Quiz",
    description: "Test your knowledge",
    icon: "📝",
    href: "/quiz",
    color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
  },
  {
    title: "Subjective QA",
    description: "Get answers from the AI",
    icon: "❓",
    href: "/subjective-qa",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="card-modern p-8 text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sign in required
          </h2>
          <button
            className="btn-modern w-full"
            onClick={() => signIn("google", { prompt: "select_account" })}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 sm:p-4 lg:p-6 xl:p-8">
      {showApiBanner && (
        <div className="card-modern p-6 mb-8 border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 flex items-center justify-between animate-fadeIn">
          <div>
            <span className="font-bold text-yellow-800">
              ⚡️ Set your Gemini API key!
            </span>
            <p className="text-sm text-yellow-700 mt-1">
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

      <div className="mb-8 animate-fadeIn">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {session?.user?.name?.split(" ")[0] || "User"}
          </span>
          ! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Here&apos;s your learning dashboard for today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slideIn">
        <StatCard
          title="Topics Completed"
          value={stats.topicsCompleted}
          icon="📚"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Quizzes Taken"
          value={stats.quizzesTaken}
          icon="📝"
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon="🎯"
          gradient="from-green-500 to-green-600"
        />
        <StatCard
          title="Study Time"
          value={stats.studyTime}
          icon="⏱️"
          gradient="from-pink-500 to-pink-600"
        />
      </div>

      <div className="mb-8 animate-scaleIn">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <ActionCard key={action.title} {...action} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
        <div className="lg:col-span-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            Recent Topics
          </h2>
          <div className="card-modern p-6 space-y-4">
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
              <p className="text-gray-500 text-center py-8">
                No recent topics to show. Start by uploading some material!
              </p>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            AI Recommendations
          </h2>
          <div className="card-modern p-6 space-y-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card-modern p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scaleIn">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setShowModal(false)}
              aria-label="Close topic modal"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {viewedTopic.label}
            </h2>
            <p className="text-gray-600 mb-2">
              Last studied: {viewedTopic.lastStudied}
            </p>
            <p className="text-gray-600 mb-6">
              Progress: {viewedTopic.progress}%
            </p>

            {/* Subtopics section */}
            {modalSubtopics.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Subtopics
                </h3>
                {modalSubtopics.map((sub, idx) => (
                  <div
                    key={idx}
                    className="mb-4 p-4 border border-blue-100 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50"
                  >
                    <div className="font-bold text-blue-700 mb-2">
                      {sub.title}
                    </div>
                    <div className="text-gray-700 mb-3">{sub.summary}</div>
                    {sub.keyPoints && sub.keyPoints.length > 0 && (
                      <ul className="list-disc pl-5 text-gray-600 text-sm mb-3">
                        {sub.keyPoints.map((kp: string, i: number) => (
                          <li key={i}>{kp}</li>
                        ))}
                      </ul>
                    )}
                    <button
                      className="btn-modern-secondary text-sm px-4 py-2"
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
                        <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                          {tutorState[sub.title].error && (
                            <div className="text-red-600 mb-3 font-medium">
                              {tutorState[sub.title].error}
                            </div>
                          )}
                          {tutorState[sub.title].response && (
                            <>
                              <div className="mb-3">
                                <h4 className="font-semibold mb-2 text-gray-800">
                                  AI Tutor Explanation:
                                </h4>
                                <div className="mb-3 whitespace-pre-line text-gray-700">
                                  {tutorState[sub.title].response}
                                </div>
                              </div>
                              {tutorState[sub.title].suggestions &&
                                tutorState[sub.title].suggestions.length >
                                  0 && (
                                  <div className="mb-3">
                                    <span className="font-medium text-gray-800">
                                      Related Topics:
                                    </span>
                                    <ul className="list-disc ml-6 mt-1">
                                      {tutorState[sub.title].suggestions.map(
                                        (s: string, i: number) => (
                                          <li key={i} className="text-gray-700">
                                            {s}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              {tutorState[sub.title].followUpQuestions &&
                                tutorState[sub.title].followUpQuestions.length >
                                  0 && (
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      Model Questions:
                                    </span>
                                    <ul className="list-disc ml-6 mt-1">
                                      {tutorState[
                                        sub.title
                                      ].followUpQuestions.map(
                                        (fq: string, i: number) => (
                                          <li key={i} className="text-gray-700">
                                            {fq}
                                          </li>
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
              <div className="text-gray-500 text-center py-8">
                No subtopics found for this topic.
              </div>
            )}
            <div className="text-center">
              <button
                className="btn-modern"
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
  gradient,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}) => (
  <div className="card-modern p-6 flex items-center group">
    <div
      className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
    >
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
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
    className="card-modern p-6 hover:shadow-xl transition-all duration-300 group"
  >
    <div
      className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
    >
      <span className="text-2xl">{icon}</span>
    </div>
    <div className="text-center">
      <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
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
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl gap-4 sm:gap-0">
    <div className="flex-1 min-w-0">
      <h4 className="font-bold text-gray-800 text-lg truncate">{label}</h4>
      <p className="text-sm text-gray-500">Last studied: {lastStudied}</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-24 bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <span className="font-semibold text-gray-700 text-sm min-w-[3rem]">
        {progress}%
      </span>
      <button className="btn-modern text-sm px-3 py-2" onClick={onView}>
        View
      </button>
      <button
        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
        onClick={onDelete}
        title="Delete topic"
      >
        <FaTrash className="w-4 h-4" />
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
  <div className="flex items-start group">
    <div className="text-2xl mr-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-gray-800 text-lg">{title}</h4>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <Link
        href={href}
        className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:underline"
      >
        Start Now &rarr;
      </Link>
    </div>
  </div>
);
