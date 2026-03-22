"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Check, X, Loader2 } from "lucide-react";

interface ParsedLab {
  test_name: string;
  result_value: string;
  unit: string;
  reference_range: string;
  status: string;
  flagged: boolean;
  validation: string;
}

interface VoiceInputProps {
  onDataIngested?: () => void;
}

export default function VoiceInput({ onDataIngested }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedLabs, setParsedLabs] = useState<ParsedLab[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "parsing" | "confirming" | "stored" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Speech recognition not supported in this browser");
      setStatus("error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript + " ";
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setTranscript((final + interim).trim());
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      setStatus("error");
      setErrorMsg(`Speech error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setStatus("listening");
    setTranscript("");
    setParsedLabs([]);
  }, []);

  const stopAndParse = useCallback(async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    if (!transcript.trim()) {
      setStatus("idle");
      return;
    }

    setStatus("parsing");

    try {
      const res = await fetch("http://localhost:3847/api/ingest-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer abe-open-brain-2026",
        },
        body: JSON.stringify({ text: transcript, source: "voice" }),
      });

      if (!res.ok) throw new Error("Parse failed");
      const data = await res.json();

      if (data.parsed && data.parsed.length > 0) {
        setParsedLabs(data.parsed);
        setStatus("confirming");
      } else {
        setErrorMsg("No lab values recognized. Try saying something like: 'A1C 5.8, cholesterol 210, hematocrit 50'");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Could not connect to Open Brain API. Is the server running?");
      setStatus("error");
    }
  }, [transcript]);

  const confirmAndStore = useCallback(async () => {
    setStatus("parsing");
    try {
      const res = await fetch("http://localhost:3847/api/ingest-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer abe-open-brain-2026",
        },
        body: JSON.stringify({
          labs: parsedLabs,
          date: new Date().toISOString().split("T")[0],
          source: "voice-input",
        }),
      });

      if (!res.ok) throw new Error("Store failed");
      setStatus("stored");
      onDataIngested?.();
      setTimeout(() => {
        setStatus("idle");
        setTranscript("");
        setParsedLabs([]);
      }, 3000);
    } catch {
      setErrorMsg("Failed to store data");
      setStatus("error");
    }
  }, [parsedLabs, onDataIngested]);

  const cancel = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setStatus("idle");
    setTranscript("");
    setParsedLabs([]);
    setErrorMsg("");
  }, []);

  return (
    <>
      {/* Floating mic button */}
      <button
        onClick={isListening ? stopAndParse : startListening}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{
          background: isListening
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          boxShadow: isListening
            ? "0 0 20px rgba(239,68,68,0.5)"
            : "0 0 20px rgba(99,102,241,0.3)",
          animation: isListening ? "pulse 1.5s infinite" : "none",
        }}
      >
        {isListening ? <MicOff size={22} color="white" /> : <Mic size={22} color="white" />}
      </button>

      {/* Voice input overlay */}
      {status !== "idle" && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status === "listening" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                  <span className="text-[12px] text-[#ef4444] font-semibold">Listening...</span>
                </>
              )}
              {status === "parsing" && (
                <>
                  <Loader2 size={14} color="#6366f1" className="animate-spin" />
                  <span className="text-[12px] text-[#6366f1] font-semibold">Parsing...</span>
                </>
              )}
              {status === "confirming" && (
                <span className="text-[12px] text-[#f59e0b] font-semibold">Confirm Data</span>
              )}
              {status === "stored" && (
                <>
                  <Check size={14} color="#10b981" />
                  <span className="text-[12px] text-[#10b981] font-semibold">Stored!</span>
                </>
              )}
              {status === "error" && (
                <span className="text-[12px] text-[#ef4444] font-semibold">Error</span>
              )}
            </div>
            <button onClick={cancel} className="text-[#64748b] hover:text-[#94a3b8] bg-transparent border-none cursor-pointer">
              <X size={14} />
            </button>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="px-4 py-3 border-b border-[#1e293b]">
              <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">You said:</div>
              <div className="text-[13px] text-[#e2e8f0] leading-relaxed">{transcript}</div>
            </div>
          )}

          {/* Parsed results for confirmation */}
          {status === "confirming" && parsedLabs.length > 0 && (
            <div className="px-4 py-3">
              <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">I heard these values:</div>
              {parsedLabs.map((lab, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center py-1.5 border-b border-[#1e293b] last:border-0"
                >
                  <span className="text-[12px] text-[#e2e8f0]">{lab.test_name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[12px] font-semibold"
                      style={{
                        color: lab.status === "high" ? "#ef4444" : lab.status === "low" ? "#3b82f6" : "#10b981",
                      }}
                    >
                      {lab.result_value} {lab.unit}
                    </span>
                    {lab.validation === "suspect" && (
                      <span className="text-[9px] text-[#f59e0b]">⚠</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={confirmAndStore}
                  className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#10b981] text-white hover:brightness-110 transition-all flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Correct — Store
                </button>
                <button
                  onClick={cancel}
                  className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#334155] text-[#94a3b8] hover:brightness-110 transition-all flex items-center justify-center gap-1"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="px-4 py-3">
              <div className="text-[12px] text-[#ef4444]">{errorMsg}</div>
              <button
                onClick={cancel}
                className="mt-2 w-full py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#334155] text-[#94a3b8] hover:brightness-110 transition-all"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Stored confirmation */}
          {status === "stored" && (
            <div className="px-4 py-3 text-center">
              <div className="text-[13px] text-[#10b981] font-medium">
                {parsedLabs.length} lab value{parsedLabs.length > 1 ? "s" : ""} stored in your digital twin.
              </div>
            </div>
          )}

          {/* Listening hint */}
          {status === "listening" && !transcript && (
            <div className="px-4 py-3">
              <div className="text-[12px] text-[#64748b]">
                Say your lab results naturally:<br />
                <span className="text-[#94a3b8]">"A1C came back 5.8, cholesterol 210, hematocrit was 50"</span>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 30px rgba(239,68,68,0.8); }
        }
      `}</style>
    </>
  );
}

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
