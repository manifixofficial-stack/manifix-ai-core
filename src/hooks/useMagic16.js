// src/hooks/useMagic16.js
import { useState, useEffect, useCallback } from "react";
import useTimer from "./useTimer";
import useDetection from "./useDetection";
import useStreak from "./useStreak";
import useVoice from "./useVoice";

export default function useMagic16(steps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [scoreHistory, setScoreHistory] = useState([]);

  const { speak } = useVoice();
  const { score, startDetection, stopDetection } = useDetection();
  const { streak, updateStreak } = useStreak();

  // Called when all steps are done
  const finish = useCallback(() => {
    stopTimer();
    stopDetection();
    updateStreak();
    setCompleted(true);
  }, [stopDetection, updateStreak]);

  // Use per-step timer
  const {
    stepTime,
    totalTime,
    totalDuration,
    progress,
    running,
    completed: timerCompleted,
    startTimer,
    stopTimer,
    resetTimer
  } = useTimer({
    steps,
    stepIndex,
    setStepIndex,
    onFinish: finish
  });

  // Start session
  const start = useCallback(() => {
    speak("Welcome to Magic16");
    startTimer();
    startDetection();
  }, [startTimer, startDetection, speak]);

  // Pause / stop session
  const stop = useCallback(() => {
    stopTimer();
    stopDetection();
    setCompleted(true);
  }, [stopTimer, stopDetection]);

  // Restart session
  const restart = useCallback(() => {
    setCompleted(false);
    setStepIndex(0);
    setScoreHistory([]);
    resetTimer();
    startDetection();
    speak("Session restarted");
  }, [resetTimer, startDetection, speak]);

  // Track score history
  useEffect(() => {
    if (score !== null && score !== undefined) {
      setScoreHistory((prev) => [...prev, score]);
    }
  }, [score]);

  const averageScore =
    scoreHistory.length > 0
      ? Math.round(scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length)
      : 0;

  return {
    start,
    stop,
    restart,
    stepTime,       // per-step countdown
    totalTime,      // total elapsed time
    totalDuration,  // total session duration
    progress,       // overall session progress %
    score,
    stepIndex,
    completed,
    averageScore,
    streak,
    running,
    timerCompleted
  };
}
