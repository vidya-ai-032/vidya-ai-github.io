"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

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

export default function LibraryPage() {
  const { data: session } = useSession();
  const [library, setLibrary] = useState<LibraryDoc[]>([]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(`vidyaai_library_${session.user.email}`);
    console.log(
      "[LIBRARY] Loaded from localStorage:",
      `vidyaai_library_${session.user.email}`,
      data
    );
    if (data) setLibrary(JSON.parse(data));
    const loadLibrary = () => {
      const data = localStorage.getItem(
        `vidyaai_library_${session.user.email}`
      );
      if (data) setLibrary(JSON.parse(data));
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
  };

  // Organize by subject and chapter
  const organized = library.reduce((acc, doc) => {
    if (!acc[doc.subject]) acc[doc.subject] = {};
    if (!acc[doc.subject][doc.chapter]) acc[doc.subject][doc.chapter] = [];
    acc[doc.subject][doc.chapter].push(doc);
    return acc;
  }, {} as Record<string, Record<string, LibraryDoc[]>>);

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
                            <PrintButton contentId={`qna-section-${idx}`} />
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
                          <button
                            className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 text-xs cursor-pointer mt-2 sm:mt-0 sm:ml-2"
                            onClick={async () => {
                              if (!session?.user?.email) return;
                              console.log(
                                "[GEMINI] Sending to Gemini (quiz):",
                                doc.rawContent?.slice(0, 200),
                                doc.subject
                              );
                              await fetch("/api/gemini/generate-quiz", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  content: doc.rawContent,
                                  subject: doc.subject,
                                  quizType: "mcq",
                                }),
                              });
                              // ...handle response...
                            }}
                          >
                            Generate Quiz
                          </button>
                          <button
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 text-xs cursor-pointer mt-2 sm:mt-0 sm:ml-2"
                            onClick={async () => {
                              if (!session?.user?.email) return;
                              console.log(
                                "[GEMINI] Sending to Gemini (Q&A):",
                                doc.rawContent?.slice(0, 200),
                                doc.subject
                              );
                              await fetch("/api/gemini/generate-quiz", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  content: doc.rawContent,
                                  subject: doc.subject,
                                  quizType: "subjective",
                                }),
                              });
                              // ...handle response...
                            }}
                          >
                            Generate Q&A
                          </button>
                          <button
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded font-semibold hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 text-xs cursor-pointer mt-2 sm:mt-0 sm:ml-2"
                            onClick={async () => {
                              if (!session?.user?.email) return;
                              console.log(
                                "[GEMINI] Sending to Gemini (summary):",
                                doc.rawContent?.slice(0, 200),
                                doc.subject
                              );
                              await fetch("/api/gemini/process-content", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  content: doc.rawContent,
                                  subject: doc.subject,
                                }),
                              });
                              // ...handle response...
                            }}
                          >
                            Generate Summary
                          </button>
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
