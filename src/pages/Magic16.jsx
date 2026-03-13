// src/pages/Magic16.jsx

import { useRef, useEffect, useState, useCallback } from "react";
import * as posedetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import confetti from "canvas-confetti";

import "../styles/magic16.css";
import logo from "../../assets/logo.png";

import PostureOverlay from "../components/Magic16/PostureOverlay";
import BreathingCircle from "../components/Magic16/BreathingCircle";

import meditationAudio from "../assets/audio/meditation/meditation.mp3";

// Yoga
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

// Meditation
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

  // ---------- Steps ----------
  const yogaSteps = [
    { img: yoga1, text: "Mountain Pose. Stand tall and breathe deeply.", duration: 60 },
    { img: yoga2, text: "Forward Fold. Relax your neck.", duration: 40 },
    { img: yoga3, text: "Half Lift. Lengthen your spine.", duration: 40 },
    { img: yoga4, text: "Plank Pose. Engage your core.", duration: 60 },
    { img: yoga5, text: "Cobra Pose. Open your chest.", duration: 40 },
    { img: yoga6, text: "Downward Dog. Stretch fully.", duration: 60 },
    { img: yoga71, text: "Warrior Pose 1. Strong stance.", duration: 40 },
    { img: yoga72, text: "Warrior Pose 2. Focus stability.", duration: 40 },
    { img: yoga73, text: "Warrior Pose 3. Balance.", duration: 40 },
    { img: yoga8, text: "Tree Pose. Deep focus.", duration: 60 },
  ];

  const meditationSteps = [
    { img: med1, text: "Close your eyes and breathe slowly.", duration: 60 },
    { img: med2, text: "Focus on your breath.", duration: 60 },
    { img: med3, text: "Release tension.", duration: 120 },
    { img: med4, text: "Feel calm energy.", duration: 60 },
    { img: med5, text: "Let thoughts pass.", duration: 60 },
    { img: med6, text: "Stay present.", duration: 60 },
    { img: med7, text: "Visualize success.", duration: 60 },
  ];

  const steps = [...yogaSteps, ...meditationSteps];
  const TOTAL_DURATION = steps.reduce((sum, s) => sum + s.duration, 0);

  // ---------- State ----------
  const [stepIndex, setStepIndex] = useState(0);
  const [stepTime, setStepTime] = useState(steps[0].duration);
  const [totalTime, setTotalTime] = useState(TOTAL_DURATION);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [streak, setStreak] = useState(
    Number(localStorage.getItem("magic16_streak") || 0)
  );

  const [level, setLevel] = useState("Beginner");
  const [coachText, setCoachText] = useState("");

  // ---------- Voice ----------
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

  // ---------- Audio ----------
  const playAudio = () => {

    const audio = new Audio(meditationAudio);
    audio.loop = true;
    audio.volume = 0.4;
    audio.play().catch(() => {});

    audioRef.current = audio;
  };

  // ---------- Pose ----------
  const angle = (A, B, C) => {

    const AB = { x: A.x - B.x, y: A.y - B.y };
    const CB = { x: C.x - B.x, y: C.y - B.y };

    const dot = AB.x * CB.x + AB.y * CB.y;

    const magAB = Math.hypot(AB.x, AB.y);
    const magCB = Math.hypot(CB.x, CB.y);

    return (Math.acos(dot / (magAB * magCB)) * 180) / Math.PI;
  };

  const detect = useCallback(async () => {

    if (!detectorRef.current || !videoRef.current) return;

    const poses = await detectorRef.current.estimatePoses(videoRef.current);

    if (!poses?.length) return;

    const kp = poses[0].keypoints;

    const hip = kp.find((k) => k.name === "left_hip");
    const knee = kp.find((k) => k.name === "left_knee");
    const ankle = kp.find((k) => k.name === "left_ankle");

    if (hip && knee && ankle) {

      const a = angle(hip, knee, ankle);

      const sc = Math.max(0, 100 - Math.abs(a - 90));

      setScore(Math.round(sc));
    }

  }, []);

  // ---------- Daily Streak ----------
  const updateStreak = () => {

    const last = localStorage.getItem("magic16_last");

    const today = new Date().toDateString();

    if (last !== today) {

      let s = Number(localStorage.getItem("magic16_streak") || 0);

      s += 1;

      localStorage.setItem("magic16_streak", s);
      localStorage.setItem("magic16_last", today);

      setStreak(s);
    }
  };

  // ---------- Level System ----------
  const updateLevel = (sessions) => {

    if (sessions >= 50) setLevel("Zen Master");
    else if (sessions >= 20) setLevel("Master");
    else if (sessions >= 5) setLevel("Explorer");
    else setLevel("Beginner");
  };

  // ---------- AI Coach ----------
  const generateCoach = () => {

    if (score > 90) {
      setCoachText("Excellent posture! Maintain this consistency.");
    } else if (score > 70) {
      setCoachText("Good work. Focus on balance in Tree Pose.");
    } else {
      setCoachText("Improve knee alignment during Warrior poses.");
    }
  };

  // ---------- Share ----------
  const shareResult = () => {

    const text = `I completed Magic16 🧘
Posture Score: ${score}%
🔥 Streak: ${streak} days

Try it on ManifiX`;

    if (navigator.share) {

      navigator.share({
        title: "Magic16 Challenge",
        text,
        url: "https://manifix.ai",
      });

    } else {

      navigator.clipboard.writeText(text);
      alert("Result copied to clipboard!");
    }
  };

  // ---------- Camera Init ----------
  useEffect(() => {

    const init = async () => {

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      streamRef.current = stream;

      videoRef.current.srcObject = stream;

      await tf.ready();

      await tf.setBackend("webgl");

      detectorRef.current = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );

      setLoading(false);

      speak("Welcome to Magic16");

    };

    init();

    return () => {

      streamRef.current?.getTracks().forEach((t) => t.stop());

      audioRef.current?.pause();

      clearInterval(timerRef.current);

      clearInterval(detectRef.current);
    };

  }, []);

  // ---------- Timer ----------
  const start = () => {

    if (playing) return;

    setPlaying(true);

    playAudio();

    speak(steps[stepIndex].text);

    detectRef.current = setInterval(detect, 400);

    timerRef.current = setInterval(() => {

      setTotalTime((t) => t - 1);

      setStepTime((prev) => {

        if (prev <= 1) {

          const next = stepIndex + 1;

          if (next >= steps.length) {

            finish();

            return 0;
          }

          setStepIndex(next);

          setStepTime(steps[next].duration);

          speak(steps[next].text);

          return steps[next].duration;
        }

        return prev - 1;

      });

      setProgress(
        Math.round(((TOTAL_DURATION - totalTime) / TOTAL_DURATION) * 100)
      );

    }, 1000);
  };

  const stop = () => {

    clearInterval(timerRef.current);

    clearInterval(detectRef.current);

    audioRef.current?.pause();

    setPlaying(false);
  };

  const finish = () => {

    stop();

    updateStreak();

    updateLevel(streak);

    generateCoach();

    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.6 },
    });

    speak("Congratulations! Ritual complete!");

    setCompleted(true);
  };

  // ---------- Completed ----------
  if (completed) {

    return (

      <div className="magic16-complete">

        <h1>🎉 Ritual Complete</h1>

        <h2>Posture Score {score}%</h2>

        <h3>🔥 Magic16 Streak: {streak} days</h3>

        <h4>Level: {level}</h4>

        <div className="magic16-coach">
          <h3>AI Coach</h3>
          <p>{coachText}</p>
        </div>

        <button onClick={shareResult}>
          Share Result
        </button>

        <button onClick={() => window.location.reload()}>
          Start Again
        </button>

      </div>

    );
  }

  // ---------- UI ----------
  return (

    <div className="magic16">

      {loading && (
        <div className="magic16-loading">
          Preparing your yoga trainer...
        </div>
      )}

      <img src={logo} className="magic16-logo" alt="logo" />

      <div className="magic16-camera">

        <PostureOverlay />

      </div>

      <div className="magic16-step">

        <img
          src={steps[stepIndex].img}
          alt="step"
          className="magic16-step-img"
        />

        <h1 className="magic16-step-text">
          {steps[stepIndex].text}
        </h1>

      </div>

      {stepIndex >= yogaSteps.length && (
        <BreathingCircle />
      )}

      <div className="magic16-progress">
        <div style={{ width: `${progress}%` }} />
      </div>

      {playing && (
        <div className="magic16-score">
          Posture Score {score}%
        </div>
      )}

      <div className="magic16-controls">

        {!playing ? (
          <button onClick={start}>Start Magic16</button>
        ) : (
          <button onClick={stop}>Pause</button>
        )}

      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        hidden
      />

    </div>
  );
}
