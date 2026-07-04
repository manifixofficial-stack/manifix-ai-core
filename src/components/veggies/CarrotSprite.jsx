import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Props:
 *  - panic: hyper-run / shock state
 *  - sizePx: render size
 *  - directionX: -1 (fleeing left) | 0 (still/unknown) | 1 (fleeing
 *    right), driven by VeggieSprite's position-tracking effect. Feeds a
 *    real lean into the actual direction of travel instead of a generic
 *    symmetric wobble.
 *
 * Note on transform-origin: Framer Motion manages `originX`/`originY` as
 * its own motion values, separate from a plain CSS `transformOrigin`
 * string. Setting `originX` alone inside `animate` (without `originY`)
 * makes Framer Motion take over and silently reset Y back to 0.5 — which
 * would undo the feet-anchor below. So the origin is set ONCE as a plain
 * style string and never touched from `animate`.
 */
export default function CarrotSprite({ panic, sizePx = 90, directionX = 0 }) {
  const dir = Math.max(-1, Math.min(1, directionX));
  const leaning = panic && dir !== 0;

  const movementAnimate = useMemo(() => {
    if (!panic) return { y: [0, -10, 0] }; // idle hover

    if (!leaning) {
      // Panicking but no direction data yet (e.g. cornered in place) —
      // original symmetric whip.
      return {
        y: [0, -14, 4, -14],
        x: [-5, 6, -6, 5, 0],
        rotate: [-12, 12, -12, 0],
        skewX: [-15, 15, -15, 0],
        scaleY: [1.2, 0.8, 1.2, 1.0],
      };
    }

    // Directional lean: torso whips toward the run direction and holds a
    // forward-tilted skew instead of oscillating evenly both ways.
    return {
      y: [0, -14, 4, -14],
      x: [-5, 6, -6, 5, 0],
      rotate: [dir * 6, dir * 22, dir * 14, dir * 20],
      skewX: [dir * 8, dir * 26, dir * 16, dir * 22],
      scaleY: [1.25, 0.85, 1.25, 1.0],
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
        duration: panic ? 0.2 : 1.6,
        repeat: Infinity,
        ease: panic ? "linear" : "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* HIGH-SPEED CIRCULAR WHEEL RUNNING FEET */}
        <g stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round">
          {/* Left Leg Axis */}
          <motion.g
            style={{ transformOrigin: "44px 86px" }}
            animate={panic ? { rotate: [0, -360] } : { rotate: 0 }}
            transition={{ duration: 0.12, repeat: Infinity, ease: "linear" }}
          >
            <line x1="44" y1="86" x2="34" y2="96" />
            <ellipse cx="34" cy="96" rx="6" ry="3" fill="#3a1d00" stroke="none" />
          </motion.g>

          {/* Right Leg Axis (Phase Shifted) */}
          <motion.g
            style={{ transformOrigin: "56px 86px" }}
            animate={panic ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 0.12, repeat: Infinity, ease: "linear" }}
          >
            <line x1="56" y1="86" x2="66" y2="96" />
            <ellipse cx="66" cy="96" rx="6" ry="3" fill="#3a1d00" stroke="none" />
          </motion.g>
        </g>

        {/* MITTEN ARMS PUMPING RADICALLY IN PANIC */}
        <motion.g
          animate={panic ? { rotate: [0, -95, 30, 0], y: [-3, 5, -3] } : { rotate: [0, 12, 0] }}
          transition={{ duration: panic ? 0.15 : 1.8, repeat: Infinity }}
          style={{ transformOrigin: "44px 64px" }}
        >
          <line x1="44" y1="64" x2="30" y2="50" stroke="#ff8c1a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="30" cy="50" r="8" fill="#ff8c1a" stroke="#c85a00" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={panic ? { rotate: [0, 95, -30, 0], y: [3, -5, 3] } : { rotate: [0, -12, 0] }}
          transition={{ duration: panic ? 0.15 : 1.8, repeat: Infinity }}
          style={{ transformOrigin: "56px 64px" }}
        >
          <line x1="56" y1="64" x2="70" y2="50" stroke="#ff8c1a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="70" cy="50" r="8" fill="#ff8c1a" stroke="#c85a00" strokeWidth="1.5" />
        </motion.g>

        {/* LEAF CROWN (Whips back and forth during movement) */}
        <motion.g
          style={{ transformOrigin: "50px 34px" }}
          animate={panic ? { rotate: leaning ? [dir * 10, dir * 20, dir * 10] : [-15, 15, -15] } : { rotate: 0 }}
          transition={{ duration: 0.25, repeat: Infinity }}
        >
          <path d="M50,36 C47,24 42,14 36,8 C41,20 45,30 48,36 Z" fill="#2e7d32" />
          <path d="M50,36 C48,22 45,10 41,2 C46,16 49,28 50,36 Z" fill="#43a047" />
          <path d="M50,36 C50,20 50,8 50,2 C50,16 50,28 50,36 Z" fill="#2e7d32" />
          <path d="M50,36 C52,22 55,10 59,2 C54,16 51,28 50,36 Z" fill="#43a047" />
          <path d="M50,36 C53,24 58,14 64,8 C59,20 55,30 52,36 Z" fill="#2e7d32" />
        </motion.g>

        {/* MAIN TAPERED CARROT BODY */}
        <path
          d="M50,34 C64,34 68,48 64,62 C61,74 56,86 50,92 C44,86 39,74 36,62 C32,48 36,34 50,34 Z"
          fill="#ff8c1a"
          stroke="#c85a00"
          strokeWidth="2.5"
        />

        {/* Horizontal Ridge Details */}
        <g stroke="rgba(0,0,0,0.15)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M40,50 Q50,53 60,50" />
          <path d="M39,64 Q50,68 61,64" />
          <path d="M42,78 Q50,81 58,78" />
        </g>

        {/* Blush Accents */}
        <ellipse cx="33" cy="65" rx="4.5" ry="2.5" fill="#ff6f61" opacity="0.4" />
        <ellipse cx="67" cy="65" rx="4.5" ry="2.5" fill="#ff6f61" opacity="0.4" />

        {/* BUG-OUT SHOCK EYE SOCKET NODES */}
        <g>
          {/* Left Shock Eye */}
          <motion.g
            style={{ transformOrigin: "42px 56px" }}
            animate={
              panic
                ? { scale: [1, 2.3, 1.7, 2.1], y: [-4, 2, -1], x: [-2, 1, 0] }
                : { scale: 1, y: 0, x: 0 }
            }
            transition={{ duration: 0.22, repeat: Infinity, type: "spring", stiffness: 380, damping: 14 }}
          >
            <ellipse cx="42" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="43" cy="57" r="3.5" fill="#000" />
            <circle cx="44.5" cy="55" r="1.2" fill="#fff" />
          </motion.g>

          {/* Right Shock Eye */}
          <motion.g
            style={{ transformOrigin: "58px 56px" }}
            animate={
              panic
                ? { scale: [1, 2.3, 1.7, 2.1], y: [-4, 2, -1], x: [2, -1, 0] }
                : { scale: 1, y: 0, x: 0 }
            }
            transition={{ duration: 0.22, repeat: Infinity, type: "spring", stiffness: 380, damping: 14 }}
          >
            <ellipse cx="58" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1.5" />
            <circle cx="59" cy="57" r="3.5" fill="#000" />
            <circle cx="60.5" cy="55" r="1.2" fill="#fff" />
          </motion.g>
        </g>

        {/* SCREAMING TEETH CAVITY */}
        {panic ? (
          <g>
            {/* Wide Open Mouth Open Cavity */}
            <path d="M38,68 Q50,86 62,68 Z" fill="#520000" stroke="#000" strokeWidth="1.5" />
            {/* Top Cartoon Square Teeth Block */}
            <rect x="44" y="68" width="12" height="4" fill="#fff" stroke="#000" strokeWidth="1" rx="1" />
            {/* Vibrating tongue */}
            <path d="M43,76 Q50,82 57,76" fill="none" stroke="#ff8a80" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          // Standard relaxed mapping line
          <path d="M40,70 Q50,80 60,70" fill="none" stroke="#7a2e00" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}
