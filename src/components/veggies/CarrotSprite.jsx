import React from "react";
import { motion } from "framer-motion";
// A cute carrot character. Purely presentational — parent positions it
// on screen via the wrapping transform (see VeggieSprite.jsx).
export default function CarrotSprite({ panic, sizePx = 90 }) {
  return (
    <motion.div
      style={{ width: sizePx, height: sizePx, position: "relative" }}
      animate={
        panic
          ? { y: [0, -6, 0], x: [-2, 2, -2, 0], rotate: [-3, 3, -3] }
          : { y: [0, -10, 0] } // idle hop, gentle
      }
      transition={{
        duration: panic ? 0.35 : 1.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        {/* legs / feet */}
        <motion.line x1="44" y1="86" x2="40" y2="96" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
          animate={{ y2: panic ? [96, 88, 96] : [96, 92, 96] }}
          transition={{ duration: panic ? 0.25 : 0.9, repeat: Infinity }} />
        <motion.line x1="56" y1="86" x2="60" y2="96" stroke="rgba(0,0,0,0.5)" strokeWidth="5" strokeLinecap="round"
          animate={{ y2: panic ? [88, 96, 88] : [92, 96, 92] }}
          transition={{ duration: panic ? 0.25 : 0.9, repeat: Infinity }} />
        <ellipse cx="39" cy="97" rx="6" ry="3" fill="#3a1d00" />
        <ellipse cx="61" cy="97" rx="6" ry="3" fill="#3a1d00" />

        {/* mitten arms — idle: raised "Hii" wave. panic: pumping */}
        <motion.g
          animate={{ rotate: panic ? [0, -25, 0] : [0, 12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.8, repeat: Infinity }}
          style={{ transformOrigin: "44px 64px" }}
        >
          <line x1="44" y1="64" x2="30" y2="50" stroke="#ff8c1a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="30" cy="50" r="8" fill="#ff8c1a" stroke="#c85a00" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: panic ? [0, 25, 0] : [0, -12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.8, repeat: Infinity }}
          style={{ transformOrigin: "56px 64px" }}
        >
          <line x1="56" y1="64" x2="70" y2="50" stroke="#ff8c1a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="70" cy="50" r="8" fill="#ff8c1a" stroke="#c85a00" strokeWidth="1.5" />
        </motion.g>

        {/* leaf crown — fanned, two-tone */}
        <path d="M50,36 C47,24 42,14 36,8 C41,20 45,30 48,36 Z" fill="#2e7d32" />
        <path d="M50,36 C48,22 45,10 41,2 C46,16 49,28 50,36 Z" fill="#43a047" />
        <path d="M50,36 C50,20 50,8 50,2 C50,16 50,28 50,36 Z" fill="#2e7d32" />
        <path d="M50,36 C52,22 55,10 59,2 C54,16 51,28 50,36 Z" fill="#43a047" />
        <path d="M50,36 C53,24 58,14 64,8 C59,20 55,30 52,36 Z" fill="#2e7d32" />

        {/* body — rounded taper instead of a hard triangle */}
        <path d="M50,34 C64,34 68,48 64,62 C61,74 56,86 50,92 C44,86 39,74 36,62 C32,48 36,34 50,34 Z"
          fill="#ff8c1a" stroke="#c85a00" strokeWidth="2.5" />
        {/* ridge texture */}
        <path d="M40,50 Q50,53 60,50" stroke="rgba(0,0,0,0.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M39,64 Q50,68 61,64" stroke="rgba(0,0,0,0.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M42,78 Q50,81 58,78" stroke="rgba(0,0,0,0.15)" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* blush */}
        <ellipse cx="36" cy="65" rx="4.5" ry="2.5" fill="#ff6f61" opacity="0.35" />
        <ellipse cx="64" cy="65" rx="4.5" ry="2.5" fill="#ff6f61" opacity="0.35" />

        {/* face — bigger eyes with shine, like the reference art */}
        <ellipse cx="42" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
        <ellipse cx="58" cy="56" rx="6" ry="8" fill="#fff" stroke="#000" strokeWidth="1" />
        <circle cx="43" cy="57" r="3" fill="#000" />
        <circle cx="59" cy="57" r="3" fill="#000" />
        <circle cx="44.5" cy="55" r="1" fill="#fff" />
        <circle cx="60.5" cy="55" r="1" fill="#fff" />
        <path d="M40,70 Q50,80 60,70" fill="none" stroke="#7a2e00" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
