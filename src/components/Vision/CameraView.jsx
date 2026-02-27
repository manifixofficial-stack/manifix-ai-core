/* ==========================================================
 * ManifiX — Camera View
 * ----------------------------------------------------------
 * Responsibilities:
 * - Request camera & microphone access
 * - Real-time video feed
 * - Integrate with Vision AI (face, posture, emotion)
 * - Privacy-first: user consent required
 * - Works on mobile + web
 * ========================================================== */

import React, { useEffect, useRef, useState } from "react";
import Button from "../UI/Button.jsx";
import visionService from "../../services/vision.service.js";

const CameraView = ({ onFrame, onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState(null);

  // ===============================
  // 🎥 INIT CAMERA
  // ===============================
  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true, // microphone access
      });
      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setPermissionGranted(true);

      // Start vision frame processing
      visionService.startProcessing(videoRef.current, onFrame);
    } catch (err) {
      console.error("Camera init error:", err);
      setError(err.message || "Camera access denied");
    }
  };

  // ===============================
  // 🚫 STOP CAMERA
  // ===============================
  const stopCamera = () => {
    visionService.stopProcessing();
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setPermissionGranted(false);
  };

  // ===============================
  // INIT ON MOUNT
  // ===============================
  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, []);

  // ===============================
  // UI
  // ===============================
  if (error) {
    return (
      <div className="camera-error">
        <p>⚠️ {error}</p>
        <Button onClick={initCamera}>Retry</Button>
      </div>
    );
  }

  if (!permissionGranted) {
    return (
      <div className="camera-permission">
        <p>📸 Please allow camera & microphone access to continue</p>
        <Button onClick={initCamera}>Allow Access</Button>
      </div>
    );
  }

  return (
    <div className="camera-view-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-video"
      />
      <Button onClick={() => { stopCamera(); onClose?.(); }} variant="danger">
        ✕ Close
      </Button>
    </div>
  );
};

export default CameraView;
