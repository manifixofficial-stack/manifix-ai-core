import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  TopBar,
  BottomNav,
  ChatBox,
  ChatInput,
  Magic16Controls,
  Magic16Timer,
  Modal,
} from "../index";
import "../../styles/MobileLayout.css";

export default function MobileLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);

  const menuItems = [
    { name: "GPT", path: "/app/gpt", icon: "chat" },
    { name: "Magic16", path: "/app/magic16", icon: "magic16" },
    { name: "Profile", path: "/app/profile", icon: "profile" },
    { name: "Settings", path: "/app/settings", icon: "settings" },
  ];

  return (
    <div className="mobile-layout">
      {/* TopBar */}
      <TopBar onMagicClick={() => setMagicOpen(true)} />

      {/* Main content */}
      <main className="mobile-main">
        <Outlet />
      </main>

      {/* Floating Chat */}
      {chatOpen && (
        <div className="mobile-chat">
          <ChatBox />
          <ChatInput
            value={chatInput}
            onChange={setChatInput}
            onSend={() => {
              console.log("Send:", chatInput);
              setChatInput("");
            }}
          />
        </div>
      )}

      {/* Bottom navigation */}
      <BottomNav menuItems={menuItems} />

      {/* Magic16 Modal */}
      {magicOpen && (
        <Modal onClose={() => setMagicOpen(false)}>
          <h2 className="text-xl font-bold mb-2">Magic16 Ritual</h2>
          <p className="mb-4">8 Minutes Yoga + 8 Minutes Meditation</p>
          <Magic16Controls />
          <Magic16Timer />
        </Modal>
      )}

      {/* Chat toggle button */}
      <button
        className="mobile-chat-toggle"
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? "Close Chat" : "Open Chat"}
      </button>
    </div>
  );
}
