import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   STYLE INJECTION
───────────────────────────────────────────── */
function injectStyles() {
  if (document.getElementById("ob-styles")) return;
  const s = document.createElement("style");
  s.id = "ob-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes ob-scan {
      0%   { top: -10%; opacity: 0; }
      10%  { opacity: 1; }
      90%  { opacity: 1; }
      100% { top: 110%; opacity: 0; }
    }
    @keyframes ob-glitch-1 {
      0%,100% { clip-path: inset(0 0 95% 0); transform: translateX(0); }
      20%     { clip-path: inset(30% 0 50% 0); transform: translateX(-4px); }
      40%     { clip-path: inset(60% 0 10% 0); transform: translateX(4px); }
      60%     { clip-path: inset(10% 0 70% 0); transform: translateX(-2px); }
      80%     { clip-path: inset(80% 0 5%  0); transform: translateX(2px); }
    }
    @keyframes ob-glitch-2 {
      0%,100% { clip-path: inset(50% 0 30% 0); transform: translateX(0); opacity: 0; }
      25%     { clip-path: inset(20% 0 60% 0); transform: translateX(6px);  opacity: 1; }
      75%     { clip-path: inset(70% 0 10% 0); transform: translateX(-6px); opacity: 1; }
    }
    @keyframes ob-blink {
      0%,100% { opacity: 1; } 50% { opacity: 0; }
    }
    @keyframes ob-pulse-gold {
      0%,100% { box-shadow: 0 0 0 0 rgba(200,168,75,.5); }
      50%      { box-shadow: 0 0 0 12px rgba(200,168,75,0); }
    }
    @keyframes ob-breathe {
      0%,100% { opacity: .2; transform: scale(1); }
      50%      { opacity: .45; transform: scale(1.1); }
    }
    @keyframes ob-shake {
      0%,100% { transform: translateX(0); }
      20%     { transform: translateX(-6px); }
      40%     { transform: translateX(6px); }
      60%     { transform: translateX(-4px); }
      80%     { transform: translateX(4px); }
    }

    .ob-blink     { animation: ob-blink 1s step-end infinite; }
    .ob-shake     { animation: ob-shake .4s ease; }
    .ob-pulse-btn { animation: ob-pulse-gold 2.2s ease-in-out infinite; }

    /* glitch layers */
    .ob-glitch { position: relative; }
    .ob-glitch::before,
    .ob-glitch::after {
      content: attr(data-text);
      position: absolute;
      inset: 0;
      font-family: inherit;
      font-size: inherit;
      letter-spacing: inherit;
      color: inherit;
    }
    .ob-glitch::before {
      color: #ff3c3c;
      animation: ob-glitch-1 2.5s infinite;
    }
    .ob-glitch::after {
      color: #c8a84b;
      animation: ob-glitch-2 2.5s infinite;
    }

    /* option buttons */
    .ob-option {
      width: 100%;
      padding: 14px 16px;
      background: #0e0e0e;
      border: 1px solid #1e1e1e;
      color: #3a3a3a;
      font-family: 'DM Mono', monospace;
      font-size: 11px;
      letter-spacing: .2em;
      text-transform: uppercase;
      cursor: pointer;
      text-align: left;
      transition: border-color .2s, color .2s, background .2s;
    }
    .ob-option:hover   { border-color: #2e2e2e; color: #666; }
    .ob-option.sel-gold {
      border-color: #c8a84b;
      color: #c8a84b;
      background: #0f0d08;
    }
    .ob-option.sel-red {
      border-color: #ff3c3c;
      color: #ff3c3c;
      background: #0f0808;
    }

    /* commitment input */
    .ob-commit-input {
      width: 100%;
      background: #0c0c0c;
      border: 1px solid #1e1e1e;
      border-top: none;
      color: #e8e4d9;
      font-family: 'DM Mono', monospace;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: .18em;
      padding: 16px;
      outline: none;
      caret-color: #c8a84b;
      transition: border-color .2s;
    }
    .ob-commit-input:focus { border-color: #c8a84b; }
    .ob-commit-input.ob-error { border-color: #ff3c3c; }
    .ob-commit-input::placeholder { color: #2a2a2a; letter-spacing: .12em; }

    /* step dots */
    .ob-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #1a1a1a;
      transition: background .3s;
    }
    .ob-dot.active { background: #c8a84b; }
  `;
  document.head.appendChild(s);
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const TOTAL_STEPS = 5; // 0-intro, 1-goal, 2-intensity, 3-warning, 4-identity, 5-lock => steps 1-5

const GOALS = [
  { val: "Discipline", icon: "⚔" },
  { val: "Focus",      icon: "🎯" },
  { val: "Power",      icon: "⚡" },
  { val: "Control",    icon: "🧠" },
];

const INTENSITIES = [
  { val: "Standard",   desc: "16 min / day. Measured.", sel: "sel-gold" },
  { val: "High",       desc: "Harder. Faster. No breaks.", sel: "sel-gold" },
  { val: "NO EXCUSES", desc: "Maximum difficulty. AI watches everything.", sel: "sel-red" },
];

const IDENTITIES = [
  "I don't quit.",
  "I finish what I start.",
  "I am in the top 1%.",
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const VARIANTS = {
  enter:  { opacity: 0, y: 28, scale: 0.98 },
  center: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.42, ease: "easeOut" } },
  exit:   { opacity: 0, y: -20, scale: 0.97, transition: { duration: 0.28, ease: "easeIn" } },
};

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Onboarding() {
  const navigate = useNavigate();

  // ── phase: "intro" | "steps"
  const [phase, setPhase]       = useState("intro");
  const [step,  setStep]        = useState(1);   // 1..5

  // ── user choices
  const [goal,      setGoal]      = useState("");
  const [intensity, setIntensity] = useState("");
  const [identity,  setIdentity]  = useState("");

  // ── final lock step
  const [commitText, setCommitText] = useState("");
  const [inputError, setInputError] = useState(false);
  const [loading,    setLoading]    = useState(false);

  const spokeRef = useRef(false);   // guard: speak only once on mount

  useEffect(() => { injectStyles(); }, []);

  // ── voice intro (fires once)
  const speak = useCallback((text, rate = 0.88) => {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = rate;
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  }, []);

  useEffect(() => {
    if (spokeRef.current) return;
    spokeRef.current = true;
    speak("Initializing neural discipline protocol.");
    const t = setTimeout(() => setPhase("steps"), 2800);
    return () => clearTimeout(t);
  }, [speak]);

  // ── final commit
  const handleFinalLock = useCallback(() => {
    if (loading) return;
    if (commitText !== "I WILL NOT QUIT") {
      setInputError(true);
      setTimeout(() => setInputError(false), 600);
      return;
    }

    setLoading(true);
    speak("Welcome to the one percent.", 0.82);

    // BUG FIX: do NOT write magic16_last_date here.
    // Dashboard checks lastDate === today to mark mission done.
    // A brand-new user should land with mission PENDING.
    localStorage.setItem("magic16_started",   "true");
    localStorage.setItem("magic16_streak",    "0");     // starts at 0; increments on first session complete
    localStorage.setItem("magic16_xp",        "0");
    localStorage.setItem("magic16_level",     "1");
    localStorage.setItem("magic16_goal",      goal);
    localStorage.setItem("magic16_intensity", intensity);
    localStorage.setItem("magic16_identity",  identity);
    // magic16_last_date intentionally NOT set — recordSessionComplete() sets it after first session

    setTimeout(() => navigate("/app/dashboard", { replace: true }), 1600);
  }, [loading, commitText, goal, intensity, identity, speak, navigate]);

  /* ── shared layout wrappers */
  const card = {
    width: "min(400px, 94vw)",
    border: "1px solid #1a1a1a",
    background: "#0b0b0b",
    padding: "32px 28px",
    position: "relative",
    overflow: "hidden",
  };

  const label = {
    fontSize: 9,
    letterSpacing: "0.25em",
    color: "#2e2e2e",
    textTransform: "uppercase",
    marginBottom: 8,
    display: "block",
  };

  const heading = {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "clamp(38px, 10vw, 56px)",
    letterSpacing: "0.04em",
    lineHeight: 0.95,
    color: "#e8e4d9",
    marginBottom: 24,
  };

  const nextBtn = (disabled) => ({
    width: "100%",
    marginTop: 16,
    padding: "15px 0",
    background: disabled ? "#0e0e0e" : "#c8a84b",
    color: disabled ? "#282828" : "#080808",
    border: disabled ? "1px solid #181818" : "none",
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s",
  });

  const stepDots = (current) => (
    <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className={`ob-dot ${i + 1 <= current ? "active" : ""}`} />
      ))}
    </div>
  );

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    <div style={{
      minHeight: "100dvh",
      background: "#080808",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: "#e8e4d9",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ambient glow */}
      <div style={{
        position: "fixed",
        top: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: 480, height: 280,
        background: "radial-gradient(ellipse, rgba(200,168,75,.1) 0%, transparent 70%)",
        animation: "ob-breathe 5s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* scan line */}
      <div style={{
        position: "fixed",
        left: 0, right: 0, height: 60,
        background: "linear-gradient(180deg,transparent,rgba(200,168,75,.04),transparent)",
        animation: "ob-scan 3.5s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* corner marks */}
      {[
        { top: 16, left: 16,  borderTopWidth: 2, borderLeftWidth: 2  },
        { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2 },
        { bottom: 16, left: 16,  borderBottomWidth: 2, borderLeftWidth: 2  },
        { bottom: 16, right: 16, borderBottomWidth: 2, borderRightWidth: 2 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "fixed",
          width: 18, height: 18,
          borderColor: "#1e1e1e",
          borderStyle: "solid",
          borderWidth: 0,
          ...pos,
        }} />
      ))}

      <AnimatePresence mode="wait">

        {/* ══ INTRO PHASE ══ */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            style={{ textAlign: "center", position: "relative", zIndex: 1 }}
          >
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(36px, 10vw, 64px)",
              letterSpacing: "0.1em",
              color: "#e8e4d9",
              marginBottom: 16,
            }}
              className="ob-glitch"
              data-text="SCANNING..."
            >
              SCANNING...
            </div>
            <div style={{
              fontSize: 10,
              letterSpacing: "0.25em",
              color: "#2a2a2a",
              textTransform: "uppercase",
            }}>
              <span className="ob-blink" style={{ color: "#c8a84b" }}>●</span>
              {" "}Neural discipline protocol initializing
            </div>
          </motion.div>
        )}

        {/* ══ STEPS PHASE ══ */}
        {phase === "steps" && (
          <div style={{ position: "relative", zIndex: 1, width: "min(400px, 94vw)" }}>
            <AnimatePresence mode="wait">

              {/* STEP 1 — GOAL */}
              {step === 1 && (
                <motion.div key="s1" variants={VARIANTS} initial="enter" animate="center" exit="exit">
                  <div style={card}>
                    {stepDots(1)}
                    <span style={label}>— Step 1 of {TOTAL_STEPS}</span>
                    <div style={heading}>What is your<br />objective?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 }}>
                      {GOALS.map(({ val, icon }) => (
                        <button
                          key={val}
                          className={`ob-option ${goal === val ? "sel-gold" : ""}`}
                          onClick={() => setGoal(val)}
                        >
                          <span style={{ marginRight: 10, opacity: .6 }}>{icon}</span>
                          {val}
                        </button>
                      ))}
                    </div>
                    <button style={nextBtn(!goal)} disabled={!goal} onClick={() => setStep(2)}>
                      Next →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — INTENSITY */}
              {step === 2 && (
                <motion.div key="s2" variants={VARIANTS} initial="enter" animate="center" exit="exit">
                  <div style={card}>
                    {stepDots(2)}
                    <span style={label}>— Step 2 of {TOTAL_STEPS}</span>
                    <div style={heading}>Choose your<br />intensity.</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {INTENSITIES.map(({ val, desc, sel }) => (
                        <button
                          key={val}
                          className={`ob-option ${intensity === val ? sel : ""}`}
                          onClick={() => setIntensity(val)}
                          style={{ flexDirection: "column", alignItems: "flex-start", gap: 3 }}
                        >
                          <span style={{ fontWeight: 500 }}>{val}</span>
                          <span style={{ fontSize: 9, opacity: .5, letterSpacing: ".12em", textTransform: "none", fontStyle: "italic" }}>
                            {desc}
                          </span>
                        </button>
                      ))}
                    </div>
                    <button style={nextBtn(!intensity)} disabled={!intensity} onClick={() => setStep(3)}>
                      Next →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 — WARNING */}
              {step === 3 && (
                <motion.div key="s3" variants={VARIANTS} initial="enter" animate="center" exit="exit">
                  <div style={{
                    ...card,
                    border: "1px solid #2a1010",
                    background: "#0a0808",
                  }}>
                    {stepDots(3)}
                    <div style={{
                      fontSize: 9,
                      letterSpacing: "0.25em",
                      color: "#ff3c3c",
                      textTransform: "uppercase",
                      marginBottom: 20,
                    }}>
                      ⚠ System Warning
                    </div>
                    <div style={{
                      ...heading,
                      color: "#ff5c5c",
                    }}>
                      Miss once.<br />Start over.
                    </div>
                    <div style={{
                      fontSize: 11,
                      lineHeight: 1.85,
                      color: "#3a2a2a",
                      letterSpacing: "0.08em",
                      marginBottom: 24,
                      borderLeft: "2px solid #2a1010",
                      paddingLeft: 12,
                    }}>
                      The system does not negotiate. Miss a single day
                      and your streak resets to zero. No exceptions.
                      No recovery windows. No excuses accepted.
                    </div>
                    <button
                      style={{
                        ...nextBtn(false),
                        background: "#1a0808",
                        color: "#ff5c5c",
                        border: "1px solid #2a1010",
                      }}
                      onClick={() => setStep(4)}
                    >
                      I accept the terms →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4 — IDENTITY */}
              {step === 4 && (
                <motion.div key="s4" variants={VARIANTS} initial="enter" animate="center" exit="exit">
                  <div style={card}>
                    {stepDots(4)}
                    <span style={label}>— Step 4 of {TOTAL_STEPS}</span>
                    <div style={heading}>Choose your<br />identity.</div>
                    <p style={{
                      fontSize: 11,
                      color: "#3a3a3a",
                      letterSpacing: "0.08em",
                      lineHeight: 1.7,
                      marginBottom: 18,
                    }}>
                      This is the statement the system will hold you to.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {IDENTITIES.map((id) => (
                        <button
                          key={id}
                          className={`ob-option ${identity === id ? "sel-gold" : ""}`}
                          onClick={() => setIdentity(id)}
                          style={{ fontStyle: "italic" }}
                        >
                          "{id}"
                        </button>
                      ))}
                    </div>
                    <button style={nextBtn(!identity)} disabled={!identity} onClick={() => setStep(5)}>
                      Sync identity →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 5 — FINAL LOCK */}
              {step === 5 && (
                <motion.div key="s5" variants={VARIANTS} initial="enter" animate="center" exit="exit">
                  <div style={card}>
                    {stepDots(5)}
                    <span style={label}>— Final lock</span>
                    <div style={heading}>Prove it.</div>

                    {/* summary */}
                    <div style={{
                      border: "1px solid #161616",
                      background: "#0e0e0e",
                      padding: "12px 14px",
                      marginBottom: 20,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}>
                      {[
                        ["Objective",  goal],
                        ["Intensity",  intensity],
                        ["Identity",   identity],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: ".12em" }}>
                          <span style={{ color: "#2e2e2e", textTransform: "uppercase" }}>{k}</span>
                          <span style={{ color: "#c8a84b" }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    {/* commitment input */}
                    <div style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      color: "#2e2e2e",
                      textTransform: "uppercase",
                      padding: "10px 16px",
                      border: "1px solid #1e1e1e",
                      background: "#0e0e0e",
                      marginBottom: 0,
                    }}>
                      Type exactly: I WILL NOT QUIT
                    </div>
                    <input
                      className={`ob-commit-input ${inputError ? "ob-error ob-shake" : ""}`}
                      value={commitText}
                      onChange={(e) => setCommitText(e.target.value.toUpperCase())}
                      placeholder="TYPE HERE..."
                      autoComplete="off"
                      spellCheck={false}
                    />

                    <button
                      className={commitText === "I WILL NOT QUIT" && !loading ? "ob-pulse-btn" : ""}
                      style={nextBtn(commitText !== "I WILL NOT QUIT" || loading)}
                      disabled={commitText !== "I WILL NOT QUIT" || loading}
                      onClick={handleFinalLock}
                    >
                      {loading ? "Syncing neural profile..." : "Enter the loop 🔥"}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}
