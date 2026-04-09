// src/pages/Session.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import "../styles/session.css";

const STEPS = [
  { name: "Breathing Focus", target: "calm" },
  { name: "Half Lift", target: "straight_back" },
  { name: "Plank Hold", target: "core" },
  { name: "Deep Stretch", target: "flexibility" },
  { name: "Meditation", target: "stillness" }
];

export default function Session() {
  const navigate = useNavigate();
  const videoRef = useRef();
  const canvasRef = useRef();

  const TOTAL_TIME = 60 * 16;
  const STEP_TIME = TOTAL_TIME / STEPS.length;

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [poseStatus, setPoseStatus] = useState("Detecting...");

  /* ---------------- CAMERA SETUP ---------------- */
  useEffect(() => {
    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    setupCamera();
  }, []);

  /* ---------------- AI POSE DETECTION ---------------- */
  useEffect(() => {
    let detector;

    async function initAI() {
      detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet
      );

      detectPose();
    }

    async function detectPose() {
      if (!videoRef.current) return;

      const poses = await detector.estimatePoses(videoRef.current);

      if (poses.length > 0) {
        // FAKE LOGIC → replace with real angle checks later
        const good = Math.random() > 0.3;

        if (good) {
          setPoseStatus("✅ Perfect Form");
          setScore((s) => s + 5);
          setCombo((c) => c + 1);
          setFeedback("🔥 Perfect posture!");
        } else {
          setPoseStatus("⚠️ Adjust posture");
          setCombo(0);
          setFeedback("👉 Straighten your back");
        }
      }

      requestAnimationFrame(detectPose);
    }

    initAI();
  }, []);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finish();
          return 0;
        }

        setScore((s) => s + 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- STEP FLOW ---------------- */
  useEffect(() => {
    const index = Math.floor((TOTAL_TIME - timeLeft) / STEP_TIME);

    if (index !== step) {
      setStep(index);
      setScore((s) => s + 50);
      setFeedback("🎉 Step Complete!");
    }
  }, [timeLeft]);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const finish = () => {
    navigate("/app/result", {
      state: {
        score,
        accuracy: 90,
        time: "16:00",
        xpEarned: score / 2,
        streak: 7
      }
    });
  };

  return (
    <div className="session">

      {/* CAMERA */}
      <div className="camera-box">
        <video ref={videoRef} className="video" />
        <canvas ref={canvasRef} className="overlay" />
      </div>

      {/* TIMER */}
      <h1 className="timer">{formatTime(timeLeft)}</h1>

      {/* STEP */}
      <h2 className="step">{STEPS[step]?.name}</h2>

      {/* AI STATUS */}
      <div className="pose-status">{poseStatus}</div>

      {/* FEEDBACK */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="feedback"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCORE */}
      <div className="score">
        ⚡ {score} | 🔥 x{combo}
      </div>

      {/* PROGRESS */}
      <div className="progress">
        <div
          style={{
            width: `${((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100}%`
          }}
        />
      </div>

      {/* END */}
      <button className="end-btn" onClick={finish}>
        End Session
      </button>

    </div>
  );
}
