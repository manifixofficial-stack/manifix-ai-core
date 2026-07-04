// components/veggies/HackedTargetSprite.jsx
//
// Sprite for the legendary "Hacked Target" entity spawned by
// lib/hackedEventClient.js when a room's is_hacked flag flips on. This is
// an ORIGINAL design — a glitched-out, corrupted-signal mascot, not a
// reproduction of any existing copyrighted character. Reads as "something
// got into the system" (scanlines, RGB-split, static, radar lock-on)
// rather than any specific IP.
//
// Rendering follows the same contract as the other veggie sprites
// (CarrotSprite, TomatoSprite, etc.) so it can drop straight into
// VeggieSprite's type-switch alongside them. It never camouflages —
// unlike normal veggies, the whole point is that it's impossible to miss
// once it spawns.
//
// Props:
//  - sizePx: render size
//  - panic: general "actively fleeing" state
//  - catchMode: player is close enough that the hunt UI (radar, jitter)
//    should be live
//  - cornered: intensifies the glitch static and shows the tension cue
//  - locked: CaptureThrow's net has landed — freezes jitter/lean
//  - directionX: -1/0/1, same contract as the other sprites
//
// Note: the "high-value bounty" flash below is presentational only (a
// flashing score badge) — it doesn't and shouldn't try to direct a real
// player toward any real-world location. The "signal lock imminent" cue
// on cornered is deliberately worded as game UI rather than a fake
// hardware/system failure message, so it can't be mistaken for a real
// device warning by someone playing outdoors mid-gesture.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const JITTER_INTERVAL_MS = 90;
const GLITCH_TICK_MS = 120;

export default function HackedTargetSprite({
  sizePx = 90,
  panic = false,
  catchMode = false,
  cornered = false,
  locked = false,
  directionX = 0,
}) {
  const size = sizePx;
  const dir = Math.max(-1, Math.min(1, directionX));
  const leaning = catchMode && !locked && dir !== 0;

  // ---- GPS Jitter Hijack ----------------------------------------------
  // Once the player closes in, injects small random pixel displacements
  // on a fast tick so the target visibly glitches/hops in place, layered
  // on top of whatever position the parent (VeggieSprite) has already
  // placed it at. Stops the instant it's locked — a netted target holds
  // still rather than fighting the net visually.
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!catchMode || locked) {
      setJitter({ x: 0, y: 0 });
      return undefined;
    }
    const id = setInterval(() => {
      setJitter({ x: Math.random() * 8 - 4, y: Math.random() * 8 - 4 });
    }, JITTER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [catchMode, locked]);

  // ---- Directional lean -------------------------------------------------
  // Tilts sharply into the run direction while active; snaps back
  // straight with spring physics the moment it stops or gets locked.
  const leanTransition = leaning
    ? { duration: 0.15, repeat: Infinity, ease: "linear" }
    : { type: "spring", stiffness: 320, damping: 15 };
  const leanAnimate = leaning ? { rotate: dir * 26, skewX: dir * 18 } : { rotate: 0, skewX: 0 };

  return (
    <motion.div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transformOrigin: "50% 85%",
      }}
      animate={{
        x: catchMode && !locked ? jitter.x : 0,
        y: catchMode && !locked ? jitter.y : [0, -6, 0],
        ...leanAnimate,
        scale: catchMode && !locked ? [1, 1.08, 1] : 1,
        filter: locked ? "brightness(1.3)" : "none",
      }}
      transition={{
        x: { duration: JITTER_INTERVAL_MS / 1000, ease: "linear" },
        y:
          catchMode && !locked
            ? { duration: JITTER_INTERVAL_MS / 1000, ease: "linear" }
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
        rotate: leanTransition,
        skewX: leanTransition,
        scale: { duration: 0.6, repeat: Infinity },
      }}
    >
      {/* Cyber Radar Reticle Matrix — only while actively hunting */}
      {catchMode && !locked && (
        <svg
          viewBox="0 0 100 100"
          width={size * 1.7}
          height={size * 1.7}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        >
          {/* outer dashed spinning ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#39ff6a"
            strokeWidth="1.5"
            strokeDasharray="6 5"
            style={{ transformOrigin: "50px 50px" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          {/* tactical crosshair axis */}
          <line x1="50" y1="6" x2="50" y2="28" stroke="#39ff6a" strokeWidth="1" opacity="0.8" />
          <line x1="50" y1="72" x2="50" y2="94" stroke="#39ff6a" strokeWidth="1" opacity="0.8" />
          <line x1="6" y1="50" x2="28" y2="50" stroke="#39ff6a" strokeWidth="1" opacity="0.8" />
          <line x1="72" y1="50" x2="94" y2="50" stroke="#39ff6a" strokeWidth="1" opacity="0.8" />
          {/* inner radar wave pulsing outward — active lock-on read */}
          <motion.circle
            cx="50"
            cy="50"
            r="10"
            fill="none"
            stroke="#39ff6a"
            strokeWidth="2"
            animate={{ r: [10, 44], opacity: [0.8, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
          />
        </svg>
      )}

      {/* Digital Slicing Static — glitch shiver, intensifies when cornered */}
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(57,255,106,0.25) 0px, rgba(57,255,106,0.25) 2px, transparent 2px, transparent 5px)",
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
        animate={
          cornered
            ? {
                clipPath: [
                  "inset(0 0 0 0)",
                  "inset(10% 0 60% 0)",
                  "inset(60% 0 5% 0)",
                  "inset(30% 0 40% 0)",
                  "inset(5% 0 70% 0)",
                  "inset(0 0 0 0)",
                ],
                filter: [
                  "hue-rotate(0deg) contrast(1)",
                  "hue-rotate(90deg) contrast(2)",
                  "hue-rotate(0deg) contrast(1)",
                ],
              }
            : { clipPath: "inset(0 0 0 0)", filter: "hue-rotate(0deg) contrast(1)" }
        }
        transition={{
          duration: GLITCH_TICK_MS / 1000,
          repeat: cornered ? Infinity : 0,
          ease: "linear",
        }}
      />

      {/* RGB-split glitch glyphs behind the main icon */}
      <motion.span
        aria-hidden="true"
        style={{ position: "absolute", fontSize: size * 0.7, color: "#ff3355", opacity: 0.55 }}
        animate={{ x: [-2, 2, -1, 1, 0], y: [0, 1, -1, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
      >
        ⚠
      </motion.span>
      <motion.span
        aria-hidden="true"
        style={{ position: "absolute", fontSize: size * 0.7, color: "#33e0ff", opacity: 0.55 }}
        animate={{ x: [2, -2, 1, -1, 0], y: [0, -1, 1, 0] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }}
      >
        ⚠
      </motion.span>

      {/* Main glyph */}
      <span
        style={{
          position: "relative",
          fontSize: size * 0.7,
          filter: "drop-shadow(0 0 8px rgba(255,51,85,0.8))",
        }}
      >
        ⚠
      </span>

      {/* Bug-Out Target Lenses — detach and inflate under panic, nudging
          toward the run direction, same spring physics as the other
          veggies' eyes */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <motion.div
          style={{
            position: "absolute",
            left: "32%",
            top: "36%",
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: "50%",
            background: "#0a0a0a",
            border: `2px solid #39ff6a`,
          }}
          animate={
            panic
              ? { scale: [1, 2.1, 1.6, 1.9], x: [dir * -3, dir * 2, 0] }
              : { scale: 1, x: 0 }
          }
          transition={{ duration: 0.24, repeat: Infinity, type: "spring", stiffness: 380, damping: 13 }}
        />
        <motion.div
          style={{
            position: "absolute",
            right: "32%",
            top: "36%",
            width: size * 0.14,
            height: size * 0.14,
            borderRadius: "50%",
            background: "#0a0a0a",
            border: `2px solid #39ff6a`,
          }}
          animate={
            panic
              ? { scale: [1, 2.1, 1.6, 1.9], x: [dir * 3, dir * -2, 0] }
              : { scale: 1, x: 0 }
          }
          transition={{ duration: 0.24, repeat: Infinity, type: "spring", stiffness: 380, damping: 13 }}
        />
      </div>

      {/* scanline overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)",
          pointerEvents: "none",
          mixBlendMode: "overlay",
        }}
      />

      {/* Legendary-tier ring */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: -6,
          borderRadius: "50%",
          border: "2px solid rgba(255,51,85,0.7)",
          boxShadow: "0 0 16px rgba(255,51,85,0.6)",
          pointerEvents: "none",
        }}
      />

      {/* High-value bounty flash — arcade flourish only; a flashing
          score badge, nothing that directs the player anywhere */}
      {(catchMode || panic) && (
        <motion.div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 4,
            fontFamily: "'DM Mono', monospace",
            fontSize: size * 0.14,
            fontWeight: "bold",
            color: "#39ff6a",
            textShadow: "0 0 6px rgba(57,255,106,0.9)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          BOUNTY 999,999 PTS
        </motion.div>
      )}

      {/* Tension cue on cornered — deliberately game-themed wording
          rather than a fake hardware/system failure message, so it can't
          read as a real device warning to someone playing outdoors */}
      {cornered && (
        <motion.div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 4,
            padding: "2px 6px",
            borderRadius: 4,
            background: "rgba(20,0,0,0.85)",
            border: "1px solid #ff3355",
            color: "#ff3355",
            fontFamily: "'DM Mono', monospace",
            fontSize: size * 0.11,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.35, repeat: Infinity }}
        >
          ⚠ SIGNAL LOCK IMMINENT
        </motion.div>
      )}
    </motion.div>
  );
}

export const HACKED_TARGET_ICON = "⚠";
export const HACKED_TARGET_LABEL = "HACKED TARGET";
