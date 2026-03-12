import React from "react";
import "../../styles/magic16.css";

export default function Magic16Controls({
  running = false,
  onStart,
  onPause,
  onRestart
}) {

  return (
    <div className="magic16-controls">

      {!running && (
        <button
          className="magic16-btn magic16-btn-primary"
          onClick={onStart}
        >
          ▶ Start
        </button>
      )}

      {running && (
        <button
          className="magic16-btn magic16-btn-secondary"
          onClick={onPause}
        >
          ⏸ Pause
        </button>
      )}

      <button
        className="magic16-btn magic16-btn-secondary"
        onClick={onRestart}
      >
        🔄 Restart
      </button>

    </div>
  );
}
