"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRef } from "react";

interface QA {
  questions: Array<{
    question: string;
    answer: string;
    type: string;
  }>;
  date: string;
  topicLabel: string;
  userEmail: string;
}

export default function QAPage() {
  const { data: session, status } = useSession();
  const [qaHistory, setQaHistory] = useState<QA[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, string>>({});
  const recognitionRef = useRef<any>(null);
  const [listeningIdx, setListeningIdx] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<
    Record<string, boolean>
  >({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({
    0: true,
  });
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [successIdx, setSuccessIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    const loadHistory = () => {
      const data = localStorage.getItem(
        `vidyaai_qa_history_${session.user.email}`
      );
      if (data) setQaHistory(JSON.parse(data));
    };
    loadHistory();
    window.addEventListener("qa-history-updated", loadHistory);
    return () => window.removeEventListener("qa-history-updated", loadHistory);
  }, [session?.user?.email]);

  const handleDelete = (qaToDelete: QA) => {
    if (!session?.user?.email) return;
    const key = `vidyaai_qa_history_${session.user.email}`;
    const updated = qaHistory.filter(
      (q) =>
        !(q.date === qaToDelete.date && q.topicLabel === qaToDelete.topicLabel)
    );
    setQaHistory(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  // Generate answers for all questions in a Q&A card
  const handleGenerateAnswers = async (qa: QA, idx: number) => {
    if (!session?.user?.email) return;
    setLoadingIdx(idx);
    setSuccessIdx(null);
    const updatedQuestions = await Promise.all(
      qa.questions.map(async (q) => {
        if (q.answer && q.answer.length > 0) return q; // Skip if already answered
        try {
          // Call Gemini answer API
          const res = await fetch("/api/gemini/generate-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q.question }),
          });
          const data = await res.json();
          console.log(
            "[Gemini Answer API] Question:",
            q.question,
            "Response:",
            data
          );
          return { ...q, answer: data.answer || "(No answer generated)" };
        } catch (err) {
          console.error(
            "[Gemini Answer API] Error for question:",
            q.question,
            err
          );
          return { ...q, answer: "(Failed to generate answer)" };
        }
      })
    );
    // Update local state and localStorage
    const updatedQa = { ...qa, questions: updatedQuestions };
    setQaHistory((prev) => {
      const copy = [...prev];
      copy[idx] = updatedQa;
      // Save to localStorage
      if (session?.user?.email) {
        const key = `vidyaai_qa_history_${session.user.email}`;
        localStorage.setItem(key, JSON.stringify(copy));
      }
      return copy;
    });
    setLoadingIdx(null);
    setSuccessIdx(idx);
    setTimeout(() => setSuccessIdx(null), 2000);
  };

  // Handle user answer input
  const handleUserAnswerChange = (
    qaIdx: number,
    qIdx: number,
    value: string
  ) => {
    setUserAnswers((prev) => ({ ...prev, [`${qaIdx}-${qIdx}`]: value }));
  };

  // Handle answer evaluation
  const handleEvaluate = async (
    qa: QA,
    q: any,
    qaIdx: number,
    qIdx: number
  ) => {
    const userAnswer = userAnswers[`${qaIdx}-${qIdx}`] || "";
    if (!userAnswer.trim()) return;
    try {
      const res = await fetch("/api/gemini/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          correctAnswer: q.answer || "",
          studentAnswer: userAnswer,
          questionType: q.type || "subjective",
        }),
      });
      const data = await res.json();
      setEvaluations((prev) => ({
        ...prev,
        [`${qaIdx}-${qIdx}`]:
          data.evaluation?.feedback ||
          data.evaluation ||
          data.error ||
          "No feedback",
      }));
    } catch (err) {
      setEvaluations((prev) => ({
        ...prev,
        [`${qaIdx}-${qIdx}`]: "Failed to evaluate answer",
      }));
    }
  };

  // Speech-to-text for user answer
  const handleSpeechInput = (qaIdx: number, qIdx: number) => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListeningIdx(null);
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleUserAnswerChange(qaIdx, qIdx, transcript);
      setListeningIdx(null);
    };
    recognition.onerror = () => setListeningIdx(null);
    recognition.onend = () => setListeningIdx(null);
    recognition.start();
    recognitionRef.current = recognition;
    setListeningIdx(`${qaIdx}-${qIdx}`);
  };

  // Toggle expand/collapse for a question
  const handleToggleExpand = (qaIdx: number, qIdx: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [`${qaIdx}-${qIdx}`]: !prev[`${qaIdx}-${qIdx}`],
    }));
  };

  // Toggle expand/collapse for a Q&A card
  const handleToggleCardExpand = (idx: number) => {
    setExpandedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Add PrintButton component if not already present
  function PrintButton({ contentId }: { contentId: string }) {
    return (
      <button
        className="bg-gradient-to-r from-gray-600 to-gray-900 text-white px-3 py-1 rounded font-semibold ml-2"
        onClick={() => {
          const printContents = document.getElementById(contentId)?.innerHTML;
          if (printContents) {
            const printWindow = window.open("", "", "height=600,width=800");
            if (printWindow) {
              printWindow.document.write(
                "<html><head><title>Print</title></head><body>"
              );
              printWindow.document.write(printContents);
              printWindow.document.write("</body></html>");
              printWindow.document.close();
              printWindow.focus();
              printWindow.print();
              printWindow.close();
            }
          }
        }}
      >
        Print
      </button>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-8 px-2">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">
          Subjective QA History
        </h1>
        {qaHistory.length === 0 ? (
          <div className="text-gray-500 text-center">
            No Subjective QA generated yet.
          </div>
        ) : (
          <ul className="space-y-6">
            {qaHistory.map((qa, idx) => {
              const isCardExpanded = expandedCards[idx] ?? false;
              return (
                <li
                  key={idx}
                  className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col relative pt-8 mb-4"
                  id={`qna-section-${idx}`}
                >
                  <div className="flex flex-wrap gap-2 justify-end mb-2">
                    <button
                      className="text-blue-500 hover:text-blue-700 text-xs font-semibold px-2 py-1 border border-blue-200 rounded"
                      onClick={() => handleToggleCardExpand(idx)}
                      type="button"
                    >
                      {isCardExpanded ? "Collapse" : "Expand"}
                    </button>
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                      onClick={() => handleGenerateAnswers(qa, idx)}
                      aria-label={`Generate answers for ${qa.topicLabel}`}
                      disabled={loadingIdx === idx}
                    >
                      {loadingIdx === idx ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                          Generating...
                        </span>
                      ) : (
                        "Generate Answers"
                      )}
                    </button>
                    {successIdx === idx && (
                      <span className="text-green-700 text-xs font-semibold ml-2">
                        Answers generated!
                      </span>
                    )}
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                      onClick={() => handleDelete(qa)}
                      aria-label={`Delete Subjective QA for ${qa.topicLabel}`}
                    >
                      Delete
                    </button>
                    <PrintButton contentId={`qna-section-${idx}`} />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-blue-500 mb-1">
                      {qa.topicLabel}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {new Date(qa.date).toLocaleString()}
                    </div>
                    {isCardExpanded && (
                      <div>
                        {qa.questions && qa.questions.length > 0 ? (
                          <ul className="list-decimal pl-5 space-y-4">
                            {qa.questions.map((q, i) => {
                              const isExpanded =
                                expandedQuestions[`${idx}-${i}`] ?? false;
                              return (
                                <li
                                  key={i}
                                  className="bg-white rounded-lg shadow border border-blue-100 p-3 mb-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-semibold text-gray-800 text-base">
                                      Q: {q.question}
                                    </div>
                                    <button
                                      className="text-blue-500 hover:text-blue-700 text-xs font-semibold px-2 py-1 border border-blue-200 rounded"
                                      onClick={() => handleToggleExpand(idx, i)}
                                      type="button"
                                    >
                                      {isExpanded ? "Collapse" : "Expand"}
                                    </button>
                                  </div>
                                  {isExpanded && (
                                    <div className="mt-2 space-y-2">
                                      {/* User answer input */}
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                        <input
                                          type="text"
                                          className="border rounded px-2 py-1 text-sm w-full sm:w-2/3"
                                          placeholder="Type your answer or use the mic"
                                          value={
                                            userAnswers[`${idx}-${i}`] || ""
                                          }
                                          onChange={(e) =>
                                            handleUserAnswerChange(
                                              idx,
                                              i,
                                              e.target.value
                                            )
                                          }
                                        />
                                        <div className="flex gap-2 mt-1 sm:mt-0">
                                          <button
                                            className={`bg-blue-400 text-white px-2 py-1 rounded text-xs font-semibold ${
                                              listeningIdx === `${idx}-${i}`
                                                ? "bg-blue-500"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              handleSpeechInput(idx, i)
                                            }
                                            type="button"
                                          >
                                            {listeningIdx === `${idx}-${i}`
                                              ? "Listening..."
                                              : "🎤"}
                                          </button>
                                          <button
                                            className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold"
                                            onClick={() =>
                                              handleEvaluate(qa, q, idx, i)
                                            }
                                            type="button"
                                          >
                                            Evaluate
                                          </button>
                                        </div>
                                      </div>
                                      {/* Evaluation feedback */}
                                      {evaluations[`${idx}-${i}`] && (
                                        <div className="text-green-700 text-sm mt-1 whitespace-pre-line border-l-4 border-green-200 pl-2 bg-green-50 rounded">
                                          <span className="font-semibold">
                                            Feedback:
                                          </span>{" "}
                                          {evaluations[`${idx}-${i}`]}
                                        </div>
                                      )}
                                      {/* Reference answer */}
                                      {q.answer && (
                                        <div className="text-gray-700 mt-1 border-l-4 border-blue-200 pl-2 bg-blue-50 rounded">
                                          <span className="font-semibold">
                                            Reference Answer:
                                          </span>{" "}
                                          {q.answer}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <div className="text-gray-500">
                            No questions found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
