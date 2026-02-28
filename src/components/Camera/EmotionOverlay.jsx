// src/components/Camera/EmotionOverlay.jsx
import React from "react";
import "../../styles/EmotionOverlay.css";

export default function EmotionOverlay({ emotions }) {
  return (
    <div className="emotion-overlay">
      {emotions?.map((e, idx) => (
        <div key={idx} className="emotion-item">
          <span className="emotion-name">{e.name}</span>:{" "}
          <span className="emotion-score">{e.score.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
