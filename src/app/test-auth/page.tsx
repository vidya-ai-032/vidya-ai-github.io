"use client";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const { login, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>

        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Current Auth State:</h2>
            <p>
              <strong>Status:</strong> {status}
            </p>
            <p>
              <strong>Is Authenticated:</strong>{" "}
              {isAuthenticated ? "Yes" : "No"}
            </p>
            <p>
              <strong>Session:</strong> {session ? "Present" : "None"}
            </p>
            {session && (
              <div className="mt-2">
                <p>
                  <strong>User Email:</strong> {session.user?.email}
                </p>
                <p>
                  <strong>User Name:</strong> {session.user?.name}
                </p>
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            {!isAuthenticated ? (
              <button
                onClick={() => login("google")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Sign In with Google
              </button>
            ) : (
              <button
                onClick={() => logout()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Sign Out
              </button>
            )}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Test Navigation:</h3>
            <div className="space-y-2">
              <a href="/" className="block text-blue-600 hover:underline">
                Go to Landing Page
              </a>
              <a
                href="/library"
                className="block text-blue-600 hover:underline"
              >
                Go to Library
              </a>
              <a
                href="/auth/login"
                className="block text-blue-600 hover:underline"
              >
                Go to Login Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
