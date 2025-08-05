"use client";

import { useEffect, useState } from "react";

export function EnvironmentCheck() {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);
      // Fetch environment info from API
      fetch("/api/env-check")
        .then((res) => res.json())
        .then(setEnvInfo)
        .catch(console.error);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">Environment Status</h3>
      {envInfo ? (
        <div className="text-xs space-y-1">
          <div>NODE_ENV: {envInfo.NODE_ENV}</div>
          <div>NEXTAUTH_URL: {envInfo.NEXTAUTH_URL}</div>
          <div className="flex items-center gap-1">
            Google Client ID: {envInfo.hasGoogleClientId ? "✅" : "❌"}
          </div>
          <div className="flex items-center gap-1">
            Google Client Secret: {envInfo.hasGoogleClientSecret ? "✅" : "❌"}
          </div>
          <div className="flex items-center gap-1">
            NextAuth Secret: {envInfo.hasNextAuthSecret ? "✅" : "❌"}
          </div>
          <div className="flex items-center gap-1">
            Gemini API Key: {envInfo.hasGeminiApiKey ? "✅" : "❌"}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500">Loading...</div>
      )}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
      >
        ×
      </button>
    </div>
  );
}
