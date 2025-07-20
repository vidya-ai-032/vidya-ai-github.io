"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface QuizQuestion {
  subject?: string;
  score?: number;
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

export default function ParentDashboardPage() {
  const { data: session, status } = useSession();
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading quiz history (from localStorage for demo)
    const data = localStorage.getItem("vidyaai_quiz_history");
    setQuizHistory(data ? JSON.parse(data) : []);
    setLoading(false);
  }, []);

  // Only allow access if logged in as parent
  if (status === "loading" || loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (!session || session.user?.role !== "parent") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg shadow text-lg font-semibold">
          Not authorized. This page is for parents only.
        </div>
      </div>
    );
  }

  // Aggregate stats
  const subjectStats: Record<string, { count: number; avg: number }> = {};
  quizHistory.forEach((q) => {
    q.questions.forEach((qq: QuizQuestion) => {
      const subj = qq.subject || q.topicLabel || "General";
      if (!subjectStats[subj]) subjectStats[subj] = { count: 0, avg: 0 };
      subjectStats[subj].count += 1;
      subjectStats[subj].avg += qq.score || 0;
    });
  });
  Object.keys(subjectStats).forEach((subj) => {
    if (subjectStats[subj].count > 0) {
      subjectStats[subj].avg = Math.round(
        subjectStats[subj].avg / subjectStats[subj].count
      );
    }
  });

  // Strengths: subjects with avg >= 80
  const strengths = Object.entries(subjectStats)
    .filter(([, v]) => v.avg >= 80)
    .map(([k]) => k);
  // Areas for improvement: avg < 60
  const improvements = Object.entries(subjectStats)
    .filter(([, v]) => v.avg > 0 && v.avg < 60)
    .map(([k]) => k);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">
          Parent Dashboard
        </h1>
        <p className="text-gray-700 text-center mb-6">
          Insights into your child&apos;s learning progress, strengths, and
          areas needing improvement.
        </p>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Overall Progress
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {Object.entries(subjectStats).map(([subj, stat]) => (
              <div
                key={subj}
                className="bg-gray-100 rounded-lg px-4 py-2 text-center min-w-[120px]"
              >
                <div className="font-bold text-purple-700">{subj}</div>
                <div className="text-sm text-gray-700">
                  Avg Score: <span className="font-semibold">{stat.avg}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Attempts: {stat.count}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Strengths
          </h2>
          {strengths.length > 0 ? (
            <ul className="list-disc list-inside text-green-700">
              {strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">
              No strong subjects identified yet.
            </div>
          )}
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Areas for Improvement
          </h2>
          {improvements.length > 0 ? (
            <ul className="list-disc list-inside text-red-700">
              {improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No major weaknesses detected.</div>
          )}
        </div>
        <div className="text-center mt-8">
          <span className="text-xs text-gray-400">
            (Demo: Data is based on local quiz history. Real implementation
            would aggregate across the child&apos;s account.)
          </span>
        </div>
      </div>
    </div>
  );
}
