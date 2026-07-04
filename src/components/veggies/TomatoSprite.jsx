import React, { useMemo } from "react";
import { motion } from "framer-motion";

// A cute tomato character. Purely presentational — parent positions it
// on screen via the wrapping transform (see VeggieSprite.jsx).
//
// Props:
//  - panic: hyper-run / shock state
//  - sizePx: render size
//  - directionX: -1 (fleeing left) | 0 (still/unknown) | 1 (fleeing
//    right), same contract as Carrot/Broccoli/Golden — feeds a real lean
//    into the actual direction of travel instead of a generic wobble.
//
// Transform-origin note (same fix as the other sprites): the feet-anchor
// is set once as a plain CSS string on `style`, never via `originX`
// inside `animate` — otherwise Framer Motion's own origin motion values
// take over and silently reset the Y anchor back to 0.5.
export default function TomatoSprite({ panic, sizePx = 90, directionX = 0 }) {
  const dir = Math.max(-1, Math.min(1, directionX));
  const leaning = panic && dir !== 0;

  const bodyAnimate = useMemo(() => {
    if (!panic) return { y: [0, -9, 0] }; // idle hop, gentle

    // Squash/stretch bounce cycle: flat pancake on floor contact
    // (y at its lowest, scaleX up / scaleY down), stretched tall at the
    // top of the hop (y at its highest, scaleX down / scaleY up). Shared
    // by both the leaning and non-leaning branches — direction only
    // changes the rotate/skewX lean layered on top.
    const bounce = {
      y: [0, -14, 0, -14],
      scaleX: [1.4, 0.8, 1.4, 0.8],
      scaleY: [0.6, 1.3, 0.6, 1.3],
    };

    if (!leaning) {
      // Panicking but no direction data yet (cornered in place) —
      // symmetric jitter, no directional commitment.
      return { ...bounce, x: [-2, 2, -2, 0], rotate: [-3, 3, -3, 0] };
    }

    // Directional lean: the whole plump body throws its weight into the
    // escape path instead of just squashing in place.
    return {
      ...bounce,
      x: [-2, 2, -2, 0],
      rotate: [dir * 5, dir * 20, dir * 12, dir * 18],
      skewX: [dir * 6, dir * 22, dir * 14, dir * 20],
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
      animate={bodyAnimate}
      transition={{
        duration: panic ? 0.3 : 1.5,
        repeat: Infinity,
        ease: panic ? "linear" : "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* CIRCULAR HIGH-SPEED PUMPING LEG WHEELS — was linear y2 bounce,
            now a full rotational cycle like Carrot/Broccoli/Golden for a
            consistent overlapping-blur run read across all veggies. */}
        <g stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round">
          {/* Left Leg Wheel Axis */}
          <motion.g
            style={{ transformOrigin: "42px 82px" }}
            animate={panic ? { rotate: [0, -360] } : { rotate: 0 }}
            transition={{ duration: 0.16, repeat: Infinity, ease: "linear" }}
          >
            <line x1="42" y1="82" x2="37" y2="95" />
            <ellipse cx="37" cy="95" rx="6" ry="3" fill="#4a0e0e" stroke="none" />
          </motion.g>

          {/* Right Leg Wheel Axis (phase-shifted 180°, same rotational
              direction, for an overlapping cycling read) */}
          <motion.g
            style={{ transformOrigin: "58px 82px" }}
            animate={panic ? { rotate: [180, -180] } : { rotate: 0 }}
            transition={{ duration: 0.16, repeat: Infinity, ease: "linear" }}
          >
            <line x1="58" y1="82" x2="63" y2="95" />
            <ellipse cx="63" cy="95" rx="6" ry="3" fill="#4a0e0e" stroke="none" />
          </motion.g>
        </g>

        {/* mitten arms — idle: raised "Hii" wave. panic: pumping */}
        <motion.g
          animate={{ rotate: panic ? [0, -25, 0] : [0, 12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.7, repeat: Infinity }}
          style={{ transformOrigin: "34px 58px" }}
        >
          <line x1="34" y1="58" x2="20" y2="46" stroke="#e53935" strokeWidth="7" strokeLinecap="round" />
          <circle cx="20" cy="46" r="8" fill="#e53935" stroke="#7a1010" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: panic ? [0, 25, 0] : [0, -12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.7, repeat: Infinity }}
          style={{ transformOrigin: "66px 58px" }}
        >
          <line x1="66" y1="58" x2="80" y2="46" stroke="#e53935" strokeWidth="7" strokeLinecap="round" />
          <circle cx="80" cy="46" r="8" fill="#e53935" stroke="#7a1010" strokeWidth="1.5" />
        </motion.g>

        {/* calyx — five-point star of little leaves on top */}
        <path d="M50,32 C46,26 40,24 34,26 C40,28 44,32 46,36 Z" fill="#2e7d32" />
        <path d="M50,32 C48,24 44,18 38,16 C43,22 46,28 48,34 Z" fill="#43a047" />
        <path d="M50,32 C50,24 50,16 50,12 C50,20 50,26 50,32 Z" fill="#2e7d32" />
        <path d="M50,32 C52,24 56,18 62,16 C57,22 54,28 52,34 Z" fill="#43a047" />
        <path d="M50,32 C54,26 60,24 66,26 C60,28 56,32 54,36 Z" fill="#2e7d32" />

        {/* round body */}
        <circle cx="50" cy="62" r="30" fill="#e53935" stroke="#7a1010" strokeWidth="2.5" />

        {/* soft highlight + belly seams for dimension */}
        <path d="M28,50 Q34,40 46,38" stroke="rgba(255,255,255,0.25)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M30,80 Q50,88 70,80" stroke="rgba(0,0,0,0.12)" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* blush */}
        <ellipse cx="34" cy="66" rx="4.5" ry="2.5" fill="#ffb3a7" opacity="0.55" />
        <ellipse cx="66" cy="66" rx="4.5" ry="2.5" fill="#ffb3a7" opacity="0.55" />

        {/* BUG-OUT SPRING EYES — detached into their own spring-animated
            nodes instead of static face elements, matching the other veggies */}
        <g>
          <motion.g
            style={{ transformOrigin: "41px 58px" }}
            animate={panic ? { scale: [1, 2.3, 1.7, 2.1], x: [-2, 1, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.24, repeat: Infinity, type: "spring", stiffness: 380, damping: 13 }}
          >
            <ellipse cx="41" cy="58" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="42" cy="59" r="3" fill="#000" />
            <circle cx="43.5" cy="57" r="1" fill="#fff" />
          </motion.g>

          <motion.g
            style={{ transformOrigin: "59px 58px" }}
            animate={panic ? { scale: [1, 2.3, 1.7, 2.1], x: [2, -1, 0] } : { scale: 1, x: 0 }}
            transition={{ duration: 0.24, repeat: Infinity, type: "spring", stiffness: 380, damping: 13 }}
          >
            <ellipse cx="59" cy="58" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
            <circle cx="60" cy="59" r="3" fill="#000" />
            <circle cx="61.5" cy="57" r="1" fill="#fff" />
          </motion.g>
        </g>

        {/* SCREAMING TEETH CAVITY — unified parity with Carrot/Broccoli/Golden */}
        {panic ? (
          <g>
            {/* Deep screaming mouth cavity */}
            <path d="M39,70 Q50,88 61,70 Z" fill="#520000" stroke="#000" strokeWidth="1.5" />
            {/* Blocky shiny cartoon teeth structure */}
            <rect x="44" y="70" width="12" height="4" fill="#fff" stroke="#000" strokeWidth="1" rx="1" />
            {/* Vibrating panic tongue */}
            <path d="M43,78 Q50,84 57,78" fill="none" stroke="#ff8a80" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : (
          // Relaxed happy smirk line
          <path d="M40,72 Q50,82 60,72" fill="none" stroke="#4a0e0e" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    </motion.div>
  );
}
