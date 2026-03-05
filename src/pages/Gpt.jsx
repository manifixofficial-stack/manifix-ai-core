// src/pages/Gpt.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import Header from "../components/Header";

// Toast Component
const Toast = ({ message, onClose, retry }) => (
  <div className="toast">
    <span>{message}</span>
    {retry && (
      <button onClick={retry} className="retry-btn" aria-label="Retry">
        ↻ Retry
      </button>
    )}
    <button onClick={onClose} aria-label="Close Notification">
      ×
    </button>
  </div>
);

const API_BASE = "https://manifix.up.railway.app";

const defaultWelcome = {
  content: `Hii ❤️ I’m ManifiX, I’m here with you ✨`,
  role: "bot",
  id: "welcome",
  type: "text",
};

export default function Gpt() {
const [messages, setMessages] = useState(() => {
  const saved = localStorage.getItem("chatMessages");

  if (!saved) return [defaultWelcome];

  let parsed = JSON.parse(saved);

  parsed = parsed.filter(m => m.id !== "welcome");

  return [defaultWelcome, ...parsed];
});
  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const [retryMsg, setRetryMsg] = useState(null);

  const chatContainer = useRef(null);
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);

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
    rec.onerror = (e) => {
      setListening(false);
      showToast(`STT Error: ${e.error}`);
      if (voiceEnabled) speak(`Speech recognition failed. ${e.error}`);
    };
    rec.onend = () => setListening(false);
  }, [voiceEnabled]);

  // ---------------- Scroll & Persist ----------------
  useEffect(() => {
    if (chatContainer.current) {
      chatContainer.current.scrollTo({ top: chatContainer.current.scrollHeight, behavior: "smooth" });
    }
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // ---------------- Text-to-Speech ----------------
  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    ttsRef.current = utterance;
  };
  const stopSpeaking = () => window.speechSynthesis?.cancel();

  // ---------------- Toast ----------------
  const showToast = (msg, retryFn = null) => {
    setToast(msg);
    setRetryMsg(() => retryFn);
    setTimeout(() => setToast(""), 5000);
  };

  // ---------------- Mic ----------------
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return showToast("STT not supported");
    listening ? rec.stop() : rec.start();
  };

  // ---------------- Copy / Share / Delete ----------------
  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    showToast("✅ Copied to clipboard");
  };
  const deleteMessage = (id) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    showToast("🗑️ Message deleted");
  };
  const shareMessage = (text) => {
    navigator.share?.({ text }).catch(() => {
      copyMessage(text);
      showToast("🔗 Copied link for sharing");
    });
  };

  // ---------------- Send Message ----------------
  const sendMessage = async (msg, isFile = false) => {
    if (!msg) return;
    stopSpeaking();

    const userMsg = {
      content: msg,
      role: "user",
      id: Math.random().toString(36).substring(2),
      type: isFile ? "file" : "text",
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const thinkingMsg = {
      content: "ManifiX is thinking...",
      role: "bot",
      type: "thinking",
      id: Math.random().toString(36).substring(2),
    };
   const replyMsg = {
  content: "",
  role: "bot",
  id: Math.random().toString(36).substring(2),
  type: "text"
};

setMessages(prev => [...prev, replyMsg]);

    try {
  const updatedMessages = [...messages, userMsg];

const conversation = updatedMessages
  .slice(-6)
  .filter(m => m.role === "user" || m.role === "bot")
  .filter(m => m.id !== "welcome")
  .map(m => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.content
  }));

const response = await axios.post(`${API_BASE}/api/chat`, {
  message: msg,
  conversation
});
      const replyText =
  response.data.reply ||
  response.data.choices?.[0]?.message?.content ||
  "Hmm… I have no response.";
      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));

     let idx = 0;

const interval = setInterval(() => {
  idx++;

  const partial = replyText.slice(0, idx);

  setMessages(prev =>
    prev.map(m =>
      m.id === replyMsg.id ? { ...m, content: partial } : m
    )
  );

  if (idx >= replyText.length) {
    clearInterval(interval);
    if (voiceEnabled) speak(replyText);
  }
}, 25);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.filter(m => m.id !== thinkingMsg.id),
        {
          content: "❌ Server Error. Please try again.",
          role: "bot",
          id: Math.random().toString(36).substring(2),
          type: "text",
        },
      ]);
      if (voiceEnabled) speak("❌ Server Error. Please try again.");
    }
  };

  // ---------------- File Upload ----------------
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendMessage(res.data.url, true);
    } catch {
      showToast("❌ File upload failed");
      if (voiceEnabled) speak("File upload failed");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // ---------------- Enter Key ----------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.trim());
    }
  };

  return (
    <div
      className="gpt-app theme-purple"
      style={{ backgroundImage: `url(${backgroundPurple})`, backgroundSize: "cover" }}
    >
      {toast && <Toast message={toast} onClose={() => setToast("")} retry={retryMsg} />}
      <Header
        onNewChat={() => {
          localStorage.removeItem("chatMessages");
          setMessages([defaultWelcome]);
        }}
      />

      {/* Chat Messages */}
      <main className="gpt-main" ref={chatContainer}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role}`}>
            <div className="message-bubble">
              {msg.type === "thinking" ? (
                <div role="status" aria-live="polite" className="typing-indicator">
                  {msg.content}<span className="dots">...</span>
                </div>
              ) : msg.type === "file" ? (
                <a href={msg.content} target="_blank" rel="noopener noreferrer" className="file-link">
                  📎 {msg.content.split("/").pop()}
                </a>
              ) : (
                <>
             <ReactMarkdown
  components={{
    code({ inline, className, children, ...props }) {

                        const match = /language-(\w+)/.exec(className || "");

                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  />

                  {msg.role === "bot" && (
                    <div className="message-actions">
                    <button aria-label="Copy message" onClick={() => copyMessage(msg.content)}>📋</button>
<button aria-label="Share message" onClick={() => shareMessage(msg.content)}>🔗</button>
<button aria-label="Delete message" onClick={() => deleteMessage(msg.id)}>🗑️</button>
                    </div>
                  )}

                </>
              )}

            </div>

          </div>

        ))}

      </main>

      <footer className="gpt-footer">

      <button
  onClick={handleMic}
  className={listening ? "recording" : ""}
  aria-label="Toggle microphone"
>
  {listening ? "🛑" : "🎤"}
</button>

        <textarea
          value={input}
          placeholder="Ask Your ManifiX Anything…"
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input.trim());
            }
          }}
        />

        <label className="upload-btn">
          📎
          <input type="file" onChange={handleUpload} disabled={uploading} />
        </label>

        <button onClick={() => sendMessage(input.trim())}>
          ➤
        </button>

        <button onClick={() => setVoiceEnabled(v => !v)}>
          {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
        </button>

      </footer>

    </div>
  );
}
