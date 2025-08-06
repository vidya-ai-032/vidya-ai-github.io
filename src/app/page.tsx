"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { login, isLoading } = useAuth();

  const handleGoogleLogin = async () => {
    await login("google");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl mb-6">
                <span className="text-3xl font-bold text-white">V</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  VidyaAI
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Revolutionize your learning experience with AI-powered tutoring,
                voice-first interactions, and intelligent quiz generation.
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slideIn">
            <div className="card-modern p-8 text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                AI Tutoring
              </h3>
              <p className="text-gray-600">
                Personalized learning with voice-first AI tutor powered by
                Google's Gemini
              </p>
            </div>

            <div className="card-modern p-8 text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Smart Quizzes
              </h3>
              <p className="text-gray-600">
                Intelligent quiz generation based on your uploaded study
                materials
              </p>
            </div>

            <div className="card-modern p-8 text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Content Processing
              </h3>
              <p className="text-gray-600">
                Upload any document and get instant AI-powered analysis and
                insights
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center animate-scaleIn">
            <div className="card-modern p-8 sm:p-12 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of students already using VidyaAI to enhance
                their learning experience.
              </p>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="btn-modern text-lg px-8 py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <svg className="w-6 h-6 mr-3 inline" viewBox="0 0 24 24">
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
                {isLoading ? "Signing in..." : "Continue with Google"}
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Free to use • No credit card required • Privacy protected
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fadeIn">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                50K+
              </div>
              <div className="text-gray-600">Quizzes Taken</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600 mb-2">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
