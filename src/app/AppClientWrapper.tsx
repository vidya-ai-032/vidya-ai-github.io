"use client";
import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";

export default function AppClientWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [showApiPrompt, setShowApiPrompt] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Listen for a custom event to trigger the API key prompt
      const handler = () => {
        const hasKey = !!window.localStorage.getItem("vidyaai_gemini_api_key");
        if (!hasKey) setShowApiPrompt(true);
      };
      window.addEventListener("ai-feature-attempt", handler);
      return () => window.removeEventListener("ai-feature-attempt", handler);
    }
  }, []);
  return (
    <>
      {showApiPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-bounceIn">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold"
              onClick={() => setShowApiPrompt(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              <div className="animate-bounce mb-4">
                <span className="text-5xl">🤖</span>
              </div>
              <h2 className="text-xl font-bold mb-2 text-center">
                Set Your Gemini API Key
              </h2>
              <p className="text-gray-700 dark:text-gray-200 text-center mb-4">
                To use AI features (Quiz, Q&A, Summary), you need to provide
                your own Gemini API key.
                <br />
                <span className="text-purple-600 font-semibold">
                  It&apos;s easy and secure!
                </span>
              </p>
              <ol className="list-decimal list-inside text-left mb-4 text-sm text-gray-700 dark:text-gray-200 animate-fadeIn">
                <li>
                  Go to <b>Settings</b> (or click the button below).
                </li>
                <li>
                  Paste your Gemini API key in the <b>Gemini API Key (BYOK)</b>{" "}
                  field.
                </li>
                <li>
                  Click <b>Save Key</b>.
                </li>
                <li>Return to any AI feature and enjoy!</li>
              </ol>
              <Link
                href="/dashboard/settings"
                className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 animate-pulse"
                onClick={() => setShowApiPrompt(false)}
              >
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
