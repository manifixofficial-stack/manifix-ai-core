import { motion } from "framer-motion";
import "../../styles/magic16.css";

function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Magic16Step({
  stepIndex = 0,
  step = {},
  stepTime = 0,
  totalSteps = 0
}) {
  return (
    <motion.div
      className="magic16-step-wrapper"
      key={stepIndex}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >

      {/* Step Counter */}
      <div className="magic16-step-counter">
        Step {stepIndex + 1} / {totalSteps}
      </div>

      {/* Step Title */}
      <h2 className="magic16-step-title">
        {step.title || "Focus"}
      </h2>

      {/* Step Instruction */}
      <p className="magic16-step-text">
        {step.text || "Follow the posture instructions carefully."}
      </p>

      {/* Step Timer */}
      <div className="magic16-step-timer">
        {formatTime(stepTime)}
      </div>

    </motion.div>
  );
}
