import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/Gpt.css";

const API_BASE = "https://manifix.up.railway.app";

const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Neural link established. **ManifiX Strategist** online. What is our objective today?",
};

export default function Gpt() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("chatMessages");
      return saved ? JSON.parse(saved) : [defaultWelcome];
    } catch { return [defaultWelcome]; }
  });

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const chatRef = useRef(null);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  /* ================= SPEECH ENGINE (GOLD TIER) ================= */
  const speak = (text) => {
    if (!window.speechSynthesis || !voiceOn) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95; // Slightly slower for authority
    utter.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = (text) => {
    if (!text.trim() || generating) return;
    setLastUserMessage(text);

    const userMsg = { id: Date.now(), role: "user", content: text };
    const msgId = Date.now() + "-bot";

    setMessages((prev) => [...prev, userMsg, { id: msgId, role: "assistant", content: "", streaming: true }]);
    setInput("");
    setGenerating(true);

    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(text)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    let fullText = "";
    eventSource.onmessage = (event) => {
      const chunk = event.data;
      if (chunk === "[DONE]") {
        eventSource.close();
        setGenerating(false);
        if (fullText.length < 500) speak(fullText);
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false } : m));
        return;
      }
      fullText += chunk;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: fullText } : m));
    };

    eventSource.onerror = () => {
      eventSource.close();
      setGenerating(false);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: "⚠️ System interference. Retry signal.", streaming: false } : m));
    };
  };

  return (
    <div className="gpt-elite-frame">
      {/* HEADER: Shows AI Status */}
      <header className="gpt-header">
        <div className="ai-badge">
          <div className="pulse-dot" />
          <span>STRATEGIST V.1 (ELITE)</span>
        </div>
        <button className="clear-link" onClick={() => setMessages([defaultWelcome])}>Wipe Memory</button>
      </header>

      <main className="chat-flow" ref={chatRef}>
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`message-wrapper ${msg.role}`}
            >
              <div className="message-bubble">
                {msg.streaming && !msg.content && <div className="ai-typing">Decoding Signal...</div>}
                <ReactMarkdown>{msg.content}</ReactMarkdown>
                
                {msg.role === "assistant" && !msg.streaming && (
                  <div className="message-actions">
                    <button onClick={() => speak(msg.content)}>🔊</button>
                    <button onClick={() => navigator.clipboard.writeText(msg.content)}>📋</button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* INPUT AREA: The "Glass" Cockpit */}
      <div className="glass-input-container">
        <div className="input-wrap">
          <textarea
            value={input}
            placeholder="Input objective..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          />
          <div className="controls">
            <button className={voiceOn ? "voice-on" : ""} onClick={() => setVoiceOn(!voiceOn)}>
              {voiceOn ? "🔊" : "🔇"}
            </button>
            <button className="send-btn" onClick={() => sendMessage(input)}>
              {generating ? "■" : "▲"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
