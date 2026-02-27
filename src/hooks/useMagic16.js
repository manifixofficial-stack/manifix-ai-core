import { useEffect, useRef, useState } from "react";

const TOTAL_TIME = 16 * 60;
const YOGA_TIME = 8 * 60;

export default function useMagic16() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_TIME);
  const [phase, setPhase] = useState(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setPhase(null);
          return 0;
        }

        if (s === YOGA_TIME) setPhase("meditation");
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  const startSession = () => {
    setPhase("yoga");
    setSecondsLeft(TOTAL_TIME);
    setRunning(true);
  };

  const stopSession = () => {
    setRunning(false);
    setPhase(null);
  };

  return {
    phase,
    startSession,
    stopSession,
    progress: ((TOTAL_TIME - secondsLeft) / TOTAL_TIME) * 100,
    completed: secondsLeft === 0,
  };
}
