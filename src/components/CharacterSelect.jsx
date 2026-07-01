import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Stage 2: The Color Pad Slot Claim Grid
// Live camera feed streams behind this component (handled by parent layout).
// This card floats on top with transparent/glass panels so the room stays visible.

function CharacterSelect({ takenChars = {}, onLock = () => {} }) {
  const colorSlots = [
    { id: 'BLUE', label: 'BLUE HERO PROFILE', color: '#3a86ff' },
    { id: 'PURPLE', label: 'FAST PURPLE PROFILE', color: '#8338ec' },
    { id: 'PINK', label: 'AGILE PINK PROFILE', color: '#ff006e' },
    { id: 'ORANGE', label: 'HEAVY ORANGE PROFILE', color: '#fb5607' }
  ];

  const [drafts, setDrafts] = useState({ BLUE: '', PURPLE: '', PINK: '', ORANGE: '' });

  const handleChange = (slotId, value) => {
    if (value.length <= 14) {
      setDrafts((prev) => ({ ...prev, [slotId]: value }));
    }
  };

  const handleClaim = (slotId) => {
    const trimmedName = drafts[slotId].trim();
    if (trimmedName.length === 0) return;
    // Fires the precise two-argument callback pattern required by App.jsx natively
    onLock(slotId, trimmedName);
  };

  const handleKeyDown = (e, slotId) => {
    if (e.key === 'Enter') {
      handleClaim(slotId);
    }
  };

  return (
    <div
      className="lobby-card"
      style={{
        background: 'rgba(8, 8, 10, 0.55)', // translucent so the live camera room shows through
        backdropFilter: 'blur(6px)',
        padding: '20px',
        borderRadius: '16px'
      }}
    >
      <h1
        style={{
          fontFamily: '"Orbitron", sans-serif',
          letterSpacing: '2px',
          textAlign: 'center',
          color: '#fff',
          textShadow: '0 0 12px rgba(255,255,255,0.4)'
        }}
      >
        MEMBER SELECT
      </h1>
      <p style={{ textAlign: 'center', color: '#b6b6c0', fontSize: '13px', marginBottom: '18px' }}>
        Pick your color and type your name. Each friend locks in their own unique slot:
      </p>

      <div className="character-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {colorSlots.map((slot) => {
          const lockedName = takenChars[slot.id];
          const isTaken = Boolean(lockedName);
          const canClaim = !isTaken && drafts[slot.id].trim().length > 0;

          return (
            <div
              key={slot.id}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '10px',
                boxSizing: 'border-box'
              }}
            >
              {/* Neon glowing frame track */}
              <motion.div
                animate={
                  isTaken
                    ? { borderColor: '#1c1c24', boxShadow: '0 0 0 rgba(0,0,0,0)' }
                    : {
                        borderColor: slot.color,
                        boxShadow: [
                          `0 0 6px ${slot.color}55`,
                          `0 0 16px ${slot.color}aa`,
                          `0 0 6px ${slot.color}55`
                        ]
                      }
                }
                transition={
                  isTaken
                    ? { duration: 0.4 }
                    : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(18, 18, 23, 0.75)',
                  border: '1.5px solid',
                  borderRadius: '10px'
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isTaken ? (
                    // LOCKED STATE — slide-in swipe animation
                    <motion.div
                      key="locked"
                      initial={{ x: '-100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                          {lockedName}
                        </span>
                        <small style={{ fontSize: '10px', color: '#8a8a93', marginTop: '2px' }}>
                          {slot.label}
                        </small>
                      </div>

                      {/* Stamp effect */}
                      <motion.div
                        initial={{ scale: 2, opacity: 0, rotate: -8 }}
                        animate={{ scale: 1, opacity: 1, rotate: -8 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 14 }}
                        style={{
                          background: '#2a2a31',
                          border: '2px solid #8b0000',
                          color: '#e63946',
                          fontFamily: '"Orbitron", sans-serif',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          letterSpacing: '1px',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          textShadow: '0 0 6px rgba(230,57,70,0.6)'
                        }}
                      >
                        IN GAME
                      </motion.div>
                    </motion.div>
                  ) : (
                    // OPEN STATE — input + claim button
                    <motion.div
                      key="open"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1, marginRight: '12px' }}>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={drafts[slot.id]}
                            onChange={(e) => handleChange(slot.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, slot.id)}
                            placeholder=" "
                            maxLength={14}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              borderBottom: `1px solid ${slot.color}`,
                              color: '#ffffff',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              padding: '4px 0',
                              outline: 'none',
                              width: '100%',
                              textAlign: 'left'
                            }}
                          />
                          {drafts[slot.id].length === 0 && (
                            <motion.span
                              animate={{ opacity: [0.35, 1, 0.35] }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                              style={{
                                position: 'absolute',
                                left: 0,
                                top: '4px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                                color: `${slot.color}aa`,
                                pointerEvents: 'none'
                              }}
                            >
                              ENTER YOUR NAME
                            </motion.span>
                          )}
                        </div>
                        <small style={{ fontSize: '10px', color: '#8a8a93', marginTop: '6px' }}>
                          {slot.label}
                        </small>
                      </div>

                      <motion.button
                        whileTap={canClaim ? { scale: 0.96 } : {}}
                        onClick={() => handleClaim(slot.id)}
                        disabled={!canClaim}
                        style={{
                          background: canClaim
                            ? `linear-gradient(180deg, ${slot.color}, ${slot.color}cc)`
                            : '#1c1c24',
                          color: canClaim ? '#080808' : '#8a8a93',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '10px 16px',
                          fontFamily: '"Orbitron", sans-serif',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          letterSpacing: '0.5px',
                          cursor: canClaim ? 'pointer' : 'not-allowed',
                          whiteSpace: 'nowrap',
                          boxShadow: canClaim ? `0 0 10px ${slot.color}88` : 'none'
                        }}
                      >
                        CLAIM
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Standalone demo wrapper — only used when this file is previewed
// on its own (e.g. as an artifact). In the real app, App.jsx renders
// <CharacterSelect takenChars={...} onLock={...} /> directly and this
// wrapper is unused.
// ─────────────────────────────────────────────────────────────
export function CharacterSelectDemo() {
  const [takenChars, setTakenChars] = useState({});

  const handleLock = (slotId, name) => {
    setTakenChars((prev) => ({ ...prev, [slotId]: name }));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 50% 20%, #1a1a22 0%, #08080a 70%)',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <CharacterSelect takenChars={takenChars} onLock={handleLock} />
      </div>
    </div>
  );
}

export default CharacterSelect;
