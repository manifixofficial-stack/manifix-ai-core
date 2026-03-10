// src/hooks/useTimer.js
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * useTimer hook for Magic16
 * Handles per-step timer for yoga & meditation
 *
 * @param {Array} steps - array of step objects { duration: number }
 * @param {number} stepIndex - current step index
 * @param {function} setStepIndex - function to update stepIndex
 * @param {function} onFinish - callback when session ends
 */
export default function useTimer({ steps, stepIndex, setStepIndex, onFinish }) {
  const [stepTime, setStepTime] = useState(steps[stepIndex]?.duration || 0); // seconds left in current step
  const [totalTime, setTotalTime] = useState(0); // total seconds elapsed
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);

  const intervalRef = useRef(null);

  // Start timer
  const startTimer = useCallback(() => {
    if (running || completed) return;
    setRunning(true);
  }, [running, completed]);

  // Stop/pause timer
  const stopTimer = useCallback(() => {
    setRunning(false);
  }, []);

  // Reset timer
  const resetTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setCompleted(false);
    setStepTime(steps[0]?.duration || 0);
    setTotalTime(0);
    setStepIndex(0);
  }, [steps, setStepIndex]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setStepTime((prevStepTime) => {
        // Step finished
        if (prevStepTime <= 1) {
          // Advance to next step if exists
          if (stepIndex + 1 < steps.length) {
            setStepIndex(stepIndex + 1);
            return steps[stepIndex + 1].duration;
          } else {
            // Session completed
            clearInterval(intervalRef.current);
            setRunning(false);
            setCompleted(true);
            onFinish && onFinish();
            return 0;
          }
        }
        return prevStepTime - 1;
      });

      // Increment total time
      setTotalTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, stepIndex, steps, setStepIndex, onFinish]);

  // Progress: overall session %
  const totalDuration = steps.reduce((acc, s) => acc + s.duration, 0);
  const progress = Math.min((totalTime / totalDuration) * 100, 100);

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
