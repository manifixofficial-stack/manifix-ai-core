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
    return saved ? JSON.parse(saved) : [defaultWelcome];
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
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, { message: msg });
      const replyText = response.data.reply || "Hmm… I have no response.";

      // Remove thinking message
      setMessages(prev => prev.filter(m => m.id !== thinkingMsg.id));

      // Typing animation
      let idx = 0;
      const replyMsg = {
        content: "",
        role: "bot",
        id: Math.random().toString(36).substring(2),
        type: "text",
      };
      setMessages(prev => [...prev, replyMsg]);

      const interval = setInterval(() => {
        if (idx < replyText.length) {
          replyMsg.content += replyText[idx];
          setMessages(prev => [
            ...prev.filter(m => m.id !== replyMsg.id),
            { ...replyMsg },
          ]);
          idx++;
        } else {
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
                    children={msg.content}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            children={String(children).replace(/\n$/, "")}
                            {...props}
                          />
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  />
                  <div className="message-actions">
                    <button className="copy-msg" onClick={() => copyMessage(msg.content)} title="Copy">📋</button>
                    <button className="share-msg" onClick={() => shareMessage(msg.content)} title="Share">🔗</button>
                    <button className="delete-msg" onClick={() => deleteMessage(msg.id)} title="Delete">🗑️</button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="gpt-footer">
        <button onClick={handleMic} className={listening ? "recording" : ""} aria-label={listening ? "Stop Recording" : "Start Recording"}>
          {listening ? "🛑" : "🎤"}
        </button>

        <textarea
          rows={1}
          style={{ resize: "none", overflowY: "hidden" }}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Your ManifiX Anything…"
          aria-label="Chat input"
        />

        <label className="upload-btn" aria-label="Upload File">
          📎
          <input type="file" onChange={handleUpload} disabled={uploading} />
        </label>

        <button
          onClick={() => sendMessage(input.trim())}
          disabled={!input.trim()}
          className="primary"
          aria-label="Send"
        >
          ➤
        </button>

        <button className="toggle-voice" onClick={() => setVoiceEnabled((prev) => !prev)} aria-label="Toggle Voice">
          {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
        </button>
      </footer>
    </div>
  );
}
