// src/components/Layout/MainLayout.jsx
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
import "../../styles/MainLayout.css";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { name: "GPT", path: "/app/gpt", icon: "chat" },
    { name: "Vibe", path: "/app/vibe", icon: "feed" },
    { name: "Magic16", path: "/app/magic16", icon: "magic16" },
    { name: "Profile", path: "/app/profile", icon: "profile" },
    { name: "Settings", path: "/app/settings", icon: "settings" },
    { name: "Billing", path: "/app/billing", icon: "billing" },
  ];

  return (
    <div className="app-layout flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`sidebar bg-white shadow-md flex flex-col transition-width duration-300 ${
          sidebarCollapsed ? "w-20" : "w-60"
        } hidden md:flex`}
      >
        <div className="sidebar-header p-4 flex justify-between items-center">
          {!sidebarCollapsed && <span className="text-xl font-bold">ManifiX</span>}
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        <div className="sidebar-menu flex-1 flex flex-col mt-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`sidebar-btn flex items-center gap-2 p-3 rounded-md m-1 hover:bg-gray-100 transition-colors ${
                location.pathname === item.path ? "bg-blue-100 font-semibold" : ""
              }`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-icon">{/* icon here */}</span>
              {!sidebarCollapsed && <span>{item.name}</span>}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TopBar */}
        <TopBar
          onMagicClick={() => setMagicOpen(true)}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>

        {/* Chat Section */}
        {chatOpen && (
          <div className="chat-container fixed bottom-20 right-6 w-80 md:w-96 bg-white border shadow-lg rounded-lg flex flex-col overflow-hidden">
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

        {/* Mobile Bottom Navigation */}
        <BottomNav menuItems={menuItems} />
      </div>

      {/* Magic16 Modal */}
      {magicOpen && (
        <Modal onClose={() => setMagicOpen(false)}>
          <h2 className="text-xl font-bold mb-2">Magic16 Ritual</h2>
          <p className="mb-4">8 Minutes Yoga + 8 Minutes Meditation</p>
          <Magic16Controls />
          <Magic16Timer />
        </Modal>
      )}

      {/* Chat Toggle Button */}
      <button
        className="chat-toggle-btn fixed bottom-24 right-6 p-3 bg-blue-500 rounded-full shadow-lg text-white hover:bg-blue-600 transition-colors"
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? "Close Chat" : "Open Chat"}
      </button>
    </div>
  );
}
