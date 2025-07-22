"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vidyaai_gemini_api_key");
    if (saved) setApiKey(saved);
    // Check for Gemini API key in localStorage
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("vidyaai_gemini_api_key");
      setHasGeminiKey(!!key);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setStatus("Please enter a valid API key.");
      return;
    }
    localStorage.setItem("vidyaai_gemini_api_key", apiKey.trim());
    setStatus("API key saved successfully.");
  };

  const handleRemove = () => {
    localStorage.removeItem("vidyaai_gemini_api_key");
    setApiKey("");
    setStatus("API key removed.");
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {!hasGeminiKey && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md flex items-center justify-between shadow-sm">
          <div>
            <span className="font-bold">⚡️ Set your Gemini API key!</span>
            <p className="text-sm">
              To use all AI features, please add your Gemini API key below. You
              can get one from Google AI Studio.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600 mb-6">
          Manage your application settings below.
        </p>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Gemini API Key
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Enter your personal Gemini API key to use your own quota for AI
            features. This key is stored securely in your browser's local
            storage.
          </p>
          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Enter your Gemini API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Key
              </button>
              {apiKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Remove Key
                </button>
              )}
            </div>
          </form>
          {status && (
            <div className="mt-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
