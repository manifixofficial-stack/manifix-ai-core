import { useState } from "react";
import aiService from "../services/ai.service";

export default function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (content) => {
    setLoading(true);

    const userMsg = { role: "user", content };

    setMessages((prev) => {
      const updated = [...prev, userMsg];

      aiService.chat(updated).then((reply) => {
        setMessages((m) => [...m, reply]);
        setLoading(false);
      });

      return updated;
    });
  };

  return { messages, loading, sendMessage };
}
