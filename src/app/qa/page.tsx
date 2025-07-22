"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(
      `vidyaai_qa_history_${session.user.email}`
    );
    if (data) setQaHistory(JSON.parse(data));
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
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">
          Q&A History
        </h1>
        {qaHistory.length === 0 ? (
          <div className="text-gray-500 text-center">No Q&A generated yet.</div>
        ) : (
          <ul className="space-y-6">
            {qaHistory.map((qa, idx) => (
              <li
                key={idx}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col relative pt-8"
                id={`qna-section-${idx}`}
              >
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                    onClick={() => handleDelete(qa)}
                    aria-label={`Delete Q&A for ${qa.topicLabel}`}
                  >
                    Delete
                  </button>
                  <PrintButton contentId={`qna-section-${idx}`} />
                </div>
                <div>
                  <div className="font-bold text-lg text-blue-900 mb-1">
                    {qa.topicLabel}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(qa.date).toLocaleString()}
                  </div>
                  <div>
                    {qa.questions && qa.questions.length > 0 ? (
                      <ul className="list-decimal pl-5 space-y-2">
                        {qa.questions.map((q, i) => (
                          <li key={i}>
                            <div className="font-semibold text-gray-800">
                              Q: {q.question}
                            </div>
                            {q.answer && (
                              <div className="text-gray-700">A: {q.answer}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-500">No questions found.</div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
