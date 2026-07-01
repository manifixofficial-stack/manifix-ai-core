import React, { useState } from 'react';
import { motion } from 'framer-motion';

function CharacterSelect({ takenChars, onLock }) {
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
    <div className="lobby-card">
      <h1>MEMBER SELECT</h1>
      <p>Pick your color and type your name. Each friend locks in their own unique slot:</p>

      {/* FIXED CLASS CONTEXT WRAPPERS */}
      <div className="character-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {colorSlots.map((slot) => {
          const lockedName = takenChars[slot.id];
          const isTaken = Boolean(lockedName);
          const canClaim = !isTaken && drafts[slot.id].trim().length > 0;

          return (
            <div
              key={slot.id}
              style={{ 
                borderColor: isTaken ? '#1c1c24' : slot.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#121217',
                border: '1px solid',
                borderRadius: '10px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', flex: 1, marginRight: '12px' }}>
                {isTaken ? (
                  <>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>{lockedName}</span>
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
                        width: '100%',
                        textAlign: 'left'
                      }}
                    />
                    <small style={{ fontSize: '10px', color: '#8a8a93', marginTop: '4px' }}>
                      {slot.label}
                    </small>
                  </>
                )}
              </div>

              {isTaken ? (
                <strong style={{ fontSize: '12px', color: '#ff3333', fontFamily: 'sans-serif' }}>IN GAME</strong>
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
                    padding: '10px 16px',
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
