// src/pages/Gpt.jsx

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import Header from "../components/Header";

const API_BASE = "https://manifixai.com";

// Default welcome message (shown in UI only)
const defaultWelcome = {
  id: "welcome",
  role: "bot",
  type: "text",
  content: "Hii ❤️ I’m ManifiX, I’m here with you ✨",
};

// Toast notification
const Toast = ({ message, onClose, retry }) => (
  <div className="toast">
    <span>{message}</span>
    {retry && <button onClick={retry} className="retry-btn">↻ Retry</button>}
    <button onClick={onClose}>×</button>
  </div>
);

export default function Gpt() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    if (!saved) return [defaultWelcome];

    const parsed = JSON.parse(saved).filter((m) => m.id !== "welcome");
    return [defaultWelcome, ...parsed];
  });

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [retryMsg, setRetryMsg] = useState(null);

  const chatContainer = useRef(null);
  const recognitionRef = useRef(null);

  // ---------------- Scroll + Save ----------------
  useEffect(() => {
    if (chatContainer.current) {
      chatContainer.current.scrollTo({
        top: chatContainer.current.scrollHeight,
        behavior: "smooth",
      });
    }
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // ---------------- Speech Recognition ----------------
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.continuous = false;
    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.onerror = () => {
      setListening(false);
      showToast("Speech recognition error");
    };
    rec.onend = () => setListening(false);
  }, []);

  const showToast = (msg, retry = null) => {
    setToast(msg);
    setRetryMsg(() => retry);
    setTimeout(() => setToast(""), 4000);
  };

  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";
    window.speechSynthesis.speak(utter);
  };

  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return showToast("Voice not supported");
    listening ? rec.stop() : rec.start();
  };

  const copyMessage = (text) => { navigator.clipboard.writeText(text); showToast("Copied"); };
  const deleteMessage = (id) => { setMessages((prev) => prev.filter((m) => m.id !== id)); };
  const shareMessage = (text) => { navigator.share?.({ text }).catch(() => copyMessage(text)); };

  // ---------------- Send Message ----------------
  const sendMessage = async (msg, isFile = false) => {
    if (!msg) return;

    const userMsg = { id: crypto.randomUUID(), role: "user", type: isFile ? "file" : "text", content: msg };
    const thinkingMsg = { id: crypto.randomUUID(), role: "bot", type: "thinking", content: "ManifiX is thinking..." };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setInput("");

    try {
      // Remove default welcome before sending
      const conversation = [...messages, userMsg]
        .filter((m) => m.id !== "welcome") // <--- REMOVE default welcome
        .slice(-12)
        .map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content }));

      const res = await axios.post(`${API_BASE}/api/chat`, { message: msg, conversation });
      const replyText = res.data.reply || res.data.choices?.[0]?.message?.content || "Hmm… I have no response.";

      // Remove thinking message
      setMessages((prev) => prev.filter((m) => m.id !== thinkingMsg.id));

      // Add bot reply with typing effect
      const replyMsg = { id: crypto.randomUUID(), role: "bot", type: "text", content: "" };
      setMessages((prev) => [...prev, replyMsg]);

      let i = 0;
      const interval = setInterval(() => {
        i++;
        const partial = replyText.slice(0, i);
        setMessages((prev) => prev.map((m) => m.id === replyMsg.id ? { ...m, content: partial } : m));
        if (i >= replyText.length) {
          clearInterval(interval);
          if (voiceEnabled) speak(replyText);
        }
      }, 15);

    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== thinkingMsg.id),
        { id: crypto.randomUUID(), role: "bot", type: "text", content: "❌ Server error. Try again." },
      ]);
    }
  };

  // ---------------- Upload ----------------
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/api/upload`, form);
      sendMessage(res.data.url, true);
    } catch {
      showToast("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ---------------- Render ----------------
  return (
    <div className="gpt-app theme-purple" style={{ backgroundImage: `url(${backgroundPurple})` }}>
      {toast && <Toast message={toast} onClose={() => setToast("")} retry={retryMsg} />}

      <Header onNewChat={() => { localStorage.removeItem("chatMessages"); setMessages([defaultWelcome]); }} />

      <main className="gpt-main" ref={chatContainer}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            <div className="message-bubble">
              {msg.type === "thinking" ? (
                <div className="typing-indicator">{msg.content}<span className="dots">...</span></div>
              ) : msg.type === "file" ? (
                <a href={msg.content} target="_blank" rel="noreferrer">📎 {msg.content.split("/").pop()}</a>
              ) : (
                <>
                  <ReactMarkdown components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>{String(children).replace(/\n$/, "")}</SyntaxHighlighter> : <code {...props}>{children}</code>;
                    },
                  }}>{msg.content}</ReactMarkdown>

                  {msg.role === "bot" && (
                    <div className="message-actions">
                      <button onClick={() => copyMessage(msg.content)}>📋</button>
                      <button onClick={() => shareMessage(msg.content)}>🔗</button>
                      <button onClick={() => deleteMessage(msg.id)}>🗑️</button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </main>

      <footer className="gpt-footer">
        <button onClick={handleMic} className={listening ? "recording" : ""}>{listening ? "🛑" : "🎤"}</button>
        <textarea value={input} placeholder="Ask Your ManifiX Anything…" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input.trim()); } }} />
        <label className="upload-btn">📎<input type="file" onChange={handleUpload} disabled={uploading} /></label>
        <button className="primary" onClick={() => sendMessage(input.trim())} disabled={!input.trim()}>➤</button>
        <button onClick={() => setVoiceEnabled((v) => !v)}>{voiceEnabled ? "🔊" : "🔇"}</button>
      </footer>
    </div>
  );
}
