"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import jsPDF from "jspdf";
import { useSession, signIn } from "next-auth/react";

interface QuizQuestion {
  question: string;
  type: "multiple_choice" | "subjective" | "creative";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface QuizResult {
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

interface Topic {
  label: string;
  content: string;
  subject: string;
  isUploaded: boolean;
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
  content?: string; // Add this field
}

export default function QuizPage() {
  const { data: session, status } = useSession();
  const [quiz, setQuiz] = useState<{ questions: QuizQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<{ [idx: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    [idx: number]: { score: number; feedback: string; suggestions: string[] };
  }>({});
  const [perSubtopicQuizzes, setPerSubtopicQuizzes] = useState<
    Record<string, any>
  >({});
  const [expandedQuizCards, setExpandedQuizCards] = useState<
    Record<string, boolean>
  >({});
  // Add state for per-subtopic quiz answers, submission, and feedback
  const [perSubtopicQuizAnswers, setPerSubtopicQuizAnswers] = useState<
    Record<string, Record<number, string>>
  >({});
  const [perSubtopicQuizSubmitted, setPerSubtopicQuizSubmitted] = useState<
    Record<string, boolean>
  >({});
  const [perSubtopicQuizScore, setPerSubtopicQuizScore] = useState<
    Record<string, number>
  >({});

  // Sample topics (replace with real topics from upload/content processing in future)
  const sampleTopics = useMemo(
    () => [
      {
        label: "Photosynthesis (Biology)",
        content:
          "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.",
        subject: "Biology",
      },
      {
        label: "World War II (History)",
        content:
          "World War II was a global conflict that lasted from 1939 to 1945, involving most of the world's nations.",
        subject: "History",
      },
      {
        label: "Quadratic Equations (Mathematics)",
        content:
          "A quadratic equation is a second-order polynomial equation in a single variable x with a ≠ 0.",
        subject: "Mathematics",
      },
    ],
    []
  );
  // Load topics from uploaded content (simulate with localStorage for now)
  const [uploadedTopics, setUploadedTopics] = useState<Topic[]>([]);
  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(
      `vidyaai_uploaded_topics_${session.user.email}`
    );
    if (data) setUploadedTopics(JSON.parse(data));
  }, [session?.user?.email]);

  // Group topics for selection
  const allTopics = useMemo(
    () => [
      ...(uploadedTopics.length > 0
        ? uploadedTopics.map((t) => ({ ...t, isUploaded: true }))
        : []),
      ...sampleTopics.map((t) => ({ ...t, isUploaded: false })),
    ],
    [uploadedTopics, sampleTopics]
  );
  const [selectedTopic, setSelectedTopic] = useState(
    allTopics[0] || sampleTopics[0]
  );
  // On mount, check for pre-selected topic from upload view
  useEffect(() => {
    const stored = localStorage.getItem("vidyaai_selected_topic");
    if (stored) {
      const topic = JSON.parse(stored);
      const found = allTopics.find(
        (t) => t.label === topic.label && t.subject === topic.subject
      );
      if (found) setSelectedTopic(found);
      localStorage.removeItem("vidyaai_selected_topic");
    }
  }, [uploadedTopics.length, allTopics]);

  // Load per-subtopic quizzes from localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    const quizzes: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`vidyaai_quiz_${session.user.email}_`)) {
        const quiz = JSON.parse(localStorage.getItem(key) || "null");
        if (quiz) {
          // Extract subtopic title from key
          const subtopic = key.replace(
            `vidyaai_quiz_${session.user.email}_`,
            ""
          );
          quizzes[subtopic] = quiz;
        }
      }
    }
    setPerSubtopicQuizzes(quizzes);
  }, [session?.user?.email]);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setAiFeedback({});
    try {
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedTopic.content,
          subject: selectedTopic.subject,
          quizType: "mcq",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.quiz)
        throw new Error(data.error || "Failed to generate quiz");
      setQuiz(data.quiz);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Evaluate subjective/creative answers with Gemini
    if (!quiz) return;
    const feedback: {
      [idx: number]: { score: number; feedback: string; suggestions: string[] };
    } = {};
    await Promise.all(
      quiz.questions.map(async (q, idx) => {
        if (
          (q.type === "subjective" || q.type === "creative") &&
          answers[idx]
        ) {
          try {
            const res = await fetch("/api/gemini/evaluate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                question: q.question,
                correctAnswer: q.correctAnswer || "",
                studentAnswer: answers[idx],
                questionType: q.type,
              }),
            });
            const data = await res.json();
            if (res.ok && data.evaluation) {
              feedback[idx] = data.evaluation;
            }
          } catch {}
        }
      })
    );
    setAiFeedback(feedback);
  };

  // Calculate overall score
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  if (quiz && submitted) {
    quiz.questions.forEach((q, idx) => {
      if (q.type === "multiple_choice" && q.correctAnswer) {
        maxScore += 1;
        if (answers[idx] === q.correctAnswer) {
          totalScore += 1;
          correctCount += 1;
        }
      } else if (
        (q.type === "subjective" || q.type === "creative") &&
        aiFeedback[idx]
      ) {
        maxScore += 100;
        totalScore += aiFeedback[idx].score;
      }
    });
  }

  // Save results to localStorage after submission (history)
  const saveResults = useCallback(() => {
    if (!quiz || !submitted || !session?.user?.email) return;
    const result: QuizResult = {
      date: new Date().toISOString(),
      questions: quiz.questions,
      answers,
      aiFeedback,
      totalScore,
      maxScore,
      correctCount,
      topicLabel: selectedTopic.label, // Add topic label for progress tracking
      userEmail: session.user.email,
    };
    const history = JSON.parse(
      localStorage.getItem(`vidyaai_quiz_history_${session.user.email}`) || "[]"
    );
    history.unshift(result);
    localStorage.setItem(
      `vidyaai_quiz_history_${session.user.email}`,
      JSON.stringify(history.slice(0, 10))
    );
    localStorage.setItem(
      `vidyaai_last_quiz_result_${session.user.email}`,
      JSON.stringify(result)
    );
  }, [
    quiz,
    submitted,
    session?.user?.email,
    answers,
    aiFeedback,
    totalScore,
    maxScore,
    correctCount,
    selectedTopic.label,
  ]);
  // Save results when submitted
  useEffect(() => {
    if (submitted) saveResults();
  }, [submitted, saveResults]);

  // Load quiz history
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(
      `vidyaai_quiz_history_${session.user.email}`
    );
    if (data) setQuizHistory(JSON.parse(data));
  }, [quiz, submitted, session?.user?.email]);

  // Review a past quiz
  const handleReview = (idx: number) => {
    const past = quizHistory[idx];
    setQuiz({ questions: past.questions });
    setAnswers(past.answers);
    setAiFeedback(past.aiFeedback || {});
    setSubmitted(true);
    setError(null);
  };

  // Load last result (optional, for display)
  const [lastResult, setLastResult] = useState<QuizResult | null>(null);
  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(
      `vidyaai_last_quiz_result_${session.user.email}`
    );
    if (data) setLastResult(JSON.parse(data));
  }, [session?.user?.email]);

  const handleRetake = () => {
    setQuiz(null);
    setAnswers({});
    setAiFeedback({});
    setSubmitted(false);
    setError(null);
  };

  const handleAttemptQuiz = async (topic: string, content: string) => {
    setLoading(true);
    setError(null);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setAiFeedback({});
    try {
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content,
          subject: topic,
          quizType: "mcq",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.quiz)
        throw new Error(data.error || "Failed to generate quiz");
      setQuiz(data.quiz);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Export quiz result as CSV
  const exportCSV = (result: QuizResult) => {
    if (!result) return;
    let csv = "Question,Your Answer,AI Score,Feedback\n";
    result.questions.forEach((q: QuizQuestion, idx: number) => {
      const ans = result.answers[idx] || "";
      const ai =
        result.aiFeedback && result.aiFeedback[idx]
          ? result.aiFeedback[idx]
          : null;
      csv += `"${q.question.replace(/"/g, '""')}","${ans.replace(
        /"/g,
        '""'
      )}","${ai ? ai.score : ""}","${ai ? ai.feedback.replace(/"/g, '""') : ""}"
`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz_result_${new Date(result.date).toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export quiz result as PDF
  const exportPDF = (result: QuizResult) => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Quiz Result", 10, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(result.date).toLocaleString()}`, 10, 22);
    doc.text(
      `Score: ${
        result.maxScore > 0
          ? Math.round((result.totalScore / result.maxScore) * 100)
          : 0
      } / 100`,
      10,
      28
    );
    let y = 36;
    result.questions.forEach((q: QuizQuestion, idx: number) => {
      doc.text(`Q${idx + 1}: ${q.question}`, 10, y);
      y += 6;
      doc.text(`Your Answer: ${result.answers[idx] || ""}`, 12, y);
      y += 6;
      if (result.aiFeedback && result.aiFeedback[idx]) {
        doc.text(`AI Score: ${result.aiFeedback[idx].score}/100`, 12, y);
        y += 6;
        doc.text(`Feedback: ${result.aiFeedback[idx].feedback}`, 12, y);
        y += 6;
      }
      y += 2;
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
    });
    doc.save(`quiz_result_${new Date(result.date).toISOString()}.pdf`);
  };

  // Add print handler
  const printQuiz = (result: QuizResult) => {
    if (!result) return;
    // Create a print-friendly window
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    let html = `<html><head><title>Quiz Questions</title><style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      h1 { font-size: 1.5em; margin-bottom: 0.5em; }
      .question { margin-bottom: 1.5em; }
      .question-title { font-weight: bold; margin-bottom: 0.3em; }
      .answer { margin-left: 1em; color: #333; }
      .key { color: #888; font-size: 0.95em; }
    </style></head><body>`;
    html += `<h1>Quiz Questions</h1>`;
    html += `<div>Date: ${new Date(result.date).toLocaleString()}</div>`;
    html += `<div>Topic: ${result.topicLabel || ""}</div>`;
    html += "<hr />";
    result.questions.forEach((q: QuizQuestion, idx: number) => {
      html += `<div class='question'>`;
      html += `<div class='question-title'>Q${idx + 1}: ${q.question}</div>`;
      if (q.type === "multiple_choice" && q.options) {
        html += "<ul>";
        q.options.forEach((opt: string) => {
          html += `<li>${opt}</li>`;
        });
        html += "</ul>";
      }
      html += `</div>`;
    });
    html += "</body></html>";
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // --- Analytics for logged-in users ---
  let analytics = null;
  if (session?.user?.email) {
    const userKey = `quiz_results_${session.user.email}`;
    const userResults = JSON.parse(
      typeof window !== "undefined"
        ? localStorage.getItem(userKey) || "[]"
        : "[]"
    );
    if (userResults.length > 0) {
      const total = userResults.length;
      const avg = (
        userResults.reduce(
          (sum: number, r: { totalScore?: number }) =>
            sum + (r.totalScore || 0),
          0
        ) / total
      ).toFixed(2);
      const best = Math.max(
        ...userResults.map((r: { totalScore?: number }) => r.totalScore || 0)
      );
      analytics = { total, avg, best };
    }
  }

  const handleDeleteQuiz = (quizToDelete: QuizHistory) => {
    if (!session?.user?.email) return;
    const key = `vidyaai_quiz_history_${session.user.email}`;
    const updated = quizHistory.filter(
      (q) =>
        !(
          q.date === quizToDelete.date &&
          q.topicLabel === quizToDelete.topicLabel
        )
    );
    setQuizHistory(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  // Handle answer selection for per-subtopic quiz
  const handlePerSubtopicQuizAnswer = (
    subtopic: string,
    idx: number,
    value: string
  ) => {
    setPerSubtopicQuizAnswers((prev) => ({
      ...prev,
      [subtopic]: { ...(prev[subtopic] || {}), [idx]: value },
    }));
  };

  // Handle quiz submission and scoring for per-subtopic quiz
  const handlePerSubtopicQuizSubmit = (subtopic: string, quiz: any) => {
    const answers = perSubtopicQuizAnswers[subtopic] || {};
    let score = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      if (q.type === "multiple_choice" && answers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    setPerSubtopicQuizScore((prev) => ({ ...prev, [subtopic]: score }));
    setPerSubtopicQuizSubmitted((prev) => ({ ...prev, [subtopic]: true }));
  };

  // Add delete handler for per-subtopic quizzes
  const handleDeletePerSubtopicQuiz = (subtopic: string) => {
    if (!session?.user?.email) return;
    const quizKey = `vidyaai_quiz_${session.user.email}_${subtopic}`;
    localStorage.removeItem(quizKey);
    setPerSubtopicQuizzes((prev) => {
      const copy = { ...prev };
      delete copy[subtopic];
      return copy;
    });
    setExpandedQuizCards((prev) => {
      const copy = { ...prev };
      delete copy[subtopic];
      return copy;
    });
    setPerSubtopicQuizAnswers((prev) => {
      const copy = { ...prev };
      delete copy[subtopic];
      return copy;
    });
    setPerSubtopicQuizSubmitted((prev) => {
      const copy = { ...prev };
      delete copy[subtopic];
      return copy;
    });
    setPerSubtopicQuizScore((prev) => {
      const copy = { ...prev };
      delete copy[subtopic];
      return copy;
    });
  };

  // Add print handler for per-subtopic quiz
  const handlePrintPerSubtopicQuiz = (subtopic: string, quiz: any) => {
    const answers = perSubtopicQuizAnswers[subtopic] || {};
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    let html = `<html><head><title>Quiz Result</title><style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      h1 { font-size: 1.5em; margin-bottom: 0.5em; }
      .question { margin-bottom: 1.5em; }
      .question-title { font-weight: bold; margin-bottom: 0.3em; }
      .answer { margin-left: 1em; color: #333; }
      .key { color: #888; font-size: 0.95em; }
      .correct { color: #008000; }
      .incorrect { color: #c00; }
      .explanation { color: #555; font-size: 0.95em; margin-top: 0.5em; }
    </style></head><body>`;
    html += `<h1>Quiz Result: ${subtopic}</h1>`;
    html += `<div>Date: ${new Date().toLocaleString()}</div>`;
    html += "<hr />";
    quiz.questions.forEach((q: any, idx: number) => {
      html += `<div class='question'>`;
      html += `<div class='question-title'>Q${idx + 1}: ${q.question}</div>`;
      if (q.options && q.options.length > 0) {
        html += "<ul>";
        q.options.forEach((opt: string) => {
          const isUser = answers[idx] === opt;
          const isCorrect = q.correctAnswer === opt;
          html += `<li class='${
            isUser ? (isCorrect ? "correct" : "incorrect") : ""
          }'>`;
          html += `${opt}`;
          if (isUser) html += ` <span class='key'>(Your answer)</span>`;
          if (isCorrect) html += ` <span class='key'>(Correct answer)</span>`;
          html += `</li>`;
        });
        html += "</ul>";
      }
      if (q.explanation) {
        html += `<div class='explanation'>Explanation: ${q.explanation}</div>`;
      }
      html += `</div>`;
    });
    html += "</body></html>";
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
    <div
      className="flex flex-col items-center justify-center min-h-screen px-2 sm:px-4"
      role="main"
      aria-label="Quiz page"
    >
      <h1
        className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center"
        tabIndex={0}
      >
        Quiz
      </h1>
      {/* Render per-subtopic quizzes */}
      {Object.keys(perSubtopicQuizzes).length > 0 && (
        <div className="w-full max-w-2xl mx-auto mb-8">
          <h2 className="text-lg font-semibold mb-2">
            Generated Quizzes by Topic
          </h2>
          <ul className="space-y-6">
            {Object.entries(perSubtopicQuizzes).map(([subtopic, quiz], idx) => {
              const isExpanded = expandedQuizCards[subtopic];
              const answers = perSubtopicQuizAnswers[subtopic] || {};
              const submitted = perSubtopicQuizSubmitted[subtopic] || false;
              const score = perSubtopicQuizScore[subtopic] || 0;
              return (
                <li
                  key={subtopic}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col relative mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-green-800 text-base">
                      {subtopic}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="text-green-700 hover:text-green-900 text-xs font-semibold px-2 py-1 border border-green-200 rounded"
                        onClick={() =>
                          setExpandedQuizCards((prev) => ({
                            ...prev,
                            [subtopic]: !prev[subtopic],
                          }))
                        }
                        type="button"
                      >
                        {isExpanded ? "Collapse" : "Expand"}
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                        onClick={() => handleDeletePerSubtopicQuiz(subtopic)}
                        aria-label={`Delete quiz for ${subtopic}`}
                        type="button"
                      >
                        Delete
                      </button>
                      {submitted && (
                        <button
                          className="bg-gradient-to-r from-gray-600 to-gray-900 text-white px-3 py-1 rounded text-xs font-semibold ml-2"
                          onClick={() =>
                            handlePrintPerSubtopicQuiz(subtopic, quiz)
                          }
                          aria-label={`Print quiz for ${subtopic}`}
                          type="button"
                        >
                          Print
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && quiz.questions && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePerSubtopicQuizSubmit(subtopic, quiz);
                      }}
                    >
                      <ul className="space-y-4">
                        {quiz.questions.map((q: any, i: number) => (
                          <li
                            key={i}
                            className="bg-white rounded shadow p-3 border border-green-100"
                          >
                            <div className="font-semibold text-gray-900 mb-1">
                              Q{i + 1}. {q.question}
                            </div>
                            {q.options && q.options.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2">
                                {q.options.map((opt: string, oidx: number) => (
                                  <label
                                    key={oidx}
                                    className="flex items-center gap-2 cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name={`q${subtopic}-${i}`}
                                      value={opt}
                                      checked={answers[i] === opt}
                                      onChange={() =>
                                        handlePerSubtopicQuizAnswer(
                                          subtopic,
                                          i,
                                          opt
                                        )
                                      }
                                      className="accent-blue-600"
                                      aria-label={opt}
                                      disabled={submitted}
                                    />
                                    <span>{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                            {submitted && (
                              <div
                                className={`mt-3 text-sm ${
                                  answers[i] === q.correctAnswer
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {answers[i] === q.correctAnswer
                                  ? "Correct!"
                                  : `Incorrect. Correct answer: ${q.correctAnswer}`}
                                {q.explanation && (
                                  <div className="mt-1 text-gray-600">
                                    Explanation: {q.explanation}
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                      {!submitted && (
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 mt-4"
                          aria-label="Submit Quiz"
                        >
                          Submit Quiz
                        </button>
                      )}
                      {submitted && (
                        <div className="mt-4 text-green-800 font-semibold text-center">
                          Score: {score} / {quiz.questions.length}
                        </div>
                      )}
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {session?.user?.email && (
        <>
          {/* Analytics section */}
          {analytics && (
            <div
              className="w-full max-w-xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900 flex justify-between mb-6"
              aria-label="Quiz analytics"
              role="region"
              aria-live="polite"
            >
              <div>
                <div className="font-bold text-lg">Your Quiz Analytics</div>
                <div className="text-sm mt-1">
                  Total quizzes:{" "}
                  <span className="font-semibold">{analytics.total}</span>
                </div>
                <div className="text-sm">
                  Average score:{" "}
                  <span className="font-semibold">{analytics.avg}</span>
                </div>
                <div className="text-sm">
                  Best score:{" "}
                  <span className="font-semibold">{analytics.best}</span>
                </div>
              </div>
            </div>
          )}
          {/* Topic selection UI */}
          <div className="w-full max-w-xl mx-auto mb-6">
            <label
              htmlFor="topic-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select a topic to generate a quiz:
            </label>
            <select
              id="topic-select"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={allTopics.findIndex(
                (t) =>
                  t.label === selectedTopic.label &&
                  t.isUploaded === selectedTopic.isUploaded
              )}
              onChange={(e) =>
                setSelectedTopic(allTopics[parseInt(e.target.value)])
              }
              aria-label="Select topic for quiz"
              tabIndex={0}
            >
              {uploadedTopics.length > 0 && (
                <optgroup label="Your Uploaded Topics">
                  {allTopics
                    .filter((t) => t.isUploaded)
                    .map((t) => (
                      <option key={t.label} value={allTopics.indexOf(t)}>
                        {t.label} (Uploaded)
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Sample Topics">
                {allTopics
                  .filter((t) => !t.isUploaded)
                  .map((t) => (
                    <option key={t.label} value={allTopics.indexOf(t)}>
                      {t.label}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
          {/* Quiz History section */}
          <div
            className="w-full max-w-xl mx-auto mb-8"
            role="region"
            aria-label="Quiz history"
          >
            <h2 className="text-lg font-semibold mb-2" tabIndex={0}>
              Quiz History
            </h2>
            {quizHistory.length === 0 ? (
              <div className="text-gray-500 text-sm">No quizzes taken yet.</div>
            ) : (
              <ul
                className="divide-y divide-gray-200"
                role="list"
                aria-label="Past quizzes"
              >
                {quizHistory.map((q) => (
                  <li
                    key={q.date}
                    className="py-3 flex items-center justify-between"
                    tabIndex={0}
                    role="listitem"
                    aria-label={`Quiz on ${q.topicLabel} at ${q.date}`}
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {q.topicLabel}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(q.date).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-blue-700 font-semibold">
                        Score: {q.totalScore}
                      </span>
                      <button
                        className="px-3 py-1 rounded bg-gradient-to-r from-green-400 to-blue-400 text-white text-xs font-semibold hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label={`Attempt new quiz on ${q.topicLabel}`}
                        tabIndex={0}
                        onClick={() =>
                          handleAttemptQuiz(q.topicLabel, q.content || "")
                        }
                      >
                        Attempt Quiz
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-gradient-to-r from-blue-400 to-purple-400 text-white text-xs font-semibold hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                        aria-label={`Review quiz on ${q.topicLabel}`}
                        tabIndex={0}
                        onClick={() => handleReview(quizHistory.indexOf(q))}
                      >
                        Review
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-red-500 hover:bg-red-700 text-white text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                        aria-label={`Delete quiz on ${q.topicLabel}`}
                        tabIndex={0}
                        onClick={() => handleDeleteQuiz(q)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={generateQuiz}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={loading}
            aria-label="Generate Quiz"
            tabIndex={0}
          >
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </>
      )}
      {error && (
        <div className="text-red-600 mt-4" role="alert">
          {error}
        </div>
      )}
      {quiz && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl mt-6"
          aria-label="Quiz form"
        >
          {quiz.questions.map((q, idx) => (
            <div key={idx} className="mb-6 p-4 bg-gray-50 rounded-xl shadow-sm">
              <div className="font-semibold mb-2">
                Q{idx + 1}. {q.question}
              </div>
              {q.type === "multiple_choice" && q.options && (
                <div className="flex flex-col gap-2 mt-2">
                  {q.options.map((opt, oidx) => (
                    <label
                      key={oidx}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`q${idx}`}
                        value={opt}
                        checked={answers[idx] === opt}
                        onChange={() => handleAnswer(idx, opt)}
                        className="accent-blue-600"
                        aria-label={opt}
                        disabled={submitted}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {(q.type === "subjective" || q.type === "creative") && (
                <div className="mt-2">
                  <label htmlFor={`q${idx}-text`} className="sr-only">
                    Your answer
                  </label>
                  <textarea
                    id={`q${idx}-text`}
                    className="w-full min-h-[60px] rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Type your answer..."
                    value={answers[idx] || ""}
                    onChange={(e) => handleAnswer(idx, e.target.value)}
                    disabled={submitted}
                    aria-label="Your answer"
                  />
                </div>
              )}
              {submitted && q.correctAnswer && q.type === "multiple_choice" && (
                <div
                  className={`mt-3 text-sm ${
                    answers[idx] === q.correctAnswer
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {answers[idx] === q.correctAnswer
                    ? "Correct!"
                    : `Incorrect. Correct answer: ${q.correctAnswer}`}
                  {q.explanation && (
                    <div className="mt-1 text-gray-600">
                      Explanation: {q.explanation}
                    </div>
                  )}
                </div>
              )}
              {submitted &&
                (q.type === "subjective" || q.type === "creative") && (
                  <div className="mt-3 text-sm text-blue-700">
                    {aiFeedback[idx] ? (
                      <>
                        <div className="font-semibold text-base text-blue-800">
                          AI Score: {aiFeedback[idx].score}/100
                        </div>
                        <div className="mt-1 text-gray-700">
                          {aiFeedback[idx].feedback}
                        </div>
                        {aiFeedback[idx].suggestions &&
                          aiFeedback[idx].suggestions.length > 0 && (
                            <ul className="mt-1 text-gray-600 list-disc list-inside">
                              {aiFeedback[idx].suggestions.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ul>
                          )}
                      </>
                    ) : (
                      <>Your answer has been submitted for review.</>
                    )}
                  </div>
                )}
            </div>
          ))}
          {quiz.questions.length > 0 && !submitted && (
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Submit Quiz"
            >
              Submit Quiz
            </button>
          )}
          {submitted && (
            <div className="mt-6 text-center text-lg font-semibold text-blue-700">
              Quiz submitted! Review your answers above.
              <br />
              {quiz && (
                <div className="mt-4">
                  <div className="mb-2 text-base text-gray-800">
                    <span className="font-bold">Total Correct (MCQ):</span>{" "}
                    {correctCount} /{" "}
                    {
                      quiz.questions.filter((q) => q.type === "multiple_choice")
                        .length
                    }
                  </div>
                  <div className="mb-2 text-base text-gray-800">
                    <span className="font-bold">Total Score:</span>{" "}
                    {maxScore > 0
                      ? Math.round((totalScore / maxScore) * 100)
                      : 0}{" "}
                    / 100
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-4 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          maxScore > 0
                            ? Math.round((totalScore / maxScore) * 100)
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <button
                    onClick={handleRetake}
                    className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Retake Quiz"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      )}
      {lastResult && !quiz && (
        <div className="mt-8 w-full max-w-xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-900">
          <div className="font-bold mb-2">Last Quiz Result</div>
          <div className="mb-1 text-sm">
            Date: {new Date(lastResult.date).toLocaleString()}
          </div>
          <div className="mb-1 text-sm">
            Score:{" "}
            {lastResult.maxScore > 0
              ? Math.round((lastResult.totalScore / lastResult.maxScore) * 100)
              : 0}{" "}
            / 100
          </div>
          <div className="mb-1 text-sm">
            Correct (MCQ): {lastResult.correctCount} /{" "}
            {
              lastResult.questions.filter(
                (q: QuizQuestion) => q.type === "multiple_choice"
              ).length
            }
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => exportCSV(lastResult)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Export as CSV"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportPDF(lastResult)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Export as PDF"
            >
              Export PDF
            </button>
            <button
              onClick={() => printQuiz(lastResult)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Print Questions"
            >
              Print
            </button>
          </div>
          <button
            onClick={generateQuiz}
            className="mt-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Try Another Quiz"
          >
            Try Another Quiz
          </button>
        </div>
      )}
      {quizHistory.length > 0 && !quiz && (
        <div className="mt-8 w-full max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900">
          <div className="font-bold mb-2">Quiz History (last 10 attempts)</div>
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="text-left">
                <th className="py-1">Date</th>
                <th className="py-1">Score</th>
                <th className="py-1">Correct</th>
                <th className="py-1">Review</th>
                <th className="py-1">Export</th>
              </tr>
            </thead>
            <tbody>
              {quizHistory.map((q, i) => (
                <tr key={i} className="border-t border-gray-200">
                  <td className="py-1">{new Date(q.date).toLocaleString()}</td>
                  <td className="py-1">
                    {q.maxScore > 0
                      ? Math.round((q.totalScore / q.maxScore) * 100)
                      : 0}{" "}
                    / 100
                  </td>
                  <td className="py-1">
                    {q.correctCount} /{" "}
                    {
                      q.questions.filter(
                        (qq: QuizQuestion) => qq.type === "multiple_choice"
                      ).length
                    }
                  </td>
                  <td className="py-1">
                    <button
                      onClick={() => handleReview(i)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`Review quiz from ${new Date(
                        q.date
                      ).toLocaleString()}`}
                    >
                      Review
                    </button>
                  </td>
                  <td className="py-1 flex gap-1">
                    <button
                      onClick={() => exportCSV(q)}
                      className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-2 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      aria-label={`Export quiz from ${new Date(
                        q.date
                      ).toLocaleString()} as CSV`}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportPDF(q)}
                      className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-2 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                      aria-label={`Export quiz from ${new Date(
                        q.date
                      ).toLocaleString()} as PDF`}
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => printQuiz(q)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`Print quiz from ${new Date(
                        q.date
                      ).toLocaleString()}`}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
