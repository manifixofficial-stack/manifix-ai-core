import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import confetti from "canvas-confetti";
import { getSessionSteps } from "../constants/steps";

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — MODE CONFIG
   Colors + voice speed per mode
───────────────────────────────────────────── */
const MODE_CONFIG = {
  morning: {
    accent:       "#ffc83c",
    accentDim:    "#c8a84b",
    progressGrad: "linear-gradient(90deg,#c8a84b,#ffc83c)",
    border:       "#2a2010",
    bg:           "#0f0d08",
    gridColor:    "rgba(255,200,60,.04)",
    voiceRate:    0.88,
    voicePitch:   0.95,
    label:        "Morning",
  },
  sleep: {
    accent:       "#6b46c1",
    accentDim:    "#9b8fd4",
    progressGrad: "linear-gradient(90deg,#3b1f6e,#6b46c1)",
    border:       "#1e1a30",
    bg:           "#0d0b18",
    gridColor:    "rgba(107,70,193,.04)",
    voiceRate:    0.72,   // slower, softer for sleep
    voicePitch:   0.85,
    label:        "Sleep",
  },
  focus: {
    accent:       "#378ADD",
    accentDim:    "#2d6db5",
    progressGrad: "linear-gradient(90deg,#1a3a6e,#378ADD)",
    border:       "#0f1e2e",
    bg:           "#080d18",
    gridColor:    "rgba(55,138,221,.04)",
    voiceRate:    0.92,
    voicePitch:   1.0,
    label:        "Focus",
  },
  posture: {
    accent:       "#22c55e",
    accentDim:    "#16a34a",
    progressGrad: "linear-gradient(90deg,#14532d,#22c55e)",
    border:       "#1a2a20",
    bg:           "#0a1410",
    gridColor:    "rgba(34,197,94,.04)",
    voiceRate:    0.88,
    voicePitch:   0.95,
    label:        "Posture",
  },
};

/* ─────────────────────────────────────────────
   ✅ ADDITION 2 — LANGUAGE MAP
───────────────────────────────────────────── */
const LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  es: "es-ES",
  ar: "ar-SA",
  fr: "fr-FR",
  pt: "pt-BR",
  de: "de-DE",
  zh: "zh-CN",
};

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — load mode from localStorage
───────────────────────────────────────────── */
function loadMode() {
  const raw = localStorage.getItem("magic16_mode") || "morning";
  return MODE_CONFIG[raw] ? raw : "morning";
}

/* ─────────────────────────────────────────────
   ✅ ADDITION 2 — load language from localStorage
───────────────────────────────────────────── */
function loadLang() {
  const code = localStorage.getItem("magic16_lang") || "en";
  return LANG_MAP[code] || "en-IN";
}

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 + 2 — createSpeaker
   Returns speak(text, urgent?) bound to lang + mode
───────────────────────────────────────────── */
function createSpeaker(langBcp47, modeKey) {
  const cfg = MODE_CONFIG[modeKey] || MODE_CONFIG.morning;
  return function speak(text, urgent = false) {
    if (!("speechSynthesis" in window)) return;
    const msg   = new SpeechSynthesisUtterance(text);
    msg.lang    = langBcp47;
    msg.rate    = urgent ? 1.25 : cfg.voiceRate;
    msg.pitch   = urgent ? 1.1  : cfg.voicePitch;

    // Try to match a system voice for the chosen language
    const voices = window.speechSynthesis.getVoices();
    const langBase = langBcp47.split("-")[0];
    const match = voices.find(v => v.lang.startsWith(langBase))
               || voices.find(v => v.lang.startsWith("en"));
    if (match) msg.voice = match;

    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    if (urgent) navigator.vibrate?.([80, 40, 80]);
  };
}

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

    @keyframes scanMove    { from{top:-4px} to{top:100%} }
    @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0.15} }
    @keyframes pulse-ring  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.6);opacity:0} }
    @keyframes fadeSlideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes shimmer     { from{background-position:-200% center} to{background-position:200% center} }
    @keyframes gridPulse   { 0%,100%{opacity:0.04} 50%{opacity:0.07} }

    .m16-blink       { animation: blink 1s ease-in-out infinite; }
    .m16-fade-up     { animation: fadeSlideUp 0.45s ease both; }
    .m16-shimmer-text {
      background: linear-gradient(90deg,#ffc83c,#ffe08a,#ffc83c,#ffe08a);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 2.5s linear infinite;
    }
    .m16-pulse-ring {
      position:absolute; inset:0; border-radius:50%;
      border:2px solid #ff3c3c;
      animation:pulse-ring 1.4s ease-out infinite;
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────
   FALLBACK STEPS (morning default)
───────────────────────────────────────────── */
const DEFAULT_STEPS = [
  { name:"Mountain Pose",   duration:30, guidance:"Stand tall. Breathe deeply. Ground yourself.", type:"yoga"       },
  { name:"Forward Fold",    duration:30, guidance:"Relax neck. Release all tension.",             type:"yoga"       },
  { name:"Plank Hold",      duration:40, guidance:"Core braced. Hips level. Breathe.",            type:"yoga"       },
  { name:"Cobra",           duration:30, guidance:"Open chest. Lift slowly.",                     type:"yoga"       },
  { name:"Downward Dog",    duration:35, guidance:"Stretch entire body.",                         type:"yoga"       },
  { name:"Tree Pose",       duration:30, guidance:"Find your balance. Steady gaze.",              type:"yoga"       },
  { name:"Child Pose",      duration:30, guidance:"Rest. Release. Recover.",                      type:"yoga"       },
  { name:"Deep Breathing",  duration:60, guidance:"Inhale slowly. Exhale gently. Stay present.", type:"meditation" },
  { name:"Body Scan",       duration:60, guidance:"Release tension from head to toe.",            type:"meditation" },
  { name:"Focus Breath",    duration:55, guidance:"Observe each breath. Stay here.",             type:"meditation" },
  { name:"Relax Mind",      duration:55, guidance:"Let thoughts pass. You are the observer.",    type:"meditation" },
  { name:"Inner Stillness", duration:60, guidance:"Feel the silence. This is your power.",       type:"meditation" },
  { name:"Awareness",       duration:55, guidance:"Expand your awareness. Be here now.",         type:"meditation" },
  { name:"Calm Presence",   duration:60, guidance:"Stay peaceful. Session ending. Well done.",   type:"meditation" },
];

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — SLEEP STEPS
───────────────────────────────────────────── */
const SLEEP_STEPS = [
  { name:"Legs Up Wall",    duration:60, guidance:"Lie back. Legs up the wall. Breathe slowly.",  type:"yoga"       },
  { name:"Spinal Twist",    duration:45, guidance:"Gently twist. Release the day.",               type:"yoga"       },
  { name:"Child Pose",      duration:45, guidance:"Rest. Surrender. Let go.",                     type:"yoga"       },
  { name:"Supine Stretch",  duration:40, guidance:"Full body stretch. Breathe deep.",             type:"yoga"       },
  { name:"4-7-8 Breathing", duration:64, guidance:"Inhale four. Hold seven. Exhale eight.",      type:"meditation" },
  { name:"Body Scan",       duration:70, guidance:"Scan head to toe. Release every muscle.",      type:"meditation" },
  { name:"Sleep Intention", duration:60, guidance:"Set tomorrow's intention. Let tonight rest.",  type:"meditation" },
  { name:"Deep Rest",       duration:90, guidance:"Drift. You are safe. Sleep is near.",          type:"meditation" },
];

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — FOCUS STEPS
───────────────────────────────────────────── */
const FOCUS_STEPS = [
  { name:"Power Stance",    duration:30, guidance:"Stand tall. Set your intention.",              type:"yoga"       },
  { name:"Neck Release",    duration:30, guidance:"Slow circles. Release desk tension.",          type:"yoga"       },
  { name:"Eagle Arms",      duration:35, guidance:"Cross arms. Squeeze. Breathe.",               type:"yoga"       },
  { name:"Warrior I",       duration:40, guidance:"Strong foundation. Eyes forward.",            type:"yoga"       },
  { name:"Wrist Flow",      duration:25, guidance:"Circle wrists. Shake hands. Reset.",          type:"yoga"       },
  { name:"Box Breathing",   duration:60, guidance:"In four. Hold four. Out four. Hold four.",   type:"meditation" },
  { name:"Focus Anchor",    duration:60, guidance:"Pick one breath. Return every time you drift.",type:"meditation"},
  { name:"Clear Mind",      duration:65, guidance:"Empty the inbox. You are ready to execute.",  type:"meditation" },
];

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — POSTURE STEPS
───────────────────────────────────────────── */
const POSTURE_STEPS = [
  { name:"Chin Tuck",       duration:30, guidance:"Gently pull chin back. Hold. Release.",       type:"yoga"       },
  { name:"Shoulder Roll",   duration:30, guidance:"Roll back. Open chest. Sit tall.",            type:"yoga"       },
  { name:"Chest Opener",    duration:35, guidance:"Clasp hands behind. Lift chest. Breathe.",   type:"yoga"       },
  { name:"Seated Twist",    duration:30, guidance:"Rotate slowly. Both sides. Stay tall.",       type:"yoga"       },
  { name:"Hip Flexor",      duration:40, guidance:"Stand. Lunge. Release the hip.",              type:"yoga"       },
  { name:"Wrist Stretch",   duration:25, guidance:"Extend arms. Flex wrists. Hold ten seconds.",type:"yoga"       },
  { name:"Eye Rest",        duration:30, guidance:"Close eyes. Palms warm. Rest retinas.",       type:"yoga"       },
  { name:"Posture Reset",   duration:60, guidance:"Sit tall. Shoulders back. Screen at eye level.",type:"meditation"},
  { name:"Desk Breath",     duration:55, guidance:"Breathe deep. Remind spine to lengthen.",    type:"meditation" },
  { name:"Focus Reset",     duration:60, guidance:"Clear screen fatigue. Return sharp.",         type:"meditation" },
];

/* ─────────────────────────────────────────────
   ✅ ADDITION 1 — step loader by mode
───────────────────────────────────────────── */
function loadStepsForMode(modeKey, day) {
  if (modeKey === "sleep")   return SLEEP_STEPS;
  if (modeKey === "focus")   return FOCUS_STEPS;
  if (modeKey === "posture") return POSTURE_STEPS;
  // morning — dynamic steps, fallback to defaults
  try {
    const steps = getSessionSteps(day);
    return steps && steps.length > 0 ? steps : DEFAULT_STEPS;
  } catch {
    return DEFAULT_STEPS;
  }
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Magic16() {
  const navigate = useNavigate();

  // ✅ Addition 1 — read mode once on mount
  const modeKey = useMemo(() => loadMode(), []);
  const theme   = useMemo(() => MODE_CONFIG[modeKey], [modeKey]);

  // ✅ Addition 2 — read language once on mount
  const langBcp47 = useMemo(() => loadLang(), []);

  // ✅ Addition 1 + 2 — speak() bound to lang + mode speed/pitch
  const speak = useMemo(() => createSpeaker(langBcp47, modeKey), [langBcp47, modeKey]);

  // ── refs
  const videoRef         = useRef(null);
  const canvasRef        = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef         = useRef(null);
  const detectorRef      = useRef(null);
  const stepIndexRef     = useRef(0);
  const movementScoreRef = useRef(0);
  const playingRef       = useRef(false);
  const notifiedProRef   = useRef(false);
  const stepDurationRef  = useRef(0);

  // ── state
  const [isAiLoading,   setIsAiLoading]   = useState(true);
  const [playing,       setPlaying]       = useState(false);
  const [stepIndex,     setStepIndex]     = useState(0);
  const [movementScore, setMovementScore] = useState(0);
  const [accuracy,      setAccuracy]      = useState(0);
  const [timeLeft,      setTimeLeft]      = useState(null);
  const [stepProgress,  setStepProgress]  = useState(100);
  const [isRecording,   setIsRecording]   = useState(false);
  const [recordedBlob,  setRecordedBlob]  = useState(null);
  const [notifiedPro,   setNotifiedPro]   = useState(false);
  const [cameraError,   setCameraError]   = useState(false);
  const [sessionDone,   setSessionDone]   = useState(false);
  const [imgError,      setImgError]      = useState(false);

  const day = useMemo(() => {
    const streak = Number(localStorage.getItem("magic16_streak") || 0);
    return Math.max(1, streak + 1);
  }, []);

  // ✅ Addition 1 — steps for the active mode
  const sessionSteps = useMemo(() => loadStepsForMode(modeKey, day), [modeKey, day]);

  const totalDuration   = useMemo(() => sessionSteps.reduce((a, s) => a + s.duration, 0), [sessionSteps]);
  const currentStep     = sessionSteps[stepIndex] || sessionSteps[0];
  const overallProgress = Math.round((stepIndex / sessionSteps.length) * 100);
  const isYogaPhase     = currentStep?.type !== "meditation";

  // ── inline styles — driven by theme so every color responds to mode
  const S = useMemo(() => ({
    root: {
      minHeight: "100dvh",
      background: "#080808",
      color: "#f0ede6",
      fontFamily: "'DM Mono','Courier New',monospace",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      padding: "0 0 40px",
      overflow: "hidden", position: "relative",
    },
    grid: {
      position: "fixed", inset: 0,
      backgroundImage: `linear-gradient(${theme.gridColor} 1px,transparent 1px),linear-gradient(90deg,${theme.gridColor} 1px,transparent 1px)`,
      backgroundSize: "40px 40px",
      pointerEvents: "none",
      animation: "gridPulse 4s ease-in-out infinite",
    },
    corner: (pos) => ({
      position: "fixed", width: 18, height: 18,
      borderColor: theme.accent,
      borderStyle: "solid", borderWidth: 0, opacity: 0.5, ...pos,
    }),
    layout: {
      position: "relative", zIndex: 2,
      width: "min(420px,96vw)",
      display: "flex", flexDirection: "column",
      gap: 12, paddingTop: 20,
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: "1px solid #1e1e1e", paddingBottom: 10,
    },
    logo: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 26, letterSpacing: "0.06em", color: "#e8e4d9", lineHeight: 1,
    },
    // ✅ Addition 1 — mode badge
    modeBadge: {
      fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
      color: theme.accent, border: `1px solid ${theme.border}`,
      background: theme.bg, padding: "2px 8px", marginBottom: 2,
    },
    headerRight: {
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
    },
    dayBadge: {
      fontSize: 10, letterSpacing: "0.18em", color: "#444", textTransform: "uppercase",
    },
    exitBtn: {
      fontSize: 9, letterSpacing: "0.18em", color: "#333", textTransform: "uppercase",
      background: "none", border: "none", cursor: "pointer",
      fontFamily: "inherit", padding: 0, transition: "color .2s",
    },
    videoWrap: {
      position: "relative", width: "100%", aspectRatio: "4/3",
      background: "#0e0e0e", border: "1px solid #1e1e1e", overflow: "hidden",
    },
    video: {
      width: "100%", height: "100%",
      objectFit: "cover", transform: "scaleX(-1)", display: "block",
    },
    videoPlaceholder: {
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 10, color: "#2a2a2a", fontSize: 11,
      letterSpacing: "0.15em", textTransform: "uppercase",
    },
    scanLine: {
      position: "absolute", left: 0, right: 0, height: 2,
      background: `linear-gradient(90deg,transparent,${theme.accent}44,${theme.accent}aa,${theme.accent}44,transparent)`,
      animation: "scanMove 2.4s linear infinite", pointerEvents: "none",
    },
    videoOverlay: {
      position: "absolute", top: 8, left: 8, right: 8,
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    },
    liveTag: (active) => ({
      fontSize: 9, letterSpacing: "0.2em", fontWeight: 700, padding: "3px 8px",
      border: `1px solid ${active ? "#ff3c3c" : "#222"}`,
      color: active ? "#ff3c3c" : "#333",
      background: "#080808cc", textTransform: "uppercase",
      display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(4px)",
    }),
    proTag: {
      fontSize: 9, letterSpacing: "0.18em", fontWeight: 700, padding: "3px 8px",
      border: `1px solid ${theme.accent}`,
      color: theme.accent,
      background: "#080808cc", textTransform: "uppercase", backdropFilter: "blur(4px)",
    },
    accuracyOverlay: {
      position: "absolute", bottom: 8, left: 8,
      fontSize: 9, letterSpacing: "0.15em",
      color: theme.accent, background: "#080808bb",
      padding: "4px 8px", border: "1px solid #1e1e1e",
      textTransform: "uppercase", backdropFilter: "blur(4px)",
    },
    recBtn: (active) => ({
      position: "absolute", bottom: 8, right: 8,
      background: active ? "#ff3c3c" : "#111",
      border: `1px solid ${active ? "#ff3c3c" : "#2a2a2a"}`,
      color: active ? "#fff" : "#555",
      fontSize: 9, letterSpacing: "0.15em", padding: "5px 10px",
      cursor: active ? "not-allowed" : "pointer",
      textTransform: "uppercase", fontFamily: "inherit", transition: "all .2s",
    }),
    poseImageWrap: {
      position: "relative", width: "100%", aspectRatio: "4/3",
      overflow: "hidden", border: "1px solid #1a1a1a", background: "#0c0c0c",
    },
    poseImage: {
      width: "100%", height: "100%",
      objectFit: "contain", objectPosition: "center",
      opacity: 0.85, background: "#0c0c0c", transition: "opacity 0.4s ease",
    },
    poseImageOverlay: {
      position: "absolute", inset: 0,
      background: "linear-gradient(to right,#080808cc 0%,transparent 40%,transparent 60%,#080808cc 100%)",
      pointerEvents: "none",
    },
    poseTypeBadge: (type) => ({
      position: "absolute", top: 8, left: 8,
      fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
      padding: "3px 8px",
      border: `1px solid ${type === "yoga" ? theme.accent : "#6b46c1"}`,
      color: type === "yoga" ? theme.accent : "#c084fc",
      background: "#080808cc",
    }),
    stepBox: {
      border: `1px solid ${theme.border}`,
      padding: "16px 18px", background: theme.bg, position: "relative",
    },
    stepLabel: {
      fontSize: 9, letterSpacing: "0.22em", color: "#333",
      textTransform: "uppercase", marginBottom: 4, display: "block",
    },
    stepName: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 34, letterSpacing: "0.04em",
      color: "#f0ede6", lineHeight: 1, marginBottom: 12,
    },
    timerRow: { display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 },
    timerNum: (urgent) => ({
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 56, fontWeight: 700,
      color: urgent ? "#ff5c5c" : theme.accent,
      lineHeight: 1, fontVariantNumeric: "tabular-nums", transition: "color .3s",
    }),
    timerSec: {
      fontSize: 11, color: "#333", letterSpacing: "0.12em", textTransform: "uppercase",
    },
    progressOuter: { height: 2, background: "#1a1a1a", width: "100%", overflow: "hidden" },
    progressInner: (pct, type) => ({
      height: "100%", width: `${pct}%`,
      background: type === "meditation"
        ? "linear-gradient(90deg,#6b46c1,#c084fc)"
        : theme.progressGrad,
      transition: "width 0.8s ease",
    }),
    guidanceBox: (type) => ({
      fontSize: 11, letterSpacing: "0.1em", color: "#555",
      textTransform: "uppercase",
      borderLeft: `2px solid ${type === "meditation" ? "#6b46c1" : theme.accent}`,
      paddingLeft: 10, lineHeight: 1.7,
    }),
    statsRow: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
    statBox: { border: "1px solid #1a1a1a", padding: "10px 12px", background: "#0c0c0c" },
    statLabel: {
      fontSize: 8, letterSpacing: "0.22em", color: "#333",
      textTransform: "uppercase", marginBottom: 4, display: "block",
    },
    statValue: (highlight) => ({
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 24, letterSpacing: "0.03em",
      color: highlight ? theme.accent : "#e8e4d9",
      lineHeight: 1, transition: "color .3s",
    }),
    phaseRow: { display: "flex", gap: 6, alignItems: "center" },
    phaseChip: (active, type) => ({
      flex: 1, textAlign: "center", padding: "6px 0",
      fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase",
      border: `1px solid ${active ? (type === "meditation" ? "#6b46c1" : theme.accent) : "#141414"}`,
      color: active ? (type === "meditation" ? "#c084fc" : theme.accent) : "#222",
      background: active ? "#0c0c0c" : "transparent",
      transition: "all .3s",
    }),
    startBtn: (disabled) => ({
      width: "100%", padding: "17px",
      background: disabled ? "#111" : theme.accent,
      color: disabled ? "#2a2a2a" : "#080808",
      border: disabled ? "1px solid #1a1a1a" : "none",
      fontSize: 12, fontWeight: 700,
      letterSpacing: "0.22em", textTransform: "uppercase",
      fontFamily: "inherit",
      cursor: disabled ? "not-allowed" : "pointer", transition: "all .2s",
    }),
    errorBox: {
      border: "1px solid #2a1010", background: "#0a0808",
      padding: "14px 16px", fontSize: 11, color: "#ff5c5c",
      letterSpacing: "0.1em", textTransform: "uppercase",
      borderLeft: "2px solid #ff3c3c",
    },
    shareBtn: {
      background: "transparent", border: "1px solid #222", color: "#555",
      fontSize: 10, letterSpacing: "0.15em", padding: "8px 14px",
      cursor: "pointer", textTransform: "uppercase",
      fontFamily: "inherit", width: "100%", transition: "all .2s",
    },
    completeBanner: {
      border: "1px solid #1e4d1e", background: "#0a140a",
      padding: "16px 18px", textAlign: "center",
    },
    completeTitle: {
      fontFamily: "'Bebas Neue',sans-serif",
      fontSize: 32, letterSpacing: "0.08em", color: "#4ade80", lineHeight: 1, marginBottom: 4,
    },
    completeSub: { fontSize: 9, letterSpacing: "0.2em", color: "#1e4d1e", textTransform: "uppercase" },
  }), [theme]);

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
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, [sessionSteps]);

  // ── pose detection
  const runDetection = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !playingRef.current) return;
    if (videoRef.current.readyState < 2) return;
    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses.length > 0 && poses[0].keypoints.some(k => k.score > 0.45)) {
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

        if (!notifiedProRef.current && stepIndexRef.current >= 4 && acc >= 80) {
          notifiedProRef.current = true;
          setNotifiedPro(true);
          // ✅ Addition 2 — pro unlock in user's language + mode voice
          speak("Accuracy elite. You have unlocked Discipline Pro Tier.");
        }
      } else {
        if (currentStep?.type !== "meditation" && Math.random() > 0.88) {
          // ✅ Addition 2 — fix form cue in user's language
          speak("Fix your form. I see no movement.", true);
        }
      }
    } catch (_) {}
  }, [sessionSteps, speak, currentStep]);

  // ── advance step
  const handleNextStep = useCallback(() => {
    const nextIdx = stepIndexRef.current + 1;

    if (nextIdx >= sessionSteps.length) {
      clearInterval(timerRef.current);
      playingRef.current = false;
      setPlaying(false);
      setSessionDone(true);

      confetti({ particleCount: 250, spread: 120, origin: { y: 0.55 } });
      // ✅ Addition 2 — session complete in user's language + mode voice speed
      speak("Session complete. You are in the top one percent. Rest and integrate.");

      const finalAccuracy = Math.min(
        Math.round((movementScoreRef.current / totalDuration) * 100),
        100
      );

      if (typeof window.__magic16_recordComplete === "function") {
        window.__magic16_recordComplete();
      }

      setTimeout(() => {
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        navigate("/app/result", {
          state: {
            accuracy: finalAccuracy,
            isPro:    notifiedProRef.current,
            video:    recordedBlob,
            day,
            streak:   day,
            mode:     modeKey,    // ✅ Addition 1 — pass mode to result
            lang:     langBcp47,  // ✅ Addition 2 — pass lang to result
          },
        });
      }, 2500);

      return 0;
    }

    stepIndexRef.current = nextIdx;
    const next = sessionSteps[nextIdx];
    stepDurationRef.current = next.duration;
    setStepIndex(nextIdx);
    setStepProgress(100);
    setImgError(false);
    // ✅ Addition 2 — step guidance in chosen language voice
    speak(next.guidance || next.name);
    return next.duration;
  }, [sessionSteps, totalDuration, day, recordedBlob, navigate, speak, modeKey, langBcp47]);

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

      playingRef.current       = true;
      stepIndexRef.current     = 0;
      movementScoreRef.current = 0;
      stepDurationRef.current  = sessionSteps[0].duration;

      setPlaying(true);
      setStepIndex(0);
      setMovementScore(0);
      setAccuracy(0);
      setTimeLeft(sessionSteps[0].duration);
      setStepProgress(100);
      setImgError(false);

      // ✅ Addition 1 + 2 — session start in chosen language + mode speed
      speak(`Day ${day}. Starting with ${sessionSteps[0].name}. ${sessionSteps[0].guidance}`);

      timerRef.current = setInterval(() => {
        if (!playingRef.current) return;
        runDetection();
        setTimeLeft(prev => {
          const next = (prev ?? 1) - 1;
          const pct  = Math.round((next / stepDurationRef.current) * 100);
          setStepProgress(Math.max(0, pct));
          if (next <= 0) return handleNextStep();
          return next;
        });
      }, 1000);
    } catch {
      setCameraError(true);
      // ✅ Addition 2 — camera error in chosen language
      speak("Camera access is required for AI motion verification.", true);
    }
  }, [sessionSteps, day, speak, runDetection, handleNextStep]);

  // ── recording
  const captureViralClip = useCallback(() => {
    if (!videoRef.current?.srcObject || isRecording) return;
    const chunks = [];
    const mr = new MediaRecorder(videoRef.current.srcObject, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => chunks.push(e.data);
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

  const exitSession = useCallback(() => {
    clearInterval(timerRef.current);
    speechSynthesis.cancel();
    playingRef.current = false;
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    navigate("/app/dashboard");
  }, [navigate]);

  /* ─── RENDER ─── */
  return (
    <div style={S.root}>
      <div style={S.grid} />

      {/* corner brackets */}
      <div style={{ ...S.corner({ top:16,left:16 }),     borderTopWidth:2, borderLeftWidth:2  }} />
      <div style={{ ...S.corner({ top:16,right:16 }),    borderTopWidth:2, borderRightWidth:2 }} />
      <div style={{ ...S.corner({ bottom:16,left:16 }),  borderBottomWidth:2, borderLeftWidth:2  }} />
      <div style={{ ...S.corner({ bottom:16,right:16 }), borderBottomWidth:2, borderRightWidth:2 }} />

      <div style={S.layout}>

        {/* ── HEADER */}
        <div style={S.header}>
          <span style={S.logo}>MAGIC16</span>
          <div style={S.headerRight}>
            {/* ✅ Addition 1 — mode label in header */}
            <span style={S.modeBadge}>{theme.label} Mode</span>
            <span style={S.dayBadge}>Day {day} · {sessionSteps.length} steps</span>
            {!playing && (
              <button style={S.exitBtn} onClick={exitSession}>← Back</button>
            )}
          </div>
        </div>

        {/* ── PHASE INDICATOR */}
        <div style={S.phaseRow}>
          <div style={S.phaseChip(isYogaPhase, "yoga")}>
            {modeKey === "sleep" ? "Wind-down · 8 min"
             : modeKey === "posture" ? "Posture · 8 min"
             : "Yoga · 8 min"}
          </div>
          <div style={{ width:1, background:"#1a1a1a", alignSelf:"stretch" }} />
          <div style={S.phaseChip(!isYogaPhase, "meditation")}>
            {modeKey === "sleep"   ? "Sleep ritual · 8 min"
             : modeKey === "focus" ? "Focus breath · 8 min"
             : "Meditation · 8 min"}
          </div>
        </div>

        {/* ── VIDEO */}
        <div style={S.videoWrap}>
          <video ref={videoRef} style={S.video} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display:"none" }} />

          {!playing && (
            <div style={S.videoPlaceholder}>
              <span style={{ fontSize:32 }}>👁</span>
              <span>
                {cameraError ? "Camera blocked — allow access"
                 : isAiLoading ? "Loading AI engine..."
                 : "AI observer standby"}
              </span>
            </div>
          )}

          {playing && <div style={S.scanLine} />}

          <div style={S.videoOverlay}>
            <div style={S.liveTag(playing)}>
              {playing && <span className="m16-blink">●</span>}
              {playing ? "LIVE" : "STANDBY"}
            </div>
            {notifiedPro && <div style={S.proTag}>PRO ✦</div>}
          </div>

          {playing && (
            <div style={S.accuracyOverlay}>AI: {accuracy}% accuracy</div>
          )}

          <button
            style={S.recBtn(isRecording)}
            onClick={captureViralClip}
            disabled={!playing || isRecording}
          >
            {isRecording ? "● REC…" : "▶ REC 5s"}
          </button>
        </div>

        {/* ── POSE IMAGE */}
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

        {/* ── SESSION COMPLETE */}
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
              <div style={S.statValue(accuracy >= 80)}>{accuracy}%</div>
            </div>
            <div style={S.statBox}>
              <span style={S.statLabel}>Movements</span>
              <div style={S.statValue(false)}>{movementScore}</div>
            </div>
            <div style={S.statBox}>
              <span style={S.statLabel}>AI Engine</span>
              <div style={{ ...S.statValue(false), fontSize:13, letterSpacing:"0.05em" }}>
                {isAiLoading ? "INIT…" : "ACTIVE"}
              </div>
            </div>
          </div>
        )}

        {/* ── OVERALL PROGRESS */}
        {playing && (
          <div>
            <div style={{
              display:"flex", justifyContent:"space-between",
              fontSize:9, letterSpacing:"0.18em", color:"#2a2a2a",
              textTransform:"uppercase", marginBottom:5,
            }}>
              <span>Session progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div style={{ height:2, background:"#141414", overflow:"hidden" }}>
              <div style={{
                height:"100%", width:`${overallProgress}%`,
                background: theme.progressGrad,
                transition:"width 0.8s ease",
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
              : `Start ${theme.label}16 — Day ${day} →`}
          </button>
        )}

        {/* ── SHARE CLIP */}
        {recordedBlob && (
          <button style={S.shareBtn} onClick={shareClip}>↗ Share proof clip</button>
        )}

      </div>
    </div>
  );
}
