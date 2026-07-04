import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Props:
 *  - panic: hyper-run / shock state
 *  - sizePx: render size
 *  - directionX: -1 (fleeing left) | 0 (still/unknown) | 1 (fleeing
 *    right), driven by VeggieSprite's position-tracking effect. Same
 *    contract as CarrotSprite — feeds a real lean into the actual
 *    direction of travel instead of a generic symmetric squash/stretch.
 *
 * Transform-origin note (same fix as CarrotSprite): once rotate/skewX
 * are in play, the anchor point matters for how the lean reads. Setting
 * it once as a plain CSS string on `style` — never via `originX` inside
 * `animate` — avoids Framer Motion silently resetting the Y anchor back
 * to 0.5.
 */
export default function BroccoliSprite({ panic, sizePx = 90, directionX = 0 }) {
  const dir = Math.max(-1, Math.min(1, directionX));
  const leaning = panic && dir !== 0;

  const movementAnimate = useMemo(() => {
    if (!panic) return { y: [0, -8, 0] }; // idle hover

    if (!leaning) {
      // Panicking but no direction data yet (cornered in place) —
      // original rubbery squash/stretch shudder.
      return {
        y: [0, -12, 2, -12],
        x: [-4, 5, -5, 4, 0],
        rotate: [0, 0, 0, 0],
        skewX: [0, 0, 0, 0],
        scaleX: [1.4, 0.7, 1.4, 1.0],
        scaleY: [0.6, 1.4, 0.6, 1.0],
      };
    }

    // Rubbery spine bending: lean heavily into the run direction while
    // still carrying the squash/stretch, so it reads as sliding away
    // from the catch gesture rather than just shivering in place.
    return {
      y: [0, -12, 2, -12],
      x: [-4, 5, -5, 4, 0],
      rotate: [dir * 8, dir * 24, dir * 16, dir * 22],
      skewX: [dir * 10, dir * 28, dir * 18, dir * 24],
      scaleX: [1.4, 0.7, 1.4, 1.0],
      scaleY: [0.7, 1.3, 0.7, 1.0],
    };
  }, [panic, leaning, dir]);

  return (
    <motion.div
      style={{
        width: sizePx,
        height: sizePx,
        position: "relative",
        transformOrigin: "50% 92%", // anchor at base of feet, set once, never overridden
      }}
      animate={movementAnimate}
      transition={{
        duration: panic ? 0.22 : 1.7,
        repeat: Infinity,
        ease: panic ? "linear" : "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* CIRCULAR HIGH-SPEED RUNNING FEET WHEEL LAYER */}
        <g stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round">
          {/* Left Leg Wheel Axis */}
          <motion.g
            style={{ transformOrigin: "44px 86px" }}
            animate={panic ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
          >
            <line x1="44" y1="86" x2="36" y2="96" />
            <ellipse cx="36" cy="96" rx="6" ry="3" fill="#3d2b1f" stroke="none" />
          </motion.g>

          {/* Right Leg Wheel Axis (phase-shifted 180° for an overlapping
              cycling read rather than two legs spinning in sync) */}
          <motion.g
            style={{ transformOrigin: "56px 86px" }}
            animate={panic ? { rotate: [180, 540] } : { rotate: 0 }}
            transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
          >
            <line x1="56" y1="86" x2="64" y2="96" />
            <ellipse cx="64" cy="96" rx="6" ry="3" fill="#3d2b1f" stroke="none" />
          </motion.g>
        </g>

        {/* MITTEN ARMS FLAPPING IN PANIC */}
        <motion.g
          animate={panic ? { rotate: [0, -75, 45, 0], y: [-2, 4, -2] } : { rotate: [0, 12, 0] }}
          transition={{ duration: panic ? 0.18 : 1.9, repeat: Infinity }}
          style={{ transformOrigin: "40px 74px" }}
        >
          <line x1="40" y1="74" x2="26" y2="64" stroke="#66bb6a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="26" cy="64" r="8" fill="#66bb6a" stroke="#1b5e20" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={panic ? { rotate: [0, 75, -45, 0], y: [2, -4, 2] } : { rotate: [0, -12, 0] }}
          transition={{ duration: panic ? 0.18 : 1.9, repeat: Infinity }}
          style={{ transformOrigin: "60px 74px" }}
        >
          <line x1="60" y1="74" x2="74" y2="64" stroke="#66bb6a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="74" cy="64" r="8" fill="#66bb6a" stroke="#1b5e20" strokeWidth="1.5" />
        </motion.g>

        {/* STALK BODY */}
        <path d="M43,72 L40,90 L60,90 L57,72 Z" fill="#dcedc8" stroke="#8d9e6f" strokeWidth="2" />

        {/* DYNAMIC SHIVERING FLORET CLUSTER MESH */}
        <motion.g
          stroke="#1b5e20"
          strokeWidth="1.5"
          animate={panic ? { scale: [1, 1.08, 0.95, 1], rotate: [-2, 2, -2] } : { scale: 1 }}
          transition={{ duration: 0.2, repeat: Infinity }}
          style={{ transformOrigin: "50px 46px" }}
        >
          <circle cx="34" cy="42" r="14" fill="#4caf50" />
          <circle cx="50" cy="30" r="16" fill="#43a047" />
          <circle cx="66" cy="42" r="14" fill="#4caf50" />
          <circle cx="42" cy="54" r="14" fill="#388e3c" />
          <circle cx="58" cy="54" r="14" fill="#388e3c" />
          <circle cx="50" cy="46" r="15" fill="#4caf50" />
        </motion.g>

        {/* Texture detail overlay bindings */}
        <g fill="rgba(0,0,0,0.08)" style={{ pointerEvents: "none" }}>
          <circle cx="30" cy="36" r="2.2" />
          <circle cx="44" cy="24" r="2.2" />
          <circle cx="58" cy="24" r="2.2" />
          <circle cx="70" cy="38" r="2.2" />
          <circle cx="36" cy="52" r="2.2" />
          <circle cx="64" cy="52" r="2.2" />
        </g>

        {/* Blush Elements */}
        <ellipse cx="38" cy="52" rx="4" ry="2.3" fill="#ff8a80" opacity="0.4" />
        <ellipse cx="62" cy="52" rx="4" ry="2.3" fill="#ff8a80" opacity="0.4" />

        {/* BUG-OUT SHOCK EYES — real spring physics, not a timed tween */}
        <g>
          {/* Left Eye Socket Node */}
          <motion.g
            style={{ transformOrigin: "42px 46px" }}
            animate={panic ? { scale: [1, 2.3, 1.8, 2.1], x: [-3, 2, -1] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.25, repeat: Infinity, type: "spring", stiffness: 400, damping: 13 }}
          >
            <ellipse cx="42" cy="46" rx="5.5" ry="7.5" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="43" cy="47" r="3.2" fill="#000" />
            <circle cx="44.3" cy="45" r="1.2" fill="#fff" />
          </motion.g>

          {/* Right Eye Socket Node */}
          <motion.g
            style={{ transformOrigin: "58px 46px" }}
            animate={panic ? { scale: [1, 2.3, 1.8, 2.1], x: [3, -2, 1] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.25, repeat: Infinity, type: "spring", stiffness: 400, damping: 13 }}
          >
            <ellipse cx="58" cy="46" rx="5.5" ry="7.5" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="59" cy="47" r="3.2" fill="#000" />
            <circle cx="60.3" cy="45" r="1.2" fill="#fff" />
          </motion.g>
        </g>

        {/* SCREAMING TEETH CAVE — cavity + blocky teeth + vibrating tongue,
            same anatomy as CarrotSprite's mouth for cross-veggie parity */}
        {panic ? (
          <g>
            <path d="M40,56 Q50,72 60,56 Z" fill="#6a0000" stroke="#000" strokeWidth="1.5" />
            <rect x="45" y="57" width="10" height="3.5" fill="#fff" stroke="#000" strokeWidth="1" rx="1" />
            {/* vibrating tongue */}
            <path d="M44,64 Q50,68 56,64" fill="none" stroke="#ff8a80" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          // Simple quiet tracking smirk
          <path d="M41,58 Q50,66 59,58" fill="none" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}
