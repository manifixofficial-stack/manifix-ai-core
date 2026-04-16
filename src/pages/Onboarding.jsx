// src/pages/Onboarding.jsx

import React, { useState, useEffect, useRef } from "react";
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

  const [loading, setLoading] = useState(false);

  const voiceRef = useRef(null);

  /* ================= VOICE ENGINE ================= */
  const speak = (text, rate = 1, pitch = 1.1) => {
    if (!("speechSynthesis" in window)) return;

    const msg = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();

    msg.voice =
      voices.find(v => v.name.includes("Google")) ||
      voices[0];

    msg.rate = rate;
    msg.pitch = pitch;

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);

    voiceRef.current = msg;
  };

  /* ================= INTRO CINEMATIC ================= */
  useEffect(() => {
    speak(
      "Warning. This is not a normal app. Most people quit in 3 days.",
      0.95,
      1.2
    );

    const t1 = setTimeout(() => {
      setPhase("hook");
      speak("If you continue... you will be changed in 16 days.", 1);
    }, 4000);

    const t2 = setTimeout(() => {
      setPhase("start");
      speak("Choose who you want to become.", 1.05);
    }, 8000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  /* ================= START APP ================= */
  const handleStart = () => {
    if (loading) return;
    setLoading(true);

    const today = new Date().toDateString();

    localStorage.setItem("magic16_started", "true");
    localStorage.setItem("magic16_streak", 0);
    localStorage.setItem("magic16_xp", 0);
    localStorage.setItem("magic16_level", 1);
    localStorage.setItem("magic16_last_date", "");
    localStorage.setItem("magic16_start_date", today);

    localStorage.setItem("magic16_goal", goal);
    localStorage.setItem("magic16_intensity", intensity);
    localStorage.setItem("magic16_identity", identity);

    speak("Transformation started. Day one begins now.", 1.1, 1.3);

    setTimeout(() => {
      navigate("/app/dashboard");
    }, 1200);
  };

  /* ================= OPTIONS ================= */
  const goals = ["Discipline", "Focus", "Confidence", "Stress Control"];
  const intensities = ["Low", "Medium", "HIGH", "NO EXCUSES"];
  const identities = [
    "I want to change my life",
    "I want discipline",
    "I want control",
    "I want consistency"
  ];

  /* ================= UI ================= */

  return (
    <div className="onboarding cinematic">

      <AnimatePresence mode="wait">

        {/* ================= INTRO ================= */}
        {phase === "intro" && (
          <motion.div
            className="cinematic-screen black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="glitch">⚠ WARNING</h1>
            <p>Do not continue if you are not serious.</p>
          </motion.div>
        )}

        {/* ================= HOOK ================= */}
        {phase === "hook" && (
          <motion.div
            className="cinematic-screen red-glow"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h1>92% Quit Before Day 3</h1>
            <p>This system does not forgive inconsistency.</p>
          </motion.div>
        )}

        {/* ================= START ================= */}
        {phase === "start" && step === 0 && (
          <motion.div className="card">
            <h1>Why are you here?</h1>

            <div className="options">
              {goals.map(g => (
                <button
                  key={g}
                  className={goal === g ? "active" : ""}
                  onClick={() => setGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>

            <button disabled={!goal} onClick={() => setStep(1)}>
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 1 && (
          <motion.div className="card">
            <h1>Intensity Level</h1>

            <div className="options">
              {intensities.map(i => (
                <button
                  key={i}
                  className={intensity === i ? "active" : ""}
                  onClick={() => setIntensity(i)}
                >
                  {i}
                </button>
              ))}
            </div>

            <button disabled={!intensity} onClick={() => setStep(2)}>
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 2 && (
          <motion.div className="card warning-card">
            <h1>Reality Check</h1>
            <p>Miss 1 day → streak resets.</p>

            <button onClick={() => setStep(3)}>
              I Understand →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 4 ================= */}
        {step === 3 && (
          <motion.div className="card">
            <h1>Who are you becoming?</h1>

            <div className="options">
              {identities.map(id => (
                <button
                  key={id}
                  className={identity === id ? "active" : ""}
                  onClick={() => setIdentity(id)}
                >
                  {id}
                </button>
              ))}
            </div>

            <button disabled={!identity} onClick={() => setStep(4)}>
              Final Step →
            </button>
          </motion.div>
        )}

        {/* ================= FINAL LOCK ================= */}
        {step === 4 && (
          <motion.div className="card final-lock">
            <h1>🔥 Commitment Locked</h1>

            <p>{goal} • {intensity}</p>

            <h2>16 Days. No Excuses.</h2>

            <button
              className="start-btn pulse"
              onClick={handleStart}
            >
              🚀 Begin Transformation
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
