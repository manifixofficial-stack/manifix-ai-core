// src/pages/Gpt.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/Gpt.css";
import Icons from "../assets/icons";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";

// Toast Component
const Toast = ({ message, onClose }) => (
  <div className="toast">
    {message}
    <button onClick={onClose} aria-label="Close Notification">×</button>
  </div>
);

const API_BASE = "https://manifix.up.railway.app";

export default function Gpt() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");
  const chatContainer = useRef(null);
  const recognitionRef = useRef(null);
  const ttsRef = useRef(null);

  // -------------------- Speech Recognition --------------------
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
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
    }
  }, [voiceEnabled]);

  // -------------------- Scroll & Persist --------------------
  useEffect(() => {
    if (chatContainer.current) {
      chatContainer.current.scrollTo({ top: chatContainer.current.scrollHeight, behavior: "smooth" });
    }
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // -------------------- TTS --------------------
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

  const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // -------------------- Toast --------------------
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  // -------------------- Mic --------------------
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return showToast("STT not supported on this device");
    listening ? rec.stop() : rec.start();
  };

  // -------------------- Send Message --------------------
  const sendMessage = async (msg, isFile = false) => {
    if (!msg) return;
    stopSpeaking();

    const userMsg = { content: msg, role: "user", timestamp: Date.now(), type: isFile ? "file" : "text" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const thinkingMsg = { content: "ManifiX is thinking...", role: "bot", type: "thinking", timestamp: Date.now() };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, { message: msg }, { timeout: 15000 });
      const replyText = response.data.reply || "I’m here with you 🤍";

      setMessages(prev => prev.filter(m => m.timestamp !== thinkingMsg.timestamp));

      // Typing animation
      let idx = 0;
      const replyMsg = { content: "", role: "bot", timestamp: Date.now(), type: "text" };
      setMessages(prev => [...prev, replyMsg]);

      const interval = setInterval(() => {
        if (idx < replyText.length) {
          replyMsg.content += replyText[idx];
          setMessages(prev => [...prev.filter(m => m.timestamp !== replyMsg.timestamp), replyMsg]);
          idx++;
        } else {
          clearInterval(interval);
          speak(replyText);
        }
      }, 25);
    } catch {
      setMessages(prev => prev.filter(m => m.timestamp !== thinkingMsg.timestamp));
      const errorMsg = "❌ Backend not reachable. Try again.";
      setMessages(prev => [...prev, { content: errorMsg, role: "bot", type: "text", timestamp: Date.now() }]);
      showToast(errorMsg);
      if (voiceEnabled) speak(errorMsg);
    }
  };

  // -------------------- File Upload --------------------
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/api/upload`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      const fileUrl = res.data.url;
      sendMessage(fileUrl, true);
    } catch {
      showToast("❌ File upload failed");
      if (voiceEnabled) speak("File upload failed");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // -------------------- Enter Key --------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.trim());
    }
  };

  // -------------------- Markdown Renderer --------------------
  const renderers = {
    code({ language, value }) {
      return <SyntaxHighlighter style={oneDark} language={language} children={value} />;
    }
  };

  return (
    <div
      className="gpt-app theme-purple"
      style={{ backgroundImage: `url(${backgroundPurple})`, backgroundSize: "cover" }}
    >
      {toast && <Toast message={toast} onClose={() => setToast("")} />}

      <header className="gpt-header">
        <img src={Icons.chat} alt="ManifiX Logo" className="gpt-logo" />
        <h1>ManifiX</h1>
      </header>

      <main className="gpt-main" ref={chatContainer}>
        {messages.map(msg => (
          <div key={msg.timestamp} className={`message-row ${msg.role}`}>
            <div className="message-bubble fade-in">
              {msg.isFile ? (
                <a href={msg.content} target="_blank" rel="noopener noreferrer" className="file-link">
                  📎 {msg.content.split("/").pop()}
                </a>
              ) : msg.type === "thinking" ? (
                <div role="status" aria-live="polite" className="typing-indicator">
                  {msg.content}<span className="dots">...</span>
                </div>
              ) : (
                <ReactMarkdown
                  children={msg.content}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          children={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>{children}</code>
                      );
                    }
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </main>

      <footer className="gpt-footer">
        <button id="micBtn" onClick={handleMic} className={listening ? "recording" : ""} aria-label={listening ? "Stop Recording" : "Start Recording"}>
          <img src={listening ? Icons.stop : Icons.mic} alt="Mic Icon" />
        </button>

        <textarea
          rows={1}
          style={{ resize: "none", overflowY: "hidden" }}
          value={input}
          onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Your ManifiX Anything…"
          aria-label="Chat input"
        />

        <label className="upload-btn" aria-label="Upload File">
          📎
          <input type="file" onChange={handleUpload} disabled={uploading} />
        </label>

        <button onClick={() => sendMessage(input.trim())} disabled={!input.trim()} className="primary" aria-label="Send Message">
          <img src={Icons.send} alt="Send" />
        </button>

        <button className="toggle-voice" onClick={() => setVoiceEnabled(prev => !prev)} aria-label="Toggle Voice">
          {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
        </button>
      </footer>
    </div>
  );
}
