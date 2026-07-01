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
        background: 'rgba(8, 8, 8, 0.85)',
        border: '1px solid #c8a84b',
        borderRadius: '10px',
        padding: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <h2
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '18px',
          letterSpacing: '1px',
          color: '#ffc83c',
          margin: '0 0 10px 0',
          textAlign: 'center'
        }}
      >
        LEADERBOARD
      </h2>

      <AnimatePresence initial={false}>
        {ranked.map((player, index) => {
          const isMe = player.slotId === mySlot;
          return (
            <motion.div
              key={player.slotId}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                marginBottom: '6px',
                borderRadius: '6px',
                background: isMe ? 'rgba(255, 200, 60, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: isMe ? '1px solid #ffc83c' : '1px solid transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', width: '28px', textAlign: 'center' }}>
                  {rankBadge(index)}
                </span>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: player.color,
                    display: 'inline-block'
                  }}
                />
                <span
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: '13px',
                    fontWeight: isMe ? 'bold' : 'normal',
                    color: '#ffffff'
                  }}
                >
                  {player.name}
                  {isMe && <span style={{ color: '#ffc83c' }}> (You)</span>}
                </span>
              </div>

              <span
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#ffc83c'
                }}
              >
                {player.score}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {ranked.length === 0 && (
        <p style={{ color: '#8a8a93', fontSize: '12px', textAlign: 'center', margin: '8px 0' }}>
          Waiting for players...
        </p>
      )}
    </div>
  );
}

export default Scoreboard;
