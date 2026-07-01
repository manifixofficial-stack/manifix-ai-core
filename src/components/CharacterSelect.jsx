import React, { useState } from 'react';
import { motion } from 'framer-motion';

// 4 fixed color slots. Friends type their own name into whichever slot they claim.
// takenChars shape expected: { BLUE: 'Priya', PURPLE: null, PINK: 'Rahul', ORANGE: null }
// onLock(slotId, name) — fires when a player submits their name for an open slot.
function CharacterSelect({ takenChars, onLock }) {
  const colorSlots = [
    { id: 'BLUE', label: 'BLUE HERO PROFILE', color: '#3a86ff' },
    { id: 'PURPLE', label: 'FAST PURPLE PROFILE', color: '#8338ec' },
    { id: 'PINK', label: 'AGILE PINK PROFILE', color: '#ff006e' },
    { id: 'ORANGE', label: 'HEAVY ORANGE PROFILE', color: '#fb5607' }
  ];

  // Local draft text for each slot's input, before it's locked in.
  const [drafts, setDrafts] = useState({ BLUE: '', PURPLE: '', PINK: '', ORANGE: '' });

  const handleChange = (slotId, value) => {
    if (value.length <= 14) {
      setDrafts((prev) => ({ ...prev, [slotId]: value }));
    }
  };

  const handleClaim = (slotId) => {
    const trimmedName = drafts[slotId].trim();
    if (trimmedName.length === 0) return;
    onLock(slotId, trimmedName);
  };

  const handleKeyDown = (e, slotId) => {
    if (e.key === 'Enter') {
      handleClaim(slotId);
    }
  };

  return (
    <div className="lobby-card">
      <h1>MEMBER SELECT</h1>
      <p>Pick your color and type your name. Each friend locks in their own unique slot:</p>

      <div className="character-grid">
        {colorSlots.map((slot) => {
          const lockedName = takenChars[slot.id];
          const isTaken = Boolean(lockedName);
          const canClaim = !isTaken && drafts[slot.id].trim().length > 0;

          return (
            <div
              key={slot.id}
              style={{ borderColor: isTaken ? '#1c1c24' : slot.color }}
              className={`char-button ${isTaken ? 'disabled' : `active-${slot.id.toLowerCase()}`}`}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1 }}>
                {isTaken ? (
                  <>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{lockedName}</span>
                    <small style={{ fontSize: '10px', color: '#8a8a93', marginTop: '2px' }}>
                      {slot.label}
                    </small>
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={drafts[slot.id]}
                      onChange={(e) => handleChange(slot.id, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, slot.id)}
                      placeholder="ENTER YOUR NAME"
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
                        width: '100%'
                      }}
                    />
                    <small style={{ fontSize: '10px', color: '#8a8a93', marginTop: '4px' }}>
                      {slot.label}
                    </small>
                  </>
                )}
              </div>

              {isTaken ? (
                <strong>IN GAME</strong>
              ) : (
                <motion.button
                  whileTap={canClaim ? { scale: 0.96 } : {}}
                  onClick={() => handleClaim(slot.id)}
                  disabled={!canClaim}
                  style={{
                    background: canClaim ? slot.color : '#1c1c24',
                    color: canClaim ? '#080808' : '#8a8a93',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: canClaim ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap'
                  }}
                >
                  CLAIM
                </motion.button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CharacterSelect;
