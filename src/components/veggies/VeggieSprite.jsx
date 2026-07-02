import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import CarrotSprite from "./CarrotSprite";
import TomatoSprite from "./TomatoSprite";
import BroccoliSprite from "./BroccoliSprite";
import GoldenSprite from "./GoldenSprite";

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

/**
 * Positions a single veggie character on top of the camera feed in
 * GameARView.jsx. `x` / `y` are screen-space pixel coordinates already
 * resolved from GPS + compass heading by the parent (haversine distance
 * + bearing math lives outside this component — this file only draws
 * and reacts to state).
 *
 * Props:
 *  - type: 'carrot' | 'tomato' | 'broccoli' | 'golden'
 *  - x, y: screen position in px (center point of the sprite)
 *  - distanceMeters: live distance to the player, used to scale the sprite
 *  - inRange: true when the player is close enough to capture
 *  - captured: true once a capture animation should play
 *  - onCaptured: callback fired after the capture animation finishes
 *  - onTap: called when the sprite is tapped/clicked (e.g. attempt capture)
 */
export default function VeggieSprite({
  type = "carrot",
  x = 0,
  y = 0,
  distanceMeters = null,
  inRange = false,
  captured = false,
  onCaptured,
  onTap,
}) {
  const Sprite = SPRITES[type] || CarrotSprite;
  const label = LABELS[type] || "Veggie";

  // Distance-based scale: bigger when close, smaller when far, clamped
  // so it never disappears or overwhelms the screen.
  const scale =
    distanceMeters == null
      ? 1
      : Math.max(0.55, Math.min(1.35, 40 / Math.max(distanceMeters, 6)));

  const sizePx = 90 * scale;

  return (
    <AnimatePresence onExitComplete={onCaptured}>
      {!captured && (
        <motion.div
          role="button"
          aria-label={`${label}${inRange ? ", in range" : ""}`}
          onClick={onTap}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: x,
            top: y,
            transform: `translate3d(-50%, -100%, 0) scale(${scale})`,
            transformOrigin: "center bottom",
            cursor: onTap ? "pointer" : "default",
            userSelect: "none",
          }}
        >
          {/* pulsing capture ring, only shows once the player is close enough */}
          {inRange && (
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

          <Sprite panic={inRange} sizePx={sizePx} />

          <div
            style={{
              textAlign: "center",
              marginTop: 2,
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: inRange ? "#ffc83c" : "rgba(255,255,255,0.8)",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
            {distanceMeters != null ? ` · ${Math.round(distanceMeters)}m` : ""}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
