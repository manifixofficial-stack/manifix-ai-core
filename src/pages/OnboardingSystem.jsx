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
  const [loading, setLoading] = useState(false);

  // Voice system
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    const msg = new SpeechSynthesisUtterance(text);

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  };

  // Intro animation
  useEffect(() => {
    speak("Initializing neural discipline protocol.");

    const timer = setTimeout(() => {
      setPhase("start");
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Final start
  const handleFinalLock = () => {
    if (loading || confirmText !== "I WILL NOT QUIT") return;

    setLoading(true);

    localStorage.setItem("magic16_started", "true");
    localStorage.setItem("magic16_streak", "1");
    localStorage.setItem(
      "magic16_last_date",
      new Date().toDateString()
    );

    localStorage.setItem("magic16_goal", goal);
    localStorage.setItem("magic16_intensity", intensity);
    localStorage.setItem("magic16_identity", identity);

    speak("Welcome to the one percent.");

    setTimeout(() => {
      navigate("/app/magic16", { replace: true });
    }, 1500);
  };

  return (
    <div className="onboarding-pro">
      <AnimatePresence mode="wait">

        {/* INTRO */}
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="intro-scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="glitch-text">
              BIOMETRIC SCAN...
            </h1>
          </motion.div>
        )}

        {/* STEP 0 */}
        {phase === "start" && step === 0 && (
          <motion.div
            key="step0"
            className="card-elite"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Objective?</h1>

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

            <button
              className="next-btn"
              onClick={() => setStep(1)}
              disabled={!goal}
            >
              NEXT
            </button>
          </motion.div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <motion.div
            key="step1"
            className="card-elite"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1>Intensity</h1>

            <div className="option-grid">
              {["Standard", "High", "NO EXCUSES"].map((i) => (
                <button
                  key={i}
                  className={
                    intensity === i ? "active-red" : ""
                  }
                  onClick={() => setIntensity(i)}
                >
                  {i}
                </button>
              ))}
            </div>

            <button
              className="next-btn"
              onClick={() => setStep(2)}
              disabled={!intensity}
            >
              NEXT
            </button>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div
            key="step2"
            className="card-elite-warning"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>WARNING</h1>

            <p>Miss one day, lose everything.</p>

            <button
              className="next-btn"
              onClick={() => setStep(3)}
            >
              I ACCEPT
            </button>
          </motion.div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <motion.div
            key="step3"
            className="card-elite"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Identity</h1>

            <div className="option-stack">
              {["I don't quit", "I finish", "I am elite"].map((id) => (
                <button
                  key={id}
                  className={
                    identity === id ? "active-gold" : ""
                  }
                  onClick={() => setIdentity(id)}
                >
                  {id}
                </button>
              ))}
            </div>

            <button
              className="next-btn"
              onClick={() => setStep(4)}
              disabled={!identity}
            >
              SYNC
            </button>
          </motion.div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <motion.div
            key="step4"
            className="card-elite final-lock"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1>Type I WILL NOT QUIT</h1>

            <input
              className="commitment-input"
              value={confirmText}
              onChange={(e) =>
                setConfirmText(
                  e.target.value.toUpperCase()
                )
              }
              placeholder="TYPE HERE..."
            />

            <button
              className="start-btn-gold"
              disabled={
                confirmText !== "I WILL NOT QUIT" ||
                loading
              }
              onClick={handleFinalLock}
            >
              {loading
                ? "SYNCING..."
                : "ENTER THE LOOP 🔥"}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
