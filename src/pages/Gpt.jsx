import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { motion } from "framer-motion";

import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import Header from "../components/Header";

const API_BASE = "https://manifix.up.railway.app";

/* ---------------- Default ---------------- */
const defaultWelcome = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "Hey 👋 I’m ManifiX… I’m here with you ✨",
  type: "text",
};

/* ---------------- Helpers ---------------- */
const createMessage = (role, content, type = "text") => ({
  id: crypto.randomUUID(),
  role,
  content,
  type,
});

/* ---------------- Component ---------------- */
export default function Gpt({ userId }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`chat_${userId}`);
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

  /* ---------------- Speech (STT) ---------------- */
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

    localStorage.setItem(`chat_${userId}`, JSON.stringify(messages));
  }, [messages, userId]);

  /* ---------------- TTS ---------------- */
  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    speechSynthesis.speak(utter);
  };

  /* ---------------- Emotion Detection ---------------- */
  const detectEmotion = (text) => {
    const t = text.toLowerCase();

    if (t.includes("sad") || t.includes("tired")) return "soft";
    if (t.includes("angry") || t.includes("hate")) return "calm";
    if (t.includes("happy") || t.includes("win")) return "excited";

    return "normal";
  };

  /* ---------------- Send Message (STREAMING) ---------------- */
  const sendMessage = (text) => {
    if (!text.trim() || generating) return;

    const userMsg = createMessage("user", text);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    const emotion = detectEmotion(text);

    const botMsg = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      type: "text",
    };

    setMessages((prev) => [...prev, botMsg]);

    /* STREAM */
    const eventSource = new EventSource(
      `${API_BASE}/api/chat-stream?message=${encodeURIComponent(text)}&emotion=${emotion}`
    );

    window.currentStream = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
        window.currentStream = null;
        setGenerating(false);

        // Speak final message
        setTimeout(() => {
          const finalText = botMsg.content;
          if (finalText) speak(finalText);
        }, 200);

        return;
      }

      /* Streaming append */
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsg.id
            ? { ...m, content: m.content + event.data }
            : m
        )
      );
    };

    eventSource.onerror = () => {
      eventSource.close();
      setGenerating(false);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsg.id
            ? { ...m, content: "⚠️ Connection lost" }
            : m
        )
      );
    };
  };

  /* ---------------- Stop ---------------- */
  const stopGenerating = () => {
    if (window.currentStream) {
      window.currentStream.close();
      window.currentStream = null;
    }
    setGenerating(false);
  };

  /* ---------------- Mic ---------------- */
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Mic not supported");
    listening ? rec.stop() : rec.start();
  };

  /* ---------------- UI ---------------- */
  return (
    <div
      className="gpt-app"
      style={{
        backgroundImage: `url(${backgroundPurple})`,
        backgroundSize: "cover",
      }}
    >
      <Header
        onNewChat={() => {
          localStorage.removeItem(`chat_${userId}`);
          setMessages([defaultWelcome]);
        }}
      />

      <div ref={chatRef} className="chat-window">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            className={`message-row ${msg.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="message-bubble">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
              >
                {msg.content || "…"}
              </ReactMarkdown>
            </div>
          </motion.div>
        ))}
      </div>

      <footer className="chat-footer">
        <button onClick={handleMic}>
          {listening ? "🎙️" : "🎤"}
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
