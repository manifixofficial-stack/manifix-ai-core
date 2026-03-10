import { useEffect, useState, useCallback } from "react";
import useTimer from "../useTimer";
import useDetection from "../useDetection";
import useStreak from "../useStreak";
import useVoice from "../useVoice";

type Magic16Step = {
  text: string;
  duration: number;
};

export default function useMagic16(steps: Magic16Step[]) {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

  const { speak } = useVoice();
  const { score, startDetection, stopDetection } = useDetection();
  const { streak, updateStreak } = useStreak();

  const TOTAL_DURATION = steps.reduce((sum, s) => sum + s.duration, 0);

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
  }, [stopTimer, stopDetection]);

  function finish() {
    stop();
    updateStreak();
    setCompleted(true);
  }

  useEffect(() => {
    if (score !== null && score !== undefined) {
      setScoreHistory((prev) => [...prev, score]);
    }
  }, [score]);

  const averageScore =
    scoreHistory.length > 0
      ? Math.round(
          scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length
        )
      : 0;

  const restart = () => {
    setCompleted(false);
    setStepIndex(0);
    setScoreHistory([]);
    resetTimer();
  };

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
