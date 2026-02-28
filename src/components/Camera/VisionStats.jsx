// src/components/Camera/VisionStats.jsx
import React from "react";
import "../../styles/VisionStats.css";

export default function VisionStats({ objectsDetected }) {
  return (
    <div className="vision-stats">
      <h3>Vision Stats</h3>
      {objectsDetected && objectsDetected.length > 0 ? (
        <ul>
          {objectsDetected.map((obj, idx) => (
            <li key={idx}>
              {obj.label} - Confidence: {obj.confidence.toFixed(2)}
            </li>
          ))}
        </ul>
      ) : (
        <p>No objects detected.</p>
      )}
    </div>
  );
}
