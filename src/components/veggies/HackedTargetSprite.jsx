// components/veggies/HackedTargetSprite.jsx
//
// Sprite for the legendary "Hacked Target" entity spawned by
// lib/hackedEventClient.js when a room's is_hacked flag flips on. This is
// an ORIGINAL design — a glitched-out, corrupted-signal mascot, not a
// reproduction of any existing copyrighted character. Deliberately reads
// as "something got into the system" (scanlines, RGB-split, static)
// rather than any specific IP.
//
// Rendering follows the same contract as your other veggie sprites
// (CarrotSprite, TomatoSprite, etc.) so it can drop straight into
// VeggieSprite's type-switch alongside them. It never camouflages —
// unlike normal veggies, the whole point is that it's impossible to miss
// once it spawns, so `catchMode`/`distance` are only used for scale, not
// for hiding it below CAMOUFLAGE_DISTANCE_METERS.

import React from 'react';

export default function HackedTargetSprite({ scale = 1, catchMode = false, locked = false }) {
  const size = 64 * scale;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: locked ? 'brightness(1.3)' : 'none',
        animation: catchMode ? 'hackedPulse 0.6s infinite alternate' : 'hackedFloat 2.2s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes hackedFloat {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes hackedPulse {
          0%   { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes hackedGlitch {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); }
          20% { clip-path: inset(10% 0 60% 0); transform: translate(-2px, 0); }
          40% { clip-path: inset(60% 0 5% 0); transform: translate(2px, 0); }
          60% { clip-path: inset(30% 0 40% 0); transform: translate(-1px, 0); }
          80% { clip-path: inset(5% 0 70% 0); transform: translate(1px, 0); }
        }
      `}</style>

      {/* RGB-split glitch layers behind the main glyph */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          fontSize: size * 0.7,
          color: '#ff3355',
          opacity: 0.55,
          animation: 'hackedGlitch 1.4s steps(6) infinite',
        }}
      >
        ⚠
      </span>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          fontSize: size * 0.7,
          color: '#33e0ff',
          opacity: 0.55,
          animation: 'hackedGlitch 1.7s steps(6) infinite reverse',
        }}
      >
        ⚠
      </span>

      {/* Main glyph + scanline overlay */}
      <span
        style={{
          position: 'relative',
          fontSize: size * 0.7,
          filter: 'drop-shadow(0 0 8px rgba(255,51,85,0.8))',
        }}
      >
        ⚠
      </span>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 3px)',
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Legendary-tier ring */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -6,
          borderRadius: '50%',
          border: '2px solid rgba(255,51,85,0.7)',
          boxShadow: '0 0 16px rgba(255,51,85,0.6)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export const HACKED_TARGET_ICON = '⚠';
export const HACKED_TARGET_LABEL = 'HACKED TARGET';
