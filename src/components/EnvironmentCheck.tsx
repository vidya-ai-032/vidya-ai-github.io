"use client";

import { useEffect, useState } from "react";

interface EnvInfo {
  NODE_ENV: string;
  NEXTAUTH_URL: string;
  hasGoogleClientId: boolean;
  hasGoogleClientSecret: boolean;
  hasNextAuthSecret: boolean;
  hasGeminiApiKey: boolean;
}

export function EnvironmentCheck() {
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side to prevent hydration mismatches
    setIsClient(true);
    
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);
      // Fetch environment info from API
      fetch("/api/env-check")
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch environment info');
          return res.json();
        })
        .then((data: EnvInfo) => setEnvInfo(data))
        .catch((error) => {
          console.error('Environment check failed:', error);
          // Gracefully handle error - don't show anything if API fails
        });
    }
  }, []);

  // Don't render anything on server side or if not visible
  if (!isClient || !isVisible || process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="font-semibold text-sm mb-2">Environment Status</h3>
      {envInfo ? (
        <div className="text-xs space-y-1">
          <div>NODE_ENV: {envInfo.NODE_ENV}</div>
          <div>NEXTAUTH_URL: {envInfo.NEXTAUTH_URL || 'Not set'}</div>
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
        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 w-6 h-6 flex items-center justify-center"
        aria-label="Close environment check"
      >
        ×
      </button>
    </div>
  );
}
