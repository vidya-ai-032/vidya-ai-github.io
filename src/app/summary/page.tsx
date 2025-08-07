"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  FaFileUpload,
  FaBook,
  FaGraduationCap,
  FaClock,
  FaLightbulb,
} from "react-icons/fa";

interface DocumentSummary {
  summary: string;
  academicLevel: string;
  keyTakeaways: string[];
  estimatedReadingTime: string;
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
  analysis?: {
    topic: string;
    subject: string;
    level: string;
    documentTitle: string;
    chapterSection: string;
    confidenceScore: number;
  };
}

export default function SummaryPage() {
  const { data: session, status } = useSession();
  const [libraryDocs, setLibraryDocs] = useState<LibraryDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LibraryDoc | null>(null);
  const [customContent, setCustomContent] = useState("");
  const [academicLevel, setAcademicLevel] = useState("general");
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "custom">("library");

  // Load library documents
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      const library = JSON.parse(
        localStorage.getItem(`vidyaai_library_${session.user.email}`) || "[]"
      );
      setLibraryDocs(library);
    }
  }, [session, status]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      let content = "";
      let level = academicLevel;

      if (activeTab === "library" && selectedDoc) {
        content = selectedDoc.rawContent || selectedDoc.content || "";
        level = selectedDoc.analysis?.level || academicLevel;
      } else if (activeTab === "custom") {
        content = customContent;
      }

      if (!content.trim()) {
        throw new Error("Please provide content to summarize");
      }

      const response = await fetch("/api/gemini/summarize-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content,
          academicLevel: level,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.userMessage || data.error || "Failed to generate summary"
        );
      }

      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDocSelect = (doc: LibraryDoc) => {
    setSelectedDoc(doc);
    setSummary(null);
    setError(null);
  };

  const handleCustomContentChange = () => {
    setSummary(null);
    setError(null);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Please sign in to access summaries
          </h1>
          <p className="text-gray-600">
            You need to be authenticated to use this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Document Summarization
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate comprehensive educational summaries from your documents or
            custom content. Get clear, structured summaries perfect for student
            learning.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab("library")}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === "library"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaBook className="inline mr-2" />
              From Library
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === "custom"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FaFileUpload className="inline mr-2" />
              Custom Content
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activeTab === "library" ? "Select Document" : "Enter Content"}
            </h2>

            {activeTab === "library" ? (
              <div>
                {libraryDocs.length === 0 ? (
                  <div className="text-center py-8">
                    <FaBook className="text-4xl text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      No documents in your library
                    </p>
                    <a
                      href="/library"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Upload Documents
                    </a>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {libraryDocs.map((doc) => (
                      <div
                        key={doc.name}
                        onClick={() => handleDocSelect(doc)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDoc?.name === doc.name
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">
                          {doc.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {doc.subject} • {doc.chapter}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Level
                  </label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="elementary">Elementary School</option>
                    <option value="middle">Middle School</option>
                    <option value="high">High School</option>
                    <option value="college">College/University</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Content
                  </label>
                  <textarea
                    value={customContent}
                    onChange={(e) => {
                      setCustomContent(e.target.value);
                      handleCustomContentChange();
                    }}
                    placeholder="Paste your document content here..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateSummary}
              disabled={loading || (!selectedDoc && !customContent.trim())}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Summary...
                </span>
              ) : (
                "Generate Summary"
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Generated Summary
            </h2>

            {!summary ? (
              <div className="text-center py-12">
                <FaLightbulb className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {activeTab === "library"
                    ? "Select a document and generate a summary"
                    : "Enter content and generate a summary"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Text */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Summary
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {summary.summary}
                    </p>
                  </div>
                </div>

                {/* Key Takeaways */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Key Takeaways
                  </h3>
                  <ul className="space-y-2">
                    {summary.keyTakeaways.map((takeaway, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2 mt-1">•</span>
                        <span className="text-gray-800">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <FaGraduationCap className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Level: {summary.academicLevel}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Reading Time: {summary.estimatedReadingTime}
                    </span>
                  </div>
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => {
                    const textToCopy = `Summary:\n\n${
                      summary.summary
                    }\n\nKey Takeaways:\n${summary.keyTakeaways
                      .map((t) => `• ${t}`)
                      .join("\n")}\n\nAcademic Level: ${
                      summary.academicLevel
                    }\nEstimated Reading Time: ${summary.estimatedReadingTime}`;
                    navigator.clipboard.writeText(textToCopy);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Copy Summary
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

