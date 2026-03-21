// src/pages/Gpt.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion } from "framer-motion";

import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import micIcon from "../assets/mic.png";
import Header from "../components/Header";

const API_BASE = "https://manifix.up.railway.app";

/* ---------------- Default Message ---------------- */
const defaultWelcome = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "Hey 👋 I’m ManifiX. Ask me anything ✨",
  type: "text",
};

/* ---------------- Helpers ---------------- */
const createAssistantMessage = (text) => ({
  id: crypto.randomUUID(),
  role: "assistant",
  content: text,
  type: "text",
});

const createUserMessage = (text) => ({
  id: crypto.randomUUID(),
  role: "user",
  content: text,
  type: "text",
});

export default function Gpt({ userId }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chatMessages_${userId || "default"}`);
      return saved ? JSON.parse(saved) : [defaultWelcome];
    } catch {
      return [defaultWelcome];
    }
  });

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  /* ---------------- Speech ---------------- */
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

  /* ---------------- Scroll + Save ---------------- */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });

    localStorage.setItem(
      `chatMessages_${userId || "default"}`,
      JSON.stringify(messages)
    );
  }, [messages, userId]);

  /* ---------------- Send Message ---------------- */
  const sendMessage = async (text) => {
    if (!text.trim() || generating) return;

    const userMsg = createUserMessage(text);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const thinkingId = Date.now();

    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        role: "assistant",
        content: "Thinking...",
        type: "thinking",
      },
    ]);

    setGenerating(true);

    try {
      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: text,
      });

      const reply = res.data.reply;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId ? createAssistantMessage(reply) : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? createAssistantMessage("❌ Server error")
            : m
        )
      );
    }

    setGenerating(false);
  };

  /* ---------------- Stop ---------------- */
  const stopGenerating = () => {
    setGenerating(false);
    setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
  };

  /* ---------------- Upload ---------------- */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const tempId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "assistant", content: "Uploading...", type: "thinking" },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_BASE}/api/upload`, formData);
      const url = res.data.url;

      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: url,
          type: "image",
        },
      ]);

      sendMessage(url);
    } catch {
      alert("Upload failed");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }

    setUploading(false);
  };

  /* ---------------- Mic ---------------- */
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Not supported");
    listening ? rec.stop() : rec.start();
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="gpt-app" style={{ backgroundImage: `url(${backgroundPurple})` }}>
      <Header
        onNewChat={() => {
          localStorage.clear();
          setMessages([defaultWelcome]);
        }}
      />

      <div ref={chatRef} className="chat-window">
        {messages.map((msg) => (
          <motion.div key={msg.id} className={`message-row ${msg.role}`}>
            <div className="message-bubble">
              {msg.type === "image" ? (
                <img src={msg.content} alt="" />
              ) : msg.type === "thinking" ? (
                <i>{msg.content}</i>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="chat-footer">
        <button onClick={handleMic}>🎤</button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />

        <input type="file" onChange={handleUpload} />

        {!generating ? (
          <button onClick={() => sendMessage(input)}>Send</button>
        ) : (
          <button onClick={stopGenerating}>Stop</button>
        )}
      </footer>
    </div>
  );
}
