// src/pages/Gpt.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/Gpt.css";
import { useNavigate } from "react-router-dom";

const API = "https://manifix.up.railway.app/api/chat";

export default function Gpt() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hi 👋 I'm ManifiX. Ask me anything." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState("");

  const chatRef = useRef(null);
  const controllerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = false;

    rec.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

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

      const botMsg = { id: Date.now() + 1, role: "assistant", content: "" };
      setMessages((prev) => [...prev, botMsg]);

      // Stream reply one character at a time
      let i = 0;
      const interval = setInterval(() => {
        if (i < reply.length) {
          botMsg.content += reply[i];
          setMessages((prev) =>
            prev.map((m) => (m.id === botMsg.id ? { ...botMsg } : m))
          );
          i++;
        } else {
          clearInterval(interval);
          setStreaming(false);
          setLoading(false);
          speak(reply);
        }
      }, 15);
    } catch (e) {
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

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  const editMessage = (id, text) => {
    const newText = prompt("Edit message", text);
    if (!newText) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: newText } : m))
    );
  };

  // Drag & drop file upload
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const res = await axios.post("https://manifix.up.railway.app/api/upload", form);
    sendMessage(res.data.url);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const keyHandler = (e) => {
      if (e.ctrlKey && e.key === "Enter") sendMessage();
      if (e.key === "Escape") stopGeneration();
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [input]);

  // Filter messages for search
  const filteredMessages = messages.filter((m) =>
    m.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="gpt-app"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* TopBar */}
      <header className="gpt-header">
        <h2 onClick={() => navigate("/")}>ManifiX AI</h2>
        <input
          placeholder="Search chat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="header-actions">
          <button onClick={() => navigate("/magic16")}>✨ Magic16</button>
          <button onClick={() => setVoice((v) => !v)}>{voice ? "🔊" : "🔇"}</button>
          <button onClick={() => recognitionRef.current?.start()}>🎤</button>
        </div>
      </header>

      {/* Chat messages */}
      <main className="chat-container" ref={chatRef}>
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
                          copy
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
                <button onClick={() => editMessage(msg.id, msg.content)}>✏️</button>
                <button onClick={() => navigator.clipboard.writeText(msg.content)}>📋</button>
                <button onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}>
                  🗑
                </button>
                <button>👍</button>
                <button>👎</button>
              </div>
            </div>
          </div>
        ))}

        {loading && <div className="typing">AI typing...</div>}
      </main>

      {/* Input area */}
      <footer className="chat-input">
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
        <button onClick={sendMessage}>➤</button>
        {streaming && <button onClick={stopGeneration}>⏹ Stop</button>}
        <button onClick={regenerate}>🔄</button>
      </footer>
    </div>
  );
}
