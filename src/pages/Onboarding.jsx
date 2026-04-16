// src/pages/Onboarding.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/onboarding.css";

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState("");
  const [intensity, setIntensity] = useState("");
  const [identity, setIdentity] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= AUTO REDIRECT ================= */
  useEffect(() => {
    const started = localStorage.getItem("magic16_started");
    if (started === "true") {
      navigate("/app/dashboard");
    }
  }, [navigate]);

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

    setTimeout(() => {
      navigate("/app/dashboard");
    }, 700);
  };

  /* ================= OPTIONS ================= */
  const goals = [
    "🔥 Build Discipline",
    "🧠 Improve Focus",
    "💪 Get Strong Mind",
    "😌 Reduce Stress",
  ];

  const intensities = [
    "Low 😴",
    "Medium 😐",
    "HIGH 🔥",
    "NO EXCUSES ⚡",
  ];

  const identities = [
    "I want to become consistent",
    "I want to stop quitting",
    "I want control over my life",
    "I want a new identity",
  ];

  /* ================= UI ================= */
  return (
    <div className="onboarding">

      <AnimatePresence mode="wait">

        {/* ================= STEP 1 ================= */}
        {step === 0 && (
          <motion.div
            key="s1"
            className="onboarding-card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <h1>Why are you starting?</h1>

            <div className="options">
              {goals.map((g) => (
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
              disabled={!goal}
              className="next-btn"
              onClick={() => setStep(1)}
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 1 && (
          <motion.div
            key="s2"
            className="onboarding-card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <h1>How serious are you?</h1>

            <div className="options">
              {intensities.map((i) => (
                <button
                  key={i}
                  className={intensity === i ? "active" : ""}
                  onClick={() => setIntensity(i)}
                >
                  {i}
                </button>
              ))}
            </div>

            <button
              disabled={!intensity}
              className="next-btn"
              onClick={() => setStep(2)}
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 2 && (
          <motion.div
            key="s3"
            className="onboarding-card danger"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>⚠️ Reality Check</h1>

            <p>
              92% people quit before Day 3.
              <br /><br />
              If you miss 1 day → streak resets.
            </p>

            <button className="next-btn danger-btn" onClick={() => setStep(3)}>
              I Accept →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 4 ================= */}
        {step === 3 && (
          <motion.div
            key="s4"
            className="onboarding-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>Who are you becoming?</h1>

            <div className="options">
              {identities.map((id) => (
                <button
                  key={id}
                  className={identity === id ? "active" : ""}
                  onClick={() => setIdentity(id)}
                >
                  {id}
                </button>
              ))}
            </div>

            <button
              disabled={!identity}
              className="next-btn"
              onClick={() => setStep(4)}
            >
              Final Step →
            </button>
          </motion.div>
        )}

        {/* ================= FINAL COMMITMENT SCREEN ================= */}
        {step === 4 && (
          <motion.div
            key="s5"
            className="onboarding-card final"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>🔥 Commitment Locked</h1>

            <p>
              Goal: <b>{goal}</b><br />
              Intensity: <b>{intensity}</b><br />
              Identity: <b>{identity}</b>
            </p>

            <h2>16 Days. No Excuses. No Reset.</h2>

            <button
              className="start-btn pulse"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? "Starting..." : "🚀 Begin Transformation"}
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}0
