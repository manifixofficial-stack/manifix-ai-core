import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "../../styles/magic16.css";

const BREATH_CYCLE = [
  { phase: "Inhale", duration: 4000, scale: 1.4 },
  { phase: "Hold", duration: 2000, scale: 1.4 },
  { phase: "Exhale", duration: 4000, scale: 1 },
];

export default function BreathingCircle() {
  const [index, setIndex] = useState(0);
  const current = BREATH_CYCLE[index];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % BREATH_CYCLE.length);
    }, current.duration);

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="breathing-container">
      <motion.div
        className="breathing-circle"
        animate={{
          scale: current.scale,
        }}
        transition={{
          duration: current.duration / 1000,
          ease: "easeInOut",
        }}
      />

      <motion.div
        key={current.phase}
        className="breathing-text"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {current.phase}
      </motion.div>
    </div>
  );
}
