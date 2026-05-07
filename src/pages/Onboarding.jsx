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

  const speak = (text, urgent = false) => {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = urgent ? 1.1 : 0.9;
    msg.pitch = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  };

  useEffect(() => {
    speak("Initializing neural discipline protocol.");
    const t = setTimeout(() => {
      setPhase("start");
      speak("System online.", true);
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "start" || step !== 0 || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
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
    speak("Welcome to the one percent.");
    setTimeout(() => navigate("/app/magic16", { replace: true }), 1500);
  };

  return (
    <div className="onboarding-pro">
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" className="intro-scan" exit={{ opacity: 0 }}>
            <div className="scan-line" />
            <h1 className="glitch-text">BIOMETRIC SCAN...</h1>
          </motion.div>
        )}

        {phase === "start" && step === 0 && (
          <motion.div key="step0" className="card-elite">
            <h1>Primary Objective?</h1>
            <div className="option-grid">
              {["Discipline", "Focus", "Power", "Control"].map((g) => (
                <button 
                  key={g} 
                  className={goal === g ? "active" : ""} 
                  onClick={() => setGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>
            <button className="next-btn" onClick={() => setStep(1)}>NEXT →</button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" className="card-elite">
            <h1>Operating Intensity</h1>
            <div className="option-grid">
              {["Standard", "High", "NO EXCUSES"].map((i) => (
                <button 
                  key={i} 
                  className={intensity === i ? "active-red" : ""} 
                  onClick={() => setIntensity(i)}
                >
                  {i}
                </button>
              ))}
            </div>
            <button className="next-btn" onClick={() => setStep(2)}>NEXT →</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" className="card-elite-warning">
            <h1>WARNING</h1>
            <p>Miss one day, lose everything.</p>
            <button className="next-btn" onClick={() => setStep(3)}>I ACCEPT</button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" className="card-elite">
            <h1>New Identity Statement</h1>
            <div className="option-stack">
              {["I don't quit", "I finish", "I am elite"].map((id) => (
                 setIdentity(id)}
                >
                  {id}
                </button>
              ))}
            </div>
            <button className="next-btn" onClick={() => setStep(4)}>FINAL SYNC →</button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" className="card-elite final-lock">
            <h1>Type I WILL NOT QUIT</h1>
            <input 
              className="commitment-input"
              value={confirmText} 
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
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
