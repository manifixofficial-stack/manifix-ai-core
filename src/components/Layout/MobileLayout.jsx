import React, { useState, useEffect, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  TopBar, BottomNav, ChatBox, ChatInput,
  Magic16Controls, Magic16Timer, Modal,
} from "../index";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const G = {
  gold:      "#C9A84C",
  goldLight: "#F2D06B",
  goldDim:   "rgba(201,168,76,0.10)",
  goldGlow:  "rgba(201,168,76,0.28)",
  goldBorder:"rgba(201,168,76,0.20)",
  bg:        "#06060D",
  surface:   "#0A0A16",
  surface2:  "#0E0E1C",
  panel:     "rgba(10,10,22,0.96)",
  border:    "rgba(201,168,76,0.14)",
  text:      "#ECEEF8",
  muted:     "rgba(236,238,248,0.50)",
  dim:       "rgba(236,238,248,0.22)",
  font:      "'Syne', sans-serif",
  mono:      "'JetBrains Mono', monospace",
  body:      "'Outfit', sans-serif",
};

// ─── INJECTED CSS ─────────────────────────────────────────────────────────────
const LAYOUT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${G.border}; border-radius: 2px; }

  /* ── Keyframes ── */
  @keyframes ml-gridPulse {
    0%,100% { opacity: 0.025; }
    50%      { opacity: 0.055; }
  }
  @keyframes ml-shimmer {
    0%   { background-position: -400% center; }
    100% { background-position:  400% center; }
  }
  @keyframes ml-slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);   opacity: 1; }
  }
  @keyframes ml-slideDown {
    from { transform: translateY(0);   opacity: 1; }
    to   { transform: translateY(100%); opacity: 0; }
  }
  @keyframes ml-fadeIn {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes ml-navGlow {
    0%,100% { box-shadow: 0 -1px 0 rgba(201,168,76,0.12), 0 -20px 60px rgba(201,168,76,0.04); }
    50%      { box-shadow: 0 -1px 0 rgba(201,168,76,0.28), 0 -20px 60px rgba(201,168,76,0.10); }
  }
  @keyframes ml-iconPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.28) translateY(-2px); }
    100% { transform: scale(1); }
  }
  @keyframes ml-activeBar {
    from { width: 0; opacity: 0; }
    to   { width: 24px; opacity: 1; }
  }
  @keyframes ml-chatPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.45), 0 8px 32px rgba(0,0,0,0.6); }
    60%      { box-shadow: 0 0 0 10px rgba(201,168,76,0), 0 8px 32px rgba(0,0,0,0.6); }
  }
  @keyframes ml-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ml-orbFloat {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(12px,-10px) scale(1.04); }
  }
  @keyframes ml-topBarReveal {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }
  @keyframes ml-modalIn {
    from { opacity: 0; transform: translateY(30px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes ml-dot {
    0%,100% { opacity: 0.3; transform: scale(0.8); }
    50%      { opacity: 1;   transform: scale(1); }
  }

  /* ── Gold shimmer text ── */
  .ml-gold-text {
    background: linear-gradient(90deg, #A07828, ${G.gold}, ${G.goldLight}, ${G.gold}, #A07828);
    background-size: 400% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ml-shimmer 5s linear infinite;
  }

  /* ── Root layout ── */
  .ml-root {
    position: fixed; inset: 0;
    background: ${G.bg};
    display: flex; flex-direction: column;
    overflow: hidden;
    font-family: ${G.body};
  }

  /* ── Grid texture ── */
  .ml-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(201,168,76,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(201,168,76,0.045) 1px, transparent 1px);
    background-size: 52px 52px;
    animation: ml-gridPulse 7s ease-in-out infinite;
  }

  /* ── Ambient orb ── */
  .ml-orb {
    position: fixed; z-index: 0; pointer-events: none; border-radius: 50%;
    filter: blur(80px);
    animation: ml-orbFloat 14s ease-in-out infinite;
  }

  /* ── TOP BAR ── */
  .ml-topbar {
    position: relative; z-index: 100; flex-shrink: 0;
    height: 58px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 18px;
    background: ${G.panel};
    border-bottom: 1px solid ${G.border};
    backdrop-filter: blur(24px);
    animation: ml-topBarReveal 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
  .ml-topbar-brand {
    display: flex; align-items: center; gap: 9px; text-decoration: none;
  }
  .ml-topbar-logo {
    width: 34px; height: 34px; border-radius: 9px;
    background: rgba(201,168,76,0.07);
    border: 1px solid rgba(201,168,76,0.22);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    box-shadow: 0 0 12px rgba(201,168,76,0.15);
  }
  .ml-topbar-logo img {
    width: 28px; height: 28px; object-fit: contain;
    filter: drop-shadow(0 0 4px rgba(201,168,76,0.5));
  }
  .ml-topbar-name {
    font-family: ${G.font}; font-size: 15px; font-weight: 800;
    letter-spacing: 0.18em; line-height: 1;
  }
  .ml-topbar-sub {
    font-family: ${G.mono}; font-size: 7.5px;
    color: ${G.dim}; letter-spacing: 0.20em; margin-top: 2px;
  }
  .ml-topbar-actions { display: flex; align-items: center; gap: 8px; }

  /* Magic16 trigger button */
  .ml-magic-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 13px; border-radius: 7px;
    background: linear-gradient(135deg, ${G.gold} 0%, #8A6420 100%);
    border: none; cursor: pointer;
    font-family: ${G.font}; font-size: 11px; font-weight: 700;
    color: #06060D; letter-spacing: 0.12em;
    box-shadow: 0 4px 16px rgba(201,168,76,0.35);
    transition: all 0.2s ease;
    position: relative; overflow: hidden;
  }
  .ml-magic-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.18), transparent 60%);
    opacity: 0; transition: opacity 0.2s;
  }
  .ml-magic-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.55); }
  .ml-magic-btn:hover::before { opacity: 1; }
  .ml-magic-btn:active { transform: scale(0.97); }

  /* Streak badge */
  .ml-streak {
    display: flex; align-items: center; gap: 5px;
    padding: 6px 10px; border-radius: 7px;
    background: rgba(201,168,76,0.07);
    border: 1px solid rgba(201,168,76,0.18);
    font-family: ${G.mono}; font-size: 10px;
    color: ${G.gold}; letter-spacing: 0.06em;
  }

  /* ── MAIN SCROLL AREA ── */
  .ml-main {
    flex: 1; overflow-y: auto; overflow-x: hidden;
    position: relative; z-index: 10;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 4px;
  }

  /* ── BOTTOM NAV ── */
  .ml-bottomnav {
    position: relative; z-index: 100; flex-shrink: 0;
    height: 68px;
    display: flex; align-items: center;
    background: ${G.panel};
    border-top: 1px solid ${G.border};
    backdrop-filter: blur(24px);
    padding: 0 6px;
    animation: ml-navGlow 4s ease-in-out infinite;
  }
  .ml-nav-item {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px;
    height: 100%; cursor: pointer;
    background: none; border: none;
    transition: all 0.22s ease;
    position: relative; border-radius: 10px;
    padding: 6px 4px;
    -webkit-tap-highlight-color: transparent;
  }
  .ml-nav-item:hover { background: rgba(201,168,76,0.05); }
  .ml-nav-item.active { background: rgba(201,168,76,0.07); }
  .ml-nav-icon {
    width: 22px; height: 22px;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.22s ease;
  }
  .ml-nav-item.active .ml-nav-icon {
    animation: ml-iconPop 0.35s cubic-bezier(0.16,1,0.3,1) both;
  }
  .ml-nav-label {
    font-family: ${G.mono}; font-size: 8.5px;
    letter-spacing: 0.09em; text-transform: uppercase;
    transition: color 0.2s;
  }
  .ml-nav-item.active .ml-nav-label { color: ${G.gold}; }
  .ml-nav-active-bar {
    position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
    height: 2px; border-radius: 2px;
    background: linear-gradient(90deg, transparent, ${G.gold}, transparent);
    animation: ml-activeBar 0.3s ease both;
  }
  .ml-nav-pip {
    position: absolute; top: 8px; right: calc(50% - 16px);
    width: 6px; height: 6px; border-radius: 50%;
    background: ${G.gold};
    box-shadow: 0 0 6px rgba(201,168,76,0.8);
    animation: ml-dot 1.4s ease-in-out infinite;
  }

  /* ── CHAT TOGGLE BUTTON ── */
  .ml-chat-fab {
    position: fixed; right: 18px; bottom: 82px; z-index: 200;
    width: 50px; height: 50px; border-radius: 50%;
    background: linear-gradient(135deg, ${G.gold} 0%, #8A6420 100%);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 24px rgba(201,168,76,0.45), 0 2px 8px rgba(0,0,0,0.5);
    transition: all 0.22s ease;
    animation: ml-chatPulse 2.8s ease-in-out infinite;
    -webkit-tap-highlight-color: transparent;
  }
  .ml-chat-fab:hover { transform: scale(1.08); box-shadow: 0 10px 36px rgba(201,168,76,0.65); }
  .ml-chat-fab:active { transform: scale(0.95); }
  .ml-chat-fab.open { background: linear-gradient(135deg, rgba(201,168,76,0.3) 0%, rgba(201,168,76,0.1) 100%); border: 1px solid ${G.goldBorder}; animation: none; }

  /* ── CHAT PANEL ── */
  .ml-chat-panel {
    position: fixed; left: 0; right: 0; bottom: 68px; z-index: 150;
    height: 60vh; max-height: 480px;
    background: rgba(8,8,18,0.97);
    border-top: 1px solid ${G.border};
    border-radius: 22px 22px 0 0;
    display: flex; flex-direction: column;
    overflow: hidden;
    backdrop-filter: blur(28px);
    box-shadow: 0 -20px 80px rgba(0,0,0,0.7), 0 -1px 0 rgba(201,168,76,0.18);
    animation: ml-slideUp 0.38s cubic-bezier(0.16,1,0.3,1) both;
  }
  .ml-chat-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px 10px;
    border-bottom: 1px solid ${G.border};
    flex-shrink: 0;
  }
  .ml-chat-title {
    font-family: ${G.font}; font-size: 13px; font-weight: 700;
    color: ${G.gold}; letter-spacing: 0.14em;
    display: flex; align-items: center; gap: 8px;
  }
  .ml-chat-close {
    width: 28px; height: 28px; border-radius: 7px;
    background: rgba(201,168,76,0.07); border: 1px solid ${G.border};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.18s;
    color: ${G.muted};
  }
  .ml-chat-close:hover { background: rgba(201,168,76,0.14); color: ${G.gold}; }
  .ml-chat-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

  /* ── MODAL OVERLAY ── */
  .ml-modal-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(4,4,10,0.88);
    backdrop-filter: blur(12px);
    display: flex; align-items: flex-end;
    animation: ml-fadeIn 0.25s ease both;
  }
  .ml-modal-sheet {
    width: 100%; max-height: 92vh;
    background: ${G.surface};
    border-radius: 24px 24px 0 0;
    border-top: 1px solid ${G.border};
    overflow-y: auto;
    padding: 0 0 env(safe-area-inset-bottom, 0);
    animation: ml-modalIn 0.42s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow: 0 -20px 80px rgba(0,0,0,0.8), 0 -1px 0 rgba(201,168,76,0.24);
  }
  .ml-modal-handle {
    width: 36px; height: 4px; border-radius: 2px;
    background: rgba(201,168,76,0.28);
    margin: 14px auto 0;
  }
  .ml-modal-inner { padding: 20px 20px 32px; }
  .ml-modal-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .ml-modal-title {
    font-family: ${G.font}; font-size: 18px; font-weight: 800;
    color: ${G.text}; letter-spacing: 0.06em;
  }
  .ml-modal-close {
    width: 34px; height: 34px; border-radius: 9px;
    background: rgba(255,255,255,0.04); border: 1px solid ${G.border};
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px; color: ${G.muted};
    transition: all 0.2s;
  }
  .ml-modal-close:hover { background: rgba(201,168,76,0.08); color: ${G.gold}; border-color: ${G.goldBorder}; }

  /* Magic16 info badge inside modal */
  .ml-m16-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 7px 14px; border-radius: 20px; margin-bottom: 18px;
    background: rgba(201,168,76,0.07);
    border: 1px solid rgba(201,168,76,0.20);
    font-family: ${G.mono}; font-size: 10px; color: ${G.gold};
    letter-spacing: 0.10em;
  }
`;

// ─── NAV ICONS ───────────────────────────────────────────────────────────────
const NavIcons = {
  gpt: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        fill={active ? G.gold : "none"}
        stroke={active ? G.gold : G.muted} strokeWidth="1.5"/>
      <path d="M8 12h8M8 8.5h5M8 15.5h6"
        stroke={active ? "#06060D" : G.muted} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  magic16: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
        fill={active ? G.gold : "none"}
        stroke={active ? G.gold : G.muted} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  profile: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4"
        fill={active ? G.gold : "none"}
        stroke={active ? G.gold : G.muted} strokeWidth="1.5"/>
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
        stroke={active ? G.gold : G.muted} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  settings: (active) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3"
        fill={active ? G.gold : "none"}
        stroke={active ? G.gold : G.muted} strokeWidth="1.5"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={active ? G.gold : G.muted} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

// Chat icon
const ChatIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    {open
      ? <path d="M18 6L6 18M6 6l12 12" stroke="#06060D" strokeWidth="2.2" strokeLinecap="round"/>
      : <>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            fill="none" stroke="#06060D" strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="8.5" cy="11" r="1" fill="#06060D"/>
          <circle cx="12" cy="11" r="1" fill="#06060D"/>
          <circle cx="15.5" cy="11" r="1" fill="#06060D"/>
        </>
    }
  </svg>
);

// ─── MANIFIX LOGO ──────────────────────────────────────────────────────────────
const MxLogo = ({ size = 28 }) => (
  <div className="ml-topbar-logo" style={{ width: size + 6, height: size + 6 }}>
    <img src="/assets/logo.png" alt="ManifiX" width={size} height={size}
      style={{ objectFit: "contain", filter: "drop-shadow(0 0 4px rgba(201,168,76,0.55))" }}
      onError={e => {
        e.currentTarget.style.display = "none";
      }}
    />
  </div>
);

// ─── CLOSE X ──────────────────────────────────────────────────────────────────
const CloseX = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

// ─── MOBILE LAYOUT ────────────────────────────────────────────────────────────
export default function MobileLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [chatOpen,  setChatOpen]  = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [magicOpen, setMagicOpen] = useState(false);
  const mainRef = useRef(null);

  // Inject CSS once
  useEffect(() => {
    const id = "manifix-mobile-layout-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = LAYOUT_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Close chat on route change
  useEffect(() => { setChatOpen(false); }, [location.pathname]);

  const menuItems = [
    { name: "GPT",      path: "/app/gpt",      icon: "gpt"     },
    { name: "Magic16",  path: "/app/magic16",  icon: "magic16" },
    { name: "Profile",  path: "/app/profile",  icon: "profile" },
    { name: "Settings", path: "/app/settings", icon: "settings"},
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="ml-root">

      {/* ── Atmosphere ── */}
      <div className="ml-grid" />
      <div className="ml-orb" style={{
        width: 400, height: 400, top: -100, left: -80,
        background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
      }} />
      <div className="ml-orb" style={{
        width: 300, height: 300, bottom: 80, right: -60,
        background: "radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 70%)",
        animationDelay: "-7s",
      }} />

      {/* ── TOP BAR ── */}
      <header className="ml-topbar">
        {/* Brand */}
        <div className="ml-topbar-brand" onClick={() => navigate("/app")} style={{ cursor: "pointer" }}>
          <MxLogo size={26} />
          <div>
            <div className="ml-topbar-name ml-gold-text">MANIFIX AI</div>
            <div className="ml-topbar-sub">HUMAN PERFORMANCE OS</div>
          </div>
        </div>

        {/* Actions */}
        <div className="ml-topbar-actions">
          {/* Streak pill */}
          <div className="ml-streak">
            🔥 <span style={{ fontWeight: 600 }}>12</span>
          </div>

          {/* Magic16 trigger */}
          <button className="ml-magic-btn" onClick={() => setMagicOpen(true)}>
            <span style={{ fontSize: 13 }}>⚡</span>
            <span>M16</span>
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="ml-main" ref={mainRef}>
        <Outlet />
      </main>

      {/* ── CHAT FAB ── */}
      <button
        className={`ml-chat-fab${chatOpen ? " open" : ""}`}
        onClick={() => setChatOpen(v => !v)}
        aria-label={chatOpen ? "Close chat" : "Open AI chat"}
      >
        <ChatIcon open={chatOpen} />
      </button>

      {/* ── CHAT PANEL ── */}
      {chatOpen && (
        <div className="ml-chat-panel">
          <div className="ml-chat-header">
            <div className="ml-chat-title">
              <span>🤖</span>
              <span>AI COACH</span>
              {/* Live indicator */}
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#4ADE80",
                boxShadow: "0 0 6px rgba(74,222,128,0.8)",
                display: "inline-block",
              }} />
            </div>
            <button className="ml-chat-close" onClick={() => setChatOpen(false)}>
              <CloseX />
            </button>
          </div>
          <div className="ml-chat-body">
            <ChatBox />
            <ChatInput
              value={chatInput}
              onChange={setChatInput}
              onSend={() => { setChatInput(""); }}
            />
          </div>
        </div>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav className="ml-bottomnav">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              className={`ml-nav-item${active ? " active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {/* New message pip on GPT when chat has unread */}
              {item.icon === "gpt" && !chatOpen && (
                <span className="ml-nav-pip" />
              )}

              <span className="ml-nav-icon">
                {NavIcons[item.icon]?.(active)}
              </span>

              <span className="ml-nav-label" style={{ color: active ? G.gold : G.dim }}>
                {item.name}
              </span>

              {active && (
                <span className="ml-nav-active-bar" style={{ width: 24 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── MAGIC16 MODAL ── */}
      {magicOpen && (
        <div className="ml-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMagicOpen(false); }}>
          <div className="ml-modal-sheet">
            <div className="ml-modal-handle" />
            <div className="ml-modal-inner">
              <div className="ml-modal-head">
                <h2 className="ml-modal-title">
                  <span className="ml-gold-text">MAGIC16</span> RITUAL
                </h2>
                <button className="ml-modal-close" onClick={() => setMagicOpen(false)}>
                  <CloseX />
                </button>
              </div>

              {/* Info badge */}
              <div className="ml-m16-badge">
                ⚡ 8 MIN YOGA &nbsp;·&nbsp; 🧘 8 MIN MEDITATION
              </div>

              {/* Divider */}
              <div style={{
                height: 1, marginBottom: 20,
                background: `linear-gradient(90deg, transparent, ${G.border}, transparent)`,
              }} />

              <Magic16Controls />
              <Magic16Timer />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
