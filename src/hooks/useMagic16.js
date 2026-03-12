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
  const [scoreHistory, setScoreHistory] = useState([]);

  const { speak } = useVoice();
  const { score, startDetection, stopDetection } = useDetection();
  const { streak, updateStreak } = useStreak();

  // ================= Session Finish =================
  const finish = useCallback(() => {

    stopTimer();
    stopDetection();

    updateStreak();

    setCompleted(true);

    speak("Congratulations. You completed Magic16.");

  }, [stopDetection, updateStreak, speak]);

  // ================= Timer System =================
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

  // ================= Start Session =================
  const start = useCallback(() => {

    speak("Welcome to Magic16");

    startTimer();
    startDetection();

  }, [startTimer, startDetection, speak]);

  // ================= Pause Session =================
  const stop = useCallback(() => {

    stopTimer();
    stopDetection();

  }, [stopTimer, stopDetection]);

  // ================= Restart Session =================
  const restart = useCallback(() => {

    setCompleted(false);
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
      ? Math.round(
          scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length
        )
      : 0;

  // ================= Health Analysis =================
  const healthImpact = (() => {

    if (averageScore > 90) {
      return "Excellent posture and body alignment.";
    }

    if (averageScore > 75) {
      return "Good posture with minor adjustments needed.";
    }

    if (averageScore > 60) {
      return "Moderate posture stability. Practice balance.";
    }

    return "Focus on alignment and slower movements.";
  })();

  return {

    // session control
    start,
    stop,
    restart,

    // steps
    steps,
    stepIndex,

    // timers
    stepTime,
    totalTime,
    totalDuration,
    progress,

    // detection
    score,

    // analytics
    averageScore,
    healthImpact,

    // status
    completed,
    running,
    timerCompleted,

    // streak
    streak

  };
}
