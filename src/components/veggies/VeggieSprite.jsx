// hooks/veggies/VeggieSprite.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CarrotSprite from "./CarrotSprite";
import TomatoSprite from "./TomatoSprite";
import BroccoliSprite from "./BroccoliSprite";
import GoldenSprite from "./GoldenSprite";
import { useVeggieEvasion } from "./useVeggieEvasion";

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
const SNAP_MIN_DELTA_PX = 6; // ignore sub-pixel jitter when detecting a direction flip
const SNAP_DURATION_MS = 180;
const SPLAT_DURATION_MS = 650;

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
 *  - taunting: NEW — true to trigger a TAUNT beat (sprite turns to face the
 *    player and pulls a face) instead of running. Mutually exclusive with
 *    panic in the state machine below; panic wins if both are true.
 *  - distance: live distance in meters, shown in the label
 *  - huntersNearby: count of other players also close to this veggie
 *  - catchMode: true once distance <= CATCH_RADIUS_METERS — hands position
 *    control to the evasion AI and enables the growth-defense mechanic
 *  - locked: true while CaptureThrow's net-lock is actively holding on
 *    this veggie (see GameCanvas.jsx's lockedVeggieIds). Freezes the
 *    evasion AI in place instead of letting it keep fleeing underneath a
 *    net that's already landed.
 *  - missThrow: NEW — flip this to a new truthy value (e.g. increment a
 *    counter) each time CaptureThrow registers a missed close-range throw
 *    on this veggie. Triggers a one-shot SPLAT_ATTACK: the sprite lunges
 *    at the crosshair and a full-viewport juice-splash overlay renders via
 *    a fixed-position portal-style div. Consumed once; pass a changing
 *    value (counter/timestamp) rather than a plain boolean so repeated
 *    misses each re-trigger it.
 *  - screenW, screenH: viewport size in px, needed by the evasion AI to
 *    bounce off screen edges and to size the splat overlay
 *  - crosshairX, crosshairY: where the player's aim point is (usually
 *    screen center) — the evasion AI flees this point, and SPLAT_ATTACK
 *    lunges toward it
 *  - onCatch: called when the sprite itself is tapped
 */
export default function VeggieSprite({
  type = "carrot",
  x = 0,
  y = 0,
  proximity = 0,
  panic = false,
  taunting = false,
  distance = null,
  huntersNearby = 0,
  catchMode = false,
  locked = false,
  missThrow = null,
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

  // ---- Core state machine -------------------------------------------
  // IDLE: default float/bob. PANIC: hyper-run, pop-eyes. TAUNT: turns to
  // face the player. CORNERED / LOCKED are catchMode-only sub-states
  // layered on top (see evasion.cornered / locked below). SPLAT is a
  // one-shot override that pre-empts everything else while it plays.
  const [splatting, setSplatting] = useState(false);
  const splatTimeoutRef = useRef(null);
  const lastMissRef = useRef(missThrow);

  useEffect(() => {
    if (missThrow != null && missThrow !== lastMissRef.current) {
      lastMissRef.current = missThrow;
      setSplatting(true);
      clearTimeout(splatTimeoutRef.current);
      splatTimeoutRef.current = setTimeout(() => setSplatting(false), SPLAT_DURATION_MS);
    }
    return () => clearTimeout(splatTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missThrow]);

  const gamePanic = panic || (catchMode && !locked);
  const state = splatting
    ? "SPLAT_ATTACK"
    : locked
    ? "LOCKED"
    : gamePanic
    ? "PANIC"
    : taunting
    ? "TAUNT"
    : "IDLE";

  // Evasion is only "active" while in catchMode AND not locked AND not
  // mid-splat (a splatting veggie is lunging, not fleeing).
  const evasion = useVeggieEvasion({
    active: catchMode && !locked && !splatting,
    anchorX: x,
    anchorY: y,
    screenW,
    screenH,
    crosshairX,
    crosshairY,
  });

  const renderX = catchMode && !splatting ? evasion.x : splatting ? crosshairX : x;
  const renderY = catchMode && !splatting ? evasion.y : splatting ? crosshairY : y;

  // ---- Rubber-band snap dash ------------------------------------------
  // Detects a horizontal direction flip in renderX frame-to-frame and
  // fires a brief scaleX/scaleY stretch, snapping back on release — the
  // classic rubber-hose "dash the other way" beat. Only relevant while
  // something is actually driving position (catchMode, not locked/splat).
  const lastXRef = useRef(renderX);
  const lastDirRef = useRef(0);
  const [snap, setSnap] = useState(false);
  const snapTimeoutRef = useRef(null);

  // directionX: -1/0/1, fed down to the Sprite so it can lean into its
  // actual direction of travel instead of a generic symmetric wobble.
  // Deliberately shares the same guard as the snap detector below (only
  // live while catchMode is actively driving position) so it doesn't
  // pick up noise from ordinary GPS anchor drift while idle, and resets
  // to 0 the moment the veggie stops being driven (locked/splat/caught).
  const [directionX, setDirectionX] = useState(0);

  useEffect(() => {
    const dx = renderX - lastXRef.current;
    const driving = catchMode && !locked && !splatting;
    if (driving && Math.abs(dx) >= SNAP_MIN_DELTA_PX) {
      const dir = dx > 0 ? 1 : -1;
      setDirectionX(dir);
      if (lastDirRef.current !== 0 && dir !== lastDirRef.current) {
        setSnap(true);
        clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = setTimeout(() => setSnap(false), SNAP_DURATION_MS);
      }
      lastDirRef.current = dir;
    } else if (!driving && lastDirRef.current !== 0) {
      // Stopped being driven (caught/locked/splatting) — reset lean.
      lastDirRef.current = 0;
      setDirectionX(0);
    }
    lastXRef.current = renderX;
    return () => clearTimeout(snapTimeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderX, catchMode, locked, splatting]);

  // Pre-catchMode: gentle depth nudge. In catchMode: the growth-defense
  // scale takes over, ramping up once the veggie is cornered. Locked
  // freezes growth at whatever it was the instant the net landed.
  const baseScale = 0.8 + Math.max(0, Math.min(1, proximity)) * 0.35;
  const scale = catchMode ? baseScale * evasion.growth : baseScale;
  const sizePx = 90 * scale;

  const stretchTransform = snap
    ? `scaleX(1.8) scaleY(0.4)`
    : state === "SPLAT_ATTACK"
    ? `scaleX(1.35) scaleY(0.85)`
    : `scaleX(1) scaleY(1)`;

  return (
    <>
      <motion.div
        role="button"
        aria-label={`${label}${inRange ? ", in range" : ""}${
          locked ? ", netted" : evasion.cornered ? ", cornered" : ""
        }`}
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
          // No CSS transition on left/top while catchMode/splat drives
          // position — those already update every animation frame, so a
          // CSS transition would just add lag on top of it.
          transition:
            catchMode || splatting
              ? "none"
              : "left 0.28s linear, top 0.28s linear",
          // Physical camouflage fusion: mix-blend-mode makes the veggie
          // read as part of the room's lighting/texture rather than a
          // flat overlay, on top of the existing blur/desaturate so it
          // doesn't just look like a hard cutout blending oddly with busy
          // backgrounds. Blend mode is dropped once revealed/locked so
          // colors read true.
          mixBlendMode: camouflaged ? "overlay" : "normal",
          filter: camouflaged
            ? "blur(1.5px) saturate(0.6)"
            : locked
            ? "brightness(0.85)"
            : "none",
          cursor: onCatch ? "pointer" : "default",
          userSelect: "none",
          pointerEvents: "auto", // parent overlay sets pointerEvents:none, opt this sprite back in
          touchAction: "manipulation",
        }}
      >
        {/* Rubber-band snap / splat lunge wrapper — separate node from the
            outer motion.div so the translate(-50%,-100%) anchor and the
            stretch transform don't fight each other in one transform string. */}
        <motion.div
          style={{ transformOrigin: "center bottom" }}
          animate={{ transform: stretchTransform }}
          transition={{ duration: 0.14, ease: "easeOut" }}
        >
          {/* locked ring — calm steady gold ring, takes priority over
              cornered/calm rings below */}
          {locked && (
            <motion.div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: sizePx * 1.35,
                height: sizePx * 1.35,
                borderRadius: "50%",
                border: "3px solid #ffc83c",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}

          {/* growth-defense warning ring — replaces the calm capture ring once cornered */}
          {!locked && catchMode && evasion.cornered && state !== "SPLAT_ATTACK" && (
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

          {/* calm capture ring — shown once in range but before cornered */}
          {!locked && inRange && !evasion.cornered && state !== "SPLAT_ATTACK" && (
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

          {/* other players closing in on the same veggie */}
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

          <Sprite panic={state === "PANIC"} sizePx={sizePx} directionX={directionX} state={state} />

          {/* Pop-out eye overlay: generic stand-in for per-veggie eye art.
              CarrotSprite/TomatoSprite/etc. weren't provided, so this sits
              on top rather than being wired into their internal geometry.
              Swap for real eye elements inside each Sprite component when
              you have them — same spring, same trigger condition. */}
          <AnimatePresence>
            {state === "PANIC" && (
              <motion.div
                key="eyes"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: sizePx * 0.18,
                  display: "flex",
                  gap: sizePx * 0.16,
                  transform: "translateX(-50%)",
                  pointerEvents: "none",
                }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 2.5, opacity: 1 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 12 }}
              >
                <span style={{ fontSize: sizePx * 0.14 }}>👁</span>
                <span style={{ fontSize: sizePx * 0.14 }}>👁</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Taunt face — swap the emoji for real per-veggie art */}
          {state === "TAUNT" && (
            <motion.div
              style={{
                position: "absolute",
                left: "50%",
                top: sizePx * 0.15,
                transform: "translateX(-50%)",
                fontSize: sizePx * 0.22,
                pointerEvents: "none",
              }}
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 0.6 }}
            >
              😜
            </motion.div>
          )}
        </motion.div>

        {!camouflaged && state !== "SPLAT_ATTACK" && (
          <div
            style={{
              textAlign: "center",
              marginTop: 2,
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              color: locked
                ? "#ffc83c"
                : evasion.cornered
                ? "#ff5c3d"
                : inRange
                ? "#ffc83c"
                : "rgba(255,255,255,0.8)",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              whiteSpace: "nowrap",
            }}
          >
            {locked ? "NETTED…" : evasion.cornered ? "TAP NOW!" : label}
            {distance != null && !locked && !evasion.cornered
              ? ` · ${Math.round(distance)}m`
              : ""}
          </div>
        )}
      </motion.div>

      {/* Screen-splat attacker: full-viewport juice-splash overlay,
          rendered as a sibling fixed-position layer rather than inside
          the transformed sprite div so it isn't clipped/scaled by it. */}
      <AnimatePresence>
        {splatting && (
          <motion.div
            key="splat"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              pointerEvents: "none",
              background: `radial-gradient(circle at ${crosshairX}px ${crosshairY}px, ${splatColor(
                type
              )} 0%, ${splatColor(type)}cc 22%, transparent 62%)`,
              mixBlendMode: "multiply",
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.3, 1.15, 1.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: SPLAT_DURATION_MS / 1000, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function splatColor(type) {
  switch (type) {
    case "tomato":
      return "#e0392b";
    case "broccoli":
      return "#3f7d3a";
    case "golden":
      return "#f0c419";
    default:
      return "#e58a2a"; // carrot
  }
}
