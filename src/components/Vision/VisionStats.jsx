import React from "react";

const CameraStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="camera-stats">
      <div className="stat-row">
        <strong>Face:</strong>{" "}
        {stats.faceCount > 0 ? "Yes" : "No"}
      </div>

      <div className="stat-row">
        <strong>Emotion:</strong>{" "}
        {stats.emotions?.[0]
          ? Object.keys(stats.emotions[0]).reduce((a, b) =>
              stats.emotions[0][a] > stats.emotions[0][b] ? a : b
            )
          : "neutral"}
      </div>

      <div className="stat-row">
        <strong>Posture:</strong> {stats.posture}
      </div>
    </div>
  );
};

export default CameraStats;
