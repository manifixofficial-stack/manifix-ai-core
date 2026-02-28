// src/components/Layout/MainLayout.jsx
import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "../../styles/MainLayout.css";

import {
  TopBar,
  BottomNav,
  ChatBox,
  ChatInput,
  Magic16Controls,
  Magic16Timer,
  Modal,
} from "../index";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useApp();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);

  const menuItems = [
    { name: "GPT", path: "/app/gpt" },
    { name: "Magic16", path: "/app/magic16" },
    { name: "Profile", path: "/app/profile" },
    { name: "Settings", path: "/app/settings" },
    { name: "Billing", path: "/app/billing" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* SIDEBAR */}
      <aside
        className={`bg-white shadow-xl border-r flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b">
          {!sidebarCollapsed && (
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">
              ManifiX
            </h1>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-gray-700"
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Menu */}
        <div className="flex-1 mt-6 px-2">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                  active
                    ? "bg-black text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* TOPBAR */}
        {TopBar && (
          <TopBar
            user={user}
            onMagicClick={() => setMagicOpen(true)}
          />
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>

        {/* MOBILE NAV */}
        {BottomNav && (
          <BottomNav
            items={menuItems}
          />
        )}
      </div>

      {/* MAGIC16 MODAL */}
      {magicOpen && Modal && (
        <Modal onClose={() => setMagicOpen(false)}>
          <h2 className="text-xl font-bold mb-3">Magic16 Ritual</h2>
          <p className="mb-4 text-gray-600">
            8 Minutes Yoga + 8 Minutes Meditation
          </p>
          {Magic16Controls && <Magic16Controls />}
          {Magic16Timer && <Magic16Timer />}
        </Modal>
      )}

      {/* CHAT FLOAT BUTTON */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-full shadow-xl hover:scale-105 transition-transform"
      >
        {chatOpen ? "Close Chat" : "Open Chat"}
      </button>

      {/* CHAT BOX */}
      {chatOpen && ChatBox && ChatInput && (
        <div className="fixed bottom-20 right-6 w-96 bg-white shadow-2xl rounded-2xl overflow-hidden border">
          <ChatBox />
          <ChatInput
            value={chatInput}
            onChange={setChatInput}
            onSend={() => setChatInput("")}
          />
        </div>
      )}
    </div>
  );
}
