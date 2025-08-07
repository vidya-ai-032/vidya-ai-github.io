"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FaExpand,
  FaCompress,
  FaFileAlt,
  FaList,
  FaQuestionCircle,
  FaGraduationCap,
  FaMicrophone,
  FaPlay,
  FaPause,
} from "react-icons/fa";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
  totalTime: number;
}

interface ScoreHistory {
  timestamp: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface SubjectiveQA {
  question: string;
  userAnswer: string;
  aiAnswer: string;
  evaluation: string;
  score: number;
}

function StartLearningPageContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [docName, setDocName] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docSubject, setDocSubject] = useState("");
  const [docChapter, setDocChapter] = useState("");

  // UI States
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("document");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Summary States
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Subtopics States
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);

  // Quiz States
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const [showScoreHistory, setShowScoreHistory] = useState(false);

  // Subjective QA States
  const [subjectiveQAs, setSubjectiveQAs] = useState<SubjectiveQA[]>([]);
  const [subjectiveQALoading, setSubjectiveQALoading] = useState(false);
  const [currentQAIndex, setCurrentQAIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  // AI Tutor States
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorConversation, setTutorConversation] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [tutorInput, setTutorInput] = useState("");
  const [isTutorSpeaking, setIsTutorSpeaking] = useState(false);

  // Progress Tracking States
  const [completedFeatures, setCompletedFeatures] = useState<Set<string>>(
    new Set()
  );
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Feature weights for progress calculation
  const featureWeights = {
    subtopics: 40,
    quiz: 35,
    "subjective-qa": 25,
  };

  useEffect(() => {
    // Extract document data from URL parameters
    const docNameParam = searchParams.get("docName");
    const docContentParam = searchParams.get("docContent");
    const docSubjectParam = searchParams.get("docSubject");
    const docChapterParam = searchParams.get("docChapter");

    if (docNameParam) setDocName(decodeURIComponent(docNameParam));
    if (docSubjectParam) setDocSubject(decodeURIComponent(docSubjectParam));
    if (docChapterParam) setDocChapter(decodeURIComponent(docChapterParam));

    // Try to get content from URL parameters first
    if (docContentParam) {
      setDocContent(decodeURIComponent(docContentParam));
    } else if (docNameParam) {
      // Try to get content from localStorage using the specific key
      try {
        const storedContent = localStorage.getItem(
          `vidyaai_doc_content_${docNameParam}`
        );
        if (storedContent && storedContent.trim()) {
          setDocContent(storedContent);
        } else {
          // Fallback to library data
          const libraryData = localStorage.getItem(
            `vidyaai_library_${session?.user?.email}`
          );
          if (libraryData) {
            const library = JSON.parse(libraryData);
            const doc = library.find((d: any) => d.name === docNameParam);
            if (doc && doc.rawContent && doc.rawContent.trim()) {
              setDocContent(doc.rawContent);
            }
          }
        }
      } catch (error) {
        console.error("Error loading document from localStorage:", error);
      }
    }

    // Load score history from localStorage
    const savedHistory = localStorage.getItem(`quiz_history_${docNameParam}`);
    if (savedHistory) {
      setScoreHistory(JSON.parse(savedHistory));
    }
  }, [searchParams, session?.user?.email]);

  // Update progress based on completed features
  const updateProgress = (feature: string, completed: boolean) => {
    setCompletedFeatures((prev) => {
      const newSet = new Set(prev);
      if (completed) {
        newSet.add(feature);
      } else {
        newSet.delete(feature);
      }

      // Calculate total progress
      let totalProgress = 0;
      newSet.forEach((feat) => {
        totalProgress +=
          featureWeights[feat as keyof typeof featureWeights] || 0;
      });

      setProgressPercentage(Math.min(totalProgress, 100));
      return newSet;
    });
  };

  // Generate Summary
  const generateSummary = async () => {
    setSummaryLoading(true);
    setError(null);

    try {
      // Validate that document content exists
      if (!docContent || !docContent.trim()) {
        throw new Error(
          "No document content available. Please ensure a document is loaded."
        );
      }

      const response = await fetch("/api/gemini/summarize-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: docContent,
          academicLevel: "general",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to generate summary"
        );
      }

      setSummary(data.summary);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate summary"
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  // Extract Subtopics
  const extractSubtopics = async () => {
    setSubtopicsLoading(true);
    setError(null);

    try {
      // Validate that document content exists
      if (!docContent || !docContent.trim()) {
        throw new Error(
          "No document content available. Please ensure a document is loaded."
        );
      }

      const response = await fetch("/api/gemini/process-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: docContent,
          subject: docSubject,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to extract subtopics"
        );
      }

      setSubtopics(data.topics || []);
      updateProgress("subtopics", true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to extract subtopics"
      );
    } finally {
      setSubtopicsLoading(false);
    }
  };

  // Generate Quiz
  const generateQuiz = async () => {
    setQuizLoading(true);
    setError(null);

    try {
      // Validate that document content exists
      if (!docContent || !docContent.trim()) {
        throw new Error(
          "No document content available. Please ensure a document is loaded."
        );
      }

      const response = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: docContent,
          subject: docSubject,
          quizType: "mcq",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to generate quiz"
        );
      }

      setQuiz(data.quiz);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      updateProgress("quiz", true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to generate quiz"
      );
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit Quiz
  const submitQuiz = async () => {
    if (!quiz) return;

    setLoading(true);

    try {
      let correctAnswers = 0;
      const totalQuestions = quiz.questions.length;

      quiz.questions.forEach((question, index) => {
        if (quizAnswers[index] === question.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = Math.round((correctAnswers / totalQuestions) * 100);
      setQuizScore(score);
      setQuizSubmitted(true);

      // Save to score history
      const newScore: ScoreHistory = {
        timestamp: new Date().toISOString(),
        score,
        totalQuestions,
        correctAnswers,
      };

      const updatedHistory = [newScore, ...scoreHistory];
      setScoreHistory(updatedHistory);
      localStorage.setItem(
        `quiz_history_${docName}`,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      setError("Failed to submit quiz");
    } finally {
      setLoading(false);
    }
  };

  // Re-attempt Quiz
  const reattemptQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  };

  // Generate Subjective Q&A
  const generateSubjectiveQA = async () => {
    setSubjectiveQALoading(true);
    setError(null);

    try {
      // Validate that document content exists
      if (!docContent || !docContent.trim()) {
        throw new Error(
          "No document content available. Please ensure a document is loaded."
        );
      }

      const response = await fetch("/api/gemini/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: docContent,
          subject: docSubject,
          quizType: "subjective",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to generate subjective Q&A"
        );
      }

      const qaList: SubjectiveQA[] = data.quiz.questions.map((q: any) => ({
        question: q.question,
        userAnswer: "",
        aiAnswer: "",
        evaluation: "",
        score: 0,
      }));

      setSubjectiveQAs(qaList);
      setCurrentQAIndex(0);
      updateProgress("subjective-qa", true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate subjective Q&A"
      );
    } finally {
      setSubjectiveQALoading(false);
    }
  };

  // Evaluate Answer
  const evaluateAnswer = async () => {
    if (!subjectiveQAs[currentQAIndex] || !userAnswer.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/gemini/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: subjectiveQAs[currentQAIndex].question,
          correctAnswer: subjectiveQAs[currentQAIndex].aiAnswer,
          studentAnswer: userAnswer,
          questionType: "subjective",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to evaluate answer");
      }

      const updatedQAs = [...subjectiveQAs];
      updatedQAs[currentQAIndex] = {
        ...updatedQAs[currentQAIndex],
        userAnswer,
        evaluation: data.feedback,
        score: data.score,
      };

      setSubjectiveQAs(updatedQAs);
      setUserAnswer("");
    } catch (error) {
      setError("Failed to evaluate answer");
    } finally {
      setLoading(false);
    }
  };

  // Generate AI Answer
  const generateAIAnswer = async () => {
    if (!subjectiveQAs[currentQAIndex]) return;

    setLoading(true);

    try {
      // Validate that document content exists
      if (!docContent || !docContent.trim()) {
        throw new Error(
          "No document content available. Please ensure a document is loaded."
        );
      }

      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please provide a comprehensive answer to: ${subjectiveQAs[currentQAIndex].question}`,
          context: docContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to generate AI answer"
        );
      }

      const updatedQAs = [...subjectiveQAs];
      updatedQAs[currentQAIndex] = {
        ...updatedQAs[currentQAIndex],
        aiAnswer: data.response,
      };

      setSubjectiveQAs(updatedQAs);
    } catch (error) {
      setError("Failed to generate AI answer");
    } finally {
      setLoading(false);
    }
  };

  // AI Tutor Functions
  const sendTutorMessage = async () => {
    if (!tutorInput.trim()) return;

    const userMessage = { role: "user", content: tutorInput };
    setTutorConversation((prev) => [...prev, userMessage]);
    setTutorInput("");
    setTutorLoading(true);

    try {
      // Validate that document content exists
      if (!docContent || !docContent.trim()) {
        throw new Error(
          "No document content available. Please ensure a document is loaded."
        );
      }

      const response = await fetch("/api/gemini/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: tutorInput,
          context: docContent,
          conversationHistory: tutorConversation,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to get tutor response"
        );
      }

      const assistantMessage = { role: "assistant", content: data.response };
      setTutorConversation((prev) => [...prev, assistantMessage]);

      // Text-to-speech
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.response);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        speechSynthesis.speak(utterance);
        setIsTutorSpeaking(true);

        utterance.onend = () => setIsTutorSpeaking(false);
      }
    } catch (error) {
      setError("Failed to get tutor response");
    } finally {
      setTutorLoading(false);
    }
  };

  // Speech Recognition
  const startRecording = () => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserAnswer(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    }
  };

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4">Sign in required</h2>
          <p className="text-gray-600">
            Please sign in to access the learning page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {docChapter && docChapter !== "Content Analysis Required"
                  ? docChapter
                  : docName || "Document Content"}
              </h1>
              <p className="text-gray-600">
                {docSubject && docSubject !== "Content Analysis Required"
                  ? docSubject
                  : "Document Analysis"}
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Document Content */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    <FaFileAlt className="inline mr-2" />
                    {docName || "Document Content"}
                  </h2>
                  <button
                    onClick={() => setIsDocumentExpanded(!isDocumentExpanded)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {isDocumentExpanded ? <FaCompress /> : <FaExpand />}
                  </button>
                </div>
              </div>

              <div
                className={`p-6 ${
                  isDocumentExpanded ? "max-h-96" : "max-h-64"
                } overflow-y-auto`}
              >
                <div className="prose max-w-none">
                  {docContent &&
                  docContent.trim() &&
                  !docContent.includes("Text extraction failed") ? (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {docContent}
                    </pre>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <FaFileAlt className="mx-auto text-4xl" />
                      </div>
                      <p className="text-gray-600 mb-2">
                        Document content processing required
                      </p>
                      <p className="text-sm text-gray-500">
                        The document content needs to be processed. This might
                        be due to:
                      </p>
                      <ul className="text-sm text-gray-500 mt-2 space-y-1">
                        <li>• PDF text extraction in progress</li>
                        <li>• Document format processing</li>
                        <li>• Content analysis being performed</li>
                      </ul>
                      <p className="text-sm text-gray-500 mt-2">
                        The document has been uploaded successfully. Content
                        will be available once processing is complete.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Button */}
              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={generateSummary}
                  disabled={summaryLoading || !docContent?.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {summaryLoading ? "Generating..." : "Summary"}
                </button>

                {summary && (
                  <div className="mt-4 p-4 bg-white rounded-lg border">
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-gray-700 mb-3">{summary.summary}</p>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Academic Level:</strong> {summary.academicLevel}
                      </p>
                      <p>
                        <strong>Reading Time:</strong>{" "}
                        {summary.estimatedReadingTime}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Table of Contents */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Table of Contents
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="text-blue-600 font-medium">
                    Introduction to {docSubject}
                  </li>
                  <li className="text-gray-600">Key Concepts</li>
                  <li className="text-gray-600">Applications</li>
                  <li className="text-gray-600">Examples</li>
                </ul>
              </div>

              {/* Chapter Progress */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Chapter Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {Math.round(progressPercentage)}% Complete
                </p>
                {completedFeatures.size > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">
                      Completed features:
                    </p>
                    <div className="space-y-1">
                      {Array.from(completedFeatures).map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center text-xs"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-gray-600 capitalize">
                            {feature.replace("-", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Features Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Features</h3>
                <div className="space-y-3">
                  <button
                    onClick={extractSubtopics}
                    disabled={subtopicsLoading || !docContent?.trim()}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {subtopicsLoading ? "Extracting..." : "Extract Subtopics"}
                  </button>

                  <button
                    onClick={generateQuiz}
                    disabled={quizLoading || !docContent?.trim()}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    {quizLoading ? "Generating..." : "Generate Quiz"}
                  </button>

                  <button
                    onClick={generateSubjectiveQA}
                    disabled={subjectiveQALoading || !docContent?.trim()}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
                  >
                    {subjectiveQALoading ? "Generating..." : "Subjective Q&A"}
                  </button>

                  <button
                    onClick={() => setTutorOpen(true)}
                    disabled={!docContent?.trim()}
                    className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                  >
                    Teach Me This
                  </button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                <textarea
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={4}
                  placeholder="Add your notes here..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Section - Appears when quiz is generated */}
        {quiz && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Quiz: Understanding {docSubject}
              </h2>
              <button
                onClick={() => setQuiz(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {!quizSubmitted ? (
              <>
                {quiz.questions.map((question, index) => (
                  <div key={index} className="mb-8 p-4 border rounded-lg">
                    <h3 className="font-semibold mb-3">
                      Question {index + 1} of {quiz.questions.length}:{" "}
                      {question.question}
                    </h3>

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={option}
                            checked={quizAnswers[index] === option}
                            onChange={(e) =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [index]: e.target.value,
                              }))
                            }
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex space-x-4">
                  <button
                    onClick={submitQuiz}
                    disabled={
                      Object.keys(quizAnswers).length < quiz.questions.length
                    }
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Submit Quiz
                  </button>
                  <button
                    onClick={() => setQuiz(null)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-4">Quiz Results</h3>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  Total Score: {quizScore}%
                </div>
                <p className="text-gray-600 mb-6">
                  You answered {scoreHistory[0]?.correctAnswers || 0} out of{" "}
                  {scoreHistory[0]?.totalQuestions || 0} questions correctly.
                </p>

                <div className="space-y-4 mb-6">
                  {quiz.questions.map((question, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Question {index + 1}</h4>
                      <p className="text-gray-700 mb-2">{question.question}</p>
                      <p className="text-sm">
                        <span className="font-medium">Your Answer:</span>{" "}
                        {quizAnswers[index] || "Not answered"}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Correct Answer:</span>{" "}
                        {question.correctAnswer}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {question.explanation}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 justify-center">
                  <button
                    onClick={reattemptQuiz}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Re-attempt Quiz
                  </button>
                  <button
                    onClick={() => setShowScoreHistory(!showScoreHistory)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Score History
                  </button>
                  <button
                    onClick={() => setQuiz(null)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Back to Document
                  </button>
                </div>

                {showScoreHistory && scoreHistory.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Score History</h4>
                    {scoreHistory.map((score, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {new Date(score.timestamp).toLocaleString()}:{" "}
                        {score.score}%
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Subjective Q&A Section - Appears when Q&A is generated */}
        {subjectiveQAs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Subjective Q&A</h2>
              <button
                onClick={() => setSubjectiveQAs([])}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">
                Question {currentQAIndex + 1} of {subjectiveQAs.length}:{" "}
                {subjectiveQAs[currentQAIndex].question}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer:
                  </label>
                  <div className="flex space-x-2">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="flex-1 p-3 border rounded-lg resize-none"
                      rows={4}
                      placeholder="Type your answer here..."
                    />
                    <button
                      onClick={startRecording}
                      disabled={isRecording}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <FaMicrophone />
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={evaluateAnswer}
                    disabled={!userAnswer.trim() || loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Evaluating..." : "Evaluate Answer"}
                  </button>

                  <button
                    onClick={generateAIAnswer}
                    disabled={loading || !docContent?.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Generating..." : "Generate AI Answer"}
                  </button>
                </div>

                {subjectiveQAs[currentQAIndex].evaluation && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium mb-2">Evaluation:</h4>
                    <p className="text-gray-700">
                      {subjectiveQAs[currentQAIndex].evaluation}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Score: {subjectiveQAs[currentQAIndex].score}%
                    </p>
                  </div>
                )}

                {subjectiveQAs[currentQAIndex].aiAnswer && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium mb-2">AI Answer:</h4>
                    <p className="text-gray-700">
                      {subjectiveQAs[currentQAIndex].aiAnswer}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() =>
                  setCurrentQAIndex(Math.max(0, currentQAIndex - 1))
                }
                disabled={currentQAIndex === 0}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-gray-600">
                {currentQAIndex + 1} of {subjectiveQAs.length}
              </span>

              <button
                onClick={() =>
                  setCurrentQAIndex(
                    Math.min(subjectiveQAs.length - 1, currentQAIndex + 1)
                  )
                }
                disabled={currentQAIndex === subjectiveQAs.length - 1}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Subtopics Section - Appears when subtopics are extracted */}
        {subtopics.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Document Analysis: Subtopics
              </h2>
              <button
                onClick={() => setSubtopics([])}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">
                Main Topic: {docSubject}
              </h3>
            </div>

            <div className="space-y-4">
              {subtopics.map((topic, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <input type="checkbox" className="mt-1" defaultChecked />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-2">
                        {topic.title}
                      </h4>
                      <p className="text-sm text-gray-600">{topic.summary}</p>
                      {topic.keyPoints && topic.keyPoints.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">
                            Key Points:
                          </h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {topic.keyPoints.map(
                              (point: string, pointIndex: number) => (
                                <li
                                  key={pointIndex}
                                  className="flex items-start"
                                >
                                  <span className="mr-2">•</span>
                                  {point}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* AI Tutor Modal */}
      {tutorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">AI Tutor</h2>
              <button
                onClick={() => setTutorOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {tutorConversation.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-100 ml-12"
                        : "bg-gray-100 mr-12"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.role === "user" ? "You" : "AI Tutor"}
                    </p>
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                ))}

                {tutorLoading && (
                  <div className="p-3 bg-gray-100 rounded-lg mr-12">
                    <p className="text-gray-600">AI Tutor is thinking...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tutorInput}
                  onChange={(e) => setTutorInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendTutorMessage()}
                  placeholder="Ask your question..."
                  className="flex-1 p-3 border rounded-lg"
                />
                <button
                  onClick={sendTutorMessage}
                  disabled={!tutorInput.trim() || tutorLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
                {isTutorSpeaking && (
                  <button
                    onClick={() => speechSynthesis.cancel()}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <FaPause />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StartLearningPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <StartLearningPageContent />
    </Suspense>
  );
}
