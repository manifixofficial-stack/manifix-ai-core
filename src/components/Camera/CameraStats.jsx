// src/components/Camera/CameraStats.jsx
import React from "react";
import "../../styles/CameraStats.css";

export default function CameraStats({ fps, resolution }) {
  return (
    <div className="camera-stats">
      <p>FPS: {fps || 0}</p>
      <p>Resolution: {resolution || "N/A"}</p>
    </div>
  );
}
