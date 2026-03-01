// src/pages/Magic16.jsx
import { useRef, useEffect, useState, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import "../styles/magic16.css";
import confetti from "canvas-confetti";
import * as tf from "@tensorflow/tfjs";
import logo from "../assets/logo.png";

// Audio
import meditationAudio from "../assets/audio/meditation/meditation.mp3";

// Yoga step images
import yoga1 from "../assets/steps/yoga-01.png";
import yoga2 from "../assets/steps/yoga-02.png";
import yoga3 from "../assets/steps/yoga-03.png";
import yoga4 from "../assets/steps/yoga-04.png";
import yoga5 from "../assets/steps/yoga-05.png";
import yoga6 from "../assets/steps/yoga-06.png";
import yoga71 from "../assets/steps/yoga-07-1.png";
import yoga72 from "../assets/steps/yoga-07-2.png";
import yoga73 from "../assets/steps/yoga-07-3.png";
import yoga8 from "../assets/steps/yoga-08.png";

// Meditation step images
import med1 from "../assets/steps/med-01.png";
import med2 from "../assets/steps/med-02.png";
import med3 from "../assets/steps/med-03.png";
import med4 from "../assets/steps/med-04.png";
import med5 from "../assets/steps/med-05.png";
import med6 from "../assets/steps/med-06.png";
import med7 from "../assets/steps/med-07.png";

export default function Magic16() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const timerRef = useRef(null);
  const detectRef = useRef(null);
  const audioRef = useRef(null);
  const lastVoiceRef = useRef(0);

  // -------------------- Steps --------------------
  const yogaSteps = [
    { img: yoga1, text: "Mountain Pose. Stand tall and breathe deeply.", duration: 60 },
    { img: yoga2, text: "Forward Fold. Relax your neck and shoulders.", duration: 40 },
    { img: yoga3, text: "Half Lift. Lengthen your spine.", duration: 60 },
    { img: yoga4, text: "Plank Pose. Engage your core.", duration: 60 },
    { img: yoga5, text: "Cobra Pose. Open your chest gently.", duration: 40 },
    { img: yoga6, text: "Downward Dog. Stretch fully.", duration: 60 },
    { img: yoga71, text: "Warrior Pose 1. Strong and balanced.", duration: 40 },
    { img: yoga72, text: "Warrior Pose 2. Focus on stability.", duration: 40 },
    { img: yoga73, text: "Warrior Pose 3. Deepen the stance.", duration: 40 },
    { img: yoga8, text: "Tree Pose. Focus and stability.", duration: 60 },
  ];

  const meditationSteps = [
    { img: med1, text: "Close your eyes and breathe slowly.", duration: 60 },
    { img: med2, text: "Focus on your breath.", duration: 60 },
    { img: med3, text: "Release all tension.", duration: 120 },
    { img: med4, text: "Feel calm energy flowing.", duration: 60 },
    { img: med5, text: "Let thoughts pass gently.", duration: 60 },
    { img: med6, text: "Stay present in this moment.", duration: 60 },
    { img: med7, text: "Visualize success and abundance.", duration: 60 },
  ];

  const steps = [...yogaSteps, ...meditationSteps];
  const TOTAL_DURATION = steps.reduce((sum, step) => sum + step.duration, 0);

  // -------------------- State --------------------
  const [stepIndex, setStepIndex] = useState(0);
  const [stepTime, setStepTime] = useState(steps[0].duration);
  const [totalTime, setTotalTime] = useState(TOTAL_DURATION);
  const [playing, setPlaying] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveScore, setLiveScore] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [loading, setLoading] = useState(true);

  // -------------------- Voice Guidance --------------------
  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    const now = Date.now();
    if (now - lastVoiceRef.current < 4000) return;
    lastVoiceRef.current = now;

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // -------------------- Audio Playback --------------------
  const playAudio = (src) => {
    if (!src) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    audioRef.current = audio;
  };

  // -------------------- Camera & Detector --------------------
  useEffect(() => {
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        await tf.ready();
        await tf.setBackend("webgl");
        detectorRef.current = await posedetection.createDetector(
          posedetection.SupportedModels.MoveNet,
          { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );

        setLoading(false);
      } catch (err) {
        console.error("Camera or detector error:", err);
        setCameraError(true);
      }
    };
    init();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
      clearInterval(detectRef.current);
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // -------------------- Angle Calculator --------------------
  const angle = (A, B, C) => {
    const AB = { x: A.x - B.x, y: A.y - B.y };
    const CB = { x: C.x - B.x, y: C.y - B.y };
    const dot = AB.x * CB.x + AB.y * CB.y;
    const magAB = Math.hypot(AB.x, AB.y);
    const magCB = Math.hypot(CB.x, CB.y);
    const denom = magAB * magCB;
    if (!denom) return 0;
    return (Math.acos(Math.min(Math.max(dot / denom, -1), 1)) * 180) / Math.PI;
  };

  // -------------------- Pose Detection --------------------
  const detect = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current) return;
    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (!poses?.length) return;

      if ([3,5,6].includes(stepIndex)) {
        const kp = poses[0].keypoints;
        const hip = kp.find((k) => k.name === "left_hip");
        const knee = kp.find((k) => k.name === "left_knee");
        const ankle = kp.find((k) => k.name === "left_ankle");
        if (hip && knee && ankle) {
          const a = angle(hip, knee, ankle);
          const score = Math.max(0, 100 - Math.abs(a - 90));
          setLiveScore(Math.round(score));

          if (a < 75) speak("Bend your knee deeper");
          if (a > 110) speak("Do not overextend your knee");
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    }
  }, [stepIndex]);

  // -------------------- Timer --------------------
  const start = () => {
    if (playing) return;
    speak(steps[stepIndex]?.text);
    setPlaying(true);

    if (detectRef.current) clearInterval(detectRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTotalTime((t) => {
        const newTime = t > 0 ? t - 1 : 0;
        setProgress(Math.round(((TOTAL_DURATION - newTime) / TOTAL_DURATION) * 100));
        return newTime;
      });

      setStepTime((prev) => {
        if (prev <= 1) {
          setStepIndex((i) => {
            const next = i + 1;
            if (next >= steps.length) {
              finish();
              return i;
            }
            if (next >= yogaSteps.length && meditationAudio) playAudio(meditationAudio);
            setStepTime(steps[next]?.duration || 60);
            speak(steps[next]?.text);
            return next;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    detectRef.current = setInterval(detect, 400);
  };

  const stop = () => {
    clearInterval(timerRef.current);
    clearInterval(detectRef.current);
    if (audioRef.current) audioRef.current.pause();
    setPlaying(false);
  };

  const resetRitual = () => {
    setStepIndex(0);
    setStepTime(steps[0].duration);
    setTotalTime(TOTAL_DURATION);
    setProgress(0);
    setCompleted(false);
    setLiveScore(0);
    setPlaying(false);
  };

  const finish = () => {
    stop();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);

    confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
    setCompleted(true);
  };

  const format = (s) => `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;

  // -------------------- Result Overlay --------------------
  if (completed) {
    return (
      <div className="result-overlay fade-in">
        <div className="result-card scale-up">
          <h2>✨ Ritual Complete</h2>
          <h1>{liveScore}%</h1>
          <p>Posture Score</p>
          <button onClick={resetRitual}>Start Again</button>
        </div>
      </div>
    );
  }

  // -------------------- Main UI --------------------
  return (
    <div className="magic16-container">
      {loading && <div className="loading-screen"><h2>Initializing AI Ritual...</h2></div>}
      {cameraError && <div className="error-screen"><h2>Camera Access Required</h2><p>Please allow camera permission.</p></div>}

      <img src={logo} alt="ManifiX Logo" className="magic16-logo" />

      <div className="step-display">
        <img src={steps[stepIndex]?.img} alt="step" />
        <h2>{steps[stepIndex]?.text}</h2>
      </div>

      <div className="timer-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="timer">
          <p>Total: {format(totalTime)}</p>
          <p>Step: {format(stepTime)}</p>
        </div>
      </div>

      {([3,5,6].includes(stepIndex) && playing) && (
        <div className="live-score">
          <h3>Posture Score</h3>
          <h1>{liveScore}%</h1>
        </div>
      )}

      <div className="controls">
        {!playing ? (
          <button className="start-btn" onClick={start} disabled={loading}>Start</button>
        ) : (
          <button className="pause-btn" onClick={stop}>Pause</button>
        )}
      </div>

      <video ref={videoRef} autoPlay playsInline muted className="camera-feed" hidden />
    </div>
  );
}
