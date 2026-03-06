// src/pages/Gpt.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "../styles/Gpt.css"; // Neon chat styling

// Import your icons & background
import { icons } from "../assets/icons"; // mic, stop
import PngIcons from "../assets/PngIcons"; // chat, send, microphone, etc.
import background from "../assets/backgrounds/purple-vibe.jpg";

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
  const chatContainer = useRef(null);

  // Ref for Speech Recognition
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "en-IN";
      recognitionRef.current = rec;

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInput(transcript);
      };
      rec.onend = () => setListening(false);
    }
  }, []);

  // Scroll chat to bottom and save messages
  useEffect(() => {
    if (chatContainer.current) {
      chatContainer.current.scrollTop = chatContainer.current.scrollHeight;
    }
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  // Text-to-Speech
  const speak = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // Mic button handler
  const handleMic = () => {
    const rec = recognitionRef.current;
    if (!rec) return alert("STT not supported on this device");

    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      rec.start();
      setListening(true);
    }
  };

  // Send a message
  const sendMessage = async (msg, isFile = false) => {
    if (!msg) return;

    const userMsg = { content: msg, role: "user", timestamp: Date.now(), isFile };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const thinkingMsg = { content: "ManifiX is thinking...", role: "bot", type: "thinking", timestamp: Date.now() };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const response = await axios.post(`${API_BASE}/api/chat`, { message: msg }, { timeout: 10000 });
      const replyText = response.data.reply || "I’m here with you 🤍";

      setMessages((prev) => prev.filter((m) => m !== thinkingMsg));

      // Typing effect
      let idx = 0;
      const replyMsg = { content: "", role: "bot", timestamp: Date.now(), type: "text" };
      setMessages((prev) => [...prev, replyMsg]);

      const interval = setInterval(() => {
        if (idx < replyText.length) {
          replyMsg.content += replyText[idx];
          setMessages((prev) => [...prev.filter((m) => m !== replyMsg), replyMsg]);
          idx++;
        } else {
          clearInterval(interval);
          speak(replyText);
        }
      }, 25);
    } catch {
      setMessages((prev) => prev.filter((m) => m !== thinkingMsg));
      setMessages((prev) => [
        ...prev,
        { content: "❌ Backend not reachable. Try again.", role: "bot", timestamp: Date.now() },
      ]);
    }
  };

  // File upload
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
      const fileUrl = res.data.url;
      sendMessage(fileUrl, true);
    } catch {
      alert("❌ File upload failed");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  // Enter key sends message
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.trim());
    }
  };

  return (
    <div
      className="gpt-app"
      style={{ backgroundImage: `url(${background})`, backgroundSize: "cover" }}
    >
      <header className="gpt-header">
        <img src={PngIcons.chat} alt="ManifiX Logo" className="gpt-logo" />
        <h1>ManifiX GPT</h1>
      </header>

      <main className="gpt-main" ref={chatContainer}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
            <div className="message-bubble">
              {msg.isFile ? (
                <a href={msg.content} target="_blank" rel="noopener noreferrer" className="file-link">
                  📎 {msg.content.split("/").pop()}
                </a>
              ) : (
                <>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.role === "bot" &&
                    msg.type !== "thinking" &&
                    [...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className="twinkle-star"
                        style={{
                          top: `${Math.random() * 80}%`,
                          left: `${Math.random() * 80}%`,
                          animationDelay: `${Math.random()}s`,
                        }}
                      />
                    ))}
                </>
              )}
            </div>
          </div>
        ))}
      </main>

      <footer className="gpt-footer">
        <button
          id="micBtn"
          onClick={handleMic}
          className={listening ? "recording" : ""}
          aria-label={listening ? "Stop Recording" : "Start Recording"}
        >
          <img src={listening ? icons.stop : icons.mic} alt="Mic Icon" />
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Your ManifiX Anything…"
          aria-label="Chat input"
        />

        <label className="upload-btn" aria-label="Upload File">
          📎
          <input type="file" onChange={handleUpload} disabled={uploading} />
        </label>

        <button onClick={() => sendMessage(input.trim())} disabled={!input.trim()} className="primary" aria-label="Send Message">
          <img src={PngIcons.send} alt="Send" />
        </button>

        <button className="toggle-voice" onClick={() => setVoiceEnabled((prev) => !prev)} aria-label="Toggle Voice">
          {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
        </button>
      </footer>
    </div>
  );
}
