import React, { useMemo } from "react";
import { motion } from "framer-motion";

// A shiny golden veggie — used for rare / bonus captures. Purely
// presentational — parent positions it on screen via the wrapping
// transform (see VeggieSprite.jsx).
//
// Props:
//  - panic: hyper-run / shock state
//  - sizePx: render size
//  - directionX: -1 (fleeing left) | 0 (still/unknown) | 1 (fleeing
//    right), same contract as CarrotSprite/BroccoliSprite — feeds a real
//    lean into the actual direction of travel instead of a generic wobble.
//
// Transform-origin note (same fix as the other sprites): the feet-anchor
// is set once as a plain CSS string on `style`, never via `originX`
// inside `animate` — otherwise Framer Motion's own origin motion values
// take over and silently reset the Y anchor back to 0.5.
export default function GoldenSprite({ panic, sizePx = 90, directionX = 0 }) {
  const dir = Math.max(-1, Math.min(1, directionX));
  const leaning = panic && dir !== 0;

  const bodyAnimate = useMemo(() => {
    if (!panic) return { y: [0, -10, 0] }; // idle hop, gentle

    if (!leaning) {
      // Panicking but no direction data yet (cornered in place) —
      // original gentle shimmy, no directional commitment.
      return { y: [0, -6, 0], x: [-2, 2, -2, 0], rotate: [-3, 3, -3] };
    }

    // Dramatic tilt into the sprint path — the plump body leans hard the
    // way it's actually running rather than just jittering in place.
    return {
      y: [0, -6, 0],
      x: [-2, 2, -2, 0],
      rotate: [dir * 5, dir * 20, dir * 12, dir * 18],
      skewX: [dir * 6, dir * 22, dir * 14, dir * 20],
    };
  }, [panic, leaning, dir]);

  // Pulsing golden shockwave aura — replaces the static drop-shadow with
  // a vibrating glow cycle under stress. Framer Motion can interpolate
  // between filter keyframes as long as the filter functions line up
  // structurally (same function, same arg count) between each step.
  const auraAnimate = panic
    ? {
        filter: [
          "drop-shadow(0 0 6px rgba(255,196,0,0.55))",
          "drop-shadow(0 0 20px rgba(255,196,0,0.95))",
          "drop-shadow(0 0 6px rgba(255,196,0,0.55))",
        ],
      }
    : { filter: "drop-shadow(0 0 6px rgba(255,196,0,0.55))" };

  return (
    <motion.div
      style={{
        width: sizePx,
        height: sizePx,
        position: "relative",
        transformOrigin: "50% 92%", // anchor at base of feet, set once, never overridden
      }}
      animate={{ ...bodyAnimate, ...auraAnimate }}
      transition={{
        duration: panic ? 0.35 : 1.4,
        repeat: Infinity,
        ease: panic ? "linear" : "easeInOut",
      }}
    >
      {/* sparkle particles orbiting the body */}
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          style={{
            position: "absolute",
            top: ["6%", "20%", "70%", "82%"][i],
            left: ["78%", "8%", "84%", "14%"][i],
            fontSize: sizePx * 0.14,
            color: "#ffe08a",
            pointerEvents: "none",
          }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.1, 0.7] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.25 }}
        >
          ✦
        </motion.span>
      ))}

      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* CIRCULAR HIGH-SPEED RUNNING WHEEL LEGS — was linear y2 bounce,
            now a full rotational cycle like Carrot/Broccoli for a
            consistent overlapping-blur run read across all veggies. */}
        <g stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round">
          {/* Left Leg Wheel Axis */}
          <motion.g
            style={{ transformOrigin: "43px 82px" }}
            animate={panic ? { rotate: [0, -360] } : { rotate: 0 }}
            transition={{ duration: 0.18, repeat: Infinity, ease: "linear" }}
          >
            <line x1="43" y1="82" x2="39" y2="94" />
            <ellipse cx="39" cy="94" rx="6" ry="3" fill="#7a5200" stroke="none" />
          </motion.g>

          {/* Right Leg Wheel Axis (phase-shifted 180°, same rotational
              direction, for an overlapping cycling read) */}
          <motion.g
            style={{ transformOrigin: "57px 82px" }}
            animate={panic ? { rotate: [180, -180] } : { rotate: 0 }}
            transition={{ duration: 0.18, repeat: Infinity, ease: "linear" }}
          >
            <line x1="57" y1="82" x2="61" y2="94" />
            <ellipse cx="61" cy="94" rx="6" ry="3" fill="#7a5200" stroke="none" />
          </motion.g>
        </g>

        {/* mitten arms */}
        <motion.g
          animate={{ rotate: panic ? [0, -25, 0] : [0, 12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.6, repeat: Infinity }}
          style={{ transformOrigin: "35px 58px" }}
        >
          <line x1="35" y1="58" x2="21" y2="46" stroke="#ffc83c" strokeWidth="7" strokeLinecap="round" />
          <circle cx="21" cy="46" r="8" fill="#ffc83c" stroke="#a67200" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: panic ? [0, 25, 0] : [0, -12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.6, repeat: Infinity }}
          style={{ transformOrigin: "65px 58px" }}
        >
          <line x1="65" y1="58" x2="79" y2="46" stroke="#ffc83c" strokeWidth="7" strokeLinecap="round" />
          <circle cx="79" cy="46" r="8" fill="#ffc83c" stroke="#a67200" strokeWidth="1.5" />
        </motion.g>

        {/* small green stem */}
        <path d="M50,30 C46,24 44,16 46,10 C50,16 52,22 52,30 Z" fill="#43a047" stroke="#1b5e20" strokeWidth="1" />

        {/* plump golden body */}
        <path
          d="M50,30 C66,30 70,46 68,60 C66,76 58,90 50,92 C42,90 34,76 32,60 C30,46 34,30 50,30 Z"
          fill="#ffc83c"
          stroke="#a67200"
          strokeWidth="2.5"
        />
        {/* gleam streaks instead of a flat shade — still solid fills, no gradients */}
        <path d="M40,42 Q38,56 42,70" stroke="#fff3c4" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M60,46 Q62,58 58,72" stroke="#c8a84b" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* blush */}
        <ellipse cx="36" cy="62" rx="4.5" ry="2.5" fill="#ff8a3d" opacity="0.4" />
        <ellipse cx="64" cy="62" rx="4.5" ry="2.5" fill="#ff8a3d" opacity="0.4" />

        {/* BUG-OUT SHOCK EYES — detached into their own spring-animated
            nodes instead of static face elements, matching Carrot/Broccoli */}
        <g>
          <motion.g
            style={{ transformOrigin: "42px 56px" }}
            animate={panic ? { scale: [1, 2.2, 1.7, 2.0], x: [-2, 1, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.24, repeat: Infinity, type: "spring", stiffness: 380, damping: 13 }}
          >
            <ellipse cx="42" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="43" cy="57" r="3" fill="#000" />
            <circle cx="44.5" cy="55" r="1" fill="#fff" />
          </motion.g>

          <motion.g
            style={{ transformOrigin: "58px 56px" }}
            animate={panic ? { scale: [1, 2.2, 1.7, 2.0], x: [2, -1, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.24, repeat: Infinity, type: "spring", stiffness: 380, damping: 13 }}
          >
            <ellipse cx="58" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="59" cy="57" r="3" fill="#000" />
            <circle cx="60.5" cy="55" r="1" fill="#fff" />
          </motion.g>
        </g>

        {/* SCREAMING TEETH CAVITY — unified parity with Carrot/Broccoli */}
        {panic ? (
          <g>
            {/* Deep screaming mouth cavity */}
            <path d="M38,68 Q50,86 62,68 Z" fill="#520000" stroke="#000" strokeWidth="1.5" />
            {/* Blocky shiny cartoon teeth structure */}
            <rect x="44" y="68" width="12" height="4" fill="#fff" stroke="#000" strokeWidth="1" rx="1" />
            {/* Vibrating panic tongue */}
            <path d="M43,76 Q50,82 57,76" fill="none" stroke="#ff8a80" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          // Relaxed premium gold smirk line
          <path d="M40,70 Q50,80 60,70" fill="none" stroke="#7a5200" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}
