import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { ensureSession } from "../lib/gameClient"; // ← added

const SLOT_COLORS = ["#3a86ff", "#8338ec", "#ff006e", "#fb5607"];

export default function RoomJoin({ onJoin, error, joining }) {
  const [roomCode, setRoomCode] = useState("");
  const [gateStage, setGateStage] = useState("greeting");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [sessionError, setSessionError] = useState(""); // ← added
  const videoRef = useRef(null);
  const chimeRef = useRef(null);

  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    let stream;
    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        setCameraError(true);
      }
    }
    startCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // FIX: establish (or reuse) a Supabase auth session as soon as this
  // screen mounts, so it's ready well before the player finishes typing
  // a room code. If claim_character's "Lobby session profile missing"
  // error is caused by there being no auth.uid() at all, this — plus
  // whatever auto-profile trigger already exists on your project —
  // should resolve it without any schema change on our end.
  useEffect(() => {
    ensureSession().catch((err) => {
      console.error('[RoomJoin] ensureSession failed', err);
      setSessionError('Could not start a session. Check your connection and reload.');
    });
  }, []);

  const fireVerifiedConfetti = () => {
    if (reduceMotion) return;
    confetti({
      particleCount: 60,
      spread: 70,
      startVelocity: 32,
      gravity: 0.9,
      scalar: 0.8,
      origin: { y: 0.45 },
      colors: SLOT_COLORS,
      disableForReducedMotion: true,
    });
  };

  const handleFaceTap = () => {
    if (gateStage !== "greeting") return;
    setPressed(true);
    setGateStage("scanning");
    chimeRef.current?.play?.().catch(() => {});
    setTimeout(() => {
      setGateStage("verified");
      fireVerifiedConfetti();
    }, 900);
    setTimeout(() => setGateStage("form"), 1900);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const room = roomCode.trim().toUpperCase();
    if (!room || joining) return;

    // FIX: make sure a session exists before handing off to App.jsx's
    // joinRoom()/claimCharacter() flow — covers the case where the
    // mount-time call above hadn't finished yet (slow network) by the
    // time the player submits the form.
    try {
      await ensureSession();
    } catch (err) {
      console.error('[RoomJoin] ensureSession failed on submit', err);
      setSessionError('Could not start a session. Check your connection and try again.');
      return;
    }

    onJoin(room);
  };

  return (
    <div style={styles.screen}>
      {!reduceMotion &&
        SLOT_COLORS.map((color, i) => (
          <motion.div
            key={color}
            style={{ ...styles.orb, background: color, left: `${10 + i * 24}%`, top: `${8 + (i % 2) * 55}%` }}
            animate={{
              x: [0, 22, -14, 0],
              y: [0, -18, 14, 0],
              opacity: [0.16, 0.28, 0.16],
            }}
            transition={{ duration: 9 + i * 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      <div style={styles.scanGrid} />

      {!cameraError && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            ...styles.video,
            opacity: cameraReady ? 1 : 0,
          }}
        />
      )}
      <div style={styles.videoScrim} />

      <audio ref={chimeRef} src="/sounds/chii-chiip.mp3" preload="auto" />

      <AnimatePresence mode="wait">
        {gateStage !== "form" ? (
          <motion.div
            key="scanner-card"
            style={styles.card}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.5 }}
          >
            <div style={styles.irisWrap}>
              <motion.svg
                viewBox="0 0 140 140"
                width="140"
                height="140"
                style={styles.irisSvg}
                animate={reduceMotion ? {} : { rotate: 360 }}
                transition={{ duration: gateStage === "scanning" ? 2.2 : 14, repeat: Infinity, ease: "linear" }}
              >
                {SLOT_COLORS.map((color, i) => (
                  <path
                    key={color}
                    d={arcPath(70, 70, 62, i * 90 + 6, i * 90 + 84)}
                    stroke={color}
                    strokeWidth={gateStage === "scanning" ? 5 : 3}
                    strokeLinecap="round"
                    fill="none"
                    opacity={gateStage === "verified" ? 1 : 0.85}
                  />
                ))}
              </motion.svg>

              <motion.div
                style={styles.robotFace}
                onClick={handleFaceTap}
                whileTap={{ scale: 0.92 }}
                animate={
                  gateStage === "greeting"
                    ? { y: [0, -8, 0] }
                    : gateStage === "verified"
                    ? { scale: [1, 1.1, 1] }
                    : {}
                }
                transition={{ duration: 2.2, repeat: gateStage === "greeting" ? Infinity : 0, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 120 120" width="96" height="96">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.7" />
                  <motion.ellipse
                    cx="40" cy="55" rx="8" ry={gateStage === "greeting" ? 10 : 2}
                    fill="#FFD700"
                    animate={gateStage === "greeting" ? { ry: [10, 1, 10] } : {}}
                    transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4 }}
                  />
                  <motion.ellipse
                    cx="80" cy="55" rx="8" ry={gateStage === "greeting" ? 10 : 2}
                    fill="#FFD700"
                    animate={gateStage === "greeting" ? { ry: [10, 1, 10] } : {}}
                    transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4 }}
                  />
                  <path
                    d={gateStage === "verified" ? "M40 78 Q60 95 80 78" : "M40 80 Q60 86 80 80"}
                    fill="none" stroke="#FFD700" strokeWidth="3" strokeLinecap="round"
                  />
                </svg>

                {gateStage === "scanning" && (
                  <motion.div
                    style={styles.laser}
                    initial={{ top: "-10%" }}
                    animate={{ top: "110%" }}
                    transition={{ duration: 0.9, ease: "easeIn" }}
                  />
                )}

                {pressed && gateStage === "scanning" && (
                  <motion.div
                    style={styles.ripple}
                    initial={{ scale: 0.4, opacity: 0.6 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </motion.div>
            </div>

            {gateStage === "greeting" && (
              <>
                <GlitchHeadline text="HII!" reduceMotion={reduceMotion} />
                <p style={styles.tapHint}>[ IDENTITY CHECK: TAP FACE TO INITIALISE OPTICAL RADAR ]</p>
              </>
            )}

            {gateStage === "scanning" && <p style={styles.tapHint}>SCANNING...</p>}

            {gateStage === "verified" && (
              <motion.p
                style={styles.verifiedText}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                IDENTITY VERIFIED!
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="code-card"
            style={styles.card}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 style={styles.title}>
              <span style={styles.titleGradientWord}>MANIFIX AI</span>
              <br />
              VEGGIE RUSH
            </h1>
            <p style={styles.subtitle}>
              Sit in a physical circle with your friends and type the exact same
              room code to enter the garden arena.
            </p>
            <form onSubmit={handleFormSubmit}>
              <motion.input
                style={styles.input}
                whileFocus={{
                  boxShadow: "0 0 0 2px rgba(255,215,0,0.55), 0 0 24px rgba(255,215,0,0.35)",
                }}
                type="text"
                placeholder="ENTER PARTY CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
              {(error || sessionError) && <p style={styles.errorText}>{sessionError || error}</p>}
              <motion.button
                type="submit"
                style={styles.joinBtn}
                disabled={joining}
                whileTap={{ scale: 0.96 }}
                whileHover={joining ? {} : { boxShadow: "0 0 26px rgba(255,215,0,0.55)" }}
              >
                {joining ? "CONNECTING…" : "CONNECT LOBBY"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GlitchHeadline({ text, reduceMotion }) {
  if (reduceMotion) {
    return <p style={styles.greetingText}>{text}</p>;
  }
  return (
    <div style={styles.glitchWrap}>
      <motion.span
        style={{ ...styles.greetingText, ...styles.glitchLayer, color: "#ff006e" }}
        initial={{ x: -6, opacity: 0.8 }}
        animate={{ x: 0, opacity: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        {text}
      </motion.span>
      <motion.span
        style={{ ...styles.greetingText, ...styles.glitchLayer, color: "#3a86ff" }}
        initial={{ x: 6, opacity: 0.8 }}
        animate={{ x: 0, opacity: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        {text}
      </motion.span>
      <motion.span
        style={{ ...styles.greetingText, position: "relative" }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        {text}
      </motion.span>
    </div>
  );
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const toRad = (d) => ((d - 90) * Math.PI) / 180;
  const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const end = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const styles = {
  screen: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#08080a", overflow: "hidden" },
  orb: { position: "absolute", width: "160px", height: "160px", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 },
  scanGrid: { position: "absolute", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,215,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%)" },
  video: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.6s ease" },
  videoScrim: { position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0.75) 100%)" },
  card: { position: "relative", zIndex: 2, width: "min(90vw, 380px)", padding: "32px 24px", borderRadius: "20px", background: "rgba(18, 16, 12, 0.72)", border: "1px solid rgba(255, 215, 0, 0.35)", boxShadow: "0 0 40px rgba(255, 215, 0, 0.08), inset 0 0 30px rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", textAlign: "center", fontFamily: "'Fredoka', sans-serif" },
  irisWrap: { position: "relative", width: "140px", height: "140px", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" },
  irisSvg: { position: "absolute", inset: 0, filter: "drop-shadow(0 0 10px rgba(255,255,255,0.15))" },
  robotFace: { position: "relative", width: "96px", height: "96px", cursor: "pointer", filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))" },
  laser: { position: "absolute", left: "-20px", right: "-20px", height: "3px", background: "linear-gradient(90deg, transparent, #FFD700 20%, #FFD700 80%, transparent)", boxShadow: "0 0 12px 2px rgba(255,215,0,0.8)" },
  ripple: { position: "absolute", inset: "-14px", borderRadius: "50%", border: "2px solid rgba(255,215,0,0.7)", pointerEvents: "none" },
  glitchWrap: { position: "relative", display: "inline-block" },
  glitchLayer: { position: "absolute", top: 0, left: 0, right: 0, mixBlendMode: "screen" },
  greetingText: { fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: "28px", color: "#FFD700", margin: "4px 0" },
  tapHint: { fontFamily: "'Orbitron', monospace", fontSize: "11px", letterSpacing: "1px", color: "#F5F0E8", opacity: 0.8 },
  verifiedText: { fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "16px", letterSpacing: "1px", color: "#39ff88", textShadow: "0 0 10px rgba(57,255,136,0.6)" },
  title: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: "22px", color: "#FFD700", lineHeight: 1.3, marginBottom: "12px" },
  titleGradientWord: { backgroundImage: "linear-gradient(90deg, #3a86ff, #8338ec, #ff006e, #fb5607)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  subtitle: { fontFamily: "'Fredoka', sans-serif", fontSize: "13px", color: "#F5F0E8", opacity: 0.75, marginBottom: "20px" },
  input: { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(255,215,0,0.4)", background: "rgba(0,0,0,0.5)", color: "#FFD700", fontFamily: "'Orbitron', monospace", fontSize: "14px", letterSpacing: "2px", textAlign: "center", marginBottom: "12px", outline: "none" },
  errorText: { color: "#ff5555", fontFamily: "'Fredoka', sans-serif", fontSize: "13px", marginBottom: "10px" },
  joinBtn: { width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "linear-gradient(180deg, #FFD700, #B8860B)", color: "#08080a", fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "1px", cursor: "pointer" },
};
