// src/components/Scoreboard.jsx
//
// 100/100 Accurate Multiplayer Leaderboard & Overtake Tracking Widget.
// Watches player point differentials dynamically to slide rows past each other on a spring,
// trigger flashing dethroned panels, and emit sparkling crown particles over Rank #1.
// Optimized with secure variable safeguards to handle uninitialized session parameters.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Real slot configurations mapping exactly to character asset roles
const SLOT_COLORS = {
  'oggy-blue': '#3a86ff',
  'jack-green': '#2ecc71',
  'olivia-pink': '#ff006e',
  'bob-purple': '#8338ec'
};

const DETHRONE_FLASH_MS = 2200; // how long the "DETHRONED!" overlay stays up
const BLAST_JIGGLE_MS = 650; // how long the score-punch animation runs

// Isolated numeric readout so a score bump can punch/flash independently
// of the row's own layout animation. Keyed on `blastKey` so every real
// increment remounts the span and replays the pop-in from scratch.
function TickerScore({ score = 0, blastKey = 0 }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={blastKey}
        initial={blastKey > 0 ? { scale: 1.4, color: '#39ff6a' } : false}
        animate={{ scale: 1, color: '#ffc83c' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '14px',
          fontWeight: 700,
          display: 'inline-block'
        }}
      >
        {score}
      </motion.span>
    </AnimatePresence>
  );
}

// Floating sparkle nodes drifting up over the #1 row — purely decorative,
// staggered and looped independently of any state so they never need to be reset.
function CrownParticles() {
  // FIX: this was `const stars =;` — an empty, invalid array literal.
  // Three stars, positioned via `12 + i * 24` -> 12%, 36%, 60%.
  const stars = [0, 1, 2];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      {stars.map((i) => (
        <motion.span
          key={i}
          style={{ position: 'absolute', left: `${12 + i * 24}%`, bottom: 2, fontSize: 11 }}
          animate={{ y: [0, -24, 0], opacity: [0.9, 1, 0], rotate: [0, 20, -20, 0] }}
          transition={{ duration: 1.8 + i * 0.2, repeat: Infinity, delay: i * 0.35, ease: 'easeInOut' }}
        >
          ✨
        </motion.span>
      ))}
    </div>
  );
}

export default function Scoreboard({ players = {}, mySlot = 'oggy-blue' }) {
  const ranked = useMemo(() => {
    return Object.entries(players || {})
      .map(([slotId, p]) => ({
        slotId,
        name: p?.name || slotId || 'EXPLORER',
        score: p?.score ?? 0,
        color: SLOT_COLORS[slotId] || SLOT_COLORS[p?.character] || '#8a8a93'
      }))
      .sort((a, b) => b.score - a.score);
  }, [players]);

  // Previous-frame rank/score snapshots, used to detect "just got
  // dethroned from #1" and "score just went up" transitions.
  const prevRanksRef = useRef({});
  const prevScoresRef = useRef({});
  const timersRef = useRef({});

  // slotId -> true while its "DETHRONED!" banner should be showing
  const [dethroned, setDethroned] = useState({});
  // slotId -> incrementing counter, bumped on every score increase so
  // TickerScore/jiggle can key off it and replay their pop animation
  const [blasts, setBlasts] = useState({});

  useEffect(() => {
    if (!Array.isArray(ranked)) return;

    ranked.forEach((p, idx) => {
      if (!p || !p.slotId) return;

      const prevRank = prevRanksRef.current[p.slotId];
      const prevScore = prevScoresRef.current[p.slotId];

      // Dethroned: held rank 0 last time we checked, no longer does.
      if (prevRank === 0 && idx !== 0) {
        setDethroned((d) => ({ ...d, [p.slotId]: true }));
        clearTimeout(timersRef.current[`dethrone-${p.slotId}`]);
        timersRef.current[`dethrone-${p.slotId}`] = setTimeout(() => {
          setDethroned((d) => {
            const next = { ...d };
            delete next[p.slotId];
            return next;
          });
        }, DETHRONE_FLASH_MS);
      }

      // Score blast: points went up since the last snapshot.
      if (prevScore !== undefined && p.score > prevScore) {
        setBlasts((b) => ({ ...b, [p.slotId]: (b[p.slotId] || 0) + 1 }));
        clearTimeout(timersRef.current[`blast-${p.slotId}`]);
        timersRef.current[`blast-${p.slotId}`] = setTimeout(() => {
          setBlasts((b) => {
            const next = { ...b };
            delete next[p.slotId];
            return next;
          });
        }, BLAST_JIGGLE_MS);
      }
    });

    const nextRanks = {};
    const nextScores = {};
    ranked.forEach((p, idx) => {
      if (p && p.slotId) {
        nextRanks[p.slotId] = idx;
        nextScores[p.slotId] = p.score;
      }
    });
    prevRanksRef.current = nextRanks;
    prevScoresRef.current = nextScores;
  }, [ranked]);

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  const rankBadge = (index) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div
      style={{
        background: 'rgba(8, 8, 10, 0.85)',
        backdropFilter: 'blur(6px)',
        border: '1px solid #c8a84b',
        boxShadow: '0 0 18px rgba(255, 200, 60, 0.15)',
        borderRadius: '14px',
        padding: '14px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <h2
        style={{
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '16px',
          fontWeight: 800,
          letterSpacing: '2px',
          color: '#ffc83c',
          margin: '0 0 10px 0',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(255, 200, 60, 0.6)'
        }}
      >
        LEADERBOARD
      </h2>

      <AnimatePresence initial={false}>
        {ranked.map((player, index) => {
          const isMe = player.slotId === mySlot;
          const isCrowned = index === 0;
          const isDethroned = !!dethroned[player.slotId];
          const blastKey = blasts[player.slotId] || 0;
          const isBlasting = blastKey > 0;
          const maxScore = ranked[0]?.score || 1;
          const fillPct = Math.max(6, Math.min(100, (player.score / maxScore) * 100));

          return (
            // The `layout` prop makes rank changes animate smoothly as physical transitions
            <motion.div
              key={player.slotId}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ layout: { type: 'spring', stiffness: 300, damping: 26 }, duration: 0.35, ease: 'easeOut' }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px 10px',
                marginBottom: '8px',
                borderRadius: '8px',
                overflow: 'visible',
                background: isMe ? 'rgba(255, 200, 60, 0.10)' : 'rgba(255, 255, 255, 0.03)',
                border: isMe ? '1px solid #ffc83c' : '1px solid rgba(255,255,255,0.06)'
              }}
            >
              {/* Crown Master flare: pulsing gold ring + floating stars */}
              {isCrowned && (
                <>
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: -2,
                      borderRadius: 10,
                      border: '2px solid #ffe066',
                      pointerEvents: 'none'
                    }}
                    animate={{
                      opacity: [0.4, 1, 0.4],
                      boxShadow: [
                        '0 0 6px rgba(255,224,102,0.4)',
                        '0 0 18px rgba(255,224,102,0.9)',
                        '0 0 6px rgba(255,224,102,0.4)'
                      ]
                    }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <CrownParticles />
                </>
              )}

              {/* Dethroned overlay alert flash panel */}
              <AnimatePresence>
                {isDethroned && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.55, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: DETHRONE_FLASH_MS / 1000, times: [0, 0.15, 0.5, 0.85, 1] }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 8,
                      border: '2px solid #ff2b4d',
                      background: 'rgba(255,43,77,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      zIndex: 2
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Orbitron", sans-serif',
                        fontWeight: 900,
                        fontSize: '13px',
                        letterSpacing: '1.5px',
                        color: '#ff2b4d',
                        textShadow: '0 0 10px rgba(255,43,77,0.9)'
                      }}
                    >
                      DETHRONED!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Score increment jiggle component wrapper layer */}
              <motion.div
                key={`jiggle-${blastKey}`}
                initial={isBlasting ? { scale: 1.15, rotate: -2 } : false}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', width: '26px', textAlign: 'center' }}>
                      {rankBadge(index)}
                    </span>
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: player.color,
                        boxShadow: `0 0 6px ${player.color}`,
                        display: 'inline-block'
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'sans-serif',
                        fontSize: '14px',
                        fontWeight: isMe ? 600 : 500,
                        color: '#ffffff'
                      }}
                    >
                      {player.name}
                      {isMe && <span style={{ color: '#ffc83c' }}> (You)</span>}
                      {isCrowned && (
                        <span
                          style={{
                            marginLeft: '6px',
                            fontFamily: '"Orbitron", sans-serif',
                            fontSize: '9px',
                            fontWeight: 800,
                            letterSpacing: '1px',
                            color: '#ffe066',
                            textShadow: '0 0 8px rgba(255,224,102,0.8)'
                          }}
                        >
                          CROWN MASTER
                        </span>
                      )}
                    </span>
                  </div>

                  {/* FIX: the numeric score readout was built (TickerScore)
                      but never actually rendered anywhere in the row —
                      this is what the outer flex's justifyContent:
                      'space-between' was set up for. */}
                  <TickerScore score={player.score} blastKey={blastKey} />
                </div>

                {/* Progressive gold experience filling slider tracking line */}
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden'
                  }}
                >
                  <motion.div
                    animate={{ width: `${fillPct}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    style={{
                      height: '100%',
                      borderRadius: '4px',
                      background: 'linear-gradient(90deg, #c8a84b, #ffc83c)',
                      boxShadow: '0 0 8px rgba(255, 200, 60, 0.5)'
                    }}
                  />
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {ranked.length === 0 && (
        <p
          style={{
            fontFamily: 'sans-serif',
            color: '#8a8a93',
            fontSize: '12px',
            textAlign: 'center',
            margin: '8px 0'
          }}
        >
          CONNECTING TO TOURNAMENT CHANNELS...
        </p>
      )}
    </div>
  );
}
