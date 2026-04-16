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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const started = localStorage.getItem("magic16_started");
    if (started === "true") {
      navigate("/dashboard");
    }
  }, [navigate]);

  /* ================= FLOW ================= */

  const steps = [
    "goal",
    "intensity",
    "warning",
    "commit"
  ];

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

    setTimeout(() => {
      navigate("/dashboard");
    }, 600);
  };

  return (
    <div className="onboarding">

      <AnimatePresence mode="wait">

        {/* ================= STEP 1 ================= */}
        {step === 0 && (
          <motion.div
            className="onboarding-card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <h1>Why are you here?</h1>

            <div className="options">
              {["Stress 😓", "Discipline 🔥", "Focus 🧠", "Confidence 💪"].map((g) => (
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
              onClick={() => setStep(1)}
              className="next-btn"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 2 ================= */}
        {step === 1 && (
          <motion.div
            className="onboarding-card"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <h1>How serious are you?</h1>

            <div className="options">
              {["Low 😴", "Medium 😐", "HIGH 🔥", "NO EXCUSES ⚡"].map((i) => (
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
              onClick={() => setStep(2)}
              className="next-btn"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 3 ================= */}
        {step === 2 && (
          <motion.div
            className="onboarding-card danger"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>⚠️ WARNING</h1>

            <p>
              If you quit even 1 day → your streak resets to 0.
              <br /><br />
              92% people fail at Day 3.
            </p>

            <button onClick={() => setStep(3)} className="next-btn danger-btn">
              I Understand →
            </button>
          </motion.div>
        )}

        {/* ================= STEP 4 ================= */}
        {step === 3 && (
          <motion.div
            className="onboarding-card final"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1>🔥 You’re In</h1>

            <p>
              Goal: <b>{goal}</b><br />
              Intensity: <b>{intensity}</b>
            </p>

            <h2>16 Days. No Excuses.</h2>

            <button
              className="start-btn pulse"
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? "Starting..." : "🚀 Begin Day 1"}
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
