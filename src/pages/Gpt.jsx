import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";

import micIcon from "../assets/mic.png";
import shareIcon from "../assets/share.png";
import Header from "../components/Header";

const API_BASE = "https://manifix.up.railway.app";

const defaultWelcome = {
  id: "welcome",
  role: "bot",
  content: "Hi 👋🏻 I'm ManifiX. I'm here with you ❤️",
  type: "text",
};

export default function Gpt({ userId }) {

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [defaultWelcome];
  });

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [uploading, setUploading] = useState(false);

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  // ---------------- Speech Recognition ----------------

  useEffect(() => {

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();

    rec.lang = "en-IN";
    rec.continuous = false;

    recognitionRef.current = rec;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) => {
      setInput(e.results[0][0].transcript);
    };

  }, []);

  // ---------------- Auto Scroll ----------------

  useEffect(() => {

    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }

    localStorage.setItem("chatMessages", JSON.stringify(messages));

  }, [messages]);

  // ---------------- TTS ----------------

  const speak = (text) => {

    if (!voiceEnabled) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-IN";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);

  };

  // ---------------- Copy ----------------

  const copyMessage = (text) => {

    navigator.clipboard.writeText(text);

  };

  // ---------------- Send Message ----------------

  const sendMessage = async (text, type = "text") => {

    if (!text) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
      type,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const thinking = {
      id: "thinking",
      role: "bot",
      type: "thinking",
      content: "Thinking...",
    };

    setMessages((prev) => [...prev, thinking]);

    try {

      const res = await axios.post(`${API_BASE}/api/chat`, {
        message: text,
        userId,
      });

      const reply = res.data.reply || "No response.";

      setMessages((prev) =>
        prev.filter((m) => m.id !== "thinking")
      );

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: reply,
        type: "text",
      };

      setMessages((prev) => [...prev, botMsg]);

      speak(reply);

    } catch {

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "thinking"),
        {
          id: Date.now(),
          role: "bot",
          content: "Server error. Please try again.",
          type: "text",
        },
      ]);

    }

  };

  // ---------------- Upload Image/File ----------------

  const handleUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {

      const res = await axios.post(
        `${API_BASE}/api/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const url = res.data.url;

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "user",
          content: url,
          type: "image",
        },
      ]);

      sendMessage(url, "image");

    } catch {

      alert("Upload failed");

    }

    setUploading(false);
    e.target.value = null;

  };

  // ---------------- Mic ----------------

  const handleMic = () => {

    const rec = recognitionRef.current;

    if (!rec) return;

    listening ? rec.stop() : rec.start();

  };

  // ---------------- Render ----------------

  return (

    <div
      className="gpt-app"
      style={{
        backgroundImage: `url(${backgroundPurple})`,
      }}
    >

      <Header
        onNewChat={() => {
          localStorage.removeItem("chatMessages");
          setMessages([defaultWelcome]);
        }}
      />

      {/* Chat */}

      <main className="gpt-main" ref={chatRef}>

        {messages.map((msg) => (

          <div key={msg.id} className={`message-row ${msg.role}`}>

            <div className="message-bubble">

              {msg.type === "thinking" ? (

                <div className="typing">
                  ManifiX is thinking...
                </div>

              ) : msg.type === "image" ? (

                <img
                  src={msg.content}
                  alt="upload"
                  className="chat-image"
                />

              ) : (

                <ReactMarkdown
                  components={{
                    code({ inline, className, children }) {

                      const match =
                        /language-(\w+)/.exec(className || "");

                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                        >
                          {children}
                        </SyntaxHighlighter>
                      ) : (
                        <code>{children}</code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>

              )}

              {/* Message Actions */}

              <div className="message-actions">

                <button
                  onClick={() => copyMessage(msg.content)}
                  className="msg-btn"
                >
                  Copy
                </button>

                <button
                  onClick={() => navigator.share?.({ text: msg.content })}
                  className="msg-btn"
                >
                  <img src={shareIcon} alt="share" />
                </button>

              </div>

            </div>

          </div>

        ))}

      </main>

      {/* Footer */}

      <footer className="gpt-footer">

        <button onClick={handleMic}>
          <img src={micIcon} alt="mic" />
        </button>

        <textarea
          value={input}
          placeholder="Ask ManifiX anything..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />

        {/* File Upload */}

        <label className="upload-btn">

          📎

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            disabled={uploading}
          />

        </label>

        <button
          onClick={() => sendMessage(input)}
          disabled={!input}
        >
          ➤
        </button>

        <button
          onClick={() => setVoiceEnabled((v) => !v)}
        >
          {voiceEnabled ? "🔊" : "🔇"}
        </button>

      </footer>

    </div>

  );

}
