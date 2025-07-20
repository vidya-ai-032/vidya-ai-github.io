"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Summary {
  summary: Array<{
    title: string;
    summary: string;
    keyPoints?: string[];
  }>;
  date: string;
  topicLabel: string;
  userEmail: string;
}

export default function SummaryPage() {
  const { data: session } = useSession();
  const [summaryHistory, setSummaryHistory] = useState<Summary[]>([]);

  useEffect(() => {
    if (!session?.user?.email) return;
    const data = localStorage.getItem(
      `vidyaai_summary_history_${session.user.email}`
    );
    if (data) setSummaryHistory(JSON.parse(data));
  }, [session?.user?.email]);

  const handleDelete = (summaryToDelete: Summary) => {
    if (!session?.user?.email) return;
    const key = `vidyaai_summary_history_${session.user.email}`;
    const updated = summaryHistory.filter(
      (s) =>
        !(
          s.date === summaryToDelete.date &&
          s.topicLabel === summaryToDelete.topicLabel
        )
    );
    setSummaryHistory(updated);
    localStorage.setItem(key, JSON.stringify(updated));
  };

  // Organize by subject and chapter
  const organized = summaryHistory.reduce((acc, summary) => {
    const subject =
      summary.topicLabel?.split("(")[1]?.replace(")", "") || "General";
    const chapter =
      summary.topicLabel?.split("(")[0]?.trim() ||
      summary.topicLabel ||
      "Unknown";
    if (!acc[subject]) acc[subject] = {};
    if (!acc[subject][chapter]) acc[subject][chapter] = [];
    acc[subject][chapter].push(summary);
    return acc;
  }, {} as Record<string, Record<string, Summary[]>>);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center py-8 px-2">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">
          Summary History
        </h1>
        {summaryHistory.length === 0 ? (
          <div className="text-gray-500 text-center">
            No summaries generated yet.
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
                    <ul className="space-y-4">
                      {organized[subject][chapter].map((summary, idx) => (
                        <li
                          key={idx}
                          className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex flex-col relative pt-8"
                          id={`summary-section-${idx}`}
                        >
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                              onClick={() => handleDelete(summary)}
                              aria-label={`Delete summary for ${summary.topicLabel}`}
                            >
                              Delete
                            </button>
                            <PrintButton contentId={`summary-section-${idx}`} />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-2">
                              {new Date(summary.date).toLocaleString()}
                            </div>
                            <div>
                              {Array.isArray(summary.summary) &&
                              summary.summary.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-2">
                                  {summary.summary.map((s, i) => (
                                    <li key={i}>
                                      <div className="font-semibold text-gray-800">
                                        {s.title}
                                      </div>
                                      <div className="text-gray-700">
                                        {s.summary}
                                      </div>
                                      {s.keyPoints && (
                                        <ul className="list-disc pl-5 text-gray-600">
                                          {s.keyPoints.map((kp, j) => (
                                            <li key={j}>{kp}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="text-gray-500">
                                  No summary found.
                                </div>
                              )}
                            </div>
                          </div>
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
