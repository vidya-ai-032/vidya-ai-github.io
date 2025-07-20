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

export default function QuizPage() {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<{ questions: QuizQuestion[] } | null>(null);
  const [answers, setAnswers] = useState<{ [idx: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    [idx: number]: { score: number; feedback: string; suggestions: string[] };
  }>({});

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
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
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

  const handleDeleteQuiz = (quizToDelete: QuizResult) => {
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
      {!session?.user?.email && (
        <div
          className="w-full max-w-xl mx-auto bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-900 text-center mb-6"
          role="alert"
          aria-live="polite"
        >
          <div className="font-bold mb-2">
            Please log in to access quiz history and analytics.
          </div>
          <button
            onClick={() => signIn()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-base font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Log in"
            tabIndex={0}
          >
            Log In
          </button>
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
                        className="px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-label={`Export quiz from ${new Date(
                        q.date
                      ).toLocaleString()} as CSV`}
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportPDF(q)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded text-xs font-semibold hover:shadow transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
