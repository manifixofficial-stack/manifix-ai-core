// ====================================================================
// 🚀 main.jsx — Entry point & global stability core
// ====================================================================
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GameProvider } from "./lib/GameContext";

const injectGlobalGameStyles = () => {
  const cssId = "manifix-arcade-core-theme";
  if (document.getElementById(cssId)) return;
  const styleElement = document.createElement("style");
  styleElement.id = cssId;
  styleElement.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Fredoka:wght@400;500;600;700&family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background-color: #08080a; color: #f5f5f7; font-family: 'Fredoka', sans-serif; overflow: hidden; }
    #root, .app-container { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
    .game-lock-zone { touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
    .lobby-card { text-align: center; background: #121217; padding: 35px 25px; border-radius: 20px; border: 2px solid #ffca28; box-shadow: 0 0 30px rgba(255, 202, 40, 0.2); width: 85%; max-width: 320px; box-sizing: border-box; }
    .lobby-card h1 { font-family: 'Orbitron', sans-serif; color: #ffca28; font-size: 1.8rem; margin: 0 0 12px; line-height: 1.2; letter-spacing: 2px; }
    .lobby-card p { font-family: 'Fredoka', sans-serif; color: #8a8a93; font-size: 13px; line-height: 1.5; margin: 0 0 25px; }
    .lobby-card input { box-sizing: border-box; padding: 14px; font-size: 15px; border-radius: 8px; width: 100%; border: 1px solid #2d2d3f; background: #000000; color: #ffca28; text-align: center; font-weight: bold; margin-bottom: 16px; outline: none; }
    .gold-btn { padding: 14px; font-size: 15px; font-weight: bold; background: linear-gradient(135deg, #ffca28, #b58900); color: #000000; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-family: 'Orbitron', sans-serif; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 202, 40, 0.2); }
    .character-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
    .char-button { padding: 15px 20px; font-size: 15px; font-weight: bold; color: #f5f5f7; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; cursor: pointer; background: rgba(255, 255, 255, 0.02); display: flex; justify-content: space-between; align-items: center; font-family: 'Orbitron', sans-serif; transition: all 0.2s ease; }
    .char-button.disabled { background: #17171d !important; color: #3e3e4d !important; border-color: #1c1c24 !important; cursor: not-allowed; }
    .arena-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; box-sizing: border-box; padding: calc(15px + env(safe-area-inset-top)) 15px calc(15px + env(safe-area-inset-bottom)); }
    .arena-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1c1c24; padding-bottom: 10px; margin-bottom: 12px; }
    .arena-header h2 { margin: 0; font-size: 13px; color: #ffca28; font-family: 'Orbitron', sans-serif; }
    .arena-grid { flex: 1; display: flex; flex-direction: column; gap: 15px; position: relative; }
    .battle-canvas { background: #000000; border: 3px solid #ffca28; border-radius: 12px; box-shadow: 0 0 25px rgba(255, 202, 40, 0.08); width: 100%; height: auto; aspect-ratio: 4/3; box-sizing: border-box; display: block; }
    .sidebar-rankings { background: #121217; padding: 14px; border-radius: 12px; border: 1px solid #1c1c24; display: flex; flex-direction: column; gap: 8px; }
    .sidebar-rankings h3 { margin: 0 0 4px; font-size: 12px; color: #8a8a93; font-family: 'Orbitron', sans-serif; }
    .touch-joystick-base { width: 100px; height: 100px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 202, 40, 0.25); border-radius: 50%; margin: 10px auto 5px; display: flex; justify-content: center; align-items: center; position: relative; }
    .touch-joystick-knob { width: 40px; height: 40px; background: #ffca28; border-radius: 50%; position: absolute; pointer-events: none; box-shadow: 0 0 15px #ffca28; }
    .hack-alert-banner { position: absolute; left: 50%; top: calc(15px + env(safe-area-inset-top)); transform: translateX(-50%); background: rgba(255, 10, 50, 0.9); color: white; padding: 12px 24px; font-weight: bold; font-family: 'Orbitron', sans-serif; border-radius: 6px; font-size: 11px; text-align: center; z-index: 10; animation: crashShake 0.15s infinite; }
    .error-banner { position: absolute; top: calc(15px + env(safe-area-inset-top)); background: rgba(255, 51, 51, 0.15); color: #ff3333; border: 1px solid #ff3333; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: bold; z-index: 100; }
    @keyframes crashShake { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-49%) translateY(1px); } }
    .flash-gold { animation: dynamicFlashEffect 0.4s ease-out; }
    @keyframes dynamicFlashEffect { 0% { box-shadow: inset 0 0 120px rgba(255, 202, 40, 0.95); } }
    .crash-fallback { text-align: center; background: #121217; padding: 35px 25px; border-radius: 20px; border: 2px solid #ff3333; box-shadow: 0 0 30px rgba(255, 51, 51, 0.2); width: 85%; max-width: 320px; box-sizing: border-box; color: #f5f5f7; }
    .crash-fallback h1 { font-family: 'Orbitron', sans-serif; color: #ff3333; font-size: 1.3rem; margin: 0 0 12px; letter-spacing: 1px; }
    .crash-fallback p { font-family: 'Fredoka', sans-serif; color: #8a8a93; font-size: 13px; line-height: 1.5; margin: 0 0 20px; }
    .boot-screen { position: fixed; inset: 0; z-index: 9999; background: #08080a; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; animation: bootFadeOut 0.4s ease 0.6s forwards; }
    .boot-logo { font-family: 'Bebas Neue', sans-serif; font-size: 2.6rem; letter-spacing: 4px; background: linear-gradient(135deg, #ffc83c, #39ff88 60%, #ff3b94); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0 0 30px rgba(255, 200, 60, 0.35); animation: bootPulse 1.1s ease-in-out infinite; }
    .boot-tagline { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #6f6f7a; }
    .boot-dots { display: flex; gap: 8px; }
    .boot-dots span { width: 8px; height: 8px; border-radius: 50%; background: #39ff88; animation: bootDotBounce 0.9s ease-in-out infinite; }
    .boot-dots span:nth-child(2) { animation-delay: 0.15s; background: #ffc83c; }
    .boot-dots span:nth-child(3) { animation-delay: 0.3s; background: #ff3b94; }
    @keyframes bootPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(0.97); } }
    @keyframes bootDotBounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-6px); opacity: 1; } }
    @keyframes bootFadeOut { to { opacity: 0; visibility: hidden; pointer-events: none; } }
  `;
  document.head.appendChild(styleElement);
};

injectGlobalGameStyles();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("🤖 Game Service Worker Live"))
      .catch((err) => console.warn("SW status failure:", err));
  });
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ManifiX AI crashed:", error, info);
  }
  handleReload = () => {
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="app-container">
          <div className="crash-fallback">
            <h1>SIGNAL LOST</h1>
            <p>Something crashed mid-hunt. A quick reload usually fixes it.</p>
            <button className="gold-btn" onClick={this.handleReload}> RELOAD </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [booting, setBooting] = useState(true);

  // Detects whether this build is running inside the native Capacitor
  // shell vs. a plain browser tab. Passed down to <App> so it can gate
  // anything that behaves differently on native (e.g. billing UI — App
  // Store/Play Store policy generally doesn't allow linking out to
  // external payment flows like the Razorpay checkout server.js exposes).
  // NOTE: App.jsx does not currently read this prop — this wiring is in
  // place for when that gating is added there.
  const [isNative] = useState(() => Boolean(window.Capacitor?.isNativePlatform?.()));

  useEffect(() => {
    const id = window.setTimeout(() => setBooting(false), 650);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      {booting && (
        <div className="boot-screen" aria-hidden="true">
          <div className="boot-logo">VEGGIE GO</div>
          <div className="boot-tagline">spawning nearby…</div>
          <div className="boot-dots">
            <span /><span /><span />
          </div>
        </div>
      )}
      <AppErrorBoundary>
        <App isNative={isNative} />
      </AppErrorBoundary>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameProvider>
      <Root />
    </GameProvider>
  </React.StrictMode>
);
