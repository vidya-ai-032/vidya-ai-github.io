"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Load saved key from localStorage
    const saved = localStorage.getItem("vidyaai_gemini_api_key");
    if (saved) setApiKey(saved);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8 px-2">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-800 mb-4 text-center">
          Settings
        </h1>
        <h2 className="text-lg font-semibold mb-2">Gemini API Key (BYOK)</h2>
        <p className="text-gray-600 text-sm mb-4">
          Enter your personal Gemini API key to use your own quota for AI
          features. This key is stored only in your browser (localStorage) for
          demo purposes.
        </p>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <input
            type="text"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Save Key
            </button>
            {apiKey && (
              <button
                type="button"
                onClick={handleRemove}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200"
              >
                Remove Key
              </button>
            )}
          </div>
        </form>
        {status && (
          <div className="mt-4 text-center text-sm text-blue-700">{status}</div>
        )}
        <div className="mt-6 text-xs text-gray-400">
          (For production, your key would be stored securely on the server.)
        </div>
      </div>
    </div>
  );
}
