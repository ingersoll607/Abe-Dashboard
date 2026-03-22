"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, Mic, MicOff, X, Check, Loader2, Volume2 } from "lucide-react";

interface ParsedValue {
  test_name: string;
  result_value: string;
  unit: string;
  status: string;
  flagged: boolean;
}

interface Message {
  role: "abe" | "mike";
  text: string;
  parsed?: ParsedValue[];
}

const INTERVIEWS = {
  health: {
    name: "Health Check-in",
    questions: [
      "When was your last doctor visit, and who did you see?",
      "Did you get any lab work done recently? If so, what were the key results?",
      "Any changes to your medications?",
      "How's your sleep been? Are you using the CPAP regularly?",
      "What's your blood pressure been running?",
      "Any new symptoms or health concerns?",
    ],
  },
  quick: {
    name: "Quick Update",
    questions: [
      "What happened today that I should know about?",
      "Anything coming up this week I should track?",
      "Any bills paid or financial changes?",
      "Anything else on your mind?",
    ],
  },
  vitals: {
    name: "Vitals Check",
    questions: [
      "What's your blood pressure today?",
      "What's your weight?",
      "How many hours of CPAP use last night?",
      "Any pain or discomfort to report?",
    ],
  },
  tax: {
    name: "Tax Prep Check-in",
    questions: [
      "Have you downloaded your 2025 W-2 from MyPay yet?",
      "Have you gotten your Robinhood 1099 for 2025? Any stocks sold this year?",
      "Did you take any money out of your TSP or retirement accounts this year?",
      "Any major medical expenses this year beyond insurance — prescriptions, procedures, equipment?",
      "Any charitable donations or gifts over five hundred dollars?",
      "Did you pay any property taxes on the Palisade or other vehicles?",
      "Any side income, freelance work, or cash payments received?",
      "Filing status — are you planning to file as married filing separately, or has anything changed with the divorce?",
    ],
  },
  estate: {
    name: "Estate Update",
    questions: [
      "Any updates on the Rogers estate? Heard from Gail Robinson or Jake Whitley?",
      "Any progress on the OPM survivor benefit?",
      "Any new creditor communications?",
      "Any updates on Dad's remaining admin tasks?",
    ],
  },
};

type InterviewType = keyof typeof INTERVIEWS;

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    // Try to pick a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Alex") || v.name.includes("Daniel"));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export default function InterviewMode() {
  const [isOpen, setIsOpen] = useState(false);
  const [interview, setInterview] = useState<InterviewType | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [pendingValues, setPendingValues] = useState<ParsedValue[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "parsing" | "speaking" | "confirming-inline" | "done">("idle");
  const [inlineParsed, setInlineParsed] = useState<Array<ParsedValue & { checked: boolean; editValue: string }>>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load voices
  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  const startInterview = useCallback(async (type: InterviewType) => {
    setInterview(type);
    setQuestionIndex(0);
    setMessages([]);
    setPendingValues([]);
    setStatus("speaking");

    const firstQ = INTERVIEWS[type].questions[0];
    setMessages([{ role: "abe", text: firstQ }]);
    setIsSpeaking(true);
    await speak(firstQ);
    setIsSpeaking(false);
    setStatus("idle");
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript("");
    setStatus("listening");
  }, []);

  const advanceToNextQuestion = useCallback(async () => {
    if (!interview) return;
    const nextIdx = questionIndex + 1;
    const questions = INTERVIEWS[interview].questions;

    if (nextIdx < questions.length) {
      setQuestionIndex(nextIdx);
      const nextQ = questions[nextIdx];
      setMessages(prev => [...prev, { role: "abe", text: nextQ }]);
      setStatus("speaking");
      await speak(nextQ);
      setStatus("idle");
    } else {
      const total = pendingValues.length;
      const endText = total > 0
        ? `Interview complete. ${total} data points captured and stored. Good session.`
        : "Interview complete. Thanks for the update.";
      setMessages(prev => [...prev, { role: "abe", text: endText }]);
      await speak(endText);
      setStatus("done");
    }
  }, [interview, questionIndex, pendingValues]);

  const approveInlineValues = useCallback(async () => {
    const approved = inlineParsed.filter(v => v.checked).map(v => ({ ...v, result_value: v.editValue }));
    if (approved.length > 0) {
      try {
        await fetch("http://localhost:3847/api/ingest-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer abe-open-brain-2026" },
          body: JSON.stringify({ labs: approved, source: "interview" }),
        });
        setPendingValues(prev => [...prev, ...approved]);
        const storedText = `Stored ${approved.length} value${approved.length > 1 ? "s" : ""}. Moving on.`;
        setMessages(prev => [...prev, { role: "abe", text: storedText }]);
        await speak(storedText);
      } catch {
        setMessages(prev => [...prev, { role: "abe", text: "Couldn't store — server may be down. Moving on." }]);
      }
    }
    setInlineParsed([]);
    await advanceToNextQuestion();
  }, [inlineParsed, advanceToNextQuestion]);

  const skipInlineValues = useCallback(async () => {
    setInlineParsed([]);
    setMessages(prev => [...prev, { role: "abe", text: "Skipped. Moving on." }]);
    await speak("Skipped. Moving on.");
    await advanceToNextQuestion();
  }, [advanceToNextQuestion]);

  const stopAndProcess = useCallback(async () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);

    if (!transcript.trim() || !interview) return;

    // Add Mike's response to chat
    setMessages(prev => [...prev, { role: "mike", text: transcript }]);
    setStatus("parsing");

    // Parse for structured data
    try {
      const res = await fetch("http://localhost:3847/api/ingest-text", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer abe-open-brain-2026" },
        body: JSON.stringify({ text: transcript, source: "interview" }),
      });
      const data = await res.json();

      if (data.parsed && data.parsed.length > 0) {
        // Abe acknowledges conversationally
        const names = data.parsed.map((p: ParsedValue) => `${p.test_name} at ${p.result_value}`).join(", ");
        const ackText = `I heard ${names}. Check the values below and approve what's correct.`;
        setMessages(prev => [...prev, { role: "abe", text: ackText, parsed: data.parsed }]);
        await speak(`I heard ${names}. Please review and approve.`);

        // Show editable inline confirmation
        setInlineParsed(data.parsed.map((p: ParsedValue) => ({ ...p, checked: true, editValue: p.result_value })));
        setStatus("confirming-inline");
        setTranscript("");
        return; // Don't advance to next question yet
      }
    } catch {
      // Server not running — still continue the interview
    }

    // No values found — move to next question
    await advanceToNextQuestion();
    setTranscript("");
  }, [transcript, interview, questionIndex, pendingValues]);

  const storeAll = useCallback(async () => {
    if (pendingValues.length === 0) return;
    try {
      await fetch("http://localhost:3847/api/ingest-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer abe-open-brain-2026" },
        body: JSON.stringify({ labs: pendingValues, source: "interview" }),
      });
      const stored = `Stored ${pendingValues.length} values in your digital twin.`;
      setMessages(prev => [...prev, { role: "abe", text: stored }]);
      await speak(stored);
      setPendingValues([]);
    } catch {
      setMessages(prev => [...prev, { role: "abe", text: "Could not store — server may be down." }]);
    }
  }, [pendingValues]);

  const close = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis?.cancel();
    setIsOpen(false);
    setInterview(null);
    setMessages([]);
    setTranscript("");
    setPendingValues([]);
    setStatus("idle");
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          boxShadow: "0 0 20px rgba(16,185,129,0.3)",
        }}
      >
        <MessageCircle size={22} color="white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[380px] h-[500px] bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} color="#10b981" />
          <span className="text-[13px] font-semibold text-[#e2e8f0]">
            {interview ? INTERVIEWS[interview].name : "Interview Mode"}
          </span>
          {isSpeaking && <Volume2 size={12} color="#10b981" className="animate-pulse" />}
        </div>
        <button onClick={close} className="text-[#64748b] hover:text-[#94a3b8] bg-transparent border-none cursor-pointer">
          <X size={14} />
        </button>
      </div>

      {/* Interview selector or chat */}
      {!interview ? (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="text-[12px] text-[#94a3b8] mb-4">
            Choose an interview type. Abe will ask questions and you respond by voice.
          </div>
          {(Object.entries(INTERVIEWS) as [InterviewType, typeof INTERVIEWS[InterviewType]][]).map(([key, iv]) => (
            <button
              key={key}
              onClick={() => startInterview(key)}
              className="w-full text-left mb-2 px-4 py-3 rounded-lg border-none cursor-pointer transition-all hover:brightness-125 bg-[#1e1e2e] border border-[#334155]"
              style={{ border: "1px solid #334155" }}
            >
              <div className="text-[13px] font-semibold text-[#e2e8f0]">{iv.name}</div>
              <div className="text-[10px] text-[#64748b] mt-1">{iv.questions.length} questions</div>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "abe" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className="max-w-[80%] px-3 py-2 rounded-lg text-[12px] leading-relaxed"
                  style={{
                    background: msg.role === "abe" ? "#1e293b" : "rgba(99,102,241,0.2)",
                    color: msg.role === "abe" ? "#e2e8f0" : "#c7d2fe",
                  }}
                >
                  {msg.text}
                  {msg.parsed && msg.parsed.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-[#334155]">
                      {msg.parsed.map((p, j) => (
                        <div key={j} className="text-[10px]" style={{ color: p.flagged ? "#fbbf24" : "#10b981" }}>
                          {p.test_name}: {p.result_value} {p.unit}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live transcript */}
            {isListening && transcript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] px-3 py-2 rounded-lg text-[12px] bg-[rgba(99,102,241,0.1)] text-[#94a3b8] italic">
                  {transcript}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="px-4 py-3 border-t border-[#1e293b] shrink-0">
            {status === "confirming-inline" && inlineParsed.length > 0 ? (
              <div>
                <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-2">Review & Edit:</div>
                {inlineParsed.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <input
                      type="checkbox"
                      checked={v.checked}
                      onChange={() => setInlineParsed(prev => prev.map((p, j) => j === i ? { ...p, checked: !p.checked } : p))}
                      className="w-3.5 h-3.5 accent-[#6366f1]"
                    />
                    <span className="text-[11px] text-[#94a3b8] w-24 shrink-0">{v.test_name}</span>
                    <input
                      type="text"
                      value={v.editValue}
                      onChange={(e) => setInlineParsed(prev => prev.map((p, j) => j === i ? { ...p, editValue: e.target.value } : p))}
                      className="flex-1 bg-[#1e293b] border border-[#334155] rounded px-2 py-1 text-[12px] text-[#e2e8f0] outline-none focus:border-[#6366f1]"
                    />
                    <span className="text-[10px] text-[#64748b]">{v.unit}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={approveInlineValues} className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#10b981] text-white flex items-center justify-center gap-1">
                    <Check size={14} /> Approve & Store
                  </button>
                  <button onClick={skipInlineValues} className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#334155] text-[#94a3b8] flex items-center justify-center gap-1">
                    <X size={14} /> Skip
                  </button>
                </div>
              </div>
            ) : status === "done" && pendingValues.length > 0 ? (
              <div className="flex gap-2">
                <button
                  onClick={storeAll}
                  className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#10b981] text-white flex items-center justify-center gap-1"
                >
                  <Check size={14} /> Store {pendingValues.length} values
                </button>
                <button
                  onClick={close}
                  className="flex-1 py-2 rounded-lg border-none cursor-pointer text-[12px] font-semibold bg-[#334155] text-[#94a3b8] flex items-center justify-center gap-1"
                >
                  <X size={14} /> Discard
                </button>
              </div>
            ) : (
              <button
                onClick={isListening ? stopAndProcess : startListening}
                disabled={status === "parsing" || status === "speaking"}
                className="w-full py-2.5 rounded-lg border-none cursor-pointer text-[12px] font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{
                  background: isListening
                    ? "linear-gradient(135deg, #ef4444, #dc2626)"
                    : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "white",
                }}
              >
                {status === "parsing" ? (
                  <><Loader2 size={14} className="animate-spin" /> Processing...</>
                ) : isListening ? (
                  <><MicOff size={14} /> Stop & Send</>
                ) : (
                  <><Mic size={14} /> Hold to Respond</>
                )}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
