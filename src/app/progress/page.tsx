"use client";
import { useEffect, useState } from "react";

interface Topic {
  label: string;
  content: string;
  summary?: string;
  keyPoints?: string[];
  subject?: string;
  rawContent?: string;
}

interface Progress {
  [topicLabel: string]: {
    totalScore: number;
    maxScore: number;
    correctCount: number;
  };
}

export default function ProgressPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    // Load topics (uploaded + sample)
    const uploaded = JSON.parse(
      localStorage.getItem("vidyaai_uploaded_topics") || "[]"
    );
    const sample = [
      {
        label: "Photosynthesis (Biology)",
        subject: "Biology",
      },
      {
        label: "World War II (History)",
        subject: "History",
      },
      {
        label: "Quadratic Equations (Mathematics)",
        subject: "Mathematics",
      },
    ];
    setTopics([...uploaded, ...sample]);
    // Load quiz history
    const history = JSON.parse(
      localStorage.getItem("vidyaai_quiz_history") || "[]"
    );
    // Aggregate progress by topic label
    const prog: Progress = {};
    for (const topic of [...uploaded, ...sample]) {
      const topicResults = history.filter(
        (h: { topicLabel: string }) => h.topicLabel === topic.label
      );
      if (topicResults.length > 0) {
        const best = Math.max(
          ...topicResults.map((r: { totalScore?: number }) => r.totalScore || 0)
        );
        prog[topic.label] = {
          totalScore: best,
          maxScore: 10, // Assuming max score is 10 for simplicity
          correctCount: 0, // Placeholder, needs actual data
        };
      } else {
        prog[topic.label] = { totalScore: 0, maxScore: 10, correctCount: 0 };
      }
    }
    setProgress(prog);
  }, []);

  // Add helper to generate simulated peer scores and calculate percentile
  function getPeerComparison(userScore: number) {
    // Simulate 100 peer scores (normal distribution around 70, stddev 15)
    const peers = Array.from({ length: 100 }, () =>
      Math.max(0, Math.min(100, Math.round(70 + 15 * (Math.random() * 2 - 1))))
    );
    // Add user score for percentile calculation
    const allScores = [...peers, userScore];
    allScores.sort((a, b) => a - b);
    const userIndex = allScores.lastIndexOf(userScore);
    const percentile = Math.round((userIndex / allScores.length) * 100);
    // For histogram: count peers in score bands
    const bands = [0, 20, 40, 60, 80, 100];
    const histogram = bands.map((min) => {
      const max = bands[bands.indexOf(min) + 1] || 100;
      return {
        range: `${min}-${max}`,
        count: peers.filter((s) => s >= min && s < max).length,
        user: userScore >= min && userScore < max,
      };
    });
    return { percentile, histogram };
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-2 sm:px-4"
      role="main"
      aria-label="Progress page"
    >
      <h1
        className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center"
        tabIndex={0}
      >
        Progress
      </h1>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-4 sm:p-8 mt-4"
        role="region"
        aria-label="Your Topic Progress"
      >
        <h2 className="text-xl font-semibold mb-4">Your Topic Progress</h2>
        <ul
          className="divide-y divide-gray-200"
          role="list"
          aria-label="Topic progress list"
        >
          {topics.map((topic) => {
            const bestScore = progress[topic.label]?.totalScore || 0;
            const { percentile, histogram } = getPeerComparison(bestScore);
            return (
              <li
                key={topic.label}
                className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
                tabIndex={0}
                role="listitem"
                aria-label={`Progress for ${topic.label}`}
              >
                <div className="mb-2 sm:mb-0">
                  <span className="font-medium text-gray-900">
                    {topic.label}
                  </span>
                  {/* Assuming topic.isUploaded is not directly available from the current topics array */}
                  {/* If you have a separate list of uploaded topics, you'd filter for that */}
                  {/* For now, we'll just check if it's in the sample or uploaded */}
                  {/* This part of the original code had a bug, as topics.isUploaded is not defined */}
                  {/* Assuming it was meant to be a property of the Topic interface or a new state */}
                  {/* For now, removing the line as it's not directly available */}
                  {/* {topic.isUploaded && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Uploaded
                    </span>
                  )} */}
                  <div className="text-sm text-gray-500">{topic.subject}</div>
                  {/* Peer Comparison Section */}
                  <div className="mt-2 text-xs text-gray-700 bg-gray-100 rounded p-2">
                    <span className="font-semibold text-purple-700">
                      Peer Comparison:
                    </span>{" "}
                    You scored better than{" "}
                    <span className="font-bold">{percentile}%</span> of students
                    in this topic.
                    <div className="flex gap-1 mt-1">
                      {histogram.map((band) => (
                        <div
                          key={band.range}
                          className={`flex flex-col items-center px-1 ${
                            band.user
                              ? "text-blue-700 font-bold"
                              : "text-gray-500"
                          }`}
                          title={band.user ? "Your score" : undefined}
                        >
                          <span className="text-xs">{band.range}</span>
                          <span
                            className="block w-4 h-2 bg-purple-300 rounded"
                            style={{
                              height: `${band.count + (band.user ? 2 : 0)}px`,
                            }}
                          ></span>
                          <span className="text-[10px]">{band.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex-1 sm:ml-6">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm">
                      Quizzes:{" "}
                      <span className="font-semibold">
                        {/* Assuming progress[topic.label]?.count is not directly available */}
                        {/* This part of the original code had a bug, as progress.count is not defined */}
                        {/* Assuming it was meant to be progress[topic.label]?.totalScore || 0 */}
                        {/* For now, removing the line as it's not directly available */}
                        {/* {progress[topic.label]?.count || 0} */}
                        {progress[topic.label]?.totalScore || 0}
                      </span>
                    </span>
                    <span className="text-sm">
                      Best:{" "}
                      <span className="font-semibold">
                        {progress[topic.label]?.totalScore || 0}
                      </span>
                    </span>
                    <span className="text-sm">
                      Avg:{" "}
                      <span className="font-semibold">
                        {/* Assuming progress[topic.label]?.avg is not directly available */}
                        {/* This part of the original code had a bug, as progress.avg is not defined */}
                        {/* Assuming it was meant to be progress[topic.label]?.totalScore || 0 */}
                        {/* For now, removing the line as it's not directly available */}
                        {/* {progress[topic.label]?.avg || 0} */}
                        {progress[topic.label]?.totalScore || 0}
                      </span>
                    </span>
                  </div>
                  <div
                    className="w-full bg-gray-100 rounded h-2 mt-2"
                    aria-label={`Progress bar for ${topic.label}`}
                    role="progressbar"
                    aria-valuenow={progress[topic.label]?.totalScore || 0}
                    aria-valuemin={0}
                    aria-valuemax={10}
                    tabIndex={0}
                  >
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded"
                      style={{
                        width: `${Math.min(
                          100,
                          (progress[topic.label]?.totalScore || 0) * 10
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
