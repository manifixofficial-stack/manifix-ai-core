import { useEffect, useState, useCallback } from "react";
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

  function finish() {
    stop();
    updateStreak();
    setCompleted(true);
  }

  const {
    totalTime,
    stepTime,
    progress,
    startTimer,
    stopTimer,
    resetTimer
  } = useTimer({
    steps,
    stepIndex,
    setStepIndex,
    onFinish: finish
  });

  const start = useCallback(() => {
    speak("Welcome to Magic16");
    startTimer();
    startDetection();
  }, [startTimer, startDetection, speak]);

  const stop = useCallback(() => {
    stopTimer();
    stopDetection();
    setCompleted(true); // ensure session ends properly
  }, [stopTimer, stopDetection]);

  const restart = useCallback(() => {
    setCompleted(false);
    setStepIndex(0);
    setScoreHistory([]);
    resetTimer();
    startDetection(); // restart detection
    speak("Session restarted");
  }, [resetTimer, startDetection, speak]);

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
    progress,
    score,
    stepIndex,
    stepTime,
    totalTime,
    completed,
    averageScore,
    streak
  };
}
