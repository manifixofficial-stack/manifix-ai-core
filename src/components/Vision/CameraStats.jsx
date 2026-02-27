/* ==========================================================
 * ManifiX — Camera Stats Component
 * ----------------------------------------------------------
 * Responsibilities:
 * - Display real-time camera metrics
 * - Face detection count
 * - Emotion detection (from placeholder AI / Magic16)
 * - Posture feedback
 * ========================================================== */

import React, { useEffect, useState } from "react";
import visionService from "../../services/vision.service.js";

const CameraStats = () => {
  const [stats, setStats] = useState({
    faceCount: 0,
    emotions: [],
    posture: "neutral",
  });

  // ===============================
  // Update stats in real-time
  // ===============================
  useEffect(() => {
    // Subscribe to visionService updates
    const onUpdate = (newStats) => {
      setStats(newStats);
    };

    visionService.onUpdate = onUpdate;

    return () => {
      // Cleanup on unmount
      visionService.onUpdate = null;
    };
  }, []);

  return (
    <div className="camera-stats">
      <div className="stat-row">
        <strong>Faces Detected:</strong> {stats.faceCount}
      </div>

      <div className="stat-row">
        <strong>Emotions:</strong>{" "}
        {stats.emotions.length
          ? stats.emotions
              .map((e, i) =>
                Object.entries(e)
                  .map(([key, value]) => `${key}: ${(value * 100).toFixed(1)}%`)
                  .join(", ")
              )
              .join(" | ")
          : "N/A"}
      </div>

      <div className="stat-row">
        <strong>Posture:</strong> {stats.posture}
      </div>
    </div>
  );
};

export default CameraStats;
