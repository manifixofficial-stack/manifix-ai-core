import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Injecting your premium gold and black cyber global layouts right through the code string to prevent file lookup crashes!
const injectGlobalGameStyles = () => {
  const cssId = "manifix-arcade-core-theme";
  if (document.getElementById(cssId)) return;
  const styleElement = document.createElement("style");
  styleElement.id = cssId;
  styleElement.textContent = `
    /* Fixed: the previous @import pointed at the bare "googleapis.com" domain
       with no path/family params, so it silently failed to load anything —
       every 'Orbitron' / 'Fredoka' font-family declaration across the app
       (permission screens, HUD, scoreboard, buttons) was quietly falling
       back to the browser's default sans-serif the whole time. This is the
       correct fonts.googleapis.com CSS2 endpoint with the actual weights
       used throughout the codebase. */
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Fredoka:wght@400;500;600;700&display=swap');

    html, body {
      margin: 0; padding: 0; width: 100%; height: 100%;
      background-color: #08080a; color: #f5f5f7;
      /* Default body font is now Fredoka to match index.html's stated
         typography and every component's actual usage — 'JetBrains Mono'
         was never imported or referenced anywhere else in the codebase. */
      font-family: 'Fredoka', sans-serif; overflow: hidden;
      user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; touch-action: none;
    }
    #root, .app-container {
      width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative;
    }
    .lobby-card {
      text-align: center; background: #121217; padding: 35px 25px; border-radius: 20px; border: 2px solid #ffca28; box-shadow: 0 0 30px rgba(255, 202, 40, 0.2); width: 85%; max-width: 320px; box-sizing: border-box;
    }
    .lobby-card h1 { font-family: 'Orbitron', sans-serif; color: #ffca28; font-size: 1.8rem; margin: 0 0 12px; line-height: 1.2; letter-spacing: 2px; }
    .lobby-card p { font-family: 'Fredoka', sans-serif; color: #8a8a93; font-size: 13px; line-height: 1.5; margin: 0 0 25px; }
    .lobby-card input { box-sizing: border-box; padding: 14px; font-size: 15px; border-radius: 8px; width: 100%; border: 1px solid #2d2d3f; background: #000000; color: #ffca28; text-align: center; font-weight: bold; margin-bottom: 16px; outline: none; }
    .gold-btn { padding: 14px; font-size: 15px; font-weight: bold; background: linear-gradient(135deg, #ffca28, #b58900); color: #000000; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-family: 'Orbitron', sans-serif; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 202, 40, 0.2); }
    .character-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
    .char-button { padding: 15px 20px; font-size: 15px; font-weight: bold; color: #f5f5f7; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; cursor: pointer; background: rgba(255, 255, 255, 0.02); display: flex; justify-content: space-between; align-items: center; font-family: 'Orbitron', sans-serif; transition: all 0.2s ease; }
    .char-button.disabled { background: #17171d !important; color: #3e3e4d !important; border-color: #1c1c24 !important; cursor: not-allowed; }
    .arena-wrapper { width: 100%; height: 100%; display: flex; flex-direction: column; padding: 15px; box-sizing: border-box; }
    .arena-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1c1c24; padding-bottom: 10px; margin-bottom: 12px; }
    .arena-header h2 { margin: 0; font-size: 13px; color: #ffca28; font-family: 'Orbitron', sans-serif; }
    .arena-grid { flex: 1; display: flex; flex-direction: column; gap: 15px; position: relative; }
    .battle-canvas { background: #000000; border: 3px solid #ffca28; border-radius: 12px; box-shadow: 0 0 25px rgba(255, 202, 40, 0.08); width: 100%; height: auto; aspect-ratio: 4/3; box-sizing: border-box; display: block; }
    .sidebar-rankings { background: #121217; padding: 14px; border-radius: 12px; border: 1px solid #1c1c24; display: flex; flex-direction: column; gap: 8px; }
    .sidebar-rankings h3 { margin: 0 0 4px; font-size: 12px; color: #8a8a93; font-family: 'Orbitron', sans-serif; }
    .touch-joystick-base { width: 100px; height: 100px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 202, 40, 0.25); border-radius: 50%; margin: 10px auto 5px; display: flex; justify-content: center; align-items: center; position: relative; }
    .touch-joystick-knob { width: 40px; height: 40px; background: #ffca28; border-radius: 50%; position: absolute; pointer-events: none; box-shadow: 0 0 15px #ffca28; }
    .hack-alert-banner { position: absolute; top: 15px; left: 50%; transform: translateX(-50%); background: rgba(255, 10, 50, 0.9); color: white; padding: 12px 24px; font-weight: bold; font-family: 'Orbitron', sans-serif; border-radius: 6px; font-size: 11px; text-align: center; z-index: 10; animation: crashShake 0.15s infinite; }
    .error-banner { position: absolute; top: 15px; background: rgba(255, 51, 51, 0.15); color: #ff3333; border: 1px solid #ff3333; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: bold; z-index: 100; }
    @keyframes crashShake { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-49%) translateY(1px); } }
    .flash-gold { animation: dynamicFlashEffect 0.4s ease-out; }
    @keyframes dynamicFlashEffect { 0% { box-shadow: inset 0 0 120px rgba(255, 202, 40, 0.95); } }

    /* Fallback UI for the ErrorBoundary below */
    .crash-fallback {
      text-align: center; background: #121217; padding: 35px 25px; border-radius: 20px;
      border: 2px solid #ff3333; box-shadow: 0 0 30px rgba(255, 51, 51, 0.2);
      width: 85%; max-width: 320px; box-sizing: border-box; color: #f5f5f7;
    }
    .crash-fallback h1 { font-family: 'Orbitron', sans-serif; color: #ff3333; font-size: 1.3rem; margin: 0 0 12px; letter-spacing: 1px; }
    .crash-fallback p { font-family: 'Fredoka', sans-serif; color: #8a8a93; font-size: 13px; line-height: 1.5; margin: 0 0 20px; }
  `;
  document.head.appendChild(styleElement);
};

injectGlobalGameStyles();

// Register clean background Service Worker script
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("🤖 Game Service Worker Live"))
      .catch((err) => console.warn("SW status failure:", err));
  });
}

// This app leans hard on browser APIs that can throw outside React's normal
// event flow in ways that are still surfaced as render errors — camera
// getUserMedia rejections, geolocation failures, device orientation
// permission prompts, the Socket.IO client, canvas-confetti. Without a
// boundary, any uncaught error during render blanks the entire screen with
// no way back in short of a hard refresh. This catches that and offers a
// reload instead of a dead app.
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
            <button className="gold-btn" onClick={this.handleReload}>
              RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
