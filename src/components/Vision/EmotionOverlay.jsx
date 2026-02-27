/* ==========================================================
 * ManifiX — Emotion Overlay Component
 * ----------------------------------------------------------
 * Responsibilities:
 * - Show real-time detected emotions as overlay
 * - Works with VisionService / Magic16
 * ========================================================== */

import React, { useEffect, useState } from "react";
import visionService from "../../services/vision.service.js";

const EmotionOverlay = () => {
  const [emotions, setEmotions] = useState([]);

  // ===============================
  // Subscribe to vision updates
  // ===============================
  useEffect(() => {
    const onUpdate = (stats) => {
      setEmotions(stats.emotions || []);
    };

    visionService.onUpdate = onUpdate;

    return () => {
      visionService.onUpdate = null; // cleanup
    };
  }, []);

  return (
    <div className="emotion-overlay">
      {emotions.length ? (
        emotions.map((emotionObj, index) => (
          <div key={index} className="emotion-box">
            {Object.entries(emotionObj).map(([emotion, value]) => (
              <span key={emotion} className="emotion-text">
                {emotion}: {(value * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        ))
      ) : (
        <div className="emotion-box">No emotions detected</div>
      )}
    </div>
  );
};

export default EmotionOverlay;
