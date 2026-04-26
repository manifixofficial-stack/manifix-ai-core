import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import "../styles/Gpt.css";

const API_BASE = "https://manifix.up.railway.app";

const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Hi 👋 How can I help you today?",
};

export default function Gpt() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("chatMessages");
      return saved ? JSON.parse(saved) : [defaultWelcome];
    } catch {
      return [defaultWelcome];
    }
  });

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const eventSourceRef = useRef(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });

    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ================= SPEECH RECOGNITION ================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
    };

    recognitionRef.current = rec;
  }, []);

  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Mic not supported");

    listening ? rec.stop() : rec.start();
  };

  /* ================= TEXT TO SPEECH ================= */
  const speak = (text) => {
    if (!window.speechSynthesis || !voiceOn) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    utter.rate = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  /* ================= STOP ================= */
  const stopGenerating = () => {
    eventSourceRef.current?.close();
    setGenerating(false);
  };

  /* ================= SEND ================= */
  const sendMessage = (text) => {
    if (!text.trim() || generating) return;

    setLastUserMessage(text);

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    const msgId = Date.now() + "-bot";

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: msgId, role: "assistant", content: "", streaming: true },
    ]);

    setInput("");
    setGenerating(true);

    eventSourceRef.current?.close();

    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(text)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    let fullText = "";

    eventSource.onmessage = (event) => {
      const chunk = event.data;

      if (chunk === "[DONE]") {
        eventSource.close();
        setGenerating(false);

        if (fullText.length < 300) speak(fullText);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, streaming: false } : m
          )
        );

        return;
      }

      fullText += chunk;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: fullText } : m
        )
      );
    };

    eventSource.onerror = () => {
      eventSource.close();
      setGenerating(false);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                content:
                  "⚠️ Connection issue. Please try again.",
                streaming: false,
              }
            : m
        )
      );
    };
  };

  /* ================= COPY ================= */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  /* ================= LOADING ================= */
  const loadingTexts = ["Thinking…", "Working on it…", "Generating…"];
  const randomLoading =
    loadingTexts[Math.floor(Math.random() * loadingTexts.length)];

  /* ================= UI ================= */
  return (
    <div className="gpt-container">

      <main className="chat-area" ref={chatRef}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`msg-row ${msg.role}`}
          >
            <div className={`msg-bubble ${msg.streaming ? "streaming" : ""}`}>

              {msg.streaming && !msg.content && (
                <div className="thinking">
                  {randomLoading}
                </div>
              )}

              <ReactMarkdown>{msg.content}</ReactMarkdown>

              {msg.streaming && <span className="cursor">|</span>}

              {msg.role === "assistant" && msg.content && !msg.streaming && (
                <div className="actions">
                  <button onClick={() => speak(msg.content)}>🔊</button>
                  <button onClick={() => copyText(msg.content)}>📋</button>
                  <button onClick={() => sendMessage(lastUserMessage)}>🔄</button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </main>

      <div className="input-area">
        <button onClick={handleMic}>
          {listening ? "🎙️" : "🎤"}
        </button>

        <button onClick={() => setVoiceOn((v) => !v)}>
          {voiceOn ? "🔊" : "🔇"}
        </button>

        <textarea
          value={input}
          placeholder="Message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />

        <button onClick={generating ? stopGenerating : () => sendMessage(input)}>
          {generating ? "Stop" : "➤"}
        </button>
      </div>
    </div>
  );
}
