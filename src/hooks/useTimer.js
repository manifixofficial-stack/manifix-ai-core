import { useState, useEffect, useRef, useCallback } from "react";

export default function useTimer({ steps, stepIndex, setStepIndex, onFinish }) {
  const [stepTime, setStepTime] = useState(steps[0]?.duration || 0);
  const [totalTime, setTotalTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const intervalRef = useRef(null);

  // update step time when stepIndex changes
  useEffect(() => {
    setStepTime(steps[stepIndex]?.duration || 0);
  }, [stepIndex, steps]);

  const startTimer = useCallback(() => {
    if (running || completed) return;
    setRunning(true);
  }, [running, completed]);

  const stopTimer = useCallback(() => {
    setRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setCompleted(false);
    setStepIndex(0);
    setStepTime(steps[0]?.duration || 0);
    setTotalTime(0);
  }, [steps, setStepIndex]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setStepTime(prevStepTime => {
        if (prevStepTime > 1) return prevStepTime - 1;

        // Step finished
        setStepIndex(prevIndex => {
          const nextIndex = prevIndex + 1;

          if (nextIndex < steps.length) {
            setStepTime(steps[nextIndex].duration);
            return nextIndex;
          } else {
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            if (onFinish) onFinish();
            return prevIndex;
          }
        });

        return 0;
      });

      setTotalTime(t => t + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, steps, setStepIndex, onFinish]);

  const totalDuration = steps.reduce((acc, s) => acc + s.duration, 0);
  const progress = totalDuration ? Math.min((totalTime / totalDuration) * 100, 100) : 0;

  return {
    stepTime,
    totalTime,
    totalDuration,
    progress,
    running,
    completed,
    startTimer,
    stopTimer,
    resetTimer
  };
}
