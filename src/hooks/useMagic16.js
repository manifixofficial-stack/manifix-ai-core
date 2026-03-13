// src/hooks/useMagic16.js
import { useState, useEffect, useCallback } from "react";
import { magic16Steps } from "../data/magic16Steps";

import useTimer from "./useTimer";
import useDetection from "./useDetection";
import useStreak from "./useStreak";
import useVoice from "./useVoice";

export default function useMagic16() {
  const steps = magic16Steps;

  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);

  const { speak } = useVoice();
  const { score, startDetection, stopDetection } = useDetection();
  const { streak, updateStreak } = useStreak();

  // ================= Finish Callback =================
  const finish = useCallback(() => {
    stopDetection();
    updateStreak();
    setCompleted(true);
    setPaused(false);
    speak("Congratulations. You completed Magic16.");
  }, [stopDetection, updateStreak, speak]);

  // ================= Timer Hook =================
  const {
    stepTime,
    totalTime,
    totalDuration,
    progress,
    running,
    startTimer,
    stopTimer,
    resetTimer
  } = useTimer({
    steps,
    stepIndex,
    setStepIndex,
    onFinish: finish
  });

  // ================= Start =================
  const start = useCallback(() => {
    speak("Welcome to Magic16");
    startTimer();
    startDetection();
    setPaused(false);
  }, [startTimer, startDetection, speak]);

  // ================= Pause =================
  const pause = useCallback(() => {
    stopTimer();
    stopDetection();
    setPaused(true);
  }, [stopTimer, stopDetection]);

  // ================= Resume =================
  const resume = useCallback(() => {
    startTimer();
    startDetection();
    setPaused(false);
  }, [startTimer, startDetection]);

  // ================= Restart =================
  const restart = useCallback(() => {
    setCompleted(false);
    setPaused(false);
    setStepIndex(0);
    setScoreHistory([]);
    resetTimer();
    startDetection();
    speak("Session restarted");
  }, [resetTimer, startDetection, speak]);

  // ================= Score Tracking =================
  useEffect(() => {
    if (score !== null && score !== undefined) {
      setScoreHistory((prev) => [...prev, score]);
    }
  }, [score]);

  // ================= Average Score =================
  const averageScore =
    scoreHistory.length > 0
      ? Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length)
      : 0;

  const healthImpact = (() => {
    if (averageScore > 90) return "Excellent posture and body alignment.";
    if (averageScore > 75) return "Good posture with minor adjustments needed.";
    if (averageScore > 60) return "Moderate posture stability.";
    return "Focus on alignment and slower movements.";
  })();

  return {
    start,
    pause,
    resume,
    restart,
    steps,
    stepIndex,
    stepTime,
    totalTime,
    totalDuration,
    progress,
    score,
    averageScore,
    healthImpact,
    completed,
    running,
    paused,
    streak
  };
}
