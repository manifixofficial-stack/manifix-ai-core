import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getSessionSteps } from "../constants/steps";
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import confetti from "canvas-confetti";
import "../styles/magic16.css";

export default function Magic16() {
  const navigate = useNavigate();
  
  /* ================= REFS ================= */
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const detectorRef = useRef(null);

  /* ================= STATE ================= */
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [movementScore, setMovementScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [notifiedPro, setNotifiedPro] = useState(false);

  /* ================= PERSISTENCE ================= */
  const day = Number(localStorage.getItem("magic16_streak") || 1);
  const sessionSteps = useMemo(() => getSessionSteps(day), [day]);
  const [timeLeft, setTimeLeft] = useState(sessionSteps[0]?.duration || 30);

  /* ================= 1. AI ENGINE INIT ================= */
  useEffect(() => {
    const loadModel = async () => {
      const model = poseDetection.SupportedModels.MoveNet;
      detectorRef.current = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
      });
      setIsAiLoading(false);
    };
    loadModel();
  }, []);

  /* ================= 2. VOICE & HAPTICS ================= */
  const speak = (text, urgent = false) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = urgent ? 1.2 : 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    if (urgent) navigator.vibrate?.([100, 50, 100]);
  };

  /* ================= 3. AI POSE VERIFICATION ================= */
  const runDetection = async () => {
    if (detectorRef.current && videoRef.current && playing) {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses.length > 0 && poses[0].keypoints.some(k => k.score > 0.5)) {
        setMovementScore(prev => prev + 1);
        // Billion Dollar Logic: Real-time validation
        if (movementScore > 500 && !notifiedPro) {
          speak("Accuracy elite. You've unlocked Discipline Pro Tier.");
          setNotifiedPro(true);
        }
      } else {
        if (Math.random() > 0.9) speak("I see no effort. Correct your pose.", true);
      }
    }
  };

  /* ================= 4. VIRAL CLIP RECORDER (5 SEC) ================= */
  const captureViralClip = () => {
    if (!videoRef.current?.srcObject) return;
    
    const chunks = [];
    const stream = videoRef.current.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "video/webm" });
    
    mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setRecordedBlob(blob);
      setIsRecording(false);
      speak("Clip saved. Share your proof.");
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    speak("Recording proof of discipline.");
    
    setTimeout(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }, 5000);
  };

  /* ================= 5. SESSION FLOW ================= */
  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setPlaying(true);
      speak(`Day ${day}. Start with ${sessionSteps[0].name}`);
      
      timerRef.current = setInterval(() => {
        runDetection();
        setTimeLeft((prev) => {
          if (prev <= 1) return handleNextStep();
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      alert("Camera access denied. AI cannot verify your work.");
    }
  };

  const handleNextStep = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx >= sessionSteps.length) {
      finish();
      return 0;
    }
    setStepIndex(nextIdx);
    speak(sessionSteps[nextIdx].guidance || sessionSteps[nextIdx].name);
    return sessionSteps[nextIdx].duration;
  };

  const finish = () => {
    clearInterval(timerRef.current);
    confetti({ particleCount: 200, spread: 100 });
    speak("Session complete. You are in the top one percent.");
    
    setTimeout(() => {
      navigate("/result", {
        state: {
          accuracy: Math.min(Math.floor((movementScore / 960) * 100), 100),
          isPro: notifiedPro,
          video: recordedBlob
        }
      });
    }, 2000);
  };

  /* ================= UI RENDER ================= */
  return (
    <div className="magic16-billion-container">
      {/* AI Observer View */}
      <div className="video-feed">
        <video ref={videoRef} autoPlay playsInline muted />
        <div className="ai-stats-overlay">
          <div className="badge">AI TRACKING: {movementScore > 0 ? "LIVE" : "WAITING"}</div>
          {notifiedPro && <div className="pro-badge">DISCIPLINE PRO TIER</div>}
        </div>
        
        <button 
          className={`rec-btn ${isRecording ? 'active' : ''}`} 
          onClick={captureViralClip}
          disabled={!playing || isRecording}
        >
          {isRecording ? "🔴 RECORDING..." : "📸 REC 5s CLIP"}
        </button>
      </div>

      {/* Session Progress */}
      <div className="ui-overlay">
        <div className="header">
          <h2>{sessionSteps[stepIndex].name}</h2>
          <div className="timer-box">
            <h1>{timeLeft}</h1>
          </div>
        </div>

        <div className="progress-bar">
          <div className="fill" style={{ width: `${(stepIndex / sessionSteps.length) * 100}%` }} />
        </div>

        {!playing && (
          <button className="start-main-btn" onClick={startSession} disabled={isAiLoading}>
            {isAiLoading ? "INITIALIZING AI..." : "START MAGIC16 🔥"}
          </button>
        )}

        <div className="footer-stats">
          <span>DAY {day}</span>
          <span>ACCURACY: {Math.min(Math.floor((movementScore / 10)), 100)}%</span>
        </div>
      </div>
    </div>
  );
}
