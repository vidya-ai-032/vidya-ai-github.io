"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
// Remove: import { extractPdfText } from "@/lib/pdfExtract";
import { segmentTextToSubtopics, Subtopic } from "@/lib/segmentText";
import { GeminiService } from "@/lib/gemini";
import React from "react";
import { FaTrash } from "react-icons/fa";

const getSubtopicsKey = (email, docName) =>
  `vidyaai_subtopics_${email}_${docName}`;

function SubjectThemesModal({
  open,
  subject,
  themes,
  onChange,
  onConfirm,
  onCancel,
  loading,
}) {
  const [localSubject, setLocalSubject] = React.useState(subject || "");
  const [localThemes, setLocalThemes] = React.useState(themes || []);
  React.useEffect(() => {
    setLocalSubject(subject || "");
    setLocalThemes(themes || []);
  }, [subject, themes]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full relative animate-fadeIn">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
          onClick={onCancel}
          aria-label="Close subject/themes modal"
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-2 text-blue-700">
          Detected Subject & Themes
        </h2>
        <div className="mb-4">
          <label className="block font-semibold mb-1">Main Subject:</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
            value={localSubject}
            onChange={(e) => setLocalSubject(e.target.value)}
            disabled={loading}
          />
          <label className="block font-semibold mb-1">
            Core Themes (one per line):
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={3}
            value={localThemes.join("\n")}
            onChange={(e) => setLocalThemes(e.target.value.split(/\r?\n/))}
            disabled={loading}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(localSubject, localThemes)}
            className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
            disabled={loading}
          >
            {loading ? "Extracting..." : "Confirm & Extract Topics"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AITutorModal({
  open,
  onClose,
  loading,
  conversation,
  onUserMessage,
  userInput,
  setUserInput,
}) {
  if (!open) return null;

  // Defensive check for conversation array
  const safeConversation = Array.isArray(conversation) ? conversation : [];

  const handleFollowUpClick = (question) => {
    if (typeof onUserMessage === "function") {
      onUserMessage(question);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (userInput && userInput.trim() && typeof onUserMessage === "function") {
      onUserMessage(userInput);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full relative transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">AI Tutor</h2>
          <button
            className="text-gray-400 hover:text-gray-700 text-2xl"
            onClick={onClose}
            aria-label="Close AI Tutor"
          >
            &times;
          </button>
        </div>

        <div className="h-[50vh] overflow-y-auto mb-4 pr-2 space-y-4">
          {safeConversation.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  AI
                </div>
              )}
              <div
                className={`max-w-md p-3 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-50 text-gray-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                {/* Suggestions and Follow-ups */}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                  You
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                AI
              </div>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2" />
                <span className="text-sm text-gray-600">
                  AI Tutor is thinking...
                </span>
              </div>
            </div>
          )}
        </div>
        {/* Form */}
        <form className="flex gap-2" onSubmit={handleFormSubmit}>
          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Ask a follow-up question..."
            value={userInput || ""}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading}
            aria-label="Ask a follow-up question"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading || !userInput || !userInput.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
];

// Removed local Subtopic interface declaration

interface Topic {
  label: string;
  title: string;
  content: string;
  summary: string;
  keyPoints: string[];
  subject: string;
  rawContent: string;
  subtopics?: Subtopic[];
}

interface LibraryDoc {
  name: string;
  subject: string;
  type: string;
  size: number;
  date: string;
  chapter: string;
  rawContent: string;
  content?: string;
}

function SubtopicCard({
  topic,
  onDelete,
  subject,
  rawContent,
  setTutorModal,
  expandedCardId,
  setExpandedCardId,
  quizAnswers,
  quizSubmitted,
  quizScore,
  handleQuizAnswer,
  handleQuizSubmit,
  qaContent,
  qaExpanded,
  setQaContent,
  setQaExpanded,
}: {
  topic: Subtopic;
  onDelete?: () => void;
  subject?: string;
  rawContent?: string;
  setTutorModal: React.Dispatch<React.SetStateAction<any>>;
  expandedCardId?: string | null;
  setExpandedCardId?: (id: string | null) => void;
  quizAnswers: Record<string, Record<number, string>>;
  quizSubmitted: Record<string, boolean>;
  quizScore: Record<string, number>;
  handleQuizAnswer: (subtopic: string, idx: number, value: string) => void;
  handleQuizSubmit: (subtopic: string, quiz: any) => void;
  qaContent: Record<string, any>;
  qaExpanded: Record<string, boolean>;
  setQaContent: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setQaExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const { data: session } = useSession();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [teachData, setTeachData] = useState<any>(null);
  const [teachError, setTeachError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [quiz, setQuiz] = useState<any | null>(null);
  const [quizExpanded, setQuizExpanded] = useState(false);
  const [qa, setQa] = useState<any | null>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const subtopicKey = topic.title;

  // Only allow one expanded card at a time
  useEffect(() => {
    setIsExpanded(expandedCardId === topic.title);
  }, [expandedCardId, topic.title]);

  const handleTeachMeThis = async () => {
    setIsLoading(true);
    setTeachError(null);
    setTeachData(null);
    if (setExpandedCardId) setExpandedCardId(topic.title);
    try {
      // Use GeminiService.tutorConversation or a direct API call
      const context =
        topic.summary +
        (topic.keyPoints?.length ? "\n" + topic.keyPoints.join(" ") : "");
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
      setTeachData(data);
      // Start speech synthesis
      speakText(data.response);
    } catch (err: any) {
      setTeachError(err.message || "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text: string) => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utter = new window.SpeechSynthesisUtterance(text);
    utterRef.current = utter;
    utter.onend = () => setIsSpeaking(false);
    utter.onpause = () => setIsPaused(true);
    utter.onresume = () => setIsPaused(false);
    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utter);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };
  const handleResume = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  // Add a function to generate answers for all questions in the Q&A card
  const handleGenerateAnswers = async () => {
    if (!session?.user?.email) return;
    if (!(qa || qaContent[subtopicKey])) return;
    setQaLoading(true);
    const currentQa = qa || qaContent[subtopicKey];
    const questionsWithAnswers = await Promise.all(
      currentQa.questions.map(async (q: any) => {
        if (q.answer && q.answer !== "" && q.answer !== "(No answer generated)")
          return q;
        try {
          const ansRes = await fetch("/api/gemini/generate-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q.question }),
          });
          const ansData = await ansRes.json();
          return { ...q, answer: ansData.answer || "(No answer generated)" };
        } catch {
          return { ...q, answer: "(No answer generated)" };
        }
      })
    );
    const qaWithAnswers = { ...currentQa, questions: questionsWithAnswers };
    setQa(qaWithAnswers);
    setQaContent((prev) => ({ ...prev, [subtopicKey]: qaWithAnswers }));
    // Save Q&A to localStorage per subtopic
    const qaKey = `vidyaai_qa_${session.user.email}_${topic.title}`;
    localStorage.setItem(qaKey, JSON.stringify(qaWithAnswers));
    setQaLoading(false);
  };

  // Add a Print button that is only enabled if all questions have answers
  const canPrintQa = (qaObj: any) =>
    qaObj &&
    qaObj.questions &&
    qaObj.questions.every(
      (q: any) => q.answer && q.answer !== "(No answer generated)"
    );

  const handlePrintQa = () => {
    const qaObj = qa || qaContent[subtopicKey];
    if (!canPrintQa(qaObj)) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    let html = `<html><head><title>Q&A</title><style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      h1 { font-size: 1.5em; margin-bottom: 0.5em; }
      .question { margin-bottom: 1.5em; }
      .question-title { font-weight: bold; margin-bottom: 0.3em; }
      .answer { margin-left: 1em; color: #333; }
    </style></head><body>`;
    html += `<h1>Q&A: ${subtopicKey}</h1>`;
    html += `<div>Date: ${new Date().toLocaleString()}</div>`;
    html += "<hr />";
    qaObj.questions.forEach((q: any, idx: number) => {
      html += `<div class='question'>`;
      html += `<div class='question-title'>Q${idx + 1}: ${q.question}</div>`;
      if (q.answer) {
        html += `<div class='answer'>A: ${q.answer}</div>`;
      }
      html += `</div>`;
    });
    html += "</body></html>";
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="relative bg-white border border-blue-100 rounded-lg p-4 mb-0 flex flex-col flex-1 min-w-0 shadow-sm hover:shadow-md transition-all duration-200 sm:p-5 break-words">
      {onDelete && (
        <button
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
          onClick={onDelete}
        >
          Delete
        </button>
      )}

      {/* Title */}
      <div className="font-semibold text-blue-800 mb-2 text-base sm:text-lg break-words">
        {topic.title}
      </div>

      {/* Estimated Time */}
      {topic.estimatedTime && (
        <div className="text-sm text-gray-500 mb-2">
          Estimated study time: {topic.estimatedTime}
        </div>
      )}

      {/* Summary with expand/collapse */}
      <div
        className={`relative ${isExpanded ? "" : "max-h-32 overflow-hidden"}`}
      >
        <div className="text-gray-700 text-sm sm:text-base mb-3 break-words">
          {topic.summary}
        </div>
        {!isExpanded && topic.summary.length > 200 && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      {topic.summary.length > 200 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-3"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}

      {/* Key Points */}
      {topic.keyPoints && topic.keyPoints.length > 0 && (
        <div className="mb-4">
          <div className="font-medium text-gray-900 mb-2">Key Points:</div>
          <ul className="list-disc pl-5 text-gray-600 text-sm space-y-2">
            {topic.keyPoints.map((kp, i) => (
              <li key={i} className="break-words">
                {kp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto grid grid-cols-3 gap-2 print-hide">
        <button
          className={`px-3 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 text-sm flex items-center justify-center ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label={`Generate quiz for ${topic.title}`}
          disabled={isLoading}
          onClick={async () => {
            if (!session?.user?.email) return;
            setIsLoading(true);
            try {
              const content =
                topic.summary + "\n" + (topic.keyPoints || []).join(" ");
              const res = await fetch("/api/gemini/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content: content,
                  subject: subject || topic.title,
                  quizType: "mcq",
                }),
              });
              if (res.status === 429) {
                alert(
                  "You have exceeded your Gemini API quota. Please use a different API key in settings or wait for your quota to reset."
                );
                return;
              }
              const data = await res.json();
              if (res.ok && data.quiz) {
                setQuiz(data.quiz);
                setQuizExpanded(true);
                // Save quiz to localStorage per subtopic
                const quizKey = `vidyaai_quiz_${session.user.email}_${topic.title}`;
                localStorage.setItem(quizKey, JSON.stringify(data.quiz));
              }
            } catch (error) {
              console.error("Error generating quiz:", error);
              alert("Failed to generate quiz. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Loading...
            </div>
          ) : (
            "Generate Quiz"
          )}
        </button>

        <button
          className={`px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 text-sm flex items-center justify-center ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label={`Generate Q&A for ${topic.title}`}
          disabled={isLoading}
          onClick={async () => {
            if (!session?.user?.email) return;
            setIsLoading(true);
            try {
              const content =
                topic.summary + "\n" + (topic.keyPoints || []).join(" ");
              const res = await fetch("/api/gemini/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content:
                    content +
                    "\nGenerate 3-5 deep-thinking, thought-provoking questions and answers for this subtopic, suitable for advanced students.",
                  subject: subject || topic.title,
                  quizType: "subjective",
                }),
              });
              if (res.status === 429) {
                alert(
                  "You have exceeded your Gemini API quota. Please use a different API key in settings or wait for your quota to reset."
                );
                return;
              }
              const data = await res.json();
              if (res.ok && data.quiz) {
                // For each question, generate an answer if not present
                setQaLoading(true);
                const questionsWithAnswers = await Promise.all(
                  data.quiz.questions.map(async (q: any) => {
                    if (q.answer && q.answer !== "") return q;
                    try {
                      const ansRes = await fetch("/api/gemini/evaluate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ question: q.question }),
                      });
                      const ansData = await ansRes.json();
                      return {
                        ...q,
                        answer: ansData.answer || "(No answer generated)",
                      };
                    } catch {
                      return { ...q, answer: "(No answer generated)" };
                    }
                  })
                );
                const qaWithAnswers = {
                  ...data.quiz,
                  questions: questionsWithAnswers,
                };
                setQa(qaWithAnswers);
                setQaContent((prev) => ({
                  ...prev,
                  [subtopicKey]: qaWithAnswers,
                }));
                setQaExpanded((prev) => ({ ...prev, [subtopicKey]: true }));
                // Save Q&A to localStorage per subtopic
                const qaKey = `vidyaai_qa_${session.user.email}_${topic.title}`;
                localStorage.setItem(qaKey, JSON.stringify(qaWithAnswers));
                setQaLoading(false);
              }
            } catch (error) {
              console.error("Error generating Q&A:", error);
              alert("Failed to generate Q&A. Please try again.");
              setQaLoading(false);
            } finally {
              setIsLoading(false);
            }
          }}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Loading...
            </div>
          ) : (
            "Subjective Q&A"
          )}
        </button>

        <button
          className={`px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 text-sm flex items-center justify-center ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label={`Teach me this topic: ${topic.title}`}
          disabled={isLoading}
          onClick={handleTeachMeThis}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Loading...
            </div>
          ) : (
            "Teach Me This"
          )}
        </button>
      </div>
      {/* Quiz Card with Expand/Collapse */}
      {quiz && (
        <div className="mt-4 border border-green-200 rounded-lg bg-green-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-green-800">
              {quiz.title || "Quiz"}
            </div>
            <button
              className="text-green-700 hover:text-green-900 text-xs font-semibold px-2 py-1 border border-green-200 rounded"
              onClick={() => setQuizExpanded((prev) => !prev)}
              type="button"
            >
              {quizExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
          {quizExpanded && quiz.questions && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleQuizSubmit(topic.title, quiz);
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
                              name={`q${topic.title}-${i}`}
                              value={opt}
                              checked={
                                (quizAnswers[topic.title]?.[i] ?? "") === opt
                              }
                              onChange={() =>
                                handleQuizAnswer(topic.title, i, opt)
                              }
                              className="accent-blue-600"
                              aria-label={opt}
                              disabled={quizSubmitted[topic.title] || false}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {quizSubmitted[topic.title] && (
                      <div
                        className={`mt-3 text-sm ${
                          quizAnswers[topic.title] &&
                          quizAnswers[topic.title][i] === q.correctAnswer
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {quizAnswers[topic.title] &&
                        quizAnswers[topic.title][i] === q.correctAnswer
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
              {!quizSubmitted[topic.title] && (
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg text-base sm:text-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 mt-4"
                  aria-label="Submit Quiz"
                >
                  Submit Quiz
                </button>
              )}
              {quizSubmitted[topic.title] && (
                <div className="mt-4 text-green-800 font-semibold text-center">
                  Score: {quizScore[topic.title] || 0} / {quiz.questions.length}
                </div>
              )}
            </form>
          )}
        </div>
      )}
      {/* Expanded section for Teach Me This */}
      {isExpanded && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          {teachError && <div className="text-red-600 mb-2">{teachError}</div>}
          {teachData && (
            <>
              <div className="mb-2">
                <h4 className="font-semibold mb-1">AI Tutor Explanation:</h4>
                <div className="mb-2 whitespace-pre-line">
                  {teachData.response}
                </div>
              </div>
              {teachData.suggestions && teachData.suggestions.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium">Related Topics:</span>
                  <ul className="list-disc ml-6">
                    {teachData.suggestions.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {teachData.followUpQuestions &&
                teachData.followUpQuestions.length > 0 && (
                  <div>
                    <span className="font-medium">Model Questions:</span>
                    <ul className="list-disc ml-6">
                      {teachData.followUpQuestions.map(
                        (fq: string, i: number) => (
                          <li key={i}>{fq}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              <div className="flex gap-2 mt-4">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => teachData && speakText(teachData.response)}
                  disabled={isSpeaking}
                >
                  Replay
                </button>
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                  onClick={handlePause}
                  disabled={!isSpeaking || isPaused}
                >
                  Pause
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={handleStop}
                  disabled={!isSpeaking}
                >
                  Stop
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Nested Subtopics */}
      {topic.subtopics && topic.subtopics.length > 0 && (
        <div className="ml-2 sm:ml-4 border-l-2 border-blue-200 pl-2 sm:pl-3 mt-4 space-y-4">
          {topic.subtopics.map((sub, i) => (
            <SubtopicCard
              key={i}
              topic={sub}
              subject={subject}
              rawContent={rawContent}
              setTutorModal={setTutorModal}
              expandedCardId={expandedCardId}
              setExpandedCardId={setExpandedCardId}
              quizAnswers={quizAnswers}
              quizSubmitted={quizSubmitted}
              quizScore={quizScore}
              handleQuizAnswer={handleQuizAnswer}
              handleQuizSubmit={handleQuizSubmit}
              qaContent={qaContent}
              qaExpanded={qaExpanded}
              setQaContent={setQaContent}
              setQaExpanded={setQaExpanded}
            />
          ))}
        </div>
      )}
      {(qa || qaContent[subtopicKey]) && (
        <div className="mt-4 border border-pink-200 rounded-lg bg-pink-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-pink-800">Subjective Q&A</div>
            <button
              className="text-pink-700 hover:text-pink-900 text-xs font-semibold px-2 py-1 border border-pink-200 rounded"
              onClick={() =>
                setQaExpanded((prev) => ({
                  ...prev,
                  [subtopicKey]: !prev[subtopicKey],
                }))
              }
              type="button"
            >
              {qaExpanded[subtopicKey] ? "Collapse" : "Expand"}
            </button>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
              onClick={handleGenerateAnswers}
              disabled={qaLoading}
              type="button"
            >
              {qaLoading ? "Generating..." : "Generate Answers"}
            </button>
            <button
              className="bg-gradient-to-r from-gray-600 to-gray-900 text-white px-3 py-1 rounded text-xs font-semibold"
              onClick={handlePrintQa}
              disabled={!canPrintQa(qa || qaContent[subtopicKey])}
              type="button"
            >
              Print
            </button>
          </div>
          {qaLoading && (
            <div className="text-pink-700 text-sm mb-2">
              Generating answers...
            </div>
          )}
          {qaExpanded[subtopicKey] &&
            (qa || qaContent[subtopicKey])?.questions && (
              <ul className="space-y-4">
                {(qa || qaContent[subtopicKey]).questions.map(
                  (q: any, i: number) => (
                    <li
                      key={i}
                      className="bg-white rounded shadow p-3 border border-pink-100"
                    >
                      <div className="font-semibold text-gray-900 mb-1">
                        Q{i + 1}. {q.question}
                      </div>
                      {q.answer && (
                        <div className="mt-2 text-gray-700">A: {q.answer}</div>
                      )}
                    </li>
                  )
                )}
              </ul>
            )}
        </div>
      )}
    </div>
  );
}

function PrintButton({ contentId }: { contentId: string }) {
  return (
    <button
      className="bg-gradient-to-r from-gray-600 to-gray-900 text-white px-3 py-1 rounded font-semibold ml-2 print-hide"
      onClick={() => {
        const printContents = document.getElementById(contentId)?.innerHTML;
        if (printContents) {
          const printWindow = window.open("", "", "height=600,width=800");
          if (printWindow) {
            printWindow.document.write(
              "<html><head><title>Print</title><style>@media print { nav, .sidebar, .header, .footer, button, .print-hide, .print-controls { display: none !important; } .print-content { display: block !important; } body { background: #fff !important; } }</style></head><body>"
            );
            printWindow.document.write('<div class="print-content">');
            printWindow.document.write(printContents);
            printWindow.document.write("</div></body></html>");
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

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [extractedTopics, setExtractedTopics] = useState<Topic[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDoc[]>([]);
  const [docSubtopics, setDocSubtopics] = useState<Record<string, Topic[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tutorModal, setTutorModal] = useState({
    open: false,
    loading: false,
    response: "",
    suggestions: [],
    followUps: [],
    ttsPlaying: false,
    ttsUtter: null,
    conversation: [],
    userInput: "",
  });
  // TTS controls
  const playTTS = () => {
    if (
      tutorModal.response &&
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      if (tutorModal.ttsUtter) {
        window.speechSynthesis.cancel();
      }
      const utter = new window.SpeechSynthesisUtterance(tutorModal.response);
      utter.lang = "en-US";
      utter.rate = 1;
      utter.onend = () =>
        setTutorModal((m) => ({ ...m, ttsPlaying: false, ttsUtter: null }));
      window.speechSynthesis.speak(utter);
      setTutorModal((m) => ({ ...m, ttsPlaying: true, ttsUtter: utter }));
    }
  };
  const pauseTTS = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setTutorModal((m) => ({ ...m, ttsPlaying: false }));
    }
  };
  const stopTTS = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTutorModal((m) => ({ ...m, ttsPlaying: false, ttsUtter: null }));
    }
  };
  // Handle user message (follow-up)
  const handleUserMessage = async (msg) => {
    if (!msg.trim()) return;

    const currentConversation = tutorModal.conversation || [];
    const newConversation = [
      ...currentConversation,
      { role: "user", content: msg },
    ];

    setTutorModal((m) => ({
      ...m,
      loading: true,
      userInput: "",
      conversation: newConversation,
    }));

    try {
      // Pass the new conversation history to the API
      const tutorRes = await GeminiService.tutorConversation(
        msg,
        "", // Context can be managed if needed
        newConversation
      );

      // Create a new message object for the assistant's response
      const assistantMessage = {
        role: "assistant",
        content: tutorRes.response,
        suggestions: tutorRes.suggestions || [],
        followUpQuestions: tutorRes.followUpQuestions || [],
      };

      setTutorModal((m) => ({
        ...m,
        loading: false,
        response: tutorRes.response,
        suggestions: tutorRes.suggestions || [],
        followUps: tutorRes.followUpQuestions || [],
        conversation: [...newConversation, assistantMessage],
        ttsPlaying: false,
        ttsUtter: null,
      }));
    } catch (err) {
      const errorMessage = {
        role: "assistant",
        content: "AI Tutor is currently unavailable. Please try again later.",
      };
      setTutorModal((m) => ({
        ...m,
        loading: false,
        conversation: [...newConversation, errorMessage],
      }));
    }
  };

  // Subject/themes modal state
  // Removed SubjectThemesModal and subjectModal state/logic

  // Add state for quiz answers, submission, and score per subtopic
  const [quizAnswers, setQuizAnswers] = useState<
    Record<string, Record<number, string>>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>(
    {}
  );
  const [quizScore, setQuizScore] = useState<Record<string, number>>({});
  const [qaContent, setQaContent] = useState<Record<string, any>>({});
  const [qaExpanded, setQaExpanded] = useState<Record<string, boolean>>({});

  // Handle answer selection for subtopic quiz
  const handleQuizAnswer = (subtopic: string, idx: number, value: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [subtopic]: { ...(prev[subtopic] || {}), [idx]: value },
    }));
  };

  // Handle quiz submission and scoring for subtopic quiz
  const handleQuizSubmit = (subtopic: string, quiz: any) => {
    const answers = quizAnswers[subtopic] || {};
    let score = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      if (q.type === "multiple_choice" && answers[idx] === q.correctAnswer) {
        score += 1;
      }
    });
    setQuizScore((prev) => ({ ...prev, [subtopic]: score }));
    setQuizSubmitted((prev) => ({ ...prev, [subtopic]: true }));
  };

  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(`vidyaai_library_${session.user.email}`);
    console.log(
      "[LIBRARY] Loaded from localStorage:",
      `vidyaai_library_${session.user.email}`,
      data
    );
    if (data) setLibraryDocs(JSON.parse(data));
  }, [session?.user?.email, isUploading]);

  // Load subtopics for last 5 docs on mount
  useEffect(() => {
    if (!session?.user?.email) return;
    const docs = libraryDocs.slice(0, 5);
    const subtopicsMap = {};
    docs.forEach((doc) => {
      const key = getSubtopicsKey(session.user.email, doc.name);
      const data = localStorage.getItem(key);
      if (data) subtopicsMap[doc.name] = JSON.parse(data);
    });
    setDocSubtopics(subtopicsMap);
  }, [libraryDocs, session?.user?.email]);

  // Generate subtopics for a document
  const handleGenerateSubtopics = async (doc) => {
    if (!doc.rawContent) return alert("No content found for this document.");
    try {
      const payload = { content: doc.rawContent, subject: doc.subject || "" };
      const topicRes = await fetch("/api/gemini/process-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const topicData = await topicRes.json();
      if (!topicRes.ok) {
        alert(
          "Gemini API error: " +
            (topicData?.error ||
              topicData?.message ||
              JSON.stringify(topicData))
        );
        return;
      }
      let newTopics = [];
      if (topicData.topics) {
        newTopics = topicData.topics.map((t) => ({
          label: t.title,
          title: t.title,
          content: t.summary + "\n" + t.keyPoints.join(" "),
          summary: t.summary,
          keyPoints: t.keyPoints,
          subject: doc.subject,
          rawContent: doc.rawContent,
          subtopics: t.subtopics,
        }));
      }
      // Save to localStorage
      const key = getSubtopicsKey(session.user.email, doc.name);
      localStorage.setItem(key, JSON.stringify(newTopics));
      setDocSubtopics((prev) => ({ ...prev, [doc.name]: newTopics }));
      // Only show alert after user-initiated generation
      alert("Subtopics generated!");
    } catch (err) {
      alert("Failed to generate subtopics.");
    }
  };

  // Delete a document
  const handleDeleteDoc = (doc) => {
    if (!session?.user?.email) return;
    // Remove from library
    const libraryKey = `vidyaai_library_${session.user.email}`;
    const prevLib = JSON.parse(localStorage.getItem(libraryKey) || "[]");
    const updatedLib = prevLib.filter((d) => d.name !== doc.name);
    localStorage.setItem(libraryKey, JSON.stringify(updatedLib));
    setLibraryDocs(updatedLib);
    // Remove subtopics
    const subKey = getSubtopicsKey(session.user.email, doc.name);
    localStorage.removeItem(subKey);
    setDocSubtopics((prev) => {
      const copy = { ...prev };
      delete copy[doc.name];
      return copy;
    });
    // Reset expanded state for this document
    setExpanded((prev) => ({ ...prev, [doc.name]: false }));
  };

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large. Maximum allowed size is 15MB.");
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(
        "Unsupported file type. Please upload PDF, DOCX, TXT, JPG, or PNG."
      );
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      // Read file as text for topic extraction (only for text-based files)
      let fileText = "";
      if (selectedFile.type.startsWith("text")) {
        fileText = await selectedFile.text();
      } else if (selectedFile.type === "application/pdf") {
        const extractForm = new FormData();
        extractForm.append("file", selectedFile);
        const extractRes = await fetch("/api/upload/extract-text", {
          method: "POST",
          body: extractForm,
        });
        const extractData = await extractRes.json();
        if (!extractRes.ok || !extractData.text)
          throw new Error(extractData.error || "Failed to extract PDF text");
        fileText = extractData.text;
      }
      // Validation: fileText must not be empty or too short
      if (!fileText || fileText.trim().length < 50) {
        alert(
          "The uploaded document is empty or too short for extraction. Please upload a longer document."
        );
        setIsUploading(false);
        return;
      }
      // Log the first 500 characters of fileText
      console.log("[Gemini] Sending fileText:", fileText.slice(0, 500));
      // Save uploaded document metadata to user-specific library
      if (session?.user?.email) {
        const libraryKey = `vidyaai_library_${session.user.email}`;
        const prevLib = JSON.parse(localStorage.getItem(libraryKey) || "[]");
        const newDoc = {
          name: selectedFile.name,
          subject: selectedFile.name.split(".")[0],
          type: selectedFile.type,
          size: selectedFile.size,
          date: new Date().toISOString(),
          chapter: selectedFile.name.split(".")[0],
          rawContent: fileText,
        };
        prevLib.unshift(newDoc);
        localStorage.setItem(libraryKey, JSON.stringify(prevLib.slice(0, 50)));
      }
      // Directly extract topics using Gemini expert prompt
      setExtractedTopics([]); // Clear previous topics
      try {
        const payload = { content: fileText, subject: "" };
        console.log("[Gemini] Request payload:", payload);
        const topicRes = await fetch("/api/gemini/process-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const topicData = await topicRes.json();
        if (!topicRes.ok) {
          console.error("[Gemini] API error:", topicData);
          alert(
            topicData?.userMessage ||
              topicData?.error ||
              topicData?.message ||
              "An unknown error occurred."
          );
          if (process.env.NODE_ENV === "development" && topicData?.details) {
            console.error("Gemini API error details:", topicData.details);
          }
          setIsUploading(false);
          return;
        }
        let newTopics = [];
        if (topicData.topics) {
          newTopics = topicData.topics.map((t) => ({
            label: t.title,
            title: t.title,
            content: t.summary + "\n" + t.keyPoints.join(" "),
            summary: t.summary,
            keyPoints: t.keyPoints,
            subject: selectedFile.name.split(".")[0],
            rawContent: fileText,
            subtopics: t.subtopics,
          }));
        }
        setExtractedTopics(newTopics);
        alert("File uploaded and topics extracted successfully!");
        window.dispatchEvent(new Event("library-updated"));
      } catch (err) {
        console.error("[Gemini] Extraction error:", err);
        alert(
          "Failed to extract topics. Please try again.\n" +
            (err instanceof Error ? err.message : String(err))
        );
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unknown error occurred.");
    } finally {
      setIsUploading(false);
    }
  };
  // Confirm subject/themes and extract topics
  // Removed handleSubjectConfirm function

  // Only show the most recent document in the upload page
  const lastDoc = libraryDocs.length > 0 ? [libraryDocs[0]] : [];

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4">Sign in required</h2>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => signIn("google", { prompt: "select_account" })}
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center py-8 px-2 sm:px-4 lg:px-8"
      role="main"
      aria-label="Upload page"
    >
      <div className="w-full max-w-7xl bg-white rounded-2xl shadow-lg p-4 sm:p-8 mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
          Upload Study Material
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 text-center">
          Supported formats: PDF, DOCX, TXT, JPG, PNG
        </p>

        {/* Upload Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
          className="space-y-4"
        >
          <div className="flex flex-col items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="w-full flex flex-col items-center justify-center px-4 py-6 bg-white border-2 border-blue-300 border-dashed rounded-lg cursor-pointer hover:bg-blue-50 transition-all duration-200"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-10 h-10 mb-3 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, TXT, JPG, or PNG
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={handleFileChange}
                ref={inputRef}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-8 h-8 text-blue-500 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-base sm:text-lg shadow-md hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 relative"
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                Processing...
              </div>
            ) : (
              "Upload & Process"
            )}
          </button>
        </form>

        {/* Extracted Topics */}
        {extractedTopics.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6 print-hide">
              <h2 className="text-xl font-bold text-gray-900">
                Extracted Topics
              </h2>
              <PrintButton contentId="subtopics-section" />
            </div>
            <div
              id="subtopics-section"
              className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 print-content"
            >
              {extractedTopics.map((t, i) => (
                <React.Fragment key={i}>
                  <SubtopicCard
                    topic={t}
                    subject={t.subject}
                    rawContent={t.rawContent}
                    setTutorModal={setTutorModal}
                    expandedCardId={null} // No expanded card for main topics
                    setExpandedCardId={() => {}}
                    quizAnswers={quizAnswers}
                    quizSubmitted={quizSubmitted}
                    quizScore={quizScore}
                    handleQuizAnswer={handleQuizAnswer}
                    handleQuizSubmit={handleQuizSubmit}
                    qaContent={qaContent}
                    qaExpanded={qaExpanded}
                    setQaContent={setQaContent}
                    setQaExpanded={setQaExpanded}
                  />
                  {Array.isArray(t.subtopics) &&
                    t.subtopics.length > 0 &&
                    t.subtopics.map((sub, j) => (
                      <SubtopicCard
                        key={j}
                        topic={sub}
                        subject={t.subject}
                        rawContent={t.rawContent}
                        setTutorModal={setTutorModal}
                        expandedCardId={null} // No expanded card for subtopics
                        setExpandedCardId={() => {}}
                        quizAnswers={quizAnswers}
                        quizSubmitted={quizSubmitted}
                        quizScore={quizScore}
                        handleQuizAnswer={handleQuizAnswer}
                        handleQuizSubmit={handleQuizSubmit}
                        qaContent={qaContent}
                        qaExpanded={qaExpanded}
                        setQaContent={setQaContent}
                        setQaExpanded={setQaExpanded}
                      />
                    ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Recent Uploads */}
        {libraryDocs.slice(0, 5).length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Uploads
            </h2>
            <ul className="space-y-4">
              {libraryDocs.slice(0, 5).map((doc, i) => (
                <li
                  key={doc.name + "-" + doc.date}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        Subject: {doc.subject}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Toggle expanded state
                          setExpanded((prev) => ({
                            ...prev,
                            [doc.name]: !prev[doc.name],
                          }));
                          // If expanding, regenerate subtopics
                          if (!expanded[doc.name]) handleGenerateSubtopics(doc);
                        }}
                        className={`bg-blue-600 text-white px-3 py-1 rounded font-semibold hover:bg-blue-700 transition-colors text-sm ${
                          expanded[doc.name] ? "bg-blue-800" : ""
                        }`}
                      >
                        {expanded[doc.name]
                          ? "Hide Subtopics"
                          : "Generate Subtopics"}
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc)}
                        className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition-colors"
                        title="Delete document"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {/* Show subtopics if present and expanded */}
                  {expanded[doc.name] &&
                    docSubtopics[doc.name] &&
                    docSubtopics[doc.name].length > 0 && (
                      <div className="mt-2">
                        {docSubtopics[doc.name].map((t, idx) => (
                          <SubtopicCard
                            key={idx}
                            topic={t}
                            subject={t.subject}
                            rawContent={t.rawContent}
                            setTutorModal={setTutorModal}
                            expandedCardId={null}
                            setExpandedCardId={() => {}}
                            quizAnswers={quizAnswers}
                            quizSubmitted={quizSubmitted}
                            quizScore={quizScore}
                            handleQuizAnswer={handleQuizAnswer}
                            handleQuizSubmit={handleQuizSubmit}
                            qaContent={qaContent}
                            qaExpanded={qaExpanded}
                            setQaContent={setQaContent}
                            setQaExpanded={setQaExpanded}
                          />
                        ))}
                      </div>
                    )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* AI Tutor Modal */}
      <AITutorModal
        open={tutorModal.open}
        onClose={() => {
          stopTTS();
          setTutorModal((m) => ({ ...m, open: false }));
        }}
        loading={tutorModal.loading}
        conversation={tutorModal.conversation || []}
        onUserMessage={handleUserMessage}
        userInput={tutorModal.userInput}
        setUserInput={(input) =>
          setTutorModal((m) => ({ ...m, userInput: input }))
        }
      />
    </div>
  );
}
