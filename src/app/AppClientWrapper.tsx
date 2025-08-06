"use client";
import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";

export default function AppClientWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const [showApiPrompt, setShowApiPrompt] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatches
    setIsClient(true);
    
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

  const closePrompt = () => setShowApiPrompt(false);

  return (
    <>
      {isClient && showApiPrompt && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-key-title"
          onClick={(e) => e.target === e.currentTarget && closePrompt()}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative animate-bounceIn">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={closePrompt}
              aria-label="Close dialog"
              type="button"
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              <div className="animate-bounce mb-4" aria-hidden="true">
                <span className="text-5xl">🤖</span>
              </div>
              <h2 id="api-key-title" className="text-xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">
                Set Your Gemini API Key
              </h2>
              <p className="text-gray-700 dark:text-gray-200 text-center mb-4">
                To use AI features (Quiz, Q&A, Summary), you need to provide
                your own Gemini API key.
                <br />
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  It&apos;s easy and secure!
                </span>
              </p>
              <ol className="list-decimal list-inside text-left mb-4 text-sm text-gray-700 dark:text-gray-200 animate-fadeIn space-y-1">
                <li>
                  Go to <strong>Settings</strong> (or click the button below).
                </li>
                <li>
                  Paste your Gemini API key in the <strong>Gemini API Key (BYOK)</strong>{" "}
                  field.
                </li>
                <li>
                  Click <strong>Save Key</strong>.
                </li>
                <li>Return to any AI feature and enjoy!</li>
              </ol>
              <Link
                href="/dashboard/settings"
                className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                onClick={closePrompt}
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
