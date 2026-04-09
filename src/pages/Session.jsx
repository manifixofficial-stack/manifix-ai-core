// src/pages/Session.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { getSessionSteps } from "../constants/steps";
import "../styles/session.css";

export default function Session() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastRunRef = useRef(0);
  const lastSpokenRef = useRef("");

  /* ---------------- AUTO WEEK ---------------- */
  const getCurrentWeek = () => {
    const start = new Date("2024-01-01");
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(4, Math.floor(diff / 7) + 1);
  };

  const STEPS = useMemo(() => getSessionSteps(getCurrentWeek()), []);

  /* ---------------- CONFIG ---------------- */
  const TOTAL_TIME = 60 * 16;
  const STEP_TIME = TOTAL_TIME / STEPS.length;

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("Get Ready");
  const [accuracy, setAccuracy] = useState(0);

  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [frames, setFrames] = useState(0);

  /* ---------------- VOICE ---------------- */
  const speak = (msg) => {
    if (!window.speechSynthesis.speaking) {
      const utter = new SpeechSynthesisUtterance(msg);
      utter.rate = 1;
      window.speechSynthesis.speak(utter);
    }
  };

  /* ---------------- ANGLE ---------------- */
  const getAngle = (A, B, C) => {
    const AB = [A.x - B.x, A.y - B.y];
    const CB = [C.x - B.x, C.y - B.y];
    const dot = AB[0] * CB[0] + AB[1] * CB[1];
    const magAB = Math.hypot(...AB);
    const magCB = Math.hypot(...CB);
    return (Math.acos(dot / (magAB * magCB)) * 180) / Math.PI;
  };

  /* ---------------- POSE LOGIC ---------------- */
  const evaluatePose = (keypoints) => {
    const current = STEPS[step];

    const ls = keypoints[5];
    const rs = keypoints[6];
    const lh = keypoints[11];
    const rh = keypoints[12];

    let acc = 60;
    let msg = "Adjust position";

    switch (current.target) {
      case "straight_back":
        const backAngle = getAngle(lh, ls, rs);
        acc = 100 - Math.abs(100 - backAngle);
        msg = acc > 75 ? "Perfect back!" : "Straighten your back";
        break;

      case "plank":
        const plankAngle = getAngle(ls, lh, rh);
        acc = 100 - Math.abs(180 - plankAngle);
        msg = acc > 75 ? "Strong plank!" : "Raise your hips";
        break;

      case "stretch":
        const stretchAngle = getAngle(ls, rs, rh);
        acc = 100 - Math.abs(150 - stretchAngle);
        msg = acc > 70 ? "Great stretch!" : "Extend more";
        break;

      case "stillness":
        acc = 90;
        msg = "Stay still and breathe";
        break;

      case "calm":
        acc = 95;
        msg = "Focus on breathing";
        break;

      default:
        acc = 80;
        msg = "Keep going";
    }

    acc = Math.max(0, Math.min(100, acc));

    setAccuracy(acc.toFixed(0));
    setTotalAccuracy((t) => t + acc);
    setFrames((f) => f + 1);

    if (acc > 75) {
      setScore((s) => s + 2);
      setCombo((c) => c + 1);
    } else {
      setCombo(0);
    }

    setFeedback(msg);

    if (msg !== lastSpokenRef.current) {
      speak(msg);
      lastSpokenRef.current = msg;
    }
  };

  /* ---------------- CAMERA ---------------- */
  useEffect(() => {
    let stream;
    let detector;

    async function init() {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      detector = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet
      );

      detectPose();
    }

    async function detectPose(now = 0) {
      if (now - lastRunRef.current < 100) {
        requestAnimationFrame(detectPose);
        return;
      }
      lastRunRef.current = now;

      const poses = await detector.estimatePoses(videoRef.current);

      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, 400, 400);

      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;

        keypoints.forEach((kp) => {
          if (kp.score > 0.4) {
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = "#22d3ee";
            ctx.fill();
          }
        });

        evaluatePose(keypoints);
      }

      requestAnimationFrame(detectPose);
    }

    init();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* ---------------- TIMER ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- STEP FLOW ---------------- */
  useEffect(() => {
    const index = Math.floor((TOTAL_TIME - timeLeft) / STEP_TIME);

    if (index !== step && index < STEPS.length) {
      setStep(index);
      setScore((s) => s + 50);
      setFeedback("🎉 Step Complete!");
      speak("Step complete");
    }
  }, [timeLeft]);

  /* ---------------- FINISH ---------------- */
  const finish = () => {
    const avgAccuracy = frames ? totalAccuracy / frames : 0;

    navigate("/app/result", {
      state: {
        score,
        accuracy: avgAccuracy.toFixed(0),
        xpEarned: Math.floor(score / 2),
        streak: 7
      }
    });
  };

  /* ---------------- UI HELPERS ---------------- */
  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentStep = STEPS[step] || STEPS[STEPS.length - 1];

  /* ---------------- UI ---------------- */
  return (
    <div className="session">

      <div className="camera-box">
        <video ref={videoRef} autoPlay className="video" />
        <canvas ref={canvasRef} width={400} height={400} />
      </div>

      <img
        src={currentStep.image}
        alt={currentStep.name}
        className="step-image"
      />

      <h1>{formatTime(timeLeft)}</h1>
      <h2>{currentStep.name}</h2>

      <div className="accuracy">🎯 {accuracy}%</div>
      <div className="score">⚡ {score} | 🔥 x{combo}</div>

      <div className="feedback">{feedback}</div>

      <div className="progress">
        <div
          style={{
            width: `${((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100}%`
          }}
        />
      </div>

      <button onClick={finish}>End Session</button>

    </div>
  );
}
