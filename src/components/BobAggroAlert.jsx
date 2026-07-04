// components/BobAggroAlert.jsx
//
// Purely presentational flash-alert for the "followed a veggie into Bob's
// yard" trap. GameCanvas (or, later, useVeggieEvasion.js once available)
// decides WHEN this is active — this component only knows how to render
// that state, same separation as PlayerStampedeOverlay already uses.
//
// Usage in GameCanvas.jsx:
//
//   // TODO (once useVeggieEvasion.js is available): veggies should path
//   // toward OBSTACLE_ZONES centers while fleeing rather than away from
//   // them. Until then, this can still be wired up defensively: reuse
//   // the existing ObstacleCollisionOverlay `onLockChange` signal as a
//   // proxy for "player is inside a hazard zone", and additionally check
//   // whether a veggie is also inside that same zone before flagging
//   // aggro — that avoids Bob barking just because the player wandered
//   // into a hazard zone with no veggie anywhere near it.
//   const [aggroActive, setAggroActive] = useState(false);
//   ...
//   <BobAggroAlert active={aggroActive} />
//
//   // and wherever aggro turns on, also double the battery drain rate —
//   // see the TODO in BatteryDrainSim.jsx integration notes below.

import React from 'react';

export function BobAggroAlert({ active, zoneName = "BOB'S YARD" }) {
  if (!active) return null;

  return (
    <>
      <style>{`
        @keyframes bobAggroFlash {
          0%, 100% { background-color: rgba(255,30,30,0.0); }
          50%      { background-color: rgba(255,30,30,0.22); }
        }
        @keyframes bobAggroShake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          20%      { transform: translate(-52%, -48%) rotate(-4deg); }
          40%      { transform: translate(-48%, -52%) rotate(5deg); }
          60%      { transform: translate(-51%, -49%) rotate(-3deg); }
          80%      { transform: translate(-49%, -51%) rotate(4deg); }
        }
        @keyframes bobAggroTextPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 65,
          pointerEvents: 'none',
          animation: 'bobAggroFlash 0.5s ease-in-out infinite',
        }}
      />

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 66,
          animation: 'bobAggroShake 0.4s ease-in-out infinite',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 72, lineHeight: 1 }}>🐕‍🦺💢</div>
        <div
          style={{
            marginTop: 10,
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 2,
            color: '#ff3355',
            textShadow: '2px 2px 0 #000',
            animation: 'bobAggroTextPulse 0.5s ease-in-out infinite',
          }}
        >
          AGGRO ALERT!
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 12,
            letterSpacing: 1,
            color: '#F5F0E8',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          YOU WOKE UP {zoneName}
        </div>
      </div>
    </>
  );
}

export default BobAggroAlert;
