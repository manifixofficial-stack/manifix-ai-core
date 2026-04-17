import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

import "../styles/Gpt.css";

const API_BASE = "https://manifix.up.railway.app";

const defaultWelcome = {
  id: "welcome",
  role: "assistant",
  content: "Hey 👋 I’m ManifiX, I’m here with you ❤️",
};

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
  const [voiceOn, setVoiceOn] = useState(true);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const eventSourceRef = useRef(null);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });

    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  /* ================= STT ================= */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-IN";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

    recognitionRef.current = rec;
  }, []);

  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("Mic not supported");
    listening ? rec.stop() : rec.start();
  };

  /* ================= TTS ================= */
  const speak = (text) => {
    if (!window.speechSynthesis || !voiceOn) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  /* ================= STOP ================= */
  const stopGenerating = () => {
    eventSourceRef.current?.close();
    setGenerating(false);
  };

  /* ================= SEND ================= */
  const sendMessage = (text) => {
    if (!text.trim() || generating) return;

    setLastUserMessage(text);

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);

    const msgId = Date.now() + "-bot";

    setMessages((prev) => [
      ...prev,
      { id: msgId, role: "assistant", content: "", streaming: true },
    ]);

    eventSourceRef.current?.close();

    const url = `${API_BASE}/api/stream?message=${encodeURIComponent(text)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    let fullText = "";

    eventSource.onmessage = (event) => {
      const chunk = event.data;

      if (chunk === "[DONE]") {
        eventSource.close();
        setGenerating(false);

        if (fullText.length < 200) speak(fullText);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, streaming: false } : m
          )
        );

        return;
      }

      fullText += chunk;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, content: fullText } : m
        )
      );
    };

    eventSource.onerror = () => {
      eventSource.close();
      setGenerating(false);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                content:
                  "⚠️ I'm having trouble connecting right now… give me a second and try again.",
                streaming: false,
              }
            : m
        )
      );
    };
  };

  /* ================= COPY ================= */
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  /* ================= LOADING TEXT ================= */
  const loadingTexts = [
    "Analyzing…",
    "Thinking deeply…",
    "Generating answer…",
  ];

  const randomLoading =
    loadingTexts[Math.floor(Math.random() * loadingTexts.length)];

  /* ================= UI ================= */
  return (
    <div className="gpt-container">

      {/* CHAT */}
      <main className="chat-area" ref={chatRef}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`msg-row ${msg.role}`}
          >
            <div className={`msg-bubble ${msg.streaming ? "streaming" : ""}`}>

              {/* THINKING */}
              {msg.streaming && !msg.content && (
                <div className="thinking">
                  <span>{randomLoading}</span>
                  <span className="dots">...</span>
                </div>
              )}

              {/* MESSAGE */}
              <ReactMarkdown>{msg.content}</ReactMarkdown>

              {/* CURSOR */}
              {msg.streaming && <span className="cursor">|</span>}

              {/* ACTIONS */}
              {msg.role === "assistant" && msg.content && !msg.streaming && (
                <div className="actions">
                  <button onClick={() => speak(msg.content)}>🔊</button>
                  <button onClick={() => copyText(msg.content)}>📋</button>
                  <button onClick={() => sendMessage(lastUserMessage)}>🔄</button>
                </div>
              )}

            </div>
          </motion.div>
        ))}
      </main>

      {/* INPUT */}
      <div className="input-area">

        <button onClick={handleMic} className="mic-btn">
          {listening ? "🎙️" : "🎤"}
        </button>

        <button onClick={() => setVoiceOn(v => !v)}>
          {voiceOn ? "🔊 ON" : "🔇 OFF"}
        </button>

        <textarea
          value={input}
          placeholder="Talk to ManifiX..."
          onChange={(e) => setInput(e.target.value)}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />

        <button
          className="send-btn"
          onClick={generating ? stopGenerating : () => sendMessage(input)}
        >
          {generating ? "Stop" : "➤"}
        </button>

      </div>
    </div>
  );
}
