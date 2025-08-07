"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { segmentTextToSubtopics } from "@/lib/segmentText";
import React from "react";
import {
  FaTrash,
  FaSearch,
  FaUser,
  FaBook,
  FaGraduationCap,
  FaUsers,
  FaCog,
} from "react-icons/fa";
import Link from "next/link";

interface LibraryDoc {
  name: string;
  subject: string;
  type: string;
  size: number;
  date: string;
  chapter: string;
  rawContent: string;
  content?: string;
  analysis?: {
    topic: string;
    subject: string;
    level: string;
    documentTitle: string;
    chapterSection: string;
    confidenceScore: number;
  };
  description?: {
    subject: string;
    chapter: string;
    level: string;
    document_name: string;
    description: string;
    auto_generated: string[];
    date_created: string;
  };
}

interface Subtopic {
  title: string;
  summary: string;
  keyPoints: string[];
  subject?: string;
  rawContent?: string;
  subtopics?: Subtopic[];
  estimatedTime?: string;
}

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

interface ConversationMessage {
  role: string;
  content: string;
  suggestions?: string[];
  followUpQuestions?: string[];
}

interface TutorModalState {
  open: boolean;
  loading: boolean;
  response: string;
  suggestions: string[];
  followUps: string[];
  ttsPlaying: boolean;
  ttsUtter: SpeechSynthesisUtterance | null;
  conversation: ConversationMessage[];
  userInput: string;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/jpeg",
  "image/png",
];

const getSubtopicsKey = (email: string, docName: string) =>
  `vidyaai_subtopics_${email}_${docName}`;

function AITutorModal({
  open,
  onClose,
  loading,
  conversation,
  onUserMessage,
  userInput,
  setUserInput,
}: {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  conversation: ConversationMessage[];
  onUserMessage: (message: string) => void;
  userInput: string;
  setUserInput: (input: string) => void;
}) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !loading) {
      onUserMessage(userInput.trim());
      setUserInput("");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">AI Tutor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg ${
                msg.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
              }`}
            >
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="bg-gray-100 mr-8 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-sm text-gray-600">AI is thinking...</span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!userInput.trim() || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
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
  setTutorModal: React.Dispatch<React.SetStateAction<TutorModalState>>;
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
  const cardId = `${topic.title}-${Date.now()}`;
  const isExpanded = expandedCardId === cardId;

  const handleTalkToGemini = async () => {
    setTutorModal((prev) => ({
      ...prev,
      open: true,
      conversation: [
        {
          role: "assistant",
          content: `I'm here to help you with "${topic.title}". What would you like to know about this topic?`,
        },
      ],
    }));
  };

  const handleGenerateQuiz = async () => {
    try {
      const response = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: topic.rawContent || "",
          subject: subject || "",
          quizType: "mcq",
        }),
      });
      const data = await response.json();
      if (response.ok && data.quiz) {
        setQaContent((prev) => ({ ...prev, [topic.title]: data.quiz }));
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
    }
  };

  const handleGenerateAnswers = async () => {
    try {
      const response = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: topic.rawContent || "",
          subject: subject || "",
          quizType: "subjective",
        }),
      });
      const data = await response.json();
      if (response.ok && data.quiz) {
        setQaContent((prev) => ({ ...prev, [topic.title]: data.quiz }));
      }
    } catch (error) {
      console.error("Error generating Q&A:", error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg">{topic.title}</h3>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            <FaTrash />
          </button>
        )}
      </div>

      <p className="text-gray-700 mb-3">{topic.summary}</p>

      {topic.keyPoints && topic.keyPoints.length > 0 && (
        <div className="mb-3">
          <h4 className="font-medium text-gray-800 mb-2">Key Points:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            {topic.keyPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleTalkToGemini}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Ask AI Tutor
        </button>
        <button
          onClick={handleGenerateQuiz}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Generate Quiz
        </button>
        <button
          onClick={handleGenerateAnswers}
          className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          Generate Q&A
        </button>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const [library, setLibrary] = useState<LibraryDoc[]>([]);
  const [docSubtopics, setDocSubtopics] = useState<Record<string, Subtopic[]>>(
    {}
  );
  const [expanded, setExpanded] = useState<
    Record<string, { subtopics: boolean; quiz: boolean; qa: boolean }>
  >({});
  const [docQuiz, setDocQuiz] = useState<
    Record<
      string,
      { questions?: Array<{ question: string; options?: string[] }> }
    >
  >({});
  const [docQA, setDocQA] = useState<
    Record<
      string,
      { questions?: Array<{ question: string; options?: string[] }> }
    >
  >({});
  const [loadingQuizDoc, setLoadingQuizDoc] = useState<string | null>(null);

  // Upload-related state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedTopics, setExtractedTopics] = useState<Topic[]>([]);
  const [subtopicDisplayMode, setSubtopicDisplayMode] = useState<
    "card" | "block"
  >("card");
  const [libraryDocs, setLibraryDocs] = useState<LibraryDoc[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<
    Record<string, Record<number, string>>
  >({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>(
    {}
  );
  const [quizScore, setQuizScore] = useState<Record<string, number>>({});
  const [qaContent, setQaContent] = useState<Record<string, any>>({});
  const [qaExpanded, setQaExpanded] = useState<Record<string, boolean>>({});
  const [tutorModal, setTutorModal] = useState<TutorModalState>({
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Form fields for document details
  const [documentDetails, setDocumentDetails] = useState({
    topic: "Calculus",
    subject: "",
    chapter: "",
    class: "",
    documentName: "",
    dateCreated: new Date().toISOString().split("T")[0],
  });

  // Reading progress state
  const [readingProgress, setReadingProgress] = useState(25);

  // Load expanded state from localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `vidyaai_library_expanded_${session.user.email}`;
    const data = localStorage.getItem(key);
    if (data) setExpanded(JSON.parse(data));
  }, [session?.user?.email]);

  // Save expanded state to localStorage
  useEffect(() => {
    if (!session?.user?.email) return;
    const key = `vidyaai_library_expanded_${session.user.email}`;
    localStorage.setItem(key, JSON.stringify(expanded));
  }, [expanded, session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(`vidyaai_library_${session.user.email}`);
    console.log(
      "[LIBRARY] Loaded from localStorage:",
      `vidyaai_library_${session.user.email}`,
      data
    );
    if (data) setLibrary(JSON.parse(data));
    // Load subtopics for all docs
    const subtopicsMap: Record<string, Subtopic[]> = {};
    const docs = JSON.parse(data || "[]");
    docs.forEach((doc: LibraryDoc) => {
      const key = getSubtopicsKey(session?.user?.email || "", doc.name);
      const subData = localStorage.getItem(key);
      if (subData) subtopicsMap[doc.name] = JSON.parse(subData);
    });
    setDocSubtopics(subtopicsMap);
    const loadLibrary = () => {
      const data = localStorage.getItem(
        `vidyaai_library_${session.user.email}`
      );
      if (data) setLibrary(JSON.parse(data));
      // Reload subtopics
      const subtopicsMap: Record<string, Subtopic[]> = {};
      const docs = JSON.parse(data || "[]");
      docs.forEach((doc: LibraryDoc) => {
        const key = getSubtopicsKey(session?.user?.email || "", doc.name);
        const subData = localStorage.getItem(key);
        if (subData) subtopicsMap[doc.name] = JSON.parse(subData);
      });
      setDocSubtopics(subtopicsMap);
    };
    window.addEventListener("library-updated", loadLibrary);
    return () => window.removeEventListener("library-updated", loadLibrary);
  }, [session?.user?.email]);

  const handleDelete = (docToDelete: LibraryDoc) => {
    if (!session?.user?.email) return;
    const key = `vidyaai_library_${session.user.email}`;
    const updated = library.filter(
      (doc) => !(doc.name === docToDelete.name && doc.date === docToDelete.date)
    );
    setLibrary(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    console.log("[LIBRARY] Deleted from localStorage:", key, docToDelete);
    // Remove subtopics
    const subKey = getSubtopicsKey(
      session?.user?.email || "",
      docToDelete.name
    );
    localStorage.removeItem(subKey);
    setDocSubtopics((prev) => {
      const copy = { ...prev };
      delete copy[docToDelete.name];
      return copy;
    });
  };

  // Generate subtopics for a document (toggle and persist)
  const handleGenerateSubtopics = async (doc: LibraryDoc) => {
    const docKey = doc.name;
    if (expanded[docKey]?.subtopics) {
      // Retract/hide
      setExpanded((prev) => ({
        ...prev,
        [docKey]: { ...prev[docKey], subtopics: false },
      }));
      return;
    }
    // Show and regenerate
    setExpanded((prev) => ({
      ...prev,
      [docKey]: { ...prev[docKey], subtopics: true },
    }));
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
      let newTopics: Subtopic[] = [];
      if (topicData.topics) {
        newTopics = topicData.topics.map((t: any) => ({
          title: t.title,
          summary: t.summary,
          keyPoints: t.keyPoints,
          subject: doc.subject,
          rawContent: doc.rawContent,
          subtopics: t.subtopics,
        }));
      }
      // Save to localStorage
      const key = getSubtopicsKey(session?.user?.email || "", doc.name);
      localStorage.setItem(key, JSON.stringify(newTopics));
      setDocSubtopics((prev) => ({ ...prev, [doc.name]: newTopics }));
      alert("Subtopics generated!");
    } catch (_err) {
      alert("Failed to generate subtopics.");
    }
  };

  // Quiz/Q&A state and handlers (toggle and persist)
  const handleGenerateQuiz = async (doc: LibraryDoc) => {
    setLoadingQuizDoc(doc.name);
    const docKey = doc.name;
    if (expanded[docKey]?.quiz) {
      setExpanded((prev) => ({
        ...prev,
        [docKey]: { ...prev[docKey], quiz: false },
      }));
      setLoadingQuizDoc(null);
      return;
    }
    setExpanded((prev) => ({
      ...prev,
      [docKey]: { ...prev[docKey], quiz: true },
    }));
    try {
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: doc.rawContent,
          subject: doc.subject,
          quizType: "mcq",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.quiz)
        throw new Error(data.error || "Failed to generate quiz");
      setDocQuiz((prev) => ({ ...prev, [doc.name]: data.quiz }));
    } catch (_err) {
      alert("Failed to generate quiz.");
    } finally {
      setLoadingQuizDoc(null);
    }
  };

  const handleGenerateQA = async (doc: LibraryDoc) => {
    const docKey = doc.name;
    if (expanded[docKey]?.qa) {
      setExpanded((prev) => ({
        ...prev,
        [docKey]: { ...prev[docKey], qa: false },
      }));
      return;
    }
    setExpanded((prev) => ({
      ...prev,
      [docKey]: { ...prev[docKey], qa: true },
    }));
    try {
      const res = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:
            doc.rawContent +
            "\nGenerate 3-5 deep-thinking, thought-provoking questions and answers for this subtopic, suitable for advanced students.",
          subject: doc.subject,
          quizType: "subjective",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.quiz)
        throw new Error(data.error || "Failed to generate Q&A");
      setDocQA((prev) => ({ ...prev, [doc.name]: data.quiz }));
    } catch (_err) {
      alert("Failed to generate Q&A.");
    }
  };

  const handleStartLearning = (doc: LibraryDoc) => {
    // Store document content in localStorage for the start learning page
    if (doc.rawContent && doc.rawContent.trim()) {
      localStorage.setItem(`vidyaai_doc_content_${doc.name}`, doc.rawContent);
    }

    // Navigate to the start learning page with document data
    const params = new URLSearchParams({
      docName: doc.name,
      docSubject: doc.subject,
      docChapter: doc.chapter,
    });
    window.location.href = `/start-learning?${params.toString()}`;
  };

  // Document Analysis function for library page
  const handleDocumentAnalysis = async (doc: LibraryDoc) => {
    if (!doc.rawContent || doc.rawContent.includes("Text extraction failed")) {
      alert(
        "Document content is not available for analysis. Please try uploading the document again."
      );
      return;
    }

    try {
      const response = await fetch("/api/gemini/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: doc.rawContent,
          filename: doc.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze document");
      }

      // Update the document in library with new analysis
      const updatedLibrary = library.map((d) => {
        if (d.name === doc.name && d.date === doc.date) {
          return {
            ...d,
            analysis: data.analysis,
            subject: data.analysis.subject,
            chapter: data.analysis.chapterSection,
          };
        }
        return d;
      });

      setLibrary(updatedLibrary);
      localStorage.setItem(
        `vidyaai_library_${session?.user?.email}`,
        JSON.stringify(updatedLibrary)
      );

      alert("Document analysis completed!");
    } catch (error) {
      console.error("Document analysis error:", error);
      alert("Failed to analyze document. Please try again.");
    }
  };

  // Upload-related functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please select a valid file type (PDF, DOCX, TXT, JPG, PNG)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user?.email) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("email", session.user.email);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      // Process the uploaded content
      const topics = await segmentTextToSubtopics(result.content);
      setExtractedTopics(topics as Topic[]);

      // Add to library
      const newDoc: LibraryDoc = {
        name: selectedFile.name,
        subject:
          result.analysis?.subject || result.description?.subject || "General",
        type: selectedFile.type,
        size: selectedFile.size,
        date: new Date().toISOString(),
        chapter:
          result.analysis?.chapterSection ||
          result.description?.chapter ||
          selectedFile.name.replace(/\.[^/.]+$/, ""),
        rawContent: result.content,
        content: result.content,
        analysis: result.analysis,
        description: result.description,
      };

      // Show appropriate message based on extraction status
      if (result.textExtractionStatus === "failed") {
        alert(
          "Document uploaded successfully, but text extraction failed. You can try re-analyzing the document later."
        );
      } else {
        alert("Document uploaded and analyzed successfully!");
      }

      const updatedLibrary = [newDoc, ...library];
      setLibrary(updatedLibrary);
      setLibraryDocs(updatedLibrary);

      // Save to localStorage
      localStorage.setItem(
        `vidyaai_library_${session.user.email}`,
        JSON.stringify(updatedLibrary)
      );

      // Also store the document content separately for easy access
      if (result.content && result.content.trim()) {
        localStorage.setItem(
          `vidyaai_doc_content_${selectedFile.name}`,
          result.content
        );
      }

      // Clear form
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      console.error("Upload error:", error);
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = (doc: LibraryDoc) => {
    if (!session?.user?.email) return;

    const updatedLibrary = library.filter((d) => d.name !== doc.name);
    setLibrary(updatedLibrary);
    setLibraryDocs(updatedLibrary);

    localStorage.setItem(
      `vidyaai_library_${session.user.email}`,
      JSON.stringify(updatedLibrary)
    );

    // Remove from expanded state
    setExpanded((prev) => {
      const newExpanded = { ...prev };
      delete newExpanded[doc.name];
      return newExpanded;
    });

    // Remove subtopics
    setDocSubtopics((prev) => {
      const newSubtopics = { ...prev };
      delete newSubtopics[doc.name];
      return newSubtopics;
    });
  };

  const handleQuizAnswer = (subtopic: string, idx: number, value: string) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [subtopic]: { ...prev[subtopic], [idx]: value },
    }));
  };

  const handleQuizSubmit = (subtopic: string, quiz: any) => {
    const answers = quizAnswers[subtopic] || {};
    let correct = 0;
    let total = 0;

    quiz.questions?.forEach((q: any, idx: number) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
      total++;
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    setQuizScore((prev) => ({ ...prev, [subtopic]: score }));
    setQuizSubmitted((prev) => ({ ...prev, [subtopic]: true }));
  };

  const handleUserMessage = async (msg: string) => {
    if (!session?.user?.email) return;

    setTutorModal((prev) => ({
      ...prev,
      loading: true,
      conversation: [...prev.conversation, { role: "user", content: msg }],
    }));

    try {
      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          email: session.user.email,
        }),
      });
      const data = await response.json();

      if (response.ok && data.response) {
        setTutorModal((prev) => ({
          ...prev,
          loading: false,
          response: data.response,
          conversation: [
            ...prev.conversation,
            { role: "assistant", content: data.response },
          ],
        }));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setTutorModal((prev) => ({
        ...prev,
        loading: false,
        response: "Sorry, I encountered an error. Please try again.",
      }));
    }
  };

  // Organize by subject and chapter
  const organized = library.reduce((acc, doc) => {
    if (!acc[doc.subject]) acc[doc.subject] = {};
    if (!acc[doc.subject][doc.chapter]) acc[doc.subject][doc.chapter] = [];
    acc[doc.subject][doc.chapter].push(doc);
    return acc;
  }, {} as Record<string, Record<string, LibraryDoc[]>>);

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
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Reading Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Reading Progress
            </span>
            <span className="text-sm text-gray-500">{readingProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Upload Document
        </h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          {/* File Upload Area */}
          <div className="mb-6">
            <label
              htmlFor="file-upload"
              className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Drag and drop</span> or browse
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOCX, PPTX, TXT</p>
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileChange}
              ref={inputRef}
            />
            <button
              type="button"
              className="mt-2 bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors"
            >
              Browse
            </button>
          </div>

          {/* Document Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={documentDetails.topic}
                onChange={(e) =>
                  setDocumentDetails((prev) => ({
                    ...prev,
                    topic: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={documentDetails.subject}
                onChange={(e) =>
                  setDocumentDetails((prev) => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Mathematics"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chapter
              </label>
              <input
                type="text"
                value={documentDetails.chapter}
                onChange={(e) =>
                  setDocumentDetails((prev) => ({
                    ...prev,
                    chapter: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Derivatives"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class (Optional)
              </label>
              <input
                type="text"
                value={documentDetails.class}
                onChange={(e) =>
                  setDocumentDetails((prev) => ({
                    ...prev,
                    class: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 12th Grade"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Name
              </label>
              <input
                type="text"
                value={documentDetails.documentName}
                onChange={(e) =>
                  setDocumentDetails((prev) => ({
                    ...prev,
                    documentName: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Calculus Notes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Created
              </label>
              <input
                type="date"
                value={documentDetails.dateCreated}
                onChange={(e) =>
                  setDocumentDetails((prev) => ({
                    ...prev,
                    dateCreated: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Save"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Uploaded Documents Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Uploaded Documents
            </h2>
          </div>

          {library.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg">No documents uploaded yet.</p>
              <p className="text-sm">
                Upload your first document using the form above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chapter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {library.map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doc.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.chapter}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(doc.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartLearning(doc)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Start Learning
                          </button>
                          {(doc.subject === "Content Analysis Required" ||
                            doc.chapter === "Content Analysis Required" ||
                            doc.subject === "Document Analysis" ||
                            doc.chapter === "Document Analysis" ||
                            doc.subject === "General" ||
                            doc.chapter.includes("PDF content")) && (
                            <button
                              onClick={() => handleDocumentAnalysis(doc)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Re-analyze
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* AI Tutor Modal */}
      <AITutorModal
        open={tutorModal.open}
        onClose={() => {
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
