// components/Magic16/PostureOverlay.jsx
import React, { useEffect, useRef } from "react";

export default function PostureOverlay() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    }

    startCamera();
  }, []);

  return (
    <div className="posture-container">
      <video ref={videoRef} autoPlay className="camera" />
      <canvas ref={canvasRef} className="skeleton-overlay" />
    </div>
  );
}
