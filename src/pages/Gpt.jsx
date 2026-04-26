import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

const API_BASE = "https://manifix.up.railway.app";

export default function Gpt() {
  const [messages, setMessages] = useState([
    { id: "welcome", role: "assistant", content: "Hey 👋 I’m ManifiX AI. Ask anything.", streaming: false }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const eventSourceRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (customText) => {
    const text = customText || input;
    if (!text.trim() || loading) return;

    navigator.vibrate?.(30);

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: text
    };

    const assistantId = `ai-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true }
    ]);

    setInput("");
    setLoading(true);
    setTyping(true);

    const systemPrompt = {
      role: "system",
      content: "You are a helpful, concise AI assistant."
    };

    const payload = {
      messages: [systemPrompt, ...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
    };

    try {
      await new Promise(res => setTimeout(res, 500 + Math.random() * 800));

      const response = await fetch(`${API_BASE}/api/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let fullText = "";
      let queue = [];

      const processQueue = () => {
        if (!queue.length) return;
        const chunk = queue.shift();
        fullText += chunk;

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: fullText } : m
          )
        );

        setTimeout(processQueue, 20 + Math.random() * 40);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);

        if (chunk.includes("[DONE]")) break;

        queue.push(chunk);
        if (queue.length === 1) processQueue();
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );

      new Audio("/assets/audio/pop.mp3").play();
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
    setTyping(false);
  };

  const stopGeneration = () => {
    eventSourceRef.current?.close?.();

    setMessages(prev =>
      prev.map(m =>
        m.streaming ? { ...m, streaming: false, interrupted: true } : m
      )
    );

    setLoading(false);
  };

  return (
    <div className="gpt-container">
      <div className="messages">
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`msg ${msg.role}`}
          >
            <ReactMarkdown>{msg.content}</ReactMarkdown>
            {msg.streaming && <span className="cursor">▍</span>}
            {msg.interrupted && <span className="stopped">⚠️ Stopped</span>}
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {typing && <div className="typing">AI is thinking...</div>}

      <div className="suggestions">
        <button onClick={() => sendMessage("Explain this simply")}>Explain simply</button>
        <button onClick={() => sendMessage("Give examples")}>Give examples</button>
        <button onClick={() => sendMessage("Summarize this")}>Summarize</button>
      </div>

      <div className="input-box">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything..."
        />

        {!loading ? (
          <button onClick={() => sendMessage()}>Send</button>
        ) : (
          <button onClick={stopGeneration}>Stop</button>
        )}
      </div>
    </div>
  );
}
