import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import "../styles/Gpt.css";
import backgroundPurple from "../assets/backgrounds/purple-vibe.jpg";
import micIcon from "../assets/mic.png";
import Header from "../components/Header";

const API_BASE = "https://manifix.up.railway.app";

const defaultWelcome = {
  id: "welcome",
  role: "bot",
  content: "Hi 👋 I'm ManifiX.I'm hear with you❤️.",
  type: "text",
};

export default function Gpt({ userId }) {

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatMessages");
    return saved ? JSON.parse(saved) : [defaultWelcome];
  });

  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);

  const chatRef = useRef(null);
  const recognitionRef = useRef(null);
  const controllerRef = useRef(null);

  /* ---------------- Speech Recognition ---------------- */

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

  /* ---------------- Auto Scroll ---------------- */

  useEffect(() => {

    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }

    localStorage.setItem("chatMessages", JSON.stringify(messages));

  }, [messages]);

  /* ---------------- Copy ---------------- */

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  /* ---------------- Send Message ---------------- */

  const sendMessage = async (text) => {

    if (!text || generating) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const thinking = {
      id: "thinking",
      role: "bot",
      content: "Thinking...",
      type: "thinking",
    };

    setMessages((prev) => [...prev, thinking]);

    setGenerating(true);

    try {

      controllerRef.current = new AbortController();

      const res = await axios.post(
        `${API_BASE}/api/chat`,
        { message: text, userId },
        { signal: controllerRef.current.signal }
      );

      const reply = res.data.reply || "No response.";

      setMessages((prev) =>
        prev.filter((m) => m.id !== "thinking")
      );

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        content: reply,
      };

      setMessages((prev) => [...prev, botMsg]);

    } catch (err) {

      if (err.name !== "CanceledError") {

        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "thinking"),
          {
            id: Date.now(),
            role: "bot",
            content: "Server error. Please try again.",
          },
        ]);

      }

    }

    setGenerating(false);

  };

  /* ---------------- Stop Generation ---------------- */

  const stopGenerating = () => {

    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    setGenerating(false);

  };

  /* ---------------- Regenerate ---------------- */

  const regenerate = () => {

    const lastUser = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    if (lastUser) {
      sendMessage(lastUser.content);
    }

  };

  /* ---------------- Upload Image ---------------- */

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
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const url = res.data.url;

      const imgMsg = {
        id: Date.now(),
        role: "user",
        content: url,
        type: "image",
      };

      setMessages((prev) => [...prev, imgMsg]);

      sendMessage(url);

    } catch {

      alert("Upload failed");

    }

    setUploading(false);

  };

  /* ---------------- Mic ---------------- */

  const handleMic = () => {

    const rec = recognitionRef.current;
    if (!rec) return;

    listening ? rec.stop() : rec.start();

  };

  /* ---------------- Render ---------------- */

  return (

    <div
      className="gpt-app"
      style={{ backgroundImage: `url(${backgroundPurple})` }}
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
                        <div className="code-block">

                          <button
                            className="copy-code"
                            onClick={() =>
                              copyText(children.toString())
                            }
                          >
                            Copy
                          </button>

                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                          >
                            {children}
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

              )}

              {msg.role === "bot" && (
                <button
                  className="copy-msg"
                  onClick={() => copyText(msg.content)}
                >
                  Copy
                </button>
              )}

            </div>

          </div>

        ))}

      </main>

      {/* Footer */}

      <footer className="gpt-footer">

        <button onClick={handleMic}>
          <img src={micIcon} alt="mic"/>
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

        <label className="upload-btn">
          📎
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {!generating ? (

          <button onClick={() => sendMessage(input)}>
            Send
          </button>

        ) : (

          <button onClick={stopGenerating}>
            Stop
          </button>

        )}

        <button onClick={regenerate}>
          Regenerate
        </button>

      </footer>

    </div>

  );

}
