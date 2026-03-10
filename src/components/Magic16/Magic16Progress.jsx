import { motion } from "framer-motion";
import "../../styles/magic16.css";

function formatTime(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Magic16Progress({
  progress = 0,
  totalTime = 0,
  stepTime = 0
}) {
  return (
    <div className="magic16-progress-wrapper">

      {/* Timer Section */}
      <div className="magic16-progress-times">
        <div className="magic16-time-block">
          <span className="magic16-time-label">Total Time</span>
          <span className="magic16-time-value">{formatTime(totalTime)}</span>
        </div>

        <div className="magic16-time-block">
          <span className="magic16-time-label">Step Time</span>
          <span className="magic16-time-value">{stepTime}s</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="magic16-progress-bar-bg">
        <motion.div
          className="magic16-progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Percentage */}
      <div className="magic16-progress-percent">
        {Math.round(progress)}%
      </div>

    </div>
  );
}
