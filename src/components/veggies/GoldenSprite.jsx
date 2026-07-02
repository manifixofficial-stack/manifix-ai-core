import React from "react";
import { motion } from "framer-motion";
// A shiny golden veggie — used for rare / bonus captures. Purely
// presentational — parent positions it on screen via the wrapping
// transform (see VeggieSprite.jsx).
export default function GoldenSprite({ panic, sizePx = 90 }) {
  return (
    <motion.div
      style={{
        width: sizePx,
        height: sizePx,
        position: "relative",
        filter: "drop-shadow(0 0 6px rgba(255,196,0,0.55))",
      }}
      animate={
        panic
          ? { y: [0, -6, 0], x: [-2, 2, -2, 0], rotate: [-3, 3, -3] }
          : { y: [0, -10, 0] } // idle hop, gentle
      }
      transition={{
        duration: panic ? 0.35 : 1.4,
        repeat: Infinity,
        ease: "easeInOut",
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
        {/* legs / feet */}
        <motion.line x1="43" y1="82" x2="39" y2="94" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
          animate={{ y2: panic ? [94, 86, 94] : [94, 90, 94] }}
          transition={{ duration: panic ? 0.25 : 0.9, repeat: Infinity }} />
        <motion.line x1="57" y1="82" x2="61" y2="94" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
          animate={{ y2: panic ? [86, 94, 86] : [90, 94, 90] }}
          transition={{ duration: panic ? 0.25 : 0.9, repeat: Infinity }} />
        <ellipse cx="38" cy="95" rx="6" ry="3" fill="#7a5200" />
        <ellipse cx="62" cy="95" rx="6" ry="3" fill="#7a5200" />

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
        <path d="M50,30 C66,30 70,46 68,60 C66,76 58,90 50,92 C42,90 34,76 32,60 C30,46 34,30 50,30 Z"
          fill="#ffc83c" stroke="#a67200" strokeWidth="2.5" />
        {/* gleam streaks instead of a flat shade — still solid fills, no gradients */}
        <path d="M40,42 Q38,56 42,70" stroke="#fff3c4" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M60,46 Q62,58 58,72" stroke="#c8a84b" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* blush */}
        <ellipse cx="36" cy="62" rx="4.5" ry="2.5" fill="#ff8a3d" opacity="0.4" />
        <ellipse cx="64" cy="62" rx="4.5" ry="2.5" fill="#ff8a3d" opacity="0.4" />

        {/* face */}
        <ellipse cx="42" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
        <ellipse cx="58" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
        <circle cx="43" cy="57" r="3" fill="#000" />
        <circle cx="59" cy="57" r="3" fill="#000" />
        <circle cx="44.5" cy="55" r="1" fill="#fff" />
        <circle cx="60.5" cy="55" r="1" fill="#fff" />
        <path d="M40,70 Q50,80 60,70" fill="none" stroke="#7a5200" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
