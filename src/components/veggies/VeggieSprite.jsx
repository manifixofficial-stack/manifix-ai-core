import React from "react";
import { motion } from "framer-motion";
import CarrotSprite from "./CarrotSprite";
import TomatoSprite from "./TomatoSprite";
import BroccoliSprite from "./BroccoliSprite";
import GoldenSprite from "./GoldenSprite";
import useVeggieEvasion from "./useVeggieEvasion";

const SPRITES = {
  carrot: CarrotSprite,
  tomato: TomatoSprite,
  broccoli: BroccoliSprite,
  golden: GoldenSprite,
};

const LABELS = {
  carrot: "Carrot",
  tomato: "Tomato",
  broccoli: "Broccoli",
  golden: "Golden Veggie",
};

const CATCH_RADIUS_METERS = 20;
const REVEAL_RADIUS_METERS = 35; // beyond this, render camouflaged

/**
 * Positions a single veggie character on top of the camera feed in
 * GameCanvas.jsx. `x` / `y` are the GPS/bearing-derived screen-space
 * anchor — this is what the sprite renders at UNLESS `catchMode` is true,
 * in which case it hands off to useVeggieEvasion and becomes a local
 * screen-space actor that flees the crosshair.
 *
 * Props:
 *  - type: 'carrot' | 'tomato' | 'broccoli' | 'golden'
 *  - x, y: GPS-derived anchor position in px (bottom-center of the sprite)
 *  - proximity: 0 (far) -> 1 (close), used for a gentle scale nudge pre-catchMode
 *  - panic: true once inside VEG_PANIC_RADIUS_M — hyper-run leg animation
 *  - distance: live distance in meters, shown in the label
 *  - huntersNearby: count of other players also close to this veggie
 *  - catchMode: true once distance <= CATCH_RADIUS_METERS — hands position
 *    control to the evasion AI and enables the growth-defense mechanic
 *  - screenW, screenH: viewport size in px, needed by the evasion AI to
 *    bounce off screen edges
 *  - crosshairX, crosshairY: where the player's aim point is (usually
 *    screen center) — the evasion AI flees this point
 *  - onCatch: called when the sprite itself is tapped
 */
export default function VeggieSprite({
  type = "carrot",
  x = 0,
  y = 0,
  proximity = 0,
  panic = false,
  distance = null,
  huntersNearby = 0,
  catchMode = false,
  screenW = typeof window !== "undefined" ? window.innerWidth : 400,
  screenH = typeof window !== "undefined" ? window.innerHeight : 800,
  crosshairX = screenW / 2,
  crosshairY = screenH / 2,
  onCatch,
}) {
  const Sprite = SPRITES[type] || CarrotSprite;
  const label = LABELS[type] || "Veggie";
  const camouflaged = !catchMode && distance != null && distance > REVEAL_RADIUS_METERS;
  const inRange = distance != null && distance <= CATCH_RADIUS_METERS;

  const evasion = useVeggieEvasion({
    active: catchMode,
    anchorX: x,
    anchorY: y,
    screenW,
    screenH,
    crosshairX,
    crosshairY,
  });

  const renderX = catchMode ? evasion.x : x;
  const renderY = catchMode ? evasion.y : y;

  // Pre-catchMode: gentle depth nudge. In catchMode: the growth-defense
  // scale takes over, ramping up once the veggie is cornered.
  const baseScale = 0.8 + Math.max(0, Math.min(1, proximity)) * 0.35;
  const scale = catchMode ? baseScale * evasion.growth : baseScale;
  const sizePx = 90 * scale;

  return (
    <motion.div
      role="button"
      aria-label={`${label}${inRange ? ", in range" : ""}${evasion.cornered ? ", cornered" : ""}`}
      onClick={() => onCatch && onCatch()}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: camouflaged ? 0.35 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: renderX,
        top: renderY,
        transform: "translate3d(-50%, -100%, 0)",
        transformOrigin: "center bottom",
        // No CSS transition on left/top while catchMode drives position —
        // the evasion AI already updates every animation frame, so a CSS
        // transition would just add lag on top of it.
        transition: catchMode ? "none" : "left 0.28s linear, top 0.28s linear",
        filter: camouflaged ? "blur(1.5px) saturate(0.6)" : "none",
        cursor: onCatch ? "pointer" : "default",
        userSelect: "none",
        pointerEvents: "auto", // parent overlay sets pointerEvents:none, opt this sprite back in
        touchAction: "manipulation",
      }}
    >
      {/* growth-defense warning ring — replaces the calm capture ring once cornered */}
      {catchMode && evasion.cornered && (
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: sizePx * 1.3,
            height: sizePx * 1.3,
            borderRadius: "50%",
            border: "3px solid #ff5c3d",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.08, 1] }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
      )}

      {/* calm capture ring — shown once in range but before it's cornered */}
      {inRange && !evasion.cornered && (
        <motion.div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -6,
            width: sizePx * 1.1,
            height: sizePx * 0.35,
            borderRadius: "50%",
            border: "2px solid #ffc83c",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}

      {/* other players closing in on the same veggie — competitive pressure cue */}
      {huntersNearby > 0 && !camouflaged && (
        <div
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            background: "rgba(8,8,10,0.75)",
            border: "1px solid rgba(255,215,0,0.4)",
            borderRadius: 10,
            padding: "1px 6px",
            fontSize: 10,
            fontFamily: "'DM Mono', monospace",
            color: "#ffc83c",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          🏃×{huntersNearby}
        </div>
      )}

      <Sprite panic={panic || (catchMode && !evasion.cornered)} sizePx={sizePx} />

      {!camouflaged && (
        <div
          style={{
            textAlign: "center",
            marginTop: 2,
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            color: evasion.cornered ? "#ff5c3d" : inRange ? "#ffc83c" : "rgba(255,255,255,0.8)",
            textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          {evasion.cornered ? "TAP NOW!" : label}
          {distance != null && !evasion.cornered ? ` · ${Math.round(distance)}m` : ""}
        </div>
      )}
    </motion.div>
  );
}
