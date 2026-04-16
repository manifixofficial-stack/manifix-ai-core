import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/onboarding.css";

export default function Onboarding() {

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ---------------- CHECK IF ALREADY STARTED ---------------- */
  useEffect(() => {
    const started = localStorage.getItem("magic16_started");
    if (started === "true") {
      navigate("/dashboard");
    }
  }, [navigate]);

  const screens = [
    {
      title: "This is not a normal app",
      text: "Most people quit in 3 days. This system is designed to push you past that.",
    },
    {
      title: "You are starting a 16-day reset",
      text: "For the next 16 days, you will follow a daily discipline system.",
    },
    {
      title: "If you skip, you restart",
      text: "Miss a single day → your streak resets to 0. No exceptions.",
    },
    {
      title: "This will change you",
      text: "Complete 16 days and you become someone who shows up daily.",
    },
  ];

  /* ---------------- STEP SAVE (PERSIST) ---------------- */
  useEffect(() => {
    localStorage.setItem("onboarding_step", step);
  }, [step]);

  useEffect(() => {
    const savedStep = Number(localStorage.getItem("onboarding_step"));
    if (!isNaN(savedStep)) setStep(savedStep);
  }, []);

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep((prev) => prev + 1);
    }
  };

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

    setTimeout(() => {
      navigate("/dashboard");
    }, 500);
  };

  return (
    <div className="onboarding">

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="onboarding-card"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4 }}
        >
          <h1>{screens[step].title}</h1>
          <p>{screens[step].text}</p>

          {/* PROGRESS DOTS */}
          <div className="dots">
            {screens.map((_, i) => (
              <span key={i} className={i === step ? "active" : ""}></span>
            ))}
          </div>

          {/* BUTTONS */}
          {step < screens.length - 1 ? (
            <button className="next-btn" onClick={handleNext}>
              Continue →
            </button>
          ) : (
            <button className="start-btn" onClick={handleStart} disabled={loading}>
              {loading ? "Starting..." : "🚀 Start Day 1 — No Excuses"}
            </button>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
