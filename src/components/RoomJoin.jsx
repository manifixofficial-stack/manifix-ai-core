import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// src/components/RoomJoin.jsx — Stage 1: The Biometric "Hii!" Face Scanner Gate
//
// Still a dumb/presentational component: only collects the room code and
// hands off to App.jsx via onJoin(). App.jsx keeps owning all socket.io
// logic. The camera feed here is purely decorative background — it is
// NEVER captured, analyzed, or sent anywhere. No ML, no frame grabbing.
export default function RoomJoin({ onJoin, error, connecting }) {
  const [roomCode, setRoomCode] = useState("");
  const [gateStage, setGateStage] = useState("greeting"); // greeting -> scanning -> verified -> form
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const chimeRef = useRef(null);
  const streamRef = useRef(null);

  // Camera is intentionally NOT requested on mount. Mobile browsers (iOS
  // Safari in particular, and increasingly Android/Chrome) require getUserMedia
  // to be triggered by a direct user tap, or the permission prompt is silently
  // blocked. This also matches the blueprint: camera/scan starts when the
  // player taps the robot face, not automatically on page load.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleFaceTap = async () => {
    if (gateStage !== "greeting") return;
    setGateStage("scanning");
    chimeRef.current?.play?.().catch(() => {}); // ignore autoplay-block errors

    // Requires a secure context: your live https:// domain or localhost.
    // A local network IP (http://192.168.x.x) will always fail here — that's
    // a browser security rule, not something fixable in code.
    if (!window.isSecureContext) {
      setCameraError(true);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        // Denied, no camera hardware, or blocked — game still proceeds,
        // just without the live camera backdrop.
        setCameraError(true);
      }
    }

    setTimeout(() => setGateStage("verified"), 900);
    setTimeout(() => setGateStage("form"), 1900);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const room = roomCode.trim().toUpperCase();
    if (!room || connecting) return;
    onJoin(room);
  };

  return (
    <div style={styles.screen}>
      {/* Live camera passthrough background */}
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

      {/* Optional chime asset — drop chii-chiip.mp3 in /public/sounds/ */}
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
            {/* Robot face */}
            <motion.div
              style={styles.robotFace}
              onClick={handleFaceTap}
              animate={
                gateStage === "greeting"
                  ? { y: [0, -8, 0] }
                  : gateStage === "verified"
                  ? { scale: [1, 1.08, 1] }
                  : {}
              }
              transition={{ duration: 2.2, repeat: gateStage === "greeting" ? Infinity : 0, ease: "easeInOut" }}
            >
              <svg viewBox="0 0 120 120" width="110" height="110">
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

              {/* Laser scan sweep */}
              {gateStage === "scanning" && (
                <motion.div
                  style={styles.laser}
                  initial={{ top: "-10%" }}
                  animate={{ top: "110%" }}
                  transition={{ duration: 0.9, ease: "easeIn" }}
                />
              )}
            </motion.div>

            {gateStage === "greeting" && (
              <>
                <p style={styles.greetingText}>HII!</p>
                <p style={styles.tapHint}>[ IDENTITY CHECK: TAP FACE TO INITIALISE OPTICAL RADAR ]</p>
              </>
            )}

            {gateStage === "scanning" && (
              <p style={styles.tapHint}>SCANNING...</p>
            )}

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
            <h1 style={styles.title}>MANIFIX AI:<br />VEGGIE RUSH</h1>
            <p style={styles.subtitle}>
              Sit in a physical circle with your friends and type the exact same
              room code to enter the garden arena.
            </p>
            <form onSubmit={handleFormSubmit}>
              <input
                style={styles.input}
                type="text"
                placeholder="ENTER PARTY CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={6}
                required
                autoFocus
              />
              {error && <p style={styles.errorText}>{error}</p>}
              <button type="submit" style={styles.joinBtn} disabled={connecting}>
                {connecting ? "CONNECTING…" : "CONNECT LOBBY"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  screen: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#08080a",
    overflow: "hidden",
  },
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "opacity 0.6s ease",
  },
  videoScrim: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0.75) 100%)",
  },
  card: {
    position: "relative",
    zIndex: 2,
    width: "min(90vw, 380px)",
    padding: "32px 24px",
    borderRadius: "20px",
    background: "rgba(18, 16, 12, 0.72)",
    border: "1px solid rgba(255, 215, 0, 0.35)",
    boxShadow: "0 0 40px rgba(255, 215, 0, 0.08), inset 0 0 30px rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    textAlign: "center",
    fontFamily: "'Fredoka', sans-serif",
  },
  robotFace: {
    position: "relative",
    width: "110px",
    height: "110px",
    margin: "0 auto 16px",
    cursor: "pointer",
    filter: "drop-shadow(0 0 12px rgba(255,215,0,0.5))",
  },
  laser: {
    position: "absolute",
    left: "-20px",
    right: "-20px",
    height: "3px",
    background: "linear-gradient(90deg, transparent, #FFD700 20%, #FFD700 80%, transparent)",
    boxShadow: "0 0 12px 2px rgba(255,215,0,0.8)",
  },
  greetingText: {
    fontFamily: "'Fredoka', sans-serif",
    fontWeight: 700,
    fontSize: "28px",
    color: "#FFD700",
    margin: "4px 0",
  },
  tapHint: {
    fontFamily: "'Orbitron', monospace",
    fontSize: "11px",
    letterSpacing: "1px",
    color: "#F5F0E8",
    opacity: 0.8,
  },
  verifiedText: {
    fontFamily: "'Orbitron', monospace",
    fontWeight: 700,
    fontSize: "16px",
    letterSpacing: "1px",
    color: "#39ff88",
    textShadow: "0 0 10px rgba(57,255,136,0.6)",
  },
  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 800,
    fontSize: "22px",
    color: "#FFD700",
    lineHeight: 1.3,
    marginBottom: "12px",
  },
  subtitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: "13px",
    color: "#F5F0E8",
    opacity: 0.75,
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,215,0,0.4)",
    background: "rgba(0,0,0,0.5)",
    color: "#FFD700",
    fontFamily: "'Orbitron', monospace",
    fontSize: "14px",
    letterSpacing: "2px",
    textAlign: "center",
    marginBottom: "12px",
    outline: "none",
  },
  errorText: {
    color: "#ff5555",
    fontFamily: "'Fredoka', sans-serif",
    fontSize: "13px",
    marginBottom: "10px",
  },
  joinBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(180deg, #FFD700, #B8860B)",
    color: "#08080a",
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700,
    fontSize: "14px",
    letterSpacing: "1px",
    cursor: "pointer",
  },
};
