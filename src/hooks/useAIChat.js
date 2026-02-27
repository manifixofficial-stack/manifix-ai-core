import { useState } from "react";
import aiService from "../services/ai.service";

export default function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content) => {
    setLoading(true);
    const userMsg = { role: "user", content };
    setMessages((m) => [...m, userMsg]);

    try {
      const reply = await aiService.chat([...messages, userMsg]);
      setMessages((m) => [...m, reply]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage };
}
