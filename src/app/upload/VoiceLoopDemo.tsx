import React, { useRef, useState } from "react";

export default function VoiceLoopDemo() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  // Helper to get a preferred voice
  const getPreferredVoice = () =>
    new Promise<SpeechSynthesisVoice | null>((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              v.name.toLowerCase().includes("natural")
          ) ||
          voices.find(
            (v) =>
              v.lang.startsWith("en") && v.name.toLowerCase().includes("google")
          ) ||
          voices.find((v) => v.lang.startsWith("en"));
        resolve(preferred || null);
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices();
          const preferred =
            voices.find(
              (v) =>
                v.lang.startsWith("en") &&
                v.name.toLowerCase().includes("natural")
            ) ||
            voices.find(
              (v) =>
                v.lang.startsWith("en") &&
                v.name.toLowerCase().includes("google")
            ) ||
            voices.find((v) => v.lang.startsWith("en"));
          resolve(preferred || null);
        };
      }
    });

  // Speak a message, then prompt and listen
  const speakAndPrompt = async (text: string) => {
    if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
    const preferred = await getPreferredVoice();
    const utter = new window.SpeechSynthesisUtterance(text);
    if (preferred) utter.voice = preferred;
    utter.rate = 1;
    utter.pitch = 1.1;
    utter.onend = () => {
      setIsSpeaking(false);
      promptAndListen();
    };
    utter.onstart = () => setIsSpeaking(true);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  // Prompt for follow-up and start listening
  const promptAndListen = async () => {
    const preferred = await getPreferredVoice();
    const promptUtter = new window.SpeechSynthesisUtterance(
      "Would you like to ask anything else? Just speak your question or say 'stop' to end."
    );
    if (preferred) promptUtter.voice = preferred;
    promptUtter.rate = 1;
    promptUtter.pitch = 1.1;
    promptUtter.onend = () => {
      setIsSpeaking(false);
      startListening();
    };
    promptUtter.onstart = () => setIsSpeaking(true);
    promptUtter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(promptUtter);
  };

  // Start listening for user voice
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      setIsListening(false);
      setLog((prev) => [...prev, "User said: " + transcript]);
      if (transcript.toLowerCase().includes("stop")) {
        setLog((prev) => [...prev, "Conversation ended."]);
        return;
      }
      // Respond and repeat the loop
      speakAndPrompt(
        "You asked: " +
          transcript +
          ". Here's a friendly answer! (Replace with Gemini response.)"
      );
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  // Stop everything
  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Minimal Voice Loop Demo</h2>
      <button
        onClick={() =>
          speakAndPrompt(
            "Hello! I'm your friendly teacher. Let's start learning!"
          )
        }
        disabled={isSpeaking || isListening}
      >
        Start Voice Loop
      </button>
      <button onClick={handleStop} style={{ marginLeft: 8 }}>
        Stop
      </button>
      {isSpeaking && <div>Speaking...</div>}
      {isListening && <div style={{ color: "orange" }}>Listening...</div>}
      <div style={{ marginTop: 16 }}>
        <strong>Log:</strong>
        <ul>
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
