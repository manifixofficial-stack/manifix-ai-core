// src/pages/Gpt.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/Gpt.css";

import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";

// Icons
import uploadIcon from "../assets/upload.png";
import copyIcon from "../assets/copy.png";
import micIcon from "../assets/mic.png";
import shareIcon from "../assets/share.png";
import binIcon from "../assets/bin.png";

const API = "https://manifix.up.railway.app/api/chat";

export default function Gpt() {
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hi 👋 I'm ManifiX. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const chatRef = useRef(null);
  const controllerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    recognitionRef.current = rec;
  }, []);

  // Text-to-speech
  const speak = (text) => {
    if (!voice) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreaming(true);

    try {
      controllerRef.current = new AbortController();
      const res = await axios.post(API, { message: userMsg.content });
      const reply = res.data.reply || "No response";

      let i = 0;
      const botMsg = { id: Date.now() + 1, role: "assistant", content: "" };
      setMessages((prev) => [...prev, botMsg]);

      const interval = setInterval(() => {
        if (i < reply.length) {
          botMsg.content += reply[i];
          setMessages((prev) => [...prev.filter((m) => m.id !== botMsg.id), { ...botMsg }]);
          i++;
        } else {
          clearInterval(interval);
          setStreaming(false);
          setLoading(false);
          speak(reply);
        }
      }, 15);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "assistant", content: "⚠️ Server error" },
      ]);
      setLoading(false);
      setStreaming(false);
    }
  };

  const stopGeneration = () => {
    controllerRef.current?.abort();
    setStreaming(false);
    setLoading(false);
  };

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      setInput(lastUser.content);
      sendMessage();
    }
  };

  const copyCode = (code) => navigator.clipboard.writeText(code);
  const editMessage = (id, text) => {
    const newText = prompt("Edit message", text);
    if (!newText) return;
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newText } : m)));
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axios.post("https://manifix.up.railway.app/api/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setInput(res.data.url);
      sendMessage();
    } catch {
      alert("File upload failed");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="gpt-workspace" style={{ backgroundImage: `url(${backgroundPurple})` }}>
      {/* Search + Voice */}
      <div className="chat-search">
        <input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button onClick={() => recognitionRef.current?.start()}>
          <img src={micIcon} alt="Mic" />
        </button>
        <button onClick={() => setVoice((v) => !v)}>
          {voice ? "🔊" : "🔇"}
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" ref={chatRef}>
        {filteredMessages.map((msg) => (
          <div key={msg.id} className={`msg ${msg.role}`}>
            <div className="bubble">
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children);
                    return !inline && match ? (
                      <div className="code-block">
                        <button className="copy-code" onClick={() => copyCode(code)}>
                          <img src={copyIcon} alt="Copy" />
                        </button>
                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code>{children}</code>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>

              <div className="msg-actions">
                <button onClick={() => editMessage(msg.id, msg.content)}>
                  ✏️
                </button>
                <button onClick={() => navigator.clipboard.writeText(msg.content)}>
                  <img src={copyIcon} alt="Copy" />
                </button>
                <button onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}>
                  <img src={binIcon} alt="Delete" />
                </button>
                <button>
                  <img src={shareIcon} alt="Share" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {loading && <div className="typing">AI typing...</div>}
      </div>

      {/* Bottom Input */}
      <div className="chat-input-area">
        <textarea
          value={input}
          placeholder="Ask anything..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <label className="upload-btn">
          <img src={uploadIcon} alt="Upload" />
          <input type="file" onChange={handleUpload} disabled={uploading} />
        </label>
        <button onClick={sendMessage}>➤</button>
        {streaming && <button onClick={stopGeneration}>⏹</button>}
        <button onClick={regenerate}>🔄</button>
      </div>
    </div>
  );
}
