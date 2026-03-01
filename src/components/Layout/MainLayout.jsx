// src/components/Layout/MainLayout.jsx
import React, { useState, Suspense, lazy } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import "../../styles/MainLayout.css";

// Core components
import { TopBar, BottomNav, Modal } from "../index";

// Lazy-loaded heavy components
const ChatBox = lazy(() => import("../Chat/ChatBox"));
const ChatInput = lazy(() => import("../Chat/ChatInput"));
const Magic16Controls = lazy(() => import("../Magic16/Magic16Controls"));
const Magic16Timer = lazy(() => import("../Magic16/Magic16Timer"));

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, theme, toggleTheme } = useApp();

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
    <div
      className={`flex h-screen transition-colors duration-500 ${
        theme === "dark"
          ? "bg-gray-900 text-white"
          : "bg-gradient-to-br from-gray-50 to-gray-100"
      }`}
    >
      {/* SIDEBAR */}
      <aside
        className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-xl border-r flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white glow-text">
              ManifiX
            </h1>
          )}
          <button
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xl"
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
                className={`w-full text-left px-4 py-3 mb-2 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl ${
                  active
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Logout & Theme */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition transform hover:scale-105 glow-btn"
          >
            Logout
          </button>
          <button
            onClick={toggleTheme}
            className="w-full py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-black dark:text-white rounded-lg transition transform hover:scale-105"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* TOPBAR */}
        {TopBar && <TopBar user={user} onMagicClick={() => setMagicOpen(true)} />}

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>

        {/* MOBILE NAV */}
        {BottomNav && <BottomNav items={menuItems} className="md:hidden" />}
      </div>

      {/* MAGIC16 MODAL */}
      {magicOpen && Modal && (
        <Modal onClose={() => setMagicOpen(false)} role="dialog" aria-modal="true">
          <h2 className="text-xl font-bold mb-3 glow-text">Magic16 Ritual</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            8 Minutes Yoga + 8 Minutes Meditation
          </p>
          <Suspense fallback={<p>Loading ritual...</p>}>
            <Magic16Controls />
            <Magic16Timer />
          </Suspense>
        </Modal>
      )}

      {/* CHAT FLOAT BUTTON */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 bg-black text-white px-5 py-3 rounded-full shadow-xl hover:scale-110 transition-transform animate-bounce glow-btn"
        aria-label={chatOpen ? "Close Chat" : "Open Chat"}
      >
        {chatOpen ? "Close Chat" : "Open Chat"}
      </button>

      {/* CHAT BOX */}
      {chatOpen && (
        <Suspense fallback={<div>Loading chat...</div>}>
          <div className="fixed bottom-20 right-6 w-96 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 cursor-move">
            <ChatBox />
            <ChatInput
              value={chatInput}
              onChange={setChatInput}
              onSend={() => setChatInput("")}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
}
