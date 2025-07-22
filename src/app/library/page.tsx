"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

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

interface Subtopic {
  title: string;
  summary: string;
  keyPoints: string[];
  subject?: string;
  rawContent?: string;
  subtopics?: Subtopic[];
}

const getSubtopicsKey = (email: string, docName: string) =>
  `vidyaai_subtopics_${email}_${docName}`;

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const [library, setLibrary] = useState<LibraryDoc[]>([]);
  const [docSubtopics, setDocSubtopics] = useState<Record<string, Subtopic[]>>(
    {}
  );
  const [expanded, setExpanded] = useState<
    Record<string, { subtopics: boolean; quiz: boolean; qa: boolean }>
  >({});
  const [docQuiz, setDocQuiz] = useState<Record<string, any>>({});
  const [docQA, setDocQA] = useState<Record<string, any>>({});

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
      const key = getSubtopicsKey(session.user.email, doc.name);
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
        const key = getSubtopicsKey(session.user.email, doc.name);
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
    const subKey = getSubtopicsKey(session.user.email, docToDelete.name);
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
      const key = getSubtopicsKey(session.user.email, doc.name);
      localStorage.setItem(key, JSON.stringify(newTopics));
      setDocSubtopics((prev) => ({ ...prev, [doc.name]: newTopics }));
      alert("Subtopics generated!");
    } catch (err) {
      alert("Failed to generate subtopics.");
    }
  };

  // Quiz/Q&A state and handlers (toggle and persist)
  const handleGenerateQuiz = async (doc: LibraryDoc) => {
    const docKey = doc.name;
    if (expanded[docKey]?.quiz) {
      setExpanded((prev) => ({
        ...prev,
        [docKey]: { ...prev[docKey], quiz: false },
      }));
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
    } catch (err) {
      alert("Failed to generate quiz.");
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
    } catch (err) {
      alert("Failed to generate Q&A.");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-8 px-2">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">
          My Library
        </h1>
        {library.length === 0 ? (
          <div className="text-gray-500 text-center">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(organized).map((subject) => (
              <div key={subject}>
                <h2 className="text-xl font-semibold text-blue-700 mb-2">
                  {subject}
                </h2>
                {Object.keys(organized[subject]).map((chapter) => (
                  <div key={chapter} className="mb-4">
                    <h3 className="text-lg font-medium text-purple-700 mb-1">
                      Chapter: {chapter}
                    </h3>
                    <ul className="space-y-2">
                      {organized[subject][chapter].map((doc, idx) => (
                        <li
                          key={idx}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex flex-col relative pt-8 cursor-pointer"
                          id={`qna-section-${idx}`}
                        >
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                              onClick={() => handleDelete(doc)}
                              aria-label={`Delete ${doc.name}`}
                            >
                              Delete
                            </button>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {doc.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Type: {doc.type} | Size:{" "}
                              {Math.round(doc.size / 1024)} KB
                            </div>
                            <div className="text-xs text-gray-500">
                              Uploaded: {new Date(doc.date).toLocaleString()}
                            </div>
                          </div>
                          {/* Action Buttons Group */}
                          <div className="flex gap-2 mt-2">
                            <button
                              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 text-xs cursor-pointer"
                              onClick={() => handleGenerateQuiz(doc)}
                            >
                              Generate Quiz
                            </button>
                            <button
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 text-xs cursor-pointer"
                              onClick={() => handleGenerateQA(doc)}
                            >
                              Generate Q&A
                            </button>
                            <button
                              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 text-xs cursor-pointer"
                              onClick={() => handleGenerateSubtopics(doc)}
                            >
                              Generate Subtopics
                            </button>
                          </div>
                          {/* Show subtopics if present */}
                          {expanded[doc.name]?.subtopics &&
                            docSubtopics[doc.name] &&
                            docSubtopics[doc.name].length > 0 && (
                              <div className="mt-2">
                                {docSubtopics[doc.name].map((t, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white border border-blue-100 rounded-lg p-4 mb-2"
                                  >
                                    <div className="font-semibold text-blue-800 mb-2 text-base sm:text-lg break-words">
                                      {t.title}
                                    </div>
                                    <div className="text-gray-700 text-sm sm:text-base mb-3 break-words">
                                      {t.summary}
                                    </div>
                                    {t.keyPoints && t.keyPoints.length > 0 && (
                                      <ul className="list-disc pl-5 text-gray-600 text-sm space-y-2">
                                        {t.keyPoints.map((kp, i) => (
                                          <li key={i} className="break-words">
                                            {kp}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          {expanded[doc.name]?.quiz && docQuiz[doc.name] && (
                            <div
                              className="mt-2 bg-white border border-green-200 rounded-lg p-4 mb-2"
                              id={`quiz-section-${idx}`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-semibold text-green-800 text-base sm:text-lg break-words">
                                  Quiz
                                </div>
                                <PrintButton
                                  contentId={`quiz-section-${idx}`}
                                />
                              </div>
                              {/* Render quiz questions here, e.g. as a list */}
                              {docQuiz[doc.name].questions &&
                                docQuiz[doc.name].questions.length > 0 && (
                                  <ul className="list-decimal pl-5 text-gray-700 text-sm space-y-2">
                                    {docQuiz[doc.name].questions.map(
                                      (q: any, i: number) => (
                                        <li key={i} className="break-words">
                                          <div className="font-medium">
                                            {q.question}
                                          </div>
                                          {q.options &&
                                            q.options.length > 0 && (
                                              <ul className="list-disc pl-5">
                                                {q.options.map(
                                                  (opt: string, j: number) => (
                                                    <li key={j}>{opt}</li>
                                                  )
                                                )}
                                              </ul>
                                            )}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                )}
                            </div>
                          )}
                          {expanded[doc.name]?.qa && docQA[doc.name] && (
                            <div className="mt-2 bg-white border border-pink-200 rounded-lg p-4 mb-2">
                              <div className="font-semibold text-pink-800 mb-2 text-base sm:text-lg break-words">
                                Q&A
                              </div>
                              {/* Render Q&A questions here, e.g. as a list */}
                              {docQA[doc.name].questions &&
                                docQA[doc.name].questions.length > 0 && (
                                  <ul className="list-decimal pl-5 text-gray-700 text-sm space-y-2">
                                    {docQA[doc.name].questions.map(
                                      (q: any, i: number) => (
                                        <li key={i} className="break-words">
                                          <div className="font-medium">
                                            {q.question}
                                          </div>
                                          {q.options &&
                                            q.options.length > 0 && (
                                              <ul className="list-disc pl-5">
                                                {q.options.map(
                                                  (opt: string, j: number) => (
                                                    <li key={j}>{opt}</li>
                                                  )
                                                )}
                                              </ul>
                                            )}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
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
