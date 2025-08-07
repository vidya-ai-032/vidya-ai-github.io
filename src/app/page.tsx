"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import SignInModal from "@/components/SignInModal";

export default function LandingPage() {
  const { data: session } = useSession();
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Unlock the Power of AI for{" "}
                <span className="text-blue-600">
                  Educational Content Analysis
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                Effortlessly analyze and extract insights from educational
                documents with our AI-powered workflow and enhance learning
                outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    if (session) {
                      window.location.href = "/library";
                    } else {
                      setIsSignInModalOpen(true);
                    }
                  }}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-200 text-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Upload Document
                </button>
                <Link
                  href="#how-it-works"
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-200 text-center"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* Hero Illustration - Collaborative Study Scene */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                <div className="relative w-full h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl overflow-hidden">
                  {/* Collaborative Study Illustration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full h-full">
                      {/* Table */}
                      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-80 h-4 bg-amber-800 rounded-lg shadow-lg"></div>

                      {/* People around the table */}
                      {/* Person 1 - Left (Black woman with orange shirt) */}
                      <div className="absolute bottom-12 left-8">
                        <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-12 h-12 bg-orange-300 rounded-full"></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-orange-400 rounded-full"></div>
                      </div>

                      {/* Person 2 - Middle-Left (Asian man with teal shirt) */}
                      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 -ml-8">
                        <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-12 h-12 bg-teal-300 rounded-full"></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-teal-400 rounded-full"></div>
                      </div>

                      {/* Person 3 - Middle-Right (Caucasian woman with teal shirt) */}
                      <div className="absolute bottom-12 right-1/2 transform translate-x-8">
                        <div className="w-16 h-16 bg-teal-400 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-12 h-12 bg-teal-300 rounded-full"></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-teal-400 rounded-full"></div>
                      </div>

                      {/* Person 4 - Right (South Asian man with yellow shirt) */}
                      <div className="absolute bottom-12 right-8">
                        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                          <div className="w-12 h-12 bg-yellow-300 rounded-full"></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-yellow-400 rounded-full"></div>
                      </div>

                      {/* Laptop in center */}
                      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
                        <div className="w-20 h-12 bg-gray-300 rounded-lg border-2 border-gray-400 shadow-lg"></div>
                        <div className="w-24 h-1 bg-gray-400 rounded-full mx-auto mt-1"></div>
                      </div>

                      {/* Books */}
                      <div className="absolute bottom-16 left-16">
                        <div className="w-8 h-10 bg-blue-500 rounded-sm shadow-md"></div>
                      </div>
                      <div className="absolute bottom-16 right-16">
                        <div className="w-8 h-10 bg-red-500 rounded-sm shadow-md"></div>
                      </div>

                      {/* Plant in background */}
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-12 bg-green-400 rounded-full shadow-md"></div>
                        <div className="absolute -top-2 -right-1 w-4 h-4 bg-green-300 rounded-full"></div>
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-green-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple steps to transform your educational content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Upload Your Document
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Drag and drop or select your educational files. We support PDF,
                DOCX, PPTX, and TXT formats.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                AI-Powered Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Our advanced AI algorithms analyze content, identify key
                concepts, relationships, and patterns.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-10 h-10 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Gain Valuable Insights
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive comprehensive reports and visualizations for deeper
                understanding of your content.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for effective educational content analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-10 h-10 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Content Summarization
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get concise summaries of lengthy documents, making it easier to
                understand key points quickly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Performance Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track student progress and identify areas for improvement with
                detailed analytics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Personalized Recommendations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive tailored recommendations for learning materials based on
                your content analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Educational Content Analysis?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of educators and students who are already using Vidya
            AI to enhance their learning experience.
          </p>
          <button
            onClick={() => {
              if (session) {
                window.location.href = "/library";
              } else {
                setIsSignInModalOpen(true);
              }
            }}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all duration-200 inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Vidya AI</h3>
              <p className="text-gray-400 leading-relaxed">
                Transforming education through AI-powered content analysis.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/library"
                    className="hover:text-white transition-colors"
                  >
                    Library
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="#support"
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Vidya AI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </div>
  );
}
