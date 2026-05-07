import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("intro");
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [intensity, setIntensity] = useState("");
  const [identity, setIdentity] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [loading, setLoading] = useState(false);

  /* ================= ELITE VOICE ENGINE ================= */
  const speak = (text, urgent = false) => {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = urgent ? 1.1 : 0.9;
    msg.pitch = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  };

  /* ================= SYSTEM INITIALIZATION ================= */
  useEffect(() => {
    speak("Initializing neural discipline protocol. Warning. 90% of subjects fail this system.");
    const t = setTimeout(() => {
      setPhase("start");
      speak("System online. Select your primary objective.", true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  /* ================= PRESSURE TIMER ================= */
  useEffect(() => {
    if (phase !== "start" || step !== 0 || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    if (timeLeft === 3) speak("Make your choice now.", true);
    return () => clearInterval(timer);
  }, [phase, step, timeLeft]);

  const handleFinalLock = () => {
    if (loading || confirmText !== "I WILL NOT QUIT") return;
    setLoading(true);
    
    const today = new Date().toDateString();
    localStorage.setItem("magic16_started", "true");
    localStorage.setItem("magic16_streak", "1");
    localStorage.setItem("magic16_last_date", today);
    localStorage.setItem("magic16_goal", goal);
    localStorage.setItem("magic16_intensity", intensity);
    localStorage.setItem("magic16_identity", identity);

    speak("Identity shift confirmed. Welcome to the one percent.", 0.9);
    setTimeout(() => navigate("/app/magic16", { replace: true }), 1500);
  };

  return (
    <div className="onboarding-pro">
      <AnimatePresence mode="wait">
        
        {/* --- PHASE 0: THE NEURAL SCAN --- */}
        {phase === "intro" && (
          <motion.div key="intro" className="intro-scan" exit={{ opacity: 0 }}>
            <div className="scan-line" />
            <h1 className="glitch-text">BIOMETRIC SCAN...</h1>
            <p className="gold-text">ANALYZING WEAKNESS POINTS</p>
          </motion.div>
        )}

        {/* --- PHASE 1: OBJECTIVE SELECTION --- */}
        {phase === "start" && step === 0 && (
          <motion.div key="step0" className="card-elite" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="step-count">STEP 01/04</span>
            <h1>Primary Objective?</h1>
            <p className="timer-warn">Selection Window: <span className="gold-text">{timeLeft}s</span></p>
            <div className="option-grid">
              {["Discipline", "Elite Focus", "Mental Power", "Total Control"].map(g => (
                <button 
                  key={g} 
                  className={goal === g ? "active" : ""} 
                  onClick={() => setGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>
            <button className="next-btn" disabled={!goal} onClick={() => setStep(1)}>CONFIRM OBJECTIVE →</button>
          </motion.div>
        )}

        {/* --- PHASE 2: INTENSITY --- */}
        {step === 1 && (
          <motion.div key="step1" className="card-elite" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <span className="step-count">STEP 02/04</span>
            <h1>Operating Intensity</h1>
            <div className="option-grid">
              {["Standard", "High-Performance", "NO EXCUSES"].map(i => (
                <button 
                  key={i} 
                  className={intensity === i ? "active-red" : ""} 
                  onClick={() => setIntensity(i)}
                >
                  {i}
                </button>
              ))}
            </div>
            <button className="next-btn" disabled={!intensity} onClick={() => setStep(2)}>LOCK INTENSITY →</button>
          </motion.div>
        )}

        {/* --- PHASE 3: THE CONTRACT --- */}
        {step === 2 && (
          <motion.div key="step2" className="card-elite-warning" initial={{ scale: 0.9 }}>
            <h1 className="red-text">WARNING</h1>
            <p>One missed day resets your rank to <span className="gold-text">Day 1</span>. No refunds. No excuses. The AI observer does not negotiate.</p>
            <button className="next-btn" onClick={() => setStep(3)}>I ACCEPT THE TERMS</button>
          </motion.div>
        )}

        {/* --- PHASE 4: IDENTITY SHIFT --- */}
        {step === 3 && (
          <motion.div key="step3" className="card-elite">
             <span className="step-count">STEP 04/04</span>
            <h1>New Identity Statement</h1>
            <div className="option-stack">
              {["I don't quit", "I finish what I start", "I am a high-performer"].map(id => (
                 setIdentity(id)}
                >
                  {id}
                </button>
              ))}
            </div>
             setStep(4)}>FINALIZE SYNC →</button>
          </motion.div>
        )}

        {/* --- FINAL PHASE: THE COMMITMENT --- */}
        {step === 4 && (
          <motion.div key="step4" className="card-elite final-lock">
            <h1>Type to Commit</h1>
            <p className="instruction">Type <span className="gold-text">I WILL NOT QUIT</span> to unlock the system.</p>
            <input 
              className="commitment-input"
              value={confirmText} 
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              placeholder="..." 
            />
            <button 
              className={`start-btn-gold ${confirmText === "I WILL NOT QUIT" ? "ready" : ""}`}
              disabled={confirmText !== "I WILL NOT QUIT" || loading}
              onClick={handleFinalLock}
            >
              {loading ? "SYNCING..." : "ENTER THE LOOP 🔥"}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
