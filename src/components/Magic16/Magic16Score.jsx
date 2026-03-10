import { motion } from "framer-motion";
import "../../styles/magic16.css";

function getScoreStatus(score) {
  if (score >= 85) {
    return { label: "Excellent", color: "#22c55e" };
  }

  if (score >= 65) {
    return { label: "Good", color: "#facc15" };
  }

  if (score >= 40) {
    return { label: "Adjust Posture", color: "#fb923c" };
  }

  return { label: "Incorrect Posture", color: "#ef4444" };
}

export default function Magic16Score({ score = 0 }) {
  const status = getScoreStatus(score);

  return (
    <div className="magic16-score-wrapper">

      {/* Title */}
      <div className="magic16-score-title">
        Posture Score
      </div>

      {/* Score Circle */}
      <motion.div
        className="magic16-score-circle"
        animate={{
          borderColor: status.color
        }}
        transition={{ duration: 0.4 }}
      >
        <motion.span
          key={score}
          className="magic16-score-value"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {Math.round(score)}%
        </motion.span>
      </motion.div>

      {/* Status */}
      <motion.div
        className="magic16-score-status"
        animate={{ color: status.color }}
        transition={{ duration: 0.3 }}
      >
        {status.label}
      </motion.div>

    </div>
  );
}
