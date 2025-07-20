"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
// Remove: import { extractPdfText } from "@/lib/pdfExtract";
import { segmentTextToSubtopics, Subtopic } from "@/lib/segmentText";

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
}: {
  topic: Subtopic;
  onDelete?: () => void;
  subject?: string;
  rawContent?: string;
}) {
  const { data: session } = useSession();
  return (
    <div className="relative bg-blue-50 border border-blue-100 rounded-lg p-4 mb-0 flex flex-col flex-1 min-w-0 min-h-32 max-h-80 w-full overflow-y-auto shadow-sm transition-all duration-200 sm:p-5 break-words">
      {onDelete && (
        <button
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
          onClick={onDelete}
        >
          Delete
        </button>
      )}
      <div className="font-semibold text-blue-800 mb-1 text-base sm:text-lg break-words">
        {topic.title}
      </div>
      <div className="text-gray-700 text-sm sm:text-base mb-1 break-words">
        {topic.summary}
      </div>
      {topic.keyPoints && topic.keyPoints.length > 0 && (
        <ul className="list-disc pl-5 text-gray-600 text-xs sm:text-sm mb-2 space-y-1">
          {topic.keyPoints.map((kp, i) => (
            <li key={i} className="break-words">
              {kp}
            </li>
          ))}
        </ul>
      )}
      {/* Action buttons for each subtopic */}
      <div className="mt-auto flex flex-row gap-2">
        <button
          className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 text-sm"
          aria-label={`Generate quiz for ${topic.title}`}
          tabIndex={0}
          onClick={async () => {
            if (!session?.user?.email) return;
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
              const key = `vidyaai_quiz_history_${session.user.email}`;
              const history = JSON.parse(localStorage.getItem(key) || "[]");
              history.unshift({
                ...data.quiz,
                date: new Date().toISOString(),
                topicLabel: topic.title,
                userEmail: session.user.email,
              });
              localStorage.setItem(key, JSON.stringify(history.slice(0, 10)));
              alert("Quiz generated and saved!");
            }
          }}
        >
          Generate Quiz
        </button>
        <button
          className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 text-sm"
          aria-label={`Generate Q&A for ${topic.title}`}
          tabIndex={0}
          onClick={async () => {
            if (!session?.user?.email) return;
            const content =
              topic.summary + "\n" + (topic.keyPoints || []).join(" ");
            const res = await fetch("/api/gemini/generate-quiz", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: content,
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
              const key = `vidyaai_qa_history_${session.user.email}`;
              const history = JSON.parse(localStorage.getItem(key) || "[]");
              history.unshift({
                ...data.quiz,
                date: new Date().toISOString(),
                topicLabel: topic.title,
                userEmail: session.user.email,
              });
              localStorage.setItem(key, JSON.stringify(history.slice(0, 10)));
              alert("Q&A generated and saved!");
            }
          }}
        >
          Generate Q&A
        </button>
        <button
          className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 text-sm"
          aria-label={`Generate summary for ${topic.title}`}
          tabIndex={0}
          onClick={async () => {
            if (!session?.user?.email) return;
            const content =
              topic.summary + "\n" + (topic.keyPoints || []).join(" ");
            const res = await fetch("/api/gemini/process-content", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: content,
                subject: subject || topic.title,
              }),
            });
            if (res.status === 429) {
              alert(
                "You have exceeded your Gemini API quota. Please use a different API key in settings or wait for your quota to reset."
              );
              return;
            }
            const data = await res.json();
            if (res.ok && data.topics) {
              const key = `vidyaai_summary_history_${session.user.email}`;
              const history = JSON.parse(localStorage.getItem(key) || "[]");
              history.unshift({
                summary: data.topics,
                date: new Date().toISOString(),
                topicLabel: topic.title,
                userEmail: session.user.email,
              });
              localStorage.setItem(key, JSON.stringify(history.slice(0, 10)));
              alert("Summary generated and saved!");
            }
          }}
        >
          Summary
        </button>
      </div>
      {topic.subtopics && topic.subtopics.length > 0 && (
        <div className="ml-2 sm:ml-4 border-l-2 border-blue-200 pl-2 sm:pl-3 mt-2 space-y-4">
          {topic.subtopics.map((sub, i) => (
            <SubtopicCard
              key={i}
              topic={sub}
              subject={subject}
              rawContent={rawContent}
            />
          ))}
        </div>
      )}
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

export default function UploadPage() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [extractedTopics, setExtractedTopics] = useState<Topic[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDoc[]>([]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        // Send PDF as FormData to pages/api/upload/extract-text
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
      // For demo: use file name as subject
      const subject = selectedFile.name.split(".")[0];
      // Save uploaded document metadata to user-specific library
      if (session?.user?.email) {
        const libraryKey = `vidyaai_library_${session.user.email}`;
        const prevLib = JSON.parse(localStorage.getItem(libraryKey) || "[]");
        const newDoc = {
          name: selectedFile.name,
          subject,
          type: selectedFile.type,
          size: selectedFile.size,
          date: new Date().toISOString(),
          chapter: subject, // For now, use subject as chapter placeholder
          rawContent: fileText, // Store the actual extracted PDF/text content
        };
        prevLib.unshift(newDoc);
        localStorage.setItem(libraryKey, JSON.stringify(prevLib.slice(0, 50)));
        console.log("[UPLOAD] Saved to localStorage:", libraryKey, newDoc);
      }
      // Call Gemini process-content API
      if (fileText) {
        console.log("Sending to Gemini:", fileText.slice(0, 500));
        const topicRes = await fetch("/api/gemini/process-content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: fileText, subject }),
        });
        const topicData = await topicRes.json();
        let newTopics;
        if (topicRes.ok && topicData.topics) {
          newTopics = topicData.topics.map(
            (t: {
              title: string;
              summary: string;
              keyPoints: string[];
              subtopics?: Subtopic[];
            }) => ({
              label: `${t.title} (${subject})`,
              title: t.title,
              content: t.summary + "\n" + t.keyPoints.join(" "),
              summary: t.summary,
              keyPoints: t.keyPoints,
              subject,
              rawContent: fileText, // Store the actual extracted PDF text
              subtopics: t.subtopics,
            })
          );
        } else {
          // Fallback: rule-based segmentation (now always returns a top-level topic)
          const fallbackTopics = segmentTextToSubtopics(fileText);
          newTopics = fallbackTopics.map((ft) => ({
            label: `${subject} (Rule-based)`,
            title: ft.title,
            content: ft.summary + "\n" + (ft.keyPoints || []).join(" "),
            summary: ft.summary,
            keyPoints: ft.keyPoints,
            subject,
            rawContent: fileText,
            subtopics: ft.subtopics,
          }));
        }
        const prev = JSON.parse(
          localStorage.getItem("vidyaai_uploaded_topics") || "[]"
        );
        localStorage.setItem(
          "vidyaai_uploaded_topics",
          JSON.stringify([...prev, ...newTopics])
        );
        setExtractedTopics(newTopics);
      }
      alert("File uploaded and topics extracted successfully!");
      window.dispatchEvent(new Event("library-updated"));
      setSelectedFile(null);
      setPreviewUrl(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Only show the most recent document in the upload page
  const lastDoc = libraryDocs.length > 0 ? [libraryDocs[0]] : [];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center py-8 px-2 sm:px-4 lg:px-8"
      role="main"
      aria-label="Upload page"
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-4 sm:p-8 mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
          Upload Study Material
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mb-6 text-center">
          Supported formats: PDF, DOCX, TXT, JPG, PNG
        </p>
        <form
          aria-label="Upload study material"
          role="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleUpload();
          }}
        >
          <div className="mb-4 sm:mb-6">
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select file
            </label>
            <input
              ref={inputRef}
              id="file-upload"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-600 file:to-purple-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Choose a file to upload"
              tabIndex={0}
            />
          </div>
          {previewUrl && (
            <div className="mb-4 sm:mb-6 flex justify-center">
              <Image
                src={previewUrl}
                alt="Preview of uploaded file"
                width={200}
                height={150}
                className="max-h-48 rounded-lg border"
              />
            </div>
          )}
          {selectedFile && !previewUrl && (
            <div className="mb-4 sm:mb-6 text-center text-gray-700">
              <span className="font-medium">Selected file:</span>{" "}
              {selectedFile.name}
            </div>
          )}
          {error && (
            <div
              className="mb-3 sm:mb-4 text-red-600 text-center font-medium text-sm sm:text-base"
              role="alert"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!selectedFile || isUploading}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-base sm:text-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Upload file"
            tabIndex={0}
          >
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {extractedTopics.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center mb-4">
              <div className="font-bold text-lg">Extracted Subtopics:</div>
              <PrintButton contentId="subtopics-section" />
            </div>
            <div
              id="subtopics-section"
              className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]"
            >
              {extractedTopics.map((t, i) => (
                <div
                  key={i}
                  className="relative bg-white border border-blue-200 rounded-xl shadow p-4 flex flex-col min-h-[220px]"
                >
                  <button
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
                    onClick={() => {
                      if (!session?.user?.email) return;
                      const key = `vidyaai_uploaded_topics_${session.user.email}`;
                      const prev = JSON.parse(
                        localStorage.getItem(key) || "[]"
                      );
                      const updated = prev.filter(
                        (topic: { label: string }) => topic.label !== t.label
                      );
                      localStorage.setItem(key, JSON.stringify(updated));
                      setExtractedTopics(
                        extractedTopics.filter(
                          (topic) => topic.label !== t.label
                        )
                      );
                    }}
                    aria-label={`Delete topic ${t.label}`}
                  >
                    Delete
                  </button>
                  <div className="mb-2 font-bold text-lg text-blue-900">
                    {t.label}
                  </div>
                  {/* Subtopics rendering */}
                  {Array.isArray(t.subtopics) && t.subtopics.length > 0 ? (
                    <div className="space-y-4">
                      {t.subtopics.map((sub: Subtopic, j: number) => (
                        <SubtopicCard
                          key={j}
                          topic={sub}
                          subject={t.subject}
                          rawContent={t.rawContent}
                        />
                      ))}
                    </div>
                  ) : (
                    <SubtopicCard
                      topic={t}
                      subject={t.subject}
                      rawContent={t.rawContent}
                    />
                  )}
                  <div className="mt-auto flex flex-row gap-2">
                    <button
                      className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 text-sm"
                      aria-label={`Generate quiz for ${t.label}`}
                      tabIndex={0}
                      onClick={async () => {
                        if (!session?.user?.email) return;
                        console.log(
                          "[GEMINI] Sending to Gemini:",
                          t.rawContent?.slice(0, 200),
                          t.subject
                        );
                        // Generate quiz via Gemini API
                        const res = await fetch("/api/gemini/generate-quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: t.rawContent,
                            subject: t.subject,
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
                          // Save quiz to user-specific quiz history
                          const key = `vidyaai_quiz_history_${session.user.email}`;
                          const history = JSON.parse(
                            localStorage.getItem(key) || "[]"
                          );
                          history.unshift({
                            ...data.quiz,
                            date: new Date().toISOString(),
                            topicLabel: t.label,
                            userEmail: session.user.email,
                          });
                          localStorage.setItem(
                            key,
                            JSON.stringify(history.slice(0, 10))
                          );
                          alert("Quiz generated and saved!");
                        }
                      }}
                    >
                      Generate Quiz
                    </button>
                    <button
                      className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 text-sm"
                      aria-label={`Generate Q&A for ${t.label}`}
                      tabIndex={0}
                      onClick={async () => {
                        if (!session?.user?.email) return;
                        console.log(
                          "[GEMINI] Sending to Gemini:",
                          t.rawContent?.slice(0, 200),
                          t.subject
                        );
                        // Generate Q&A via Gemini API (subjective)
                        const res = await fetch("/api/gemini/generate-quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: t.rawContent,
                            subject: t.subject,
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
                          // Save Q&A to user-specific Q&A history
                          const key = `vidyaai_qa_history_${session.user.email}`;
                          const history = JSON.parse(
                            localStorage.getItem(key) || "[]"
                          );
                          history.unshift({
                            ...data.quiz,
                            date: new Date().toISOString(),
                            topicLabel: t.label,
                            userEmail: session.user.email,
                          });
                          localStorage.setItem(
                            key,
                            JSON.stringify(history.slice(0, 10))
                          );
                          alert("Q&A generated and saved!");
                        }
                      }}
                    >
                      Generate Q&A
                    </button>
                    <button
                      className="flex-1 min-w-0 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 text-sm"
                      aria-label={`Generate summary for ${t.label}`}
                      tabIndex={0}
                      onClick={async () => {
                        if (!session?.user?.email) return;
                        console.log(
                          "[GEMINI] Sending to Gemini:",
                          t.rawContent?.slice(0, 200),
                          t.subject
                        );
                        // Generate summary via Gemini API (reuse process-content for summary)
                        const res = await fetch("/api/gemini/process-content", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: t.rawContent,
                            subject: t.subject,
                          }),
                        });
                        if (res.status === 429) {
                          alert(
                            "You have exceeded your Gemini API quota. Please use a different API key in settings or wait for your quota to reset."
                          );
                          return;
                        }
                        const data = await res.json();
                        if (res.ok && data.topics) {
                          // Save summary to user-specific summary history
                          const key = `vidyaai_summary_history_${session.user.email}`;
                          const history = JSON.parse(
                            localStorage.getItem(key) || "[]"
                          );
                          history.unshift({
                            summary: data.topics,
                            date: new Date().toISOString(),
                            topicLabel: t.label,
                            userEmail: session.user.email,
                          });
                          localStorage.setItem(
                            key,
                            JSON.stringify(history.slice(0, 10))
                          );
                          alert("Summary generated and saved!");
                        }
                      }}
                    >
                      Summary
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => router.push("/quiz")}
              aria-label="Go to Quiz"
              tabIndex={0}
            >
              Go to Quiz
            </button>
          </div>
        )}
        {/* User's uploaded documents with action buttons */}
        {lastDoc.length > 0 && (
          <div className="mt-10 bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="font-bold mb-2 text-purple-800">
              Last Uploaded Document
            </div>
            <ul className="list-disc pl-5 text-purple-900 mb-3">
              {lastDoc.map((doc, i) => (
                <li key={i} className="mb-2 flex items-center justify-between">
                  <span>
                    {doc.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({doc.subject})
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 text-sm"
                      aria-label={`Generate quiz for ${doc.name}`}
                      tabIndex={0}
                      onClick={async () => {
                        if (!session?.user?.email) return;
                        console.log(
                          "[GEMINI] Sending to Gemini:",
                          doc.content || doc.name,
                          doc.subject
                        );
                        // Generate quiz via Gemini API
                        const res = await fetch("/api/gemini/generate-quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: doc.content || doc.name,
                            subject: doc.subject,
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
                          const key = `vidyaai_quiz_history_${session.user.email}`;
                          const history = JSON.parse(
                            localStorage.getItem(key) || "[]"
                          );
                          history.unshift({
                            ...data.quiz,
                            date: new Date().toISOString(),
                            topicLabel: doc.name,
                            userEmail: session.user.email,
                          });
                          localStorage.setItem(
                            key,
                            JSON.stringify(history.slice(0, 10))
                          );
                          alert("Quiz generated and saved!");
                        }
                      }}
                    >
                      Generate Quiz
                    </button>
                    <button
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 text-sm"
                      aria-label={`Generate Q&A for ${doc.name}`}
                      tabIndex={0}
                      onClick={async () => {
                        if (!session?.user?.email) return;
                        console.log(
                          "[GEMINI] Sending to Gemini:",
                          doc.content || doc.name,
                          doc.subject
                        );
                        // Generate Q&A via Gemini API (subjective)
                        const res = await fetch("/api/gemini/generate-quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: doc.content || doc.name,
                            subject: doc.subject,
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
                          const key = `vidyaai_qa_history_${session.user.email}`;
                          const history = JSON.parse(
                            localStorage.getItem(key) || "[]"
                          );
                          history.unshift({
                            ...data.quiz,
                            date: new Date().toISOString(),
                            topicLabel: doc.name,
                            userEmail: session.user.email,
                          });
                          localStorage.setItem(
                            key,
                            JSON.stringify(history.slice(0, 10))
                          );
                          alert("Q&A generated and saved!");
                        }
                      }}
                    >
                      Generate Q&A
                    </button>
                    <button
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 text-sm"
                      aria-label={`Generate summary for ${doc.name}`}
                      tabIndex={0}
                      onClick={async () => {
                        if (!session?.user?.email) return;
                        console.log(
                          "[GEMINI] Sending to Gemini:",
                          doc.content || doc.name,
                          doc.subject
                        );
                        // Generate summary via Gemini API (reuse process-content for summary)
                        const res = await fetch("/api/gemini/process-content", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            content: doc.content || doc.name,
                            subject: doc.subject,
                          }),
                        });
                        if (res.status === 429) {
                          alert(
                            "You have exceeded your Gemini API quota. Please use a different API key in settings or wait for your quota to reset."
                          );
                          return;
                        }
                        const data = await res.json();
                        if (res.ok && data.topics) {
                          const key = `vidyaai_summary_history_${session.user.email}`;
                          const history = JSON.parse(
                            localStorage.getItem(key) || "[]"
                          );
                          history.unshift({
                            summary: data.topics,
                            date: new Date().toISOString(),
                            topicLabel: doc.name,
                            userEmail: session.user.email,
                          });
                          localStorage.setItem(
                            key,
                            JSON.stringify(history.slice(0, 10))
                          );
                          alert("Summary generated and saved!");
                        } else {
                          alert(
                            "Summary generation failed. Response: " +
                              JSON.stringify(data)
                          );
                        }
                      }}
                    >
                      Summary
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
