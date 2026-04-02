import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Gpt.css";

/* ================= CONFIG ================= */
const API_BASE = "https://manifix.up.railway.app";
const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Hey 👋 I’m ManifiX, I’m here with you ❤️",
  timestamp: new Date().toISOString(),
};

/* ================= COMPONENT ================= */
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

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  /* ================= STT (MIC) ================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
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
    utter.rate = 1;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  /* ================= DELAY ================= */
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (text) => {
    if (!text.trim() || generating) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    const thinkingId = Date.now() + "-thinking";
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "assistant", type: "thinking", timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await axios.post(
        `${API_BASE}/api/chat`,
        { message: text },
        { timeout: 55000 }
      );
      const reply = res.data?.reply || "Hmm… I couldn’t respond.";

      await delay(300);
      let current = "";
      const msgId = Date.now() + "-bot";

      setMessages((prev) =>
        prev.filter((m) => m.id !== thinkingId).concat({
          id: msgId,
          role: "assistant",
          content: "",
          timestamp: new Date().toISOString(),
        })
      );

      for (let char of reply) {
        current += char;
        await delay(10);
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, content: current } : m))
        );
      }

      if (reply.length < 200) speak(reply);
    } catch (err) {
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== thinkingId)
          .concat({
            id: Date.now(),
            role: "assistant",
            content:
              err.response?.data?.reply ||
              "⚠️ Server not responding. Try again.",
            timestamp: new Date().toISOString(),
          })
      );
    }
    setGenerating(false);
  };

  /* ================= COPY ================= */
  const copyText = (text) => navigator.clipboard.writeText(text);

  /* ================= UI ================= */
  return (
    <div className="gpt-container">

      {/* CHAT AREA */}
      <main className="chat-area" ref={chatRef}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`msg-row ${msg.role}`}
            >
              <div className="msg-avatar">
                {msg.role === "assistant" ? "🤖" : "🧑"}
              </div>

              <div className="msg-bubble">
                {msg.type === "thinking" ? (
                  <div className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
                {msg.role === "assistant" && msg.content && (
                  <button className="copy-btn" onClick={() => copyText(msg.content)}>Copy</button>
                )}
                <div className="msg-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* INPUT AREA */}
      <div className="input-area">
        <button onClick={handleMic} className={`mic-btn ${listening ? "active" : ""}`}>
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

        <button className="send-btn" onClick={() => sendMessage(input)}>
          {generating ? "..." : "➤"}
        </button>
      </div>
    </div>
  );
}
