// src/pages/Gpt.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";

import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import micIcon from "../assets/mic.png";
import Header from "../components/Header";

const API_BASE = "https://manifix.up.railway.app";

/* ---------------- DEFAULT ---------------- */
const defaultWelcome = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "Hey 👋 I’m ManifiX… I’m here with you ✨",
  type: "text",
};

/* ---------------- HELPERS ---------------- */
const createMsg = (role, content) => ({
  id: crypto.randomUUID(),
  role,
  content,
  type: "text",
});

/* ================= COMPONENT ================= */
export default function Gpt({ userId }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chat_${userId || "default"}`);
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
  const eventRef = useRef(null);

  /* ---------------- SCROLL + SAVE ---------------- */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });

    localStorage.setItem(
      `chat_${userId || "default"}`,
      JSON.stringify(messages)
    );
  }, [messages]);

  /* ---------------- SPEECH ---------------- */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript;
      if (text) setInput(text);
    };

    recognitionRef.current = rec;

    return () => rec.stop();
  }, []);

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = (text) => {
    if (!text.trim() || generating) return;

    const userMsg = createMsg("user", text);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const botId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: botId, role: "assistant", content: "", type: "stream" },
    ]);

    setGenerating(true);

    const es = new EventSource(
      `${API_BASE}/api/chat-stream?message=${encodeURIComponent(text)}`
    );

    eventRef.current = es;

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        es.close();
        setGenerating(false);
        return;
      }

      // streaming append
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botId ? { ...m, content: m.content + event.data } : m
        )
      );
    };

    es.onerror = () => {
      es.close();
      setGenerating(false);

      setMessages((prev) => [
        ...prev,
        createMsg("assistant", "⚠️ Connection lost. Try again."),
      ]);
    };
  };

  /* ---------------- STOP ---------------- */
  const stopGenerating = () => {
    if (eventRef.current) {
      eventRef.current.close();
      eventRef.current = null;
    }
    setGenerating(false);
  };

  /* ---------------- MIC ---------------- */
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Mic not supported");
    listening ? rec.stop() : rec.start();
  };

  /* ================= UI ================= */
  return (
    <div
      className="gpt-app"
      style={{
        backgroundImage: `url(${backgroundPurple})`,
      }}
    >
      <Header
        onNewChat={() => {
          localStorage.clear();
          setMessages([defaultWelcome]);
        }}
      />

      {/* CHAT */}
      <div ref={chatRef} className="chat-window">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`message-row ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-bubble">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
      </div>

      {/* INPUT */}
      <footer className="chat-footer">
        <button onClick={handleMic}>
          <img src={micIcon} alt="mic" />
        </button>

        <textarea
          value={input}
          placeholder="Talk to ManifiX…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />

        {!generating ? (
          <button onClick={() => sendMessage(input)}>Send</button>
        ) : (
          <button onClick={stopGenerating}>Stop</button>
        )}
      </footer>
    </div>
  );
}
