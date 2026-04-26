// src/pages/Magic16.jsx

import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionSteps } from "../constants/steps";
import confetti from "canvas-confetti";
import "../styles/magic16.css";

export default function Magic16() {
  const navigate = useNavigate();

  /* ================= SAFE STORAGE ================= */
  const getLS = (key, fallback) => {
    if (typeof window === "undefined") return fallback;
    return localStorage.getItem(key) ?? fallback;
  };

  const day = Number(getLS("magic16_streak", 1));
  const [xp, setXp] = useState(Number(getLS("m16_xp", 0)));
  const [showHook, setShowHook] = useState(!getLS("m16_started"));

  const sessionSteps = useMemo(() => getSessionSteps(day), [day]);

  /* ================= STATE ================= */
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(
    sessionSteps[0]?.duration || 30
  );
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const level = Math.floor(xp / 50);

  /* ================= REFS ================= */
  const timerRef = useRef(null);
  const stepRef = useRef(0);
  const timeRef = useRef(0);
  const bgAudio = useRef(null);
  const countdownAudio = useRef(null);

  const TOTAL = useMemo(() => {
    return sessionSteps.reduce((a, b) => a + b.duration, 0);
  }, [sessionSteps]);

  const current = sessionSteps[stepIndex];

  /* ================= AUDIO INIT ================= */
  useEffect(() => {
    bgAudio.current = new Audio("/assets/audio/combo.mp3");
    bgAudio.current.loop = true;
    bgAudio.current.volume = 0.3;

    countdownAudio.current = new Audio("/assets/audio/countdown.mp3");
    countdownAudio.current.volume = 0.7;

    return () => {
      bgAudio.current?.pause();
      countdownAudio.current?.pause();
    };
  }, []);

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
    msg.lang = "en-US";

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
  };

  /* ================= TRIGGERS ================= */
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 10) speak("Win your morning or lose your day.");
    else if (hour < 18) speak("You’re behind. Fix it now.");
    else speak("Finish strong. Most already failed.");

    const last = getLS("last_done", null);
    const today = new Date().toDateString();

    if (last && last !== today) {
      speak("Your streak is at risk.");
      setXp((prev) => Math.max(0, prev - 10));
    }
  }, []);

  /* ================= SYNC ================= */
  useEffect(() => {
    stepRef.current = stepIndex;
    timeRef.current = timeLeft;
  }, [stepIndex, timeLeft]);

  /* ================= SAVE ================= */
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("m16_xp", xp);
    localStorage.setItem("m16_started", "true");
  }, [xp]);

  /* ================= REWARDS ================= */
  const rewards = ["Good.", "Strong.", "Keep going.", "You're ahead."];
  const randomReward = () => {
    const r = rewards[Math.floor(Math.random() * rewards.length)];
    speak(r);
  };

  /* ================= START ================= */
  const start = () => {
    if (timerRef.current) return;

    setShowHook(false);
    setPlaying(true);

    bgAudio.current?.play().catch(() => {});
    speak(current?.guidance || current?.name);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev % 7 === 0) randomReward();

        if (prev === 5) {
          countdownAudio.current.currentTime = 0;
          countdownAudio.current.play().catch(() => {});
        }

        if (prev <= 3) {
          navigator.vibrate?.([100, 50, 100]);
          speak("Don’t break now.");
        }

        if (prev <= 1) {
          const next = stepRef.current + 1;

          confetti({ particleCount: 20, spread: 40 });
          setXp((p) => p + 5);

          if (next >= sessionSteps.length) {
            finish();
            return 0;
          }

          setStepIndex(next);
          speak(sessionSteps[next].guidance);
          return sessionSteps[next].duration;
        }

        return prev - 1;
      });

      /* PROGRESS */
      setProgress(() => {
        const doneSteps = sessionSteps
          .slice(0, stepRef.current)
          .reduce((a, b) => a + b.duration, 0);

        const currentDone =
          sessionSteps[stepRef.current]?.duration - timeRef.current;

        return Math.floor(((doneSteps + currentDone) / TOTAL) * 100);
      });
    }, 1000);
  };

  /* ================= STOP ================= */
  const stop = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;

    setPlaying(false);

    bgAudio.current?.pause();
    countdownAudio.current?.pause();
    speechSynthesis.cancel();

    speak("Paused. Don’t stay weak.");
  };

  /* ================= FINISH ================= */
  const finish = () => {
    stop();

    confetti({ particleCount: 250, spread: 120 });

    const streak = Number(getLS("magic16_streak", 0)) + 1;

    localStorage.setItem("magic16_streak", streak);
    localStorage.setItem("last_done", new Date().toDateString());

    speak("You are not average anymore.");

    setTimeout(() => {
      speak("Show this to someone who would quit.");
    }, 800);
  };

  /* ================= SHARE ================= */
  const handleShare = async () => {
    const text = `Day ${day} complete. Most people quit. I didn’t. Can you? ${window.location.origin}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Magic16", text });
      } else {
        await navigator.clipboard.writeText(text);
        speak("Copied. Share it.");
      }
    } catch {}
  };

  /* ================= IDENTITY ================= */
  const identities = [
    "You started.",
    "You are consistent.",
    "You are disciplined.",
    "You are unstoppable.",
  ];

  const identityText =
    identities[Math.min(day - 1, identities.length - 1)];

  /* ================= LEADERBOARD ================= */
  const [fakeRank] = useState(() =>
    Math.floor(Math.random() * 1000)
  );

  /* ================= HOOK ================= */
  if (showHook) {
    return (
      <div className="hook">
        <h1>You will quit.</h1>
        <p>Unless you're different.</p>
        <button onClick={start}>Start Now 🔥</button>
      </div>
    );
  }

  if (!current) return null;

  /* ================= UI ================= */
  return (
    <div className="magic16">
      <div className="top">
        <h3>🔥 Day {day}</h3>
        <h4>
          Level {level} • XP {xp}
        </h4>
        <p>Rank #{fakeRank}</p>
      </div>

      <img src={current.image} alt="" className="image" />

      <h2>{current.name}</h2>
      <p>{current.guidance}</p>
      <p className="identity">{identityText}</p>

      <div
        className={`timer ${
          timeLeft <= 5
            ? "danger"
            : timeLeft <= 10
            ? "warning"
            : ""
        }`}
      >
        <h1>{timeLeft}</h1>
      </div>

      <div className="progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      <button onClick={playing ? stop : start}>
        {playing ? "Pause" : "Start"}
      </button>

      <button onClick={handleShare} className="share">
        Share 🔥
      </button>
    </div>
  );
}
