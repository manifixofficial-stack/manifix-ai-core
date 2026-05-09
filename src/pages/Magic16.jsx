import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import confetti from "canvas-confetti";
import { getSessionSteps } from "../constants/steps"; // ✅ FIXED: was require()

/* ─────────────────────────────────────────────
   KEYFRAME INJECTION
───────────────────────────────────────────── */
function injectKeyframes() {
  if (document.getElementById("m16-kf")) return;
  const style = document.createElement("style");
  style.id = "m16-kf";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes scanMove {
      from { top: -4px; }
      to   { top: 100%; }
    }
    @keyframes blink {
      0%,100% { opacity: 1; }
      50%     { opacity: 0.15; }
    }
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.6; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes shimmer {
      from { background-position: -200% center; }
      to   { background-position:  200% center; }
    }
    @keyframes gridPulse {
      0%,100% { opacity: 0.04; }
      50%     { opacity: 0.07; }
    }

    .m16-blink       { animation: blink 1s ease-in-out infinite; }
    .m16-fade-up     { animation: fadeSlideUp 0.45s ease both; }
    .m16-shimmer-text {
      background: linear-gradient(90deg, #ffc83c, #ffe08a, #ffc83c, #ffe08a);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 2.5s linear infinite;
    }
    .m16-pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid #ff3c3c;
      animation: pulse-ring 1.4s ease-out infinite;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────
   INLINE STYLES
───────────────────────────────────────────── */
const S = {
  root: {
    minHeight: "100dvh",
    background: "#080808",
    color: "#f0ede6",
    fontFamily: "'DM Mono', 'Courier New', monospace",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0 0 40px",
    overflow: "hidden",
    position: "relative",
  },
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,200,60,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,60,.04) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    animation: "gridPulse 4s ease-in-out infinite",
  },
  corner: (pos) => ({
    position: "fixed",
    width: 18,
    height: 18,
    borderColor: "#ffc83c",
    borderStyle: "solid",
    borderWidth: 0,
    opacity: 0.5,
    ...pos,
  }),
  layout: {
    position: "relative",
    zIndex: 2,
    width: "min(420px, 96vw)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    paddingTop: 20,
  },

  // ── header
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e1e1e",
    paddingBottom: 10,
  },
  logo: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 26,
    letterSpacing: "0.06em",
    color: "#e8e4d9",
    lineHeight: 1,
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  dayBadge: {
    fontSize: 10,
    letterSpacing: "0.18em",
    color: "#444",
    textTransform: "uppercase",
  },
  exitBtn: {
    fontSize: 9,
    letterSpacing: "0.18em",
    color: "#333",
    textTransform: "uppercase",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
    transition: "color .2s",
  },

  // ── video
  videoWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "4/3",
    background: "#0e0e0e",
    border: "1px solid #1e1e1e",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
    display: "block",
  },
  videoPlaceholder: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    color: "#2a2a2a",
    fontSize: 11,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    background:
      "linear-gradient(90deg, transparent, #ffc83c44, #ffc83caa, #ffc83c44, transparent)",
    animation: "scanMove 2.4s linear infinite",
    pointerEvents: "none",
  },
  videoOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  liveTag: (active) => ({
    fontSize: 9,
    letterSpacing: "0.2em",
    fontWeight: 700,
    padding: "3px 8px",
    border: `1px solid ${active ? "#ff3c3c" : "#222"}`,
    color: active ? "#ff3c3c" : "#333",
    background: "#080808cc",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 5,
    backdropFilter: "blur(4px)",
  }),
  proTag: {
    fontSize: 9,
    letterSpacing: "0.18em",
    fontWeight: 700,
    padding: "3px 8px",
    border: "1px solid #ffc83c",
    color: "#ffc83c",
    background: "#080808cc",
    textTransform: "uppercase",
    backdropFilter: "blur(4px)",
  },
  accuracyOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    fontSize: 9,
    letterSpacing: "0.15em",
    color: "#ffc83c",
    background: "#080808bb",
    padding: "4px 8px",
    border: "1px solid #1e1e1e",
    textTransform: "uppercase",
    backdropFilter: "blur(4px)",
  },
  recBtn: (active) => ({
    position: "absolute",
    bottom: 8,
    right: 8,
    background: active ? "#ff3c3c" : "#111",
    border: `1px solid ${active ? "#ff3c3c" : "#2a2a2a"}`,
    color: active ? "#fff" : "#555",
    fontSize: 9,
    letterSpacing: "0.15em",
    padding: "5px 10px",
    cursor: active ? "not-allowed" : "pointer",
    textTransform: "uppercase",
    fontFamily: "inherit",
    transition: "all .2s",
  }),

  // ── pose image
  poseImageWrap: {
    position: "relative",
    width: "100%",
    height: 130,
    overflow: "hidden",
    border: "1px solid #1a1a1a",
    background: "#0c0c0c",
  },
  poseImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
    opacity: 0.75,
    transition: "opacity 0.4s ease",
  },
  poseImageOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to right, #080808cc 0%, transparent 40%, transparent 60%, #080808cc 100%)",
    pointerEvents: "none",
  },
  poseTypeBadge: (type) => ({
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 9,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    padding: "3px 8px",
    border: `1px solid ${type === "yoga" ? "#ffc83c" : "#6b46c1"}`,
    color: type === "yoga" ? "#ffc83c" : "#c084fc",
    background: "#080808cc",
  }),

  // ── step box
  stepBox: {
    border: "1px solid #1a1a1a",
    padding: "16px 18px",
    background: "#0c0c0c",
    position: "relative",
  },
  stepLabel: {
    fontSize: 9,
    letterSpacing: "0.22em",
    color: "#333",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  },
  stepName: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 34,
    letterSpacing: "0.04em",
    color: "#f0ede6",
    lineHeight: 1,
    marginBottom: 12,
  },
  timerRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 10,
  },
  timerNum: (urgent) => ({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 56,
    fontWeight: 700,
    color: urgent ? "#ff5c5c" : "#ffc83c",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    transition: "color .3s",
  }),
  timerSec: {
    fontSize: 11,
    color: "#333",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  progressOuter: {
    height: 2,
    background: "#1a1a1a",
    width: "100%",
    overflow: "hidden",
  },
  progressInner: (pct, type) => ({
    height: "100%",
    width: `${pct}%`,
    background: type === "meditation"
      ? "linear-gradient(90deg, #6b46c1, #c084fc)"
      : "linear-gradient(90deg, #c8a84b, #ffc83c)",
    transition: "width 0.8s ease",
  }),

  // ── guidance
  guidanceBox: (type) => ({
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "#555",
    textTransform: "uppercase",
    borderLeft: `2px solid ${type === "meditation" ? "#6b46c1" : "#ffc83c"}`,
    paddingLeft: 10,
    lineHeight: 1.7,
  }),

  // ── stats row
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  statBox: {
    border: "1px solid #1a1a1a",
    padding: "10px 12px",
    background: "#0c0c0c",
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: "0.22em",
    color: "#333",
    textTransform: "uppercase",
    marginBottom: 4,
    display: "block",
  },
  statValue: (highlight) => ({
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 24,
    letterSpacing: "0.03em",
    color: highlight ? "#ffc83c" : "#e8e4d9",
    lineHeight: 1,
    transition: "color .3s",
  }),

  // ── phase indicator
  phaseRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  phaseChip: (active, type) => ({
    flex: 1,
    textAlign: "center",
    padding: "6px 0",
    fontSize: 8,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    border: `1px solid ${active
      ? (type === "meditation" ? "#6b46c1" : "#ffc83c")
      : "#141414"}`,
    color: active
      ? (type === "meditation" ? "#c084fc" : "#ffc83c")
      : "#222",
    background: active ? "#0c0c0c" : "transparent",
    transition: "all .3s",
  }),

  // ── start button
  startBtn: (disabled) => ({
    width: "100%",
    padding: "17px",
    background: disabled ? "#111" : "#ffc83c",
    color: disabled ? "#2a2a2a" : "#080808",
    border: disabled ? "1px solid #1a1a1a" : "none",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s",
  }),

  // ── error
  errorBox: {
    border: "1px solid #2a1010",
    background: "#0a0808",
    padding: "14px 16px",
    fontSize: 11,
    color: "#ff5c5c",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    borderLeft: "2px solid #ff3c3c",
  },

  // ── share
  shareBtn: {
    background: "transparent",
    border: "1px solid #222",
    color: "#555",
    fontSize: 10,
    letterSpacing: "0.15em",
    padding: "8px 14px",
    cursor: "pointer",
    textTransform: "uppercase",
    fontFamily: "inherit",
    width: "100%",
    transition: "all .2s",
  },

  // ── session complete banner
  completeBanner: {
    border: "1px solid #1e4d1e",
    background: "#0a140a",
    padding: "16px 18px",
    textAlign: "center",
  },
  completeTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    letterSpacing: "0.08em",
    color: "#4ade80",
    lineHeight: 1,
    marginBottom: 4,
  },
  completeSub: {
    fontSize: 9,
    letterSpacing: "0.2em",
    color: "#1e4d1e",
    textTransform: "uppercase",
  },
};

/* ─────────────────────────────────────────────
   FALLBACK STEPS (if import fails)
───────────────────────────────────────────── */
const DEFAULT_STEPS = [
  { name: "Mountain Pose",    duration: 30, guidance: "Stand tall. Breathe deeply. Ground yourself.", type: "yoga"       },
  { name: "Forward Fold",     duration: 30, guidance: "Relax neck. Release all tension.",              type: "yoga"       },
  { name: "Plank Hold",       duration: 40, guidance: "Core braced. Hips level. Breathe.",             type: "yoga"       },
  { name: "Cobra",            duration: 30, guidance: "Open chest. Lift slowly.",                      type: "yoga"       },
  { name: "Downward Dog",     duration: 35, guidance: "Stretch entire body.",                          type: "yoga"       },
  { name: "Tree Pose",        duration: 30, guidance: "Find your balance. Steady gaze.",               type: "yoga"       },
  { name: "Child Pose",       duration: 30, guidance: "Rest. Release. Recover.",                       type: "yoga"       },
  { name: "Deep Breathing",   duration: 60, guidance: "Inhale slowly. Exhale gently. Stay present.",  type: "meditation" },
  { name: "Body Scan",        duration: 60, guidance: "Release tension from head to toe.",             type: "meditation" },
  { name: "Focus Breath",     duration: 55, guidance: "Observe each breath. Stay here.",              type: "meditation" },
  { name: "Relax Mind",       duration: 55, guidance: "Let thoughts pass. You are the observer.",     type: "meditation" },
  { name: "Inner Stillness",  duration: 60, guidance: "Feel the silence. This is your power.",        type: "meditation" },
  { name: "Awareness",        duration: 55, guidance: "Expand your awareness. Be here now.",          type: "meditation" },
  { name: "Calm Presence",    duration: 60, guidance: "Stay peaceful. Session ending. Well done.",    type: "meditation" },
];

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Magic16() {
  const navigate = useNavigate();

  // ── refs (mutable — never stale in closures)
  const videoRef          = useRef(null);
  const canvasRef         = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const timerRef          = useRef(null);
  const detectorRef       = useRef(null);
  const stepIndexRef      = useRef(0);
  const movementScoreRef  = useRef(0);
  const playingRef        = useRef(false);
  const notifiedProRef    = useRef(false);
  const stepDurationRef   = useRef(0);   // full duration of current step (for % calc)

  // ── UI state
  const [isAiLoading,  setIsAiLoading]  = useState(true);
  const [playing,      setPlaying]      = useState(false);
  const [stepIndex,    setStepIndex]    = useState(0);
  const [movementScore,setMovementScore]= useState(0);
  const [accuracy,     setAccuracy]     = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(null);
  const [stepProgress, setStepProgress] = useState(100); // % of current step remaining
  const [isRecording,  setIsRecording]  = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [notifiedPro,  setNotifiedPro]  = useState(false);
  const [cameraError,  setCameraError]  = useState(false);
  const [sessionDone,  setSessionDone]  = useState(false);
  const [imgError,     setImgError]     = useState(false); // pose image fallback

  // ✅ FIXED: day = streak + 1  (streak 0 → Day 1, streak 1 → Day 2, etc.)
  const day = useMemo(() => {
    const streak = Number(localStorage.getItem("magic16_streak") || 0);
    return Math.max(1, streak + 1);
  }, []);

  // load steps — use import (fixed), fallback to defaults
  const sessionSteps = useMemo(() => {
    try {
      const steps = getSessionSteps(day);
      return steps && steps.length > 0 ? steps : DEFAULT_STEPS;
    } catch {
      return DEFAULT_STEPS;
    }
  }, [day]);

  const totalDuration = useMemo(
    () => sessionSteps.reduce((a, s) => a + s.duration, 0),
    [sessionSteps]
  );

  const currentStep = sessionSteps[stepIndex] || sessionSteps[0];
  const overallProgress = Math.round((stepIndex / sessionSteps.length) * 100);
  const isYogaPhase = currentStep?.type !== "meditation";

  // ── lifecycle
  useEffect(() => {
    injectKeyframes();
    setTimeLeft(sessionSteps[0]?.duration ?? 30);
    stepDurationRef.current = sessionSteps[0]?.duration ?? 30;

    const loadModel = async () => {
      try {
        await import("@tensorflow/tfjs-backend-webgl");
        const model = poseDetection.SupportedModels.MoveNet;
        detectorRef.current = await poseDetection.createDetector(model, {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        });
      } catch (e) {
        console.warn("AI model load failed:", e);
      } finally {
        setIsAiLoading(false);
      }
    };
    loadModel();

    return () => {
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
      // clean up camera stream
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [sessionSteps]);

  // ── voice helper
  const speak = useCallback((text, urgent = false) => {
    if (!("speechSynthesis" in window)) return;
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate  = urgent ? 1.25 : 0.88;
    msg.pitch = urgent ? 1.1  : 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    if (urgent) navigator.vibrate?.([80, 40, 80]);
  }, []);

  // ── pose detection
  const runDetection = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !playingRef.current) return;
    if (videoRef.current.readyState < 2) return;
    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses.length > 0 && poses[0].keypoints.some((k) => k.score > 0.45)) {
        movementScoreRef.current += 1;
        setMovementScore(movementScoreRef.current);

        const elapsed = sessionSteps
          .slice(0, stepIndexRef.current)
          .reduce((a, s) => a + s.duration, 0);
        const acc = Math.min(
          Math.round((movementScoreRef.current / Math.max(elapsed + 1, 1)) * 100),
          100
        );
        setAccuracy(acc);

        // Pro unlock
        if (!notifiedProRef.current && stepIndexRef.current >= 4 && acc >= 80) {
          notifiedProRef.current = true;
          setNotifiedPro(true);
          speak("Accuracy elite. You have unlocked Discipline Pro Tier.");
        }
      } else {
        // Only nudge for yoga steps, not meditation
        if (
          currentStep?.type !== "meditation" &&
          Math.random() > 0.88
        ) {
          speak("Fix your form. I see no movement.", true);
        }
      }
    } catch (_) {
      // silently ignore
    }
  }, [sessionSteps, speak, currentStep]);

  // ── advance to next step
  const handleNextStep = useCallback(() => {
    const nextIdx = stepIndexRef.current + 1;

    if (nextIdx >= sessionSteps.length) {
      // ── SESSION COMPLETE
      clearInterval(timerRef.current);
      playingRef.current = false;
      setPlaying(false);
      setSessionDone(true);

      confetti({ particleCount: 250, spread: 120, origin: { y: 0.55 } });
      speak("Session complete. You are in the top one percent. Rest and integrate.");

      const finalAccuracy = Math.min(
        Math.round((movementScoreRef.current / totalDuration) * 100),
        100
      );

      // ✅ FIXED: call Dashboard's recordSessionComplete via window bridge
      // This keeps streak logic in ONE place (Dashboard.jsx)
      if (typeof window.__magic16_recordComplete === "function") {
        window.__magic16_recordComplete();
      }

      setTimeout(() => {
        // Stop camera stream
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        }
        navigate("/result", {
          state: {
            accuracy:  finalAccuracy,
            isPro:     notifiedProRef.current,
            video:     recordedBlob,
            day,                          // ✅ send 'day' (Result.jsx reads this)
            streak:    day,               // ✅ also send 'streak' so Result works either way
          },
        });
      }, 2500);

      return 0;
    }

    // ── next step
    stepIndexRef.current = nextIdx;
    const next = sessionSteps[nextIdx];
    stepDurationRef.current = next.duration;
    setStepIndex(nextIdx);
    setStepProgress(100);
    setImgError(false); // reset image error for new step
    speak(next.guidance || next.name);
    return next.duration;
  }, [sessionSteps, totalDuration, day, recordedBlob, navigate, speak]);

  // ── start session
  const startSession = useCallback(async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      playingRef.current    = true;
      stepIndexRef.current  = 0;
      movementScoreRef.current = 0;
      stepDurationRef.current  = sessionSteps[0].duration;

      setPlaying(true);
      setStepIndex(0);
      setMovementScore(0);
      setAccuracy(0);
      setTimeLeft(sessionSteps[0].duration);
      setStepProgress(100);
      setImgError(false);

      speak(
        `Day ${day}. Starting with ${sessionSteps[0].name}. ${sessionSteps[0].guidance}`
      );

      timerRef.current = setInterval(() => {
        if (!playingRef.current) return;
        runDetection();

        setTimeLeft((prev) => {
          const next = (prev ?? 1) - 1;
          // update step progress bar
          const pct = Math.round((next / stepDurationRef.current) * 100);
          setStepProgress(Math.max(0, pct));

          if (next <= 0) {
            const newDuration = handleNextStep();
            return newDuration;
          }
          return next;
        });
      }, 1000);
    } catch {
      setCameraError(true);
      speak("Camera access is required for AI motion verification.", true);
    }
  }, [sessionSteps, day, speak, runDetection, handleNextStep]);

  // ── viral clip recording
  const captureViralClip = useCallback(() => {
    if (!videoRef.current?.srcObject || isRecording) return;
    const chunks = [];
    const mr = new MediaRecorder(videoRef.current.srcObject, {
      mimeType: "video/webm;codecs=vp9",
    });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      setRecordedBlob(new Blob(chunks, { type: "video/webm" }));
      setIsRecording(false);
      speak("Clip saved. Share your proof.");
    };
    mr.start();
    setIsRecording(true);
    speak("Recording proof of discipline.");
    setTimeout(() => mr.state === "recording" && mr.stop(), 5000);
  }, [isRecording, speak]);

  // ── share clip
  const shareClip = useCallback(async () => {
    if (!recordedBlob) return;
    const file = new File([recordedBlob], "magic16-proof.webm", { type: "video/webm" });
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Magic16 — Proof of Discipline" });
    } else {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url; a.download = "magic16-proof.webm"; a.click();
    }
  }, [recordedBlob]);

  // ── exit session
  const exitSession = useCallback(() => {
    clearInterval(timerRef.current);
    speechSynthesis.cancel();
    playingRef.current = false;
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    navigate("/app/dashboard");
  }, [navigate]);

  /* ─── RENDER ─── */
  return (
    <div style={S.root}>
      {/* background grid */}
      <div style={S.grid} />

      {/* corner brackets */}
      <div style={{ ...S.corner({ top: 16, left: 16 }),   borderTopWidth: 2, borderLeftWidth: 2  }} />
      <div style={{ ...S.corner({ top: 16, right: 16 }),  borderTopWidth: 2, borderRightWidth: 2 }} />
      <div style={{ ...S.corner({ bottom: 16, left: 16 }),  borderBottomWidth: 2, borderLeftWidth: 2  }} />
      <div style={{ ...S.corner({ bottom: 16, right: 16 }), borderBottomWidth: 2, borderRightWidth: 2 }} />

      <div style={S.layout}>

        {/* ── HEADER */}
        <div style={S.header}>
          <span style={S.logo}>MAGIC16</span>
          <div style={S.headerRight}>
            <span style={S.dayBadge}>Day {day} · {sessionSteps.length} steps</span>
            {!playing && (
              <button style={S.exitBtn} onClick={exitSession}>
                ← Back
              </button>
            )}
          </div>
        </div>

        {/* ── PHASE INDICATOR */}
        <div style={S.phaseRow}>
          <div style={S.phaseChip(isYogaPhase, "yoga")}>
            Yoga · 8 min
          </div>
          <div style={{
            width: 1, background: "#1a1a1a", alignSelf: "stretch",
          }} />
          <div style={S.phaseChip(!isYogaPhase, "meditation")}>
            Meditation · 8 min
          </div>
        </div>

        {/* ── VIDEO FEED */}
        <div style={S.videoWrap}>
          <video ref={videoRef} style={S.video} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* placeholder */}
          {!playing && (
            <div style={S.videoPlaceholder}>
              <span style={{ fontSize: 32 }}>👁</span>
              <span>
                {cameraError
                  ? "Camera blocked — allow access"
                  : isAiLoading
                  ? "Loading AI engine..."
                  : "AI observer standby"}
              </span>
            </div>
          )}

          {/* scan line */}
          {playing && <div style={S.scanLine} />}

          {/* overlay badges */}
          <div style={S.videoOverlay}>
            <div style={S.liveTag(playing)}>
              {playing && <span className="m16-blink">●</span>}
              {playing ? "LIVE" : "STANDBY"}
            </div>
            {notifiedPro && <div style={S.proTag}>PRO ✦</div>}
          </div>

          {/* accuracy overlay (bottom left) */}
          {playing && (
            <div style={S.accuracyOverlay}>
              AI: {accuracy}% accuracy
            </div>
          )}

          {/* record button */}
          <button
            style={S.recBtn(isRecording)}
            onClick={captureViralClip}
            disabled={!playing || isRecording}
          >
            {isRecording ? "● REC…" : "▶ REC 5s"}
          </button>
        </div>

        {/* ── POSE IMAGE (shows during session) */}
        {playing && currentStep?.image && !imgError && (
          <div style={S.poseImageWrap} className="m16-fade-up">
            <img
              src={currentStep.image}
              alt={currentStep.name}
              style={S.poseImage}
              onError={() => setImgError(true)}
            />
            <div style={S.poseImageOverlay} />
            <div style={S.poseTypeBadge(currentStep.type)}>
              {currentStep.type === "yoga" ? "Yoga pose" : "Meditation"}
            </div>
          </div>
        )}

        {/* ── SESSION COMPLETE BANNER */}
        {sessionDone && (
          <div style={S.completeBanner} className="m16-fade-up">
            <div style={S.completeTitle}>SESSION COMPLETE</div>
            <div style={S.completeSub}>Redirecting to results…</div>
          </div>
        )}

        {/* ── STEP INFO */}
        {!sessionDone && (
          <div style={S.stepBox} className={playing ? "m16-fade-up" : ""}>
            <span style={S.stepLabel}>
              {currentStep?.type === "meditation" ? "Meditation" : "Yoga"} · Step {stepIndex + 1} of {sessionSteps.length}
            </span>
            <div style={S.stepName}>{currentStep?.name}</div>

            <div style={S.timerRow}>
              <span style={S.timerNum((timeLeft ?? 99) <= 5)}>
                {timeLeft ?? currentStep?.duration ?? "--"}
              </span>
              <span style={S.timerSec}>sec</span>
            </div>

            {/* step progress bar */}
            <div style={S.progressOuter}>
              <div style={S.progressInner(stepProgress, currentStep?.type)} />
            </div>
          </div>
        )}

        {/* ── GUIDANCE */}
        {!sessionDone && currentStep?.guidance && (
          <div style={S.guidanceBox(currentStep?.type)}>
            {currentStep.guidance}
          </div>
        )}

        {/* ── CAMERA ERROR */}
        {cameraError && (
          <div style={S.errorBox}>
            ⚠ Camera access denied. Please allow camera in your browser settings and reload.
          </div>
        )}

        {/* ── STATS ROW */}
        {playing && (
          <div style={S.statsRow}>
            <div style={S.statBox}>
              <span style={S.statLabel}>Accuracy</span>
              <div style={S.statValue(accuracy >= 80)}>
                {accuracy}%
              </div>
            </div>
            <div style={S.statBox}>
              <span style={S.statLabel}>Movements</span>
              <div style={S.statValue(false)}>{movementScore}</div>
            </div>
            <div style={S.statBox}>
              <span style={S.statLabel}>AI Engine</span>
              <div style={{ ...S.statValue(false), fontSize: 13, letterSpacing: "0.05em" }}>
                {isAiLoading ? "INIT…" : "ACTIVE"}
              </div>
            </div>
          </div>
        )}

        {/* ── OVERALL PROGRESS (session bar) */}
        {playing && (
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 9, letterSpacing: "0.18em", color: "#2a2a2a",
              textTransform: "uppercase", marginBottom: 5,
            }}>
              <span>Session progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div style={{ height: 2, background: "#141414", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${overallProgress}%`,
                background: "linear-gradient(90deg, #c8a84b, #ffc83c)",
                transition: "width 0.8s ease",
              }} />
            </div>
          </div>
        )}

        {/* ── START BUTTON */}
        {!playing && !sessionDone && (
          <button
            style={S.startBtn(isAiLoading || cameraError)}
            onClick={startSession}
            disabled={isAiLoading || cameraError}
          >
            {isAiLoading
              ? "Initializing AI Engine…"
              : `Start Magic16 — Day ${day} →`}
          </button>
        )}

        {/* ── SHARE CLIP */}
        {recordedBlob && (
          <button style={S.shareBtn} onClick={shareClip}>
            ↗ Share proof clip
          </button>
        )}

      </div>
    </div>
  );
}
