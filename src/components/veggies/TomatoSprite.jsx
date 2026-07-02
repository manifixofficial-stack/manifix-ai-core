import React from "react";
import { motion } from "framer-motion";
// A cute tomato character. Purely presentational — parent positions it
// on screen via the wrapping transform (see VeggieSprite.jsx).
export default function TomatoSprite({ panic, sizePx = 90 }) {
  return (
    <motion.div
      style={{ width: sizePx, height: sizePx, position: "relative" }}
      animate={
        panic
          ? { y: [0, -6, 0], x: [-2, 2, -2, 0], rotate: [-3, 3, -3] }
          : { y: [0, -9, 0] } // idle hop, gentle
      }
      transition={{
        duration: panic ? 0.35 : 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* legs / feet */}
        <motion.line x1="42" y1="82" x2="38" y2="94" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
          animate={{ y2: panic ? [94, 86, 94] : [94, 90, 94] }}
          transition={{ duration: panic ? 0.25 : 0.9, repeat: Infinity }} />
        <motion.line x1="58" y1="82" x2="62" y2="94" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
          animate={{ y2: panic ? [86, 94, 86] : [90, 94, 90] }}
          transition={{ duration: panic ? 0.25 : 0.9, repeat: Infinity }} />
        <ellipse cx="37" cy="95" rx="6" ry="3" fill="#4a0e0e" />
        <ellipse cx="63" cy="95" rx="6" ry="3" fill="#4a0e0e" />

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

        {/* face — big shiny eyes */}
        <ellipse cx="41" cy="58" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
        <ellipse cx="59" cy="58" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
        <circle cx="42" cy="59" r="3" fill="#000" />
        <circle cx="60" cy="59" r="3" fill="#000" />
        <circle cx="43.5" cy="57" r="1" fill="#fff" />
        <circle cx="61.5" cy="57" r="1" fill="#fff" />
        <path d="M40,72 Q50,82 60,72" fill="none" stroke="#4a0e0e" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
