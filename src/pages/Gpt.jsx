import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "../styles/Gpt.css";
import logo from "../assets/logo.png"; // ManifiX App Logo
import background from "../assets/backgrounds/purple-vibe.jpg";

const API_BASE = "https://manifix.up.railway.app";

export default function Gpt() {
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hi 👋 I'm ManifiX. Ask me anything." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voice, setVoice] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState("");

  const chatRef = useRef(null);
  const controllerRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll
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
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreaming(true);

    try {
      controllerRef.current = new AbortController();
      const res = await axios.post(`${API_BASE}/api/chat`, { message: userMsg.content });
      const reply = res.data.reply || "Hmm… I have no response.";

      let i = 0;
      const botMsg = { id: Date.now() + 1, role: "assistant", content: "" };
      setMessages(prev => [...prev, botMsg]);

      const interval = setInterval(() => {
        if (i < reply.length) {
          botMsg.content += reply[i];
          setMessages(prev => [...prev.filter(m => m.id !== botMsg.id), { ...botMsg }]);
          i++;
        } else {
          clearInterval(interval);
          setStreaming(false);
          setLoading(false);
          speak(reply);
        }
      }, 15);

    } catch (err) {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 2, role: "assistant", content: "⚠️ Server error" }
      ]);
      setLoading(false);
      setStreaming(false);
    }
  };

  // Stop streaming
  const stopGeneration = () => {
    controllerRef.current?.abort();
    setStreaming(false);
    setLoading(false);
  };

  // Regenerate last user message
  const regenerate = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (lastUser) {
      setInput(lastUser.content);
      sendMessage();
    }
  };

  // Copy code snippet
  const copyCode = (code) => navigator.clipboard.writeText(code);

  // Edit message
  const editMessage = (id, text) => {
    const newText = prompt("Edit message", text);
    if (!newText) return;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newText } : m));
  };

  // Drag & Drop file upload
  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    const res = await axios.post(`${API_BASE}/api/upload`, form);
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

  const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div
      className="gpt-app dark"
      style={{ backgroundImage: `url(${background})`, backgroundSize: "cover" }}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >

      {/* Header with logo + new chat */}
      <header className="gpt-header">
        <div className="logo-container">
          <img src={logo} alt="ManifiX Logo" className="logo"/>
          <h1>ManifiX AI</h1>
        </div>

        <input
          placeholder="Search chat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <button className="new-chat" title="New Chat" onClick={() => setMessages([{ id:1, role:"assistant", content:"Hi 👋 I'm ManifiX. Ask me anything." }])}>
          ➕
        </button>
      </header>

      {/* Chat messages */}
      <main className="chat-container" ref={chatRef}>
        {filteredMessages.map(msg => (
          <div key={msg.id} className={`msg ${msg.role}`}>
            <div className="bubble">
              <ReactMarkdown
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children);
                    return !inline && match ? (
                      <div className="code-block">
                        <button className="copy-code" onClick={() => copyCode(code)}>copy</button>
                        <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>{code}</SyntaxHighlighter>
                      </div>
                    ) : (
                      <code>{children}</code>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>

              <div className="msg-actions">
                <button onClick={() => editMessage(msg.id, msg.content)}>✏️</button>
                <button onClick={() => navigator.clipboard.writeText(msg.content)}>📋</button>
                <button onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}>🗑️</button>
                <button>👍</button>
                <button>👎</button>
              </div>
            </div>
          </div>
        ))}

        {loading && <div className="typing">AI typing...</div>}
      </main>

      {/* Footer / Input */}
      <footer className="chat-input">
        <textarea
          value={input}
          placeholder="Ask anything..."
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
        />
        <button onClick={sendMessage}>➤</button>
        {streaming && <button onClick={stopGeneration}>⏹ Stop</button>}
        <button onClick={regenerate}>🔄</button>
      </footer>
    </div>
  );
}
