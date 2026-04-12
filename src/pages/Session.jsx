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
  const audioRef = useRef(null);

  /* ---------------- AUTO WEEK ---------------- */
  const getCurrentWeek = () => {
    const start = new Date("2024-01-01");
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return Math.min(4, Math.floor(diff / 7) + 1);
  };

  const STEPS = useMemo(() => getSessionSteps(getCurrentWeek()), []);

  /* ---------------- CONFIG ---------------- */
  const TOTAL_TIME = STEPS.reduce((sum, s) => sum + s.duration, 0);

  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [feedback, setFeedback] = useState("Get Ready");
  const [accuracy, setAccuracy] = useState(0);
  const [transition, setTransition] = useState(false);

  const [totalAccuracy, setTotalAccuracy] = useState(0);
  const [frames, setFrames] = useState(0);

  /* ---------------- SOUND ---------------- */
  const playBeep = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(
        "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
      );
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

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

  /* ---------------- STEP INDEX FIX (IMPORTANT) ---------------- */
  const getCurrentStepIndex = () => {
    let elapsed = TOTAL_TIME - timeLeft;
    let total = 0;

    for (let i = 0; i < STEPS.length; i++) {
      total += STEPS[i].duration;
      if (elapsed < total) return i;
    }

    return STEPS.length - 1;
  };

  const index = getCurrentStepIndex();

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

    if (acc > 80) {
      setScore((s) => s + 3);
      setCombo((c) => c + 1);
      playBeep();
    } else {
      setCombo(0);
    }

    setFeedback(msg);

    if (msg !== lastSpokenRef.current) {
      speak(msg);
      lastSpokenRef.current = msg;
    }
  };

  /* ---------------- DRAW ---------------- */
  const drawSkeleton = (ctx, keypoints) => {
    const pairs = [
      [5, 7],[7, 9],
      [6, 8],[8, 10],
      [5, 6],
      [5, 11],[6, 12],
      [11, 13],[13, 15],
      [12, 14],[14, 16],
      [11, 12]
    ];

    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;

    pairs.forEach(([i, j]) => {
      const kp1 = keypoints[i];
      const kp2 = keypoints[j];

      if (kp1.score > 0.4 && kp2.score > 0.4) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    });
  };

  /* ---------------- CAMERA ---------------- */
  useEffect(() => {
    let stream;
    let detector;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        detector = await posedetection.createDetector(
          posedetection.SupportedModels.MoveNet
        );

        detectPose();
      } catch {
        alert("Camera permission required");
      }
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

        drawSkeleton(ctx, keypoints);

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

  /* ---------------- STEP FLOW (FIXED) ---------------- */
  useEffect(() => {
    if (index !== step && index < STEPS.length) {
      setTransition(true);
      setTimeout(() => setTransition(false), 800);

      setStep(index);
      setScore((s) => s + 50);
      setFeedback("🎉 Step Complete!");
      speak("Next step");
      playBeep();
    }
  }, [index]);

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

  /* ---------------- UI ---------------- */
  const currentStep = STEPS[step] || STEPS[0];

  return (
    <div className="session">

      <div className="camera-box">
        <video ref={videoRef} autoPlay className="video" />
        <canvas ref={canvasRef} width={400} height={400} />
      </div>

      <div className={`step-container ${transition ? "step-anim" : ""}`}>
        <img src={currentStep.image} alt="" className="step-image" />
        <p>Follow this pose</p>
      </div>

      <h1>
        {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </h1>

      <h2>{currentStep.name}</h2>

      <div className="accuracy">🎯 {accuracy}%</div>
      <div className="score">⚡ {score} | 🔥 x{combo}</div>

      <div className="feedback">{feedback}</div>

      <div className="progress">
        <div style={{ width: `${((TOTAL_TIME - timeLeft) / TOTAL_TIME) * 100}%` }} />
      </div>

      <button onClick={finish}>End Session</button>

    </div>
  );
}
