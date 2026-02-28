// src/components/Camera/CameraView.jsx
import React, { useRef, useEffect, useState } from "react";
import "../../styles/CameraView.css";

export default function CameraView({ onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    async function initCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="camera-video"
      />
      <button className="camera-capture-btn" onClick={onCapture}>
        Capture
      </button>
    </div>
  );
}
