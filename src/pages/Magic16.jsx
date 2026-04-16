// src/pages/Magic16.jsx

import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionSteps } from "../constants/steps";
import confetti from "canvas-confetti";
import "../styles/magic16.css";

export default function Magic16() {
  const navigate = useNavigate();

  /* ================= STATE ================= */

  const [stepIndex, setStepIndex] = useState(() =>
    Number(localStorage.getItem("m16_step") || 0)
  );

  const [timeLeft, setTimeLeft] = useState(30);

  const [progress, setProgress] = useState(() =>
    Number(localStorage.getItem("m16_progress") || 0)
  );

  const [playing, setPlaying] = useState(false);

  const [xp, setXp] = useState(() =>
    Number(localStorage.getItem("m16_xp") || 0)
  );

  const [showHook, setShowHook] = useState(() => {
    return !localStorage.getItem("magic16_started");
  });

  /* ================= REFS ================= */

  const timerRef = useRef(null);
  const stepRef = useRef(stepIndex);
  const timeRef = useRef(timeLeft);

  /* ================= SESSION DATA ================= */

  const day = Number(localStorage.getItem("magic16_streak") || 1);

  const sessionSteps = useMemo(() => getSessionSteps(day), [day]);

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
    localStorage.setItem("m16_time", timeLeft);
    localStorage.setItem("m16_progress", progress);
    localStorage.setItem("m16_started", "true");
    localStorage.setItem("m16_xp", xp);
  }, [stepIndex, timeLeft, progress, xp]);

  /* ================= CLEANUP ================= */

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ================= SPEECH ================= */

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;

    const msg = new SpeechSynthesisUtterance(text);
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  };

  /* ================= START ================= */

  const start = () => {
    if (timerRef.current) return;

    setShowHook(false);
    setPlaying(true);

    speak(current?.text || "Start");

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const next = stepIndex + 1;

          if (next >= sessionSteps.length) {
            finish();
            return 0;
          }

          setStepIndex(next);
          setTimeLeft(sessionSteps[next].duration);

          speak(sessionSteps[next].text);

          return sessionSteps[next].duration;
        }

        return prev - 1;
      });

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

    confetti({ particleCount: 200, spread: 100 });

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
        <h1>⚠️ You won’t finish this</h1>
        <p>Most people quit before Day 5.</p>
        <button onClick={start}>Start Anyway 🔥</button>
      </div>
    );
  }

  if (!current) return <div>Loading...</div>;

  /* ================= UI ================= */

  return (
    <div className="magic16">

      <div className="top">
        <h3>🔥 Day {day} / 16</h3>
      </div>

      <div className="image-wrapper">
        <img src={current.image} alt="" />
      </div>

      <div className="content">
        <h2>{current.name}</h2>
        <p>{current.text}</p>
      </div>

      <div className={`timer ${timeLeft <= 5 ? "danger" : ""}`}>
        <h1>{timeLeft}</h1>
      </div>

      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
        <span>{progress}%</span>
      </div>

      <button onClick={playing ? stop : start}>
        {playing ? "Pause" : "Start"}
      </button>

    </div>
  );
}
