// src/components/Magic16/Magic16Controls.jsx
import React from "react";
import "../../styles/magic16.css";

const Magic16Controls = ({
  running = false,
  paused = false,
  completed = false,
  onStart,
  onPause,
  onResume,
  onRestart
}) => {
  return (
    <div className="magic16-controls">
      {/* Start Button */}
      {!running && !paused && !completed && (
        <button
          className="magic16-btn magic16-btn-primary"
          onClick={onStart}
        >
          ▶ Start
        </button>
      )}

      {/* Pause Button */}
      {running && !paused && (
        <button
          className="magic16-btn magic16-btn-secondary"
          onClick={onPause}
        >
          ⏸ Pause
        </button>
      )}

      {/* Resume Button */}
      {paused && (
        <button
          className="magic16-btn magic16-btn-primary"
          onClick={onResume}
        >
          ▶ Resume
        </button>
      )}

      {/* Restart Button */}
      <button
        className="magic16-btn magic16-btn-danger"
        onClick={onRestart}
      >
        🔄 Restart
      </button>
    </div>
  );
};

export default Magic16Controls;
