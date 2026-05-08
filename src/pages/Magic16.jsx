import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import confetti from "canvas-confetti";

/* ─────────────────────────────────────────────
   INLINE STYLES  (no external CSS dependency)
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
    justifyContent: "center",
    padding: "0",
    overflow: "hidden",
    position: "relative",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,200,60,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,60,.04) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  corner: (pos) => ({
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: "#ffc83c",
    borderStyle: "solid",
    borderWidth: 0,
    ...pos,
  }),
  layout: {
    position: "relative",
    zIndex: 2,
    width: "min(420px, 96vw)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #222",
    paddingBottom: 10,
  },
  logo: {
    fontSize: 13,
    letterSpacing: "0.25em",
    color: "#ffc83c",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  dayBadge: {
    fontSize: 11,
    letterSpacing: "0.18em",
    color: "#555",
    textTransform: "uppercase",
  },
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
    gap: 8,
    color: "#333",
    fontSize: 12,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    background:
      "linear-gradient(90deg, transparent, #ffc83c55, #ffc83ccc, #ffc83c55, transparent)",
    animation: "scanMove 2.4s linear infinite",
    pointerEvents: "none",
  },
  overlay: {
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
    padding: "3px 7px",
    border: `1px solid ${active ? "#ff3c3c" : "#333"}`,
    color: active ? "#ff3c3c" : "#333",
    background: "#080808cc",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 5,
  }),
  proTag: {
    fontSize: 9,
    letterSpacing: "0.2em",
    fontWeight: 700,
    padding: "3px 7px",
    border: "1px solid #ffc83c",
    color: "#ffc83c",
    background: "#080808cc",
    textTransform: "uppercase",
  },
  recBtn: (active) => ({
    position: "absolute",
    bottom: 10,
    right: 10,
    background: active ? "#ff3c3c" : "#111",
    border: `1px solid ${active ? "#ff3c3c" : "#333"}`,
    color: active ? "#fff" : "#888",
    fontSize: 10,
    letterSpacing: "0.15em",
    padding: "6px 10px",
    cursor: active ? "not-allowed" : "pointer",
    textTransform: "uppercase",
    fontFamily: "inherit",
    transition: "all .2s",
  }),
  stepBox: {
    border: "1px solid #1a1a1a",
    padding: "16px 18px",
    background: "#0c0c0c",
  },
  stepLabel: {
    fontSize: 10,
    letterSpacing: "0.2em",
    color: "#444",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  stepName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f0ede6",
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    marginBottom: 10,
  },
  timerRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  timerNum: {
    fontSize: 52,
    fontWeight: 700,
    color: "#ffc83c",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
  },
  timerSec: {
    fontSize: 12,
    color: "#444",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  progressOuter: {
    height: 3,
    background: "#1a1a1a",
    width: "100%",
    marginTop: 12,
  },
  progressInner: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background: "#ffc83c",
    transition: "width .8s ease",
  }),
  statsRow: {
    display: "flex",
    gap: 10,
  },
  statBox: {
    flex: 1,
    border: "1px solid #1a1a1a",
    padding: "10px 14px",
    background: "#0c0c0c",
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: "0.2em",
    color: "#444",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f0ede6",
    fontVariantNumeric: "tabular-nums",
  },
  startBtn: (disabled) => ({
    width: "100%",
    padding: "16px",
    background: disabled ? "#111" : "#ffc83c",
    color: disabled ? "#333" : "#080808",
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all .2s",
  }),
  guidanceBox: {
    fontSize: 11,
    letterSpacing: "0.1em",
    color: "#666",
    textTransform: "uppercase",
    borderLeft: "2px solid #ffc83c",
    paddingLeft: 10,
    lineHeight: 1.6,
  },
  shareBtn: {
    background: "transparent",
    border: "1px solid #333",
    color: "#888",
    fontSize: 10,
    letterSpacing: "0.15em",
    padding: "6px 12px",
    cursor: "pointer",
    textTransform: "uppercase",
    fontFamily: "inherit",
    transition: "all .2s",
  },
};

/* ─────────────────────────────────────────────
   DEFAULT SESSION STEPS (fallback if no import)
───────────────────────────────────────────── */
const DEFAULT_STEPS = [
  { name: "Breath Reset", duration: 20, guidance: "Inhale 4 counts, exhale 4 counts. Ground yourself." },
  { name: "Shoulder Rolls", duration: 30, guidance: "10 slow rolls forward, 10 backward. Loosen up." },
  { name: "Hip Circles", duration: 30, guidance: "Hands on hips, big slow circles both directions." },
  { name: "Bodyweight Squats", duration: 45, guidance: "Feet shoulder width. Drive through heels. Controlled pace." },
  { name: "Push-Ups", duration: 45, guidance: "Elbows at 45 degrees. Full range of motion every rep." },
  { name: "Alternating Lunges", duration: 45, guidance: "Step forward, knee above ankle. Switch legs each rep." },
  { name: "Mountain Climbers", duration: 40, guidance: "Hands under shoulders. Drive knees alternately. Stay tight." },
  { name: "Plank Hold", duration: 45, guidance: "Core braced, hips level. Breathe. Don't you dare collapse." },
  { name: "Burpees", duration: 45, guidance: "Explosive jump, controlled descent. Every rep counts." },
  { name: "Cool Down Stretch", duration: 30, guidance: "Forward fold, quad stretch, shoulder cross. You earned this." },
];

function getSessionSteps(day) {
  try {
    const { getSessionSteps: fn } = require("../constants/steps");
    return fn(day);
  } catch {
    return DEFAULT_STEPS;
  }
}

/* ─────────────────────────────────────────────
   KEYFRAME INJECTION
───────────────────────────────────────────── */
function injectKeyframes() {
  if (document.getElementById("m16-kf")) return;
  const style = document.createElement("style");
  style.id = "m16-kf";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
    @keyframes scanMove { from { top: 0% } to { top: 100% } }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
    .m16-blink { animation: blink 1s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function Magic16() {
  const navigate = useNavigate();

  // ── refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const detectorRef = useRef(null);
  const stepIndexRef = useRef(0);         // ← mutable ref to avoid stale closure
  const movementScoreRef = useRef(0);     // ← same
  const playingRef = useRef(false);
  const notifiedProRef = useRef(false);

  // ── state (UI only)
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [movementScore, setMovementScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [notifiedPro, setNotifiedPro] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  const day = useMemo(() => Number(localStorage.getItem("magic16_streak") || 1), []);
  const sessionSteps = useMemo(() => getSessionSteps(day), [day]);
  const totalDuration = useMemo(() => sessionSteps.reduce((a, s) => a + s.duration, 0), [sessionSteps]);

  // ── lifecycle
  useEffect(() => {
    injectKeyframes();
    setTimeLeft(sessionSteps[0]?.duration ?? 30);

    const loadModel = async () => {
      await import("@tensorflow/tfjs-backend-webgl");
      const model = poseDetection.SupportedModels.MoveNet;
      detectorRef.current = await poseDetection.createDetector(model, {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });
      setIsAiLoading(false);
    };
    loadModel().catch(() => setIsAiLoading(false));

    return () => {
      clearInterval(timerRef.current);
      speechSynthesis.cancel();
    };
  }, []);

  // ── voice
  const speak = useCallback((text, urgent = false) => {
    const msg = new SpeechSynthesisUtterance(text);
    msg.rate = urgent ? 1.3 : 0.88;
    msg.pitch = urgent ? 1.1 : 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(msg);
    if (urgent) navigator.vibrate?.([80, 40, 80]);
  }, []);

  // ── pose detection (uses refs, never stale)
  const runDetection = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || !playingRef.current) return;
    try {
      const poses = await detectorRef.current.estimatePoses(videoRef.current);
      if (poses.length > 0 && poses[0].keypoints.some((k) => k.score > 0.45)) {
        movementScoreRef.current += 1;
        setMovementScore(movementScoreRef.current);

        // Accuracy: score relative to elapsed time (1 tick/sec expected)
        const elapsed = sessionSteps
          .slice(0, stepIndexRef.current)
          .reduce((a, s) => a + s.duration, 0);
        const acc = Math.min(Math.round((movementScoreRef.current / Math.max(elapsed + 1, 1)) * 100), 100);
        setAccuracy(acc);

        // Pro unlock at 80%+ accuracy after step 4
        if (!notifiedProRef.current && stepIndexRef.current >= 4 && acc >= 80) {
          notifiedProRef.current = true;
          setNotifiedPro(true);
          speak("Accuracy elite. You've unlocked Discipline Pro Tier.");
        }
      } else {
        if (Math.random() > 0.85) speak("Fix your form. I see no effort.", true);
      }
    } catch (_) {
      // silently ignore detection errors
    }
  }, [sessionSteps, speak]);

  // ── advance step (uses refs)
  const handleNextStep = useCallback(() => {
    const nextIdx = stepIndexRef.current + 1;

    if (nextIdx >= sessionSteps.length) {
      // finish
      clearInterval(timerRef.current);
      playingRef.current = false;
      setPlaying(false);

      confetti({ particleCount: 220, spread: 110, origin: { y: 0.6 } });
      speak("Session complete. You are in the top one percent.");

      const finalAccuracy = Math.min(
        Math.round((movementScoreRef.current / totalDuration) * 100),
        100
      );

      // Increment streak
      localStorage.setItem("magic16_streak", String(day + 1));

      setTimeout(() => {
        navigate("/result", {
          state: {
            accuracy: finalAccuracy,
            isPro: notifiedProRef.current,
            video: recordedBlob,
            day,
          },
        });
      }, 2200);

      return 0;
    }

    stepIndexRef.current = nextIdx;
    setStepIndex(nextIdx);
    const next = sessionSteps[nextIdx];
    speak(next.guidance || next.name);
    return next.duration;
  }, [sessionSteps, totalDuration, day, recordedBlob, navigate, speak]);

  // ── start session
  const startSession = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      playingRef.current = true;
      setPlaying(true);
      stepIndexRef.current = 0;
      movementScoreRef.current = 0;
      setStepIndex(0);
      setMovementScore(0);
      setTimeLeft(sessionSteps[0].duration);
      speak(`Day ${day}. Starting with ${sessionSteps[0].name}. ${sessionSteps[0].guidance}`);

      timerRef.current = setInterval(() => {
        if (!playingRef.current) return;
        runDetection();
        setTimeLeft((prev) => {
          if (prev <= 1) {
            const next = handleNextStep();
            return next;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setCameraError(true);
      speak("Camera access required for AI verification.", true);
    }
  }, [sessionSteps, day, speak, runDetection, handleNextStep]);

  // ── viral clip
  const captureViralClip = useCallback(() => {
    if (!videoRef.current?.srcObject || isRecording) return;
    const chunks = [];
    const stream = videoRef.current.srcObject;
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setRecordedBlob(blob);
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
      a.href = url;
      a.download = "magic16-proof.webm";
      a.click();
    }
  }, [recordedBlob]);

  // ── derived
  const stepProgress = ((stepIndex) / sessionSteps.length) * 100;
  const currentStep = sessionSteps[stepIndex] || sessionSteps[0];

  /* ─── RENDER ─── */
  return (
    <div style={S.root}>
      {/* background grid */}
      <div style={S.grid} />

      {/* corner brackets */}
      <div style={{ ...S.corner({ top: 16, left: 16 }), borderTopWidth: 2, borderLeftWidth: 2 }} />
      <div style={{ ...S.corner({ top: 16, right: 16 }), borderTopWidth: 2, borderRightWidth: 2 }} />
      <div style={{ ...S.corner({ bottom: 16, left: 16 }), borderBottomWidth: 2, borderLeftWidth: 2 }} />
      <div style={{ ...S.corner({ bottom: 16, right: 16 }), borderBottomWidth: 2, borderRightWidth: 2 }} />

      <div style={S.layout}>
        {/* ── HEADER */}
        <div style={S.header}>
          <span style={S.logo}>MAGIC16</span>
          <span style={S.dayBadge}>DAY {day} / STREAK</span>
        </div>

        {/* ── VIDEO FEED */}
        <div style={S.videoWrap}>
          <video ref={videoRef} style={S.video} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {/* placeholder when not playing */}
          {!playing && (
            <div style={S.videoPlaceholder}>
              <span style={{ fontSize: 28 }}>👁</span>
              <span>{cameraError ? "Camera blocked" : "AI Observer standby"}</span>
            </div>
          )}

          {/* scan line animation */}
          {playing && <div style={S.scanLine} />}

          {/* overlay badges */}
          <div style={S.overlay}>
            <div style={S.liveTag(playing)}>
              {playing && <span className="m16-blink">●</span>}
              {playing ? "LIVE" : "STANDBY"}
            </div>
            {notifiedPro && <div style={S.proTag}>PRO TIER ✦</div>}
          </div>

          {/* record button */}
          <button
            style={S.recBtn(isRecording)}
            onClick={captureViralClip}
            disabled={!playing || isRecording}
          >
            {isRecording ? "● REC…" : "▶ REC 5s"}
          </button>
        </div>

        {/* ── STEP INFO */}
        <div style={S.stepBox}>
          <div style={S.stepLabel}>Current Exercise — {stepIndex + 1} of {sessionSteps.length}</div>
          <div style={S.stepName}>{currentStep.name}</div>

          <div style={S.timerRow}>
            <span style={S.timerNum}>{timeLeft ?? currentStep.duration}</span>
            <span style={S.timerSec}>sec</span>
          </div>

          {/* progress bar */}
          <div style={S.progressOuter}>
            <div style={S.progressInner(stepProgress)} />
          </div>
        </div>

        {/* ── GUIDANCE */}
        {currentStep.guidance && (
          <div style={S.guidanceBox}>{currentStep.guidance}</div>
        )}

        {/* ── STATS */}
        <div style={S.statsRow}>
          <div style={S.statBox}>
            <div style={S.statLabel}>Accuracy</div>
            <div style={{ ...S.statValue, color: accuracy >= 80 ? "#ffc83c" : "#f0ede6" }}>
              {playing ? `${accuracy}%` : "—"}
            </div>
          </div>
          <div style={S.statBox}>
            <div style={S.statLabel}>Movements</div>
            <div style={S.statValue}>{movementScore}</div>
          </div>
          <div style={S.statBox}>
            <div style={S.statLabel}>AI Engine</div>
            <div style={{ ...S.statValue, fontSize: 13, letterSpacing: "0.05em" }}>
              {isAiLoading ? "INIT…" : playing ? "ACTIVE" : "READY"}
            </div>
          </div>
        </div>

        {/* ── CTA */}
        {!playing && (
          <button style={S.startBtn(isAiLoading)} onClick={startSession} disabled={isAiLoading}>
            {isAiLoading ? "Initializing AI Engine…" : `Start Magic16 — Day ${day}`}
          </button>
        )}

        {/* ── SHARE CLIP */}
        {recordedBlob && (
          <button style={S.shareBtn} onClick={shareClip}>
            ↗ Share Proof Clip
          </button>
        )}
      </div>
    </div>
  );
}
