import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

import "../styles/Gpt.css";

/* ================= CONFIG ================= */
const API_BASE = "https://manifix.up.railway.app";

/* ================= DEFAULT ================= */
const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Hey 👋 I’m ManifiX, I’m here with you ❤️",
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

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const eventSourceRef = useRef(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });

    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  /* ================= STT ================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

    recognitionRef.current = rec;
  }, []);

  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Mic not supported");
    listening ? rec.stop() : rec.start();
  };

  /* ================= TTS ================= */
  const speak = (text) => {
    if (!window.speechSynthesis) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  /* ================= SEND MESSAGE (STREAM) ================= */
  const sendMessage = (text) => {
    if (!text.trim() || generating) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    const msgId = Date.now() + "-bot";

    /* Create empty assistant message */
    setMessages((prev) => [
      ...prev,
      { id: msgId, role: "assistant", content: "" }
    ]);

    /* Close previous stream */
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

        if (fullText.length < 200) speak(fullText);
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
            ? { ...m, content: "⚠️ Connection lost. Try again." }
            : m
        )
      );
    };
  };

  /* ================= COPY ================= */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  /* ================= UI ================= */
  return (
    <div className="gpt-container">

      {/* CHAT */}
      <main className="chat-area" ref={chatRef}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`msg-row ${msg.role}`}
          >
            <div className="msg-bubble">

              {msg.role === "assistant" && msg.content && (
                <button
                  className="copy-btn"
                  onClick={() => copyText(msg.content)}
                >
                  Copy
                </button>
              )}

              <ReactMarkdown>{msg.content}</ReactMarkdown>

            </div>
          </motion.div>
        ))}
      </main>

      {/* INPUT */}
      <div className="input-area">

        <button onClick={handleMic} className="mic-btn">
          {listening ? "🎙️" : "🎤"}
        </button>

        <textarea
          value={input}
          placeholder="Talk to ManifiX..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />

        <button
          className="send-btn"
          onClick={() => sendMessage(input)}
        >
          {generating ? "..." : "➤"}
        </button>

      </div>
    </div>
  );
}
