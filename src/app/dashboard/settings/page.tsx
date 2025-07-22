"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function SettingsPage() {
  const { status } = useSession();
  const [apiKey, setApiKey] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
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
      setStatusMsg("Please enter a valid API key.");
      return;
    }
    localStorage.setItem("vidyaai_gemini_api_key", apiKey.trim());
    setStatusMsg("API key saved successfully.");
  };

  const handleRemove = () => {
    localStorage.removeItem("vidyaai_gemini_api_key");
    setApiKey("");
    setStatusMsg("API key removed.");
  };

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-bold mb-4">Sign in required</h2>
          <button
            className="bg-blue-400 text-white px-4 py-2 rounded flex items-center justify-center mx-auto hover:bg-blue-500"
            onClick={() => signIn("google", { prompt: "select_account" })}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

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
                className="px-5 py-2 bg-blue-400 text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400"
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
          {statusMsg && (
            <div className="mt-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg">
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
