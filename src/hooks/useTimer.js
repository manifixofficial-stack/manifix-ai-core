import { useState, useEffect, useRef, useCallback } from "react";

const YOGA_DURATION = 8 * 60;       // 8 minutes
const MEDITATION_DURATION = 8 * 60; // 8 minutes
const TOTAL_DURATION = YOGA_DURATION + MEDITATION_DURATION;

export default function useTimer() {
  const [time, setTime] = useState(0);
  const [phase, setPhase] = useState("yoga"); 
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const intervalRef = useRef(null);

  // start timer
  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
  }, [running]);

  // pause timer
  const pause = useCallback(() => {
    setRunning(false);
  }, []);

  // reset timer
  const reset = useCallback(() => {
    setRunning(false);
    setTime(0);
    setPhase("yoga");
    setCompleted(false);
  }, []);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        const next = prev + 1;

        // switch phase
        if (next === YOGA_DURATION) {
          setPhase("meditation");
        }

        // finish session
        if (next >= TOTAL_DURATION) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setCompleted(true);
          return TOTAL_DURATION;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // progress %
  const progress = Math.min((time / TOTAL_DURATION) * 100, 100);

  // remaining time
  const remaining = TOTAL_DURATION - time;

 return {
  totalTime: TOTAL_DURATION,
  stepTime: TOTAL_DURATION - time, // or customize per step
  progress,
  startTimer: start,
  stopTimer: pause,
  resetTimer: reset,
  running,
  completed,
  phase,
  time
};
}
