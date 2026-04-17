// src/pages/Magic16.jsx

import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionSteps } from "../constants/steps";
import confetti from "canvas-confetti";
import "../styles/magic16.css";

export default function Magic16() {
  const navigate = useNavigate();

  /* ================= STATE ================= */

  const day = Number(localStorage.getItem("magic16_streak") || 1);

  const sessionSteps = useMemo(() => getSessionSteps(day), [day]);

  const [stepIndex, setStepIndex] = useState(() =>
    Number(localStorage.getItem("m16_step") || 0)
  );

  const [timeLeft, setTimeLeft] = useState(() =>
    sessionSteps[stepIndex]?.duration || 30
  );

  const [progress, setProgress] = useState(() =>
    Number(localStorage.getItem("m16_progress") || 0)
  );

  const [playing, setPlaying] = useState(false);

  const [xp, setXp] = useState(() =>
    Number(localStorage.getItem("m16_xp") || 0)
  );

  const [showHook, setShowHook] = useState(() => {
    return !localStorage.getItem("m16_started");
  });

  /* ================= REFS ================= */

  const timerRef = useRef(null);
  const stepRef = useRef(stepIndex);
  const timeRef = useRef(timeLeft);

  const current = sessionSteps[stepIndex];

  const TOTAL = useMemo(() => {
    return sessionSteps.reduce((sum, s) => sum + s.duration, 0);
  }, [sessionSteps]);

  /* ================= SYNC ================= */

  useEffect(() => {
    stepRef.current = stepIndex;
    timeRef.current = timeLeft;
  }, [stepIndex, timeLeft]);

  /* ================= PERSIST ================= */

  useEffect(() => {
    localStorage.setItem("m16_step", stepIndex);
    localStorage.setItem("m16_progress", progress);
    localStorage.setItem("m16_started", "true");
    localStorage.setItem("m16_xp", xp);
  }, [stepIndex, progress, xp]);

  /* ================= CLEANUP ================= */

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  /* ================= VOICE ================= */

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = 0.9;
    msg.pitch = 1;
    msg.lang = "en-IN";

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  };

  /* ================= STEP COMPLETE EFFECT ================= */

  const stepFeedback = () => {
    navigator.vibrate?.(100);

    confetti({
      particleCount: 25,
      spread: 40,
      origin: { y: 0.8 }
    });

    setXp((prev) => prev + 5);
  };

  /* ================= START ================= */

  const start = () => {
    if (timerRef.current) return;

    setShowHook(false);
    setPlaying(true);

    speak(current?.guidance || current?.name);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stepFeedback();

          const next = stepRef.current + 1;

          if (next >= sessionSteps.length) {
            finish();
            return 0;
          }

          setStepIndex(next);

          const nextDuration = sessionSteps[next].duration;
          setTimeLeft(nextDuration);

          speak(sessionSteps[next].guidance);

          return nextDuration;
        }

        return prev - 1;
      });

      /* Progress Calculation */
      setProgress(() => {
        const doneSteps = sessionSteps
          .slice(0, stepRef.current)
          .reduce((a, b) => a + b.duration, 0);

        const currentDone =
          sessionSteps[stepRef.current]?.duration - timeRef.current;

        const totalDone = doneSteps + (currentDone || 0);

        return Math.floor((totalDone / TOTAL) * 100);
      });
    }, 1000);
  };

  /* ================= STOP ================= */

  const stop = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    speechSynthesis.cancel();
  };

  /* ================= FINISH ================= */

  const finish = () => {
    stop();

    confetti({
      particleCount: 200,
      spread: 120
    });

    const streak = Number(localStorage.getItem("magic16_streak") || 0) + 1;
    localStorage.setItem("magic16_streak", streak);

    setTimeout(() => {
      navigate("/app/dashboard");
    }, 1200);
  };

  /* ================= HOOK SCREEN ================= */

  if (showHook) {
    return (
      <div className="hook">
        <h1>Only 3% finish Day 7</h1>
        <p>Prove you're not average.</p>
        <button onClick={start}>Start Now 🔥</button>
      </div>
    );
  }

  if (!current) return <div>Loading...</div>;

  /* ================= UI ================= */

  return (
    <div className="magic16">

      {/* TOP BAR */}
      <div className="top">
        <h3>🔥 Day {day} / 7</h3>
        <h4>XP: {xp}</h4>
      </div>

      {/* IMAGE */}
      <div className="image-wrapper">
        <img
          key={stepIndex}
          src={current.image}
          alt=""
          className="fade"
        />
      </div>

      {/* CONTENT */}
      <div className="content">
        <h2>{current.name}</h2>
        <p>{current.guidance}</p>
      </div>

      {/* TIMER */}
      <div className={`timer ${timeLeft <= 5 ? "danger" : ""}`}>
        <h1>{timeLeft}</h1>
      </div>

      {/* PROGRESS */}
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
        <span>{progress}%</span>
      </div>

      {/* BUTTON */}
      <button onClick={playing ? stop : start}>
        {playing ? "Pause" : "Start"}
      </button>

    </div>
  );
}
