"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Add this type for cross-platform speech recognition instance
// This covers the properties and methods you use
// and avoids the use of 'any'.
type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult:
    | ((event: {
        resultIndex: number;
        results: { isFinal: boolean; [key: number]: { transcript: string } }[];
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechend: (() => void) | null;
  start?: () => void;
  stop?: () => void;
  abort?: () => void;
};

// Add this at the top of the file for TypeScript support
// type SpeechRecognition = typeof window.SpeechRecognition;

// Add this at the top of the file for Netlify/Next.js compatibility
declare global {
  interface Window {
    SpeechRecognition: typeof window.SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof window.SpeechRecognition | undefined;
  }
}

export default function TutorPage() {
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  // Use a more specific type for recognitionRef
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  const inputRef = useRef("");
  const finalTranscriptRef = useRef("");

  const speak = useCallback((text: string) => {
    setTtsError(null);
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setTtsError("Text-to-speech is not supported in this browser.");
      return;
    }
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      utter.rate = 1;
      utter.onerror = () => setTtsError("Failed to play audio.");
      window.speechSynthesis.speak(utter);
    } catch {
      setTtsError("Failed to play audio.");
    }
  }, []);

  const sendMessage = useCallback(
    async (msg: string) => {
      if (!msg.trim() || loading) return;
      setMessages((prev) => [...prev, { role: "user", content: msg }]);
      setInput("");
      setInterim("");
      setApiError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/gemini/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            conversationHistory: messages,
          }),
        });
        const data = await res.json();
        if (res.status !== 200) {
          setApiError(
            data.error || "AI service error. Please try again later."
          );
        }
        if (data?.response?.response) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.response.response },
          ]);
          setSuggestions(data.response.suggestions || []);
          speak(data.response.response);
        }
      } catch {
        setApiError(
          "Network error. Please check your connection and try again."
        );
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn&apos;t process that. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, speak]
  );

  // Web Speech API setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: {
      resultIndex: number;
      results: { isFinal: boolean; [key: number]: { transcript: string } }[];
    }) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setInterim(interimTranscript);
      setInput(finalTranscript);
      finalTranscriptRef.current = finalTranscript;
    };
    recognition.onerror = (event: { error: string }) => {
      setIsListening(false);
      setInterim("");
      finalTranscriptRef.current = "";
      if (event.error === "not-allowed" || event.error === "denied") {
        setMicError(
          "Microphone access denied. Please allow mic access in your browser settings."
        );
      } else if (event.error === "no-speech") {
        setMicError("No speech detected. Please try again.");
      } else {
        setMicError("Speech recognition error: " + event.error);
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterim("");
      // Auto-send message if final transcript is not empty
      if (finalTranscriptRef.current.trim()) {
        sendMessage(finalTranscriptRef.current.trim());
        finalTranscriptRef.current = "";
      }
    };
    recognition.onspeechend = () => {
      recognition.stop();
    };
    recognitionRef.current = recognition;
  }, [sendMessage]);

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "This is a test AI response. You should hear this spoken aloud.",
      },
    ]);
  }, []);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Clean up speech recognition and synthesis on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort?.();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Prevent double-sending by disabling sendMessage if already loading
  const startListening = () => {
    setInput("");
    setInterim("");
    setIsListening(true);
    recognitionRef.current?.start?.();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
    setInterim("");
  };

  const handleInputSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (s: string) => {
    setInput(s);
    setInterim("");
    sendMessage(s);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 sm:py-12 px-2 sm:px-4">
      <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6 max-w-xl w-full flex flex-col h-[80vh]">
        <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center">
          🎤 Voice-First AI Tutor
        </h1>
        {micError && (
          <div
            className="text-center text-red-500 text-xs sm:text-sm mb-2"
            role="alert"
          >
            {micError}
          </div>
        )}
        {apiError && (
          <div
            className="text-center text-red-500 text-xs sm:text-sm mb-2"
            role="alert"
          >
            {apiError}
          </div>
        )}
        <div
          className="flex-1 overflow-y-auto mb-3 sm:mb-4 px-0 sm:px-1"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="text-gray-400 text-center mt-8 sm:mt-16 text-sm sm:text-base">
              Start a conversation by speaking or typing below.
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } mb-2`}
            >
              <div
                className={`rounded-xl px-3 py-2 sm:px-4 sm:py-2 max-w-[90%] sm:max-w-[75%] text-sm sm:text-base shadow ${
                  msg.role === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-purple-100 text-purple-900"
                } flex items-center gap-2`}
              >
                {msg.content}
                {msg.role === "assistant" && (
                  <button
                    onClick={() => speak(msg.content)}
                    title="Replay audio"
                    aria-label="Replay AI response"
                    className="ml-2 p-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start mb-2">
              <div className="rounded-xl px-3 py-2 sm:px-4 sm:py-2 max-w-[90%] sm:max-w-[75%] text-sm sm:text-base shadow bg-purple-100 text-purple-900 animate-pulse">
                AI is thinking...
              </div>
            </div>
          )}
        </div>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div
            className="flex flex-wrap gap-2 mb-2"
            aria-label="AI suggestions"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm hover:from-blue-700 hover:to-purple-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label={`Send suggestion: ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {/* Input controls */}
        <form
          onSubmit={handleInputSend}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2"
          aria-label="Chat input"
        >
          <div className="flex flex-row items-center gap-2 mb-2 sm:mb-0">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow transition-all duration-200 border-2 ${
                isListening
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 border-blue-400 animate-pulse"
                  : "bg-gray-200 border-gray-300"
              }`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
              aria-pressed={isListening}
            >
              <svg
                className={`w-6 h-6 sm:w-7 sm:h-7 ${
                  isListening ? "text-white" : "text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18v2m0 0h-2m2 0h2m-2-2a4 4 0 004-4V7a4 4 0 10-8 0v7a4 4 0 004 4z"
                />
              </svg>
            </button>
            <div className="flex-1 relative">
              <label htmlFor="tutor-input" className="sr-only">
                Type your question
              </label>
              <input
                id="tutor-input"
                type="text"
                className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base pr-8 sm:pr-10"
                placeholder="Type or speak your question..."
                value={input + (isListening && interim ? interim : "")}
                onChange={(e) => setInput(e.target.value)}
                disabled={isListening || loading}
                aria-label="Type your question"
                autoComplete="off"
              />
              {isListening && interim && (
                <span className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-pulse text-xs sm:text-sm">
                  {interim}
                </span>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm sm:text-base shadow hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            Send
          </button>
        </form>
        {isListening && (
          <div
            className="text-center text-blue-500 text-xs sm:text-sm mt-2 animate-pulse"
            role="status"
          >
            Listening... Speak now!
          </div>
        )}
        {ttsError && (
          <div
            className="text-center text-red-500 text-xs sm:text-sm mt-2"
            role="alert"
          >
            {ttsError}
          </div>
        )}
      </div>
    </div>
  );
}
