// src/pages/Gpt.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

import "../styles/Gpt.css";

/* ================= CONFIG ================= */
const API_BASE = "https://manifix.up.railway.app";

/* ================= DEFAULT ================= */
const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Hey 👋 I’m ManifiX… I’m here with you ✨",
};

/* ================= COMPONENT ================= */
export default function Gpt() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [defaultWelcome];
  });

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechRef = useRef(null);

  /* ================= SCROLL ================= */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });

    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

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

  /* ================= TTS ================= */
  const speak = (text) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";

    speechRef.current = utter;
    window.speechSynthesis.speak(utter);
  };

  /* ================= DELAY ================= */
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  /* ================= SEND ================= */
  const sendMessage = async (text) => {
    if (!text.trim() || generating) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    const thinkingId = "thinking";

    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "assistant", type: "thinking" },
    ]);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: text,
      });

      const reply = res.data.reply || "No response.";

      await delay(500);

      let current = "";
      const id = Date.now();

      setMessages((prev) =>
        prev.filter((m) => m.id !== thinkingId).concat({
          id,
          role: "assistant",
          content: "",
        })
      );

      for (let char of reply) {
        current += char;
        await delay(10);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, content: current } : m
          )
        );
      }

      speak(reply);

    } catch (err) {
      console.log("FRONTEND ERROR:", err.response?.data || err.message);

      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: Date.now(),
            role: "assistant",
            content: "⚠️ Connection issue. Try again.",
          })
      );
    }

    setGenerating(false);
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

              {msg.type === "thinking" ? (
                <div className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}

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
          ➤
        </button>

      </div>
    </div>
  );
}
