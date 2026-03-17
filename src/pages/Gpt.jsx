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

// Base API
const API_BASE = "https://manifix.up.railway.app";

// Default system welcome
const defaultWelcome = {
  id: crypto.randomUUID(),
  role: "system",
  content: `You are ManifiX 2026 — an advanced conscious AI companion... (full system prompt)`,
  type: "text",
  timestamp: new Date().toISOString(),
};

// Helper to create assistant messages
const createAssistantMessage = (text) => ({
  id: crypto.randomUUID(),
  role: "assistant",
  content: text,
  type: "text",
  timestamp: new Date().toISOString(),
});

// Helper to create user messages
const createUserMessage = (text) => ({
  id: crypto.randomUUID(),
  role: "user",
  content: text,
  type: "text",
  timestamp: new Date().toISOString(),
});

export { API_BASE, defaultWelcome, createAssistantMessage, createUserMessage };

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
  const controllerRef = useRef(null);

/* ---------------- Speech Recognition ---------------- */
useEffect(() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) return;

  const rec = new SpeechRecognition();
  rec.lang = navigator.language || "en-US";
  rec.continuous = false;
  rec.interimResults = false;

  recognitionRef.current = rec;

  rec.onstart = () => setListening(true);
  rec.onend = () => setListening(false);

  rec.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();
    if (transcript) setInput(transcript);
  };

  rec.onerror = (err) => {
    console.error("Speech recognition error:", err);
    setListening(false);
  };

  return () => {
    rec.stop();
    recognitionRef.current = null;
  };
}, []);


/* ---------------- Auto-scroll & Persist ---------------- */
useEffect(() => {
  if (!chatRef.current) return;

  chatRef.current.scrollTo({
    top: chatRef.current.scrollHeight,
    behavior: "smooth",
  });

  try {
    localStorage.setItem(
      `chatMessages_${userId || "default"}`,
      JSON.stringify(messages)
    );
  } catch (err) {
    console.error("Failed to save chat messages:", err);
  }
}, [messages, userId]);


/* ---------------- Stream Cleanup ---------------- */
useEffect(() => {
  return () => {
    if (window.currentStream) {
      window.currentStream.close();
      window.currentStream = null;
    }
  };
}, []);


/* ---------------- Copy ---------------- */
const copyText = async (text) => {
  if (!navigator.clipboard) return;

  try {
    await navigator.clipboard.writeText(text);
    console.log("Copied ✅");
  } catch (err) {
    console.error("Copy failed:", err);
  }
};

  /* ---------------- Send Message ---------------- */
const sendMessage = (text) => {

if (!text.trim() || generating) return;

/* User message */
const userMsg = createUserMessage(text);
setMessages(prev => [...prev, userMsg]);
setInput("");

/* Thinking placeholder */
const thinkingId = `thinking-${Date.now()}`;

const thinkingMsg = {
id: thinkingId,
role: "assistant",
content: "ManifiX is thinking...",
type: "thinking",
timestamp: new Date().toISOString(),
};

setMessages(prev => [...prev, thinkingMsg]);
setGenerating(true);

/* Create assistant message */
const botMsg = {
id: `assistant-${Date.now()}`,
role: "assistant",
content: "",
type: "text",
timestamp: new Date().toISOString(),
};

/* Replace thinking with real message */
setMessages(prev =>
prev.map(msg =>
msg.id === thinkingId ? botMsg : msg
)
);

/* Streaming connection */
const eventSource = new EventSource(
`${API_BASE}/api/chat-stream?message=${encodeURIComponent(text)}`
);

window.currentStream = eventSource;

/* Receive tokens */
eventSource.onmessage = (event) => {

if (event.data === "[DONE]") {

eventSource.close();
window.currentStream = null;
setGenerating(false);
return;

}

/* Update message */
setMessages(prev =>
  prev.map(m =>
    m.id === botMsg.id
      ? { ...m, content: m.content + event.data }
      : m
  )
);

};

/* Error handling */
eventSource.onerror = (err) => {

console.error("Stream error:", err);

eventSource.close();
window.currentStream = null;
setGenerating(false);

const errorMsg = {
id: `assistant-error-${Date.now()}`,
role: "assistant",
content: "⚠️ ManifiX connection lost. Please try again.",
type: "error",
timestamp: new Date().toISOString(),
};

setMessages(prev => [...prev, errorMsg]);

};

};
  /* ---------------- Stop ---------------- */
const stopGenerating = () => {

  // Close streaming connection
  if (window.currentStream) {
    window.currentStream.close();
    window.currentStream = null;
  }

  // Cancel any axios request
  if (controllerRef.current) {
    controllerRef.current.abort();
    controllerRef.current = null;
  }

  // Remove thinking message
  setMessages((prev) => prev.filter((m) => m.type !== "thinking"));

  setGenerating(false);
  setListening(false);
  setUploading(false);

  console.log("Generation stopped.");
};

  /* ---------------- Regenerate ---------------- */
  const regenerate = () => {
    if (generating) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setMessages((prev) => prev.filter((m) => m.type !== "thinking"));
      sendMessage(lastUser.content);
      console.log("Regenerating:", lastUser.content);
    }
  };

  /* ---------------- Upload Image ---------------- */
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) return alert("Only JPG/PNG/GIF allowed.");
    if (file.size > 5 * 1024 * 1024) return alert("Max size 5MB.");

    setUploading(true);
    const uploadingId = `uploading-${Date.now()}`;
    const tempMsg = {
      id: uploadingId,
      role: "assistant",
      content: "Uploading image...",
      type: "thinking",
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.url;

      setMessages((prev) => prev.filter((m) => m.id !== uploadingId));

      const imgMsg = {
        id: `user-img-${Date.now()}`,
        role: "user",
        content: url,
        type: "image",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, imgMsg]);

      sendMessage(url);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== uploadingId));
      alert("Image upload failed.");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Mic ---------------- */
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Speech recognition not supported.");
    listening ? rec.stop() : rec.start();
  };

  /* ---------------- Render ---------------- */
  return (
    <div
      className="gpt-app"
      style={{
        backgroundImage: `url(${backgroundPurple})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Header
        onNewChat={() => {
          if (window.confirm("Start a new chat? This will clear messages.")) {
            localStorage.removeItem(`chatMessages_${userId || "default"}`);
            setMessages([defaultWelcome]);
            chatRef.current.scrollTop = 0;
          }
        }}
      />

      {/* Chat Window */}
      <div
        ref={chatRef}
        className="chat-window"
        style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`message-row ${msg.role}`}
            style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}
          >
            <div
              className="message-bubble"
              style={{
                maxWidth: "70%",
                backgroundColor: msg.role === "user" ? "#7c3aed33" : "#1e293b",
                color: msg.role === "user" ? "#000" : "#fff",
                padding: "10px 14px",
                borderRadius: "12px",
                wordBreak: "break-word",
                position: "relative",
              }}
            >
              {msg.type === "thinking" ? (
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontStyle: "italic" }}>
                  ManifiX is thinking...
                </motion.div>
              ) : msg.type === "image" ? (
                <img src={msg.content} alt="Upload" style={{ maxWidth: "100%", borderRadius: "8px" }} />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize]}
                  components={{
                    code({ inline, className, children }) {
                      const match = /language-(\w+)/.exec(className || "");
                      if (!inline && match) {
                        return (
                          <div style={{ position: "relative", margin: "12px 0" }}>
                            <button
                              onClick={() => copyText(children.toString())}
                              style={{ position: "absolute", top: 6, right: 6, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 }}
                            >
                              Copy
                            </button>
                            <SyntaxHighlighter style={oneDark} language={match[1]}>
                              {children}
                            </SyntaxHighlighter>
                          </div>
                        );
                      }
                      return <code style={{ background: "#e5e7eb", padding: "2px 4px", borderRadius: 4, fontFamily: "monospace" }}>{children}</code>;
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}

              {msg.role === "assistant" && msg.type !== "thinking" && (
                <button
                  onClick={() => copyText(msg.content)}
                  style={{ marginTop: 6, fontSize: 12, padding: "2px 6px", borderRadius: 4, cursor: "pointer", backgroundColor: "#7c3aed", color: "#fff", border: "none" }}
                >
                  Copy
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <footer style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, backgroundColor: "#f3f4f6", borderTop: "1px solid #ddd" }}>
        <button onClick={handleMic} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
          <img src={micIcon} alt="mic" style={{ width: 24, height: 24 }} />
        </button>

        <textarea
          value={input}
          placeholder="Ask ManifiX anything..."
         onChange={(e) => {
  setInput(e.target.value);
  e.target.style.height = "auto";
  e.target.style.height = e.target.scrollHeight + "px";
}}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #ccc", resize: "none" }}
        />

        <label style={{ cursor: "pointer" }}>
          📎
          <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
        </label>

        {!generating ? (
          <button onClick={() => sendMessage(input)} style={{ padding: "8px 12px", borderRadius: 6, backgroundColor: "#7c3aed", color: "#fff", border: "none", cursor: "pointer" }}>
            Send
          </button>
        ) : (
          <button onClick={stopGenerating} style={{ padding: "8px 12px", borderRadius: 6, backgroundColor: "#ef4444", color: "#fff", border: "none", cursor: "pointer" }}>
            Stop
          </button>
        )}

        <button onClick={regenerate} style={{ padding: "8px 12px", borderRadius: 6, backgroundColor: "#f59e0b", color: "#fff", border: "none", cursor: "pointer" }}>
          Regenerate
        </button>
      </footer>
    </div>
  );
}
