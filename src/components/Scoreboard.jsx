import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// gameState.players shape: { [slotId]: { name, character, score, color? } }
// mySlot: the current phone's slot id, used to highlight their own row.
function Scoreboard({ players, mySlot }) {
  const SLOT_COLORS = {
    BLUE: '#3a86ff',
    PURPLE: '#8338ec',
    PINK: '#ff006e',
    ORANGE: '#fb5607'
  };

  const ranked = useMemo(() => {
    return Object.entries(players || {})
      .map(([slotId, p]) => ({
        slotId,
        name: p.name || slotId,
        score: p.score || 0,
        color: SLOT_COLORS[slotId] || SLOT_COLORS[p.character] || '#8a8a93'
      }))
      .sort((a, b) => b.score - a.score);
  }, [players]);

  const rankBadge = (index) => {
    if (index === 0) return '🥇';
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
          const maxScore = ranked[0]?.score || 1;
          const fillPct = Math.max(6, Math.min(100, (player.score / maxScore) * 100));

          return (
            <motion.div
              key={player.slotId}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px 10px',
                marginBottom: '8px',
                borderRadius: '8px',
                background: isMe ? 'rgba(255, 200, 60, 0.10)' : 'rgba(255, 255, 255, 0.03)',
                border: isMe ? '1px solid #ffc83c' : '1px solid rgba(255,255,255,0.06)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
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
                      fontFamily: '"Fredoka", sans-serif',
                      fontSize: '14px',
                      fontWeight: isMe ? 600 : 500,
                      color: '#ffffff'
                    }}
                  >
                    {player.name}
                    {isMe && <span style={{ color: '#ffc83c' }}> (You)</span>}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#ffc83c'
                  }}
                >
                  {player.score}
                </span>
              </div>

              {/* Gold progress fill bar — grows/shrinks as veggies are caught or points stolen */}
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
          );
        })}
      </AnimatePresence>

      {ranked.length === 0 && (
        <p
          style={{
            fontFamily: '"Fredoka", sans-serif',
            color: '#8a8a93',
            fontSize: '12px',
            textAlign: 'center',
            margin: '8px 0'
          }}
        >
          Waiting for players...
        </p>
      )}
    </div>
  );
}

export default Scoreboard;
