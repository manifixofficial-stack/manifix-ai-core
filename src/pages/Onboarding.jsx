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

  const [confirmText, setConfirmText] = useState("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [loading, setLoading] = useState(false);

  const voiceRef = useRef(null);

  /* ================= VOICE ================= */
  const speak = (text, rate = 1, pitch = 1.1) => {
    if (!("speechSynthesis" in window)) return;

    const msg = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();

    msg.voice = voices.find(v => v.name.includes("Google")) || voices[0];
    msg.rate = rate;
    msg.pitch = pitch;

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);

    voiceRef.current = msg;
  };

  /* ================= FAST INTRO ================= */
  useEffect(() => {
    speak("Warning. Most people fail this system.", 0.95, 1.2);

    const t = setTimeout(() => {
      setPhase("start");
      speak("Decide fast. Time is running.", 1.05);
    }, 2000);

    return () => clearTimeout(t);
  }, []);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (phase !== "start" || step !== 0) return;

    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, step, timeLeft]);

  /* ================= START SYSTEM ================= */
  const handleStart = () => {
    if (loading) return;
    setLoading(true);

    const today = new Date().toDateString();

    localStorage.setItem("magic16_started", "true");
    localStorage.setItem("magic16_day", 1);
    localStorage.setItem("magic16_streak", 1);
    localStorage.setItem("magic16_last_date", today);

    localStorage.setItem("magic16_goal", goal);
    localStorage.setItem("magic16_intensity", intensity);
    localStorage.setItem("magic16_identity", identity);

    speak(`You chose ${goal}. No excuses now.`, 1.1, 1.3);

    setTimeout(() => {
      navigate("/app/magic16/day/1");
    }, 1000);
  };

  /* ================= OPTIONS ================= */
  const goals = ["Discipline", "Focus", "Confidence", "Control"];
  const intensities = ["Medium", "High", "NO EXCUSES"];
  const identities = [
    "I don't quit",
    "I finish what I start",
    "I control my actions",
    "I stay consistent"
  ];

  return (
    <div className="onboarding cinematic">

      {/* 🔥 SKIP */}
      {phase === "intro" && (
        <button className="skip-btn" onClick={() => setPhase("start")}>
          Skip →
        </button>
      )}

      <AnimatePresence mode="wait">

        {/* ================= INTRO ================= */}
        {phase === "intro" && (
          <motion.div className="cinematic-screen black">
            <h1 className="glitch">⚠ WARNING</h1>
            <p>This system is not for everyone.</p>
          </motion.div>
        )}

        {/* ================= STEP 1 ================= */}
        {phase === "start" && step === 0 && (
          <motion.div className="card">
            <h1>Why are you here?</h1>

            <p className="timer">Decide in {timeLeft}s</p>

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
            <h1>Final Warning</h1>

            <p>
              Miss 1 day → restart from Day 0  
              <br />
              No exceptions.
            </p>

            <button onClick={() => setStep(3)}>
              I Understand →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 4 ================= */}
        {step === 3 && (
          <motion.div className="card">
            <h1>Choose your identity</h1>

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
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= COMMITMENT LOCK ================= */}
        {step === 4 && (
          <motion.div className="card final-lock">
            <h1>Type to commit</h1>

            <p>I WILL NOT QUIT</p>

            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type exactly..."
            />

            <button
              disabled={confirmText !== "I WILL NOT QUIT"}
              onClick={handleStart}
              className="start-btn pulse"
            >
              🚀 Enter System
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
