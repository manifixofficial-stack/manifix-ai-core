import React from "react";
import { motion } from "framer-motion";
// A cute broccoli character. Purely presentational — parent positions it
// on screen via the wrapping transform (see VeggieSprite.jsx).
export default function BroccoliSprite({ panic, sizePx = 90 }) {
  return (
    <motion.div
      style={{ width: sizePx, height: sizePx, position: "relative" }}
      animate={
        panic
          ? { y: [0, -6, 0], x: [-2, 2, -2, 0], rotate: [-3, 3, -3] }
          : { y: [0, -8, 0] } // idle hop, gentle
      }
      transition={{
        duration: panic ? 0.35 : 1.7,
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
        <ellipse cx="39" cy="97" rx="6" ry="3" fill="#3d2b1f" />
        <ellipse cx="61" cy="97" rx="6" ry="3" fill="#3d2b1f" />

        {/* mitten arms attached to the stalk */}
        <motion.g
          animate={{ rotate: panic ? [0, -25, 0] : [0, 12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.9, repeat: Infinity }}
          style={{ transformOrigin: "40px 74px" }}
        >
          <line x1="40" y1="74" x2="26" y2="64" stroke="#66bb6a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="26" cy="64" r="8" fill="#66bb6a" stroke="#1b5e20" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: panic ? [0, 25, 0] : [0, -12, 0] }}
          transition={{ duration: panic ? 0.3 : 1.9, repeat: Infinity }}
          style={{ transformOrigin: "60px 74px" }}
        >
          <line x1="60" y1="74" x2="74" y2="64" stroke="#66bb6a" strokeWidth="7" strokeLinecap="round" />
          <circle cx="74" cy="64" r="8" fill="#66bb6a" stroke="#1b5e20" strokeWidth="1.5" />
        </motion.g>

        {/* stalk */}
        <path d="M43,72 L40,90 L60,90 L57,72 Z" fill="#dcedc8" stroke="#8d9e6f" strokeWidth="2" />

        {/* floret cluster — cloud of overlapping circles */}
        <g stroke="#1b5e20" strokeWidth="1.5">
          <circle cx="34" cy="42" r="14" fill="#4caf50" />
          <circle cx="50" cy="30" r="16" fill="#43a047" />
          <circle cx="66" cy="42" r="14" fill="#4caf50" />
          <circle cx="42" cy="54" r="14" fill="#388e3c" />
          <circle cx="58" cy="54" r="14" fill="#388e3c" />
          <circle cx="50" cy="46" r="15" fill="#4caf50" />
        </g>
        {/* little texture bumps for the "fluffy" broccoli look */}
        <g fill="rgba(0,0,0,0.08)">
          <circle cx="30" cy="36" r="2.2" />
          <circle cx="44" cy="24" r="2.2" />
          <circle cx="58" cy="24" r="2.2" />
          <circle cx="70" cy="38" r="2.2" />
          <circle cx="36" cy="52" r="2.2" />
          <circle cx="64" cy="52" r="2.2" />
        </g>

        {/* blush */}
        <ellipse cx="38" cy="52" rx="4" ry="2.3" fill="#ff8a80" opacity="0.4" />
        <ellipse cx="62" cy="52" rx="4" ry="2.3" fill="#ff8a80" opacity="0.4" />

        {/* face sits low on the floret cluster, like the reference art */}
        <ellipse cx="42" cy="46" rx="5.5" ry="7.5" fill="#fff" stroke="#000" strokeWidth="1" />
        <ellipse cx="58" cy="46" rx="5.5" ry="7.5" fill="#fff" stroke="#000" strokeWidth="1" />
        <circle cx="43" cy="47" r="2.8" fill="#000" />
        <circle cx="59" cy="47" r="2.8" fill="#000" />
        <circle cx="44.3" cy="45" r="1" fill="#fff" />
        <circle cx="60.3" cy="45" r="1" fill="#fff" />
        <path d="M41,58 Q50,66 59,58" fill="none" stroke="#1b5e20" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}
