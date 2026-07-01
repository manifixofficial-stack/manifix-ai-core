import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import Joystick from './Joystick';
import confetti from 'canvas-confetti';

function GameCanvas({ gameState, roomCode, mySlot }) {
  const canvasRef = useRef(null);
  const [flashActive, setFlashActive] = useState(false);
  const lastMoveSentRef = useRef(0);

  // Mapped parameters that read from your dynamic color selection inputs
  const SLOT_THEMES = {
    BLUE: { color: '#3a86ff', label: 'B' },
    PURPLE: { color: '#8338ec', label: 'P' },
    PINK: { color: '#ff006e', label: 'P' },
    ORANGE: { color: '#fb5607', label: 'O' }
  };

  useEffect(() => {
    const handleFlash = (data) => {
      if (data.playerId === socket.id) {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.85 } });
      }
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 400);
    };

    socket.on('high-score-flash', handleFlash);
    return () => socket.off('high-score-flash', handleFlash);
  }, []);

  // ✅ FIXED EMISSION CHANNEL AND VECTOR VARIABLE PACKAGING STRUCTURE:
  const handleJoystickMove = useCallback(
    (dx, dy) => {
      const now = Date.now();
      if (now - lastMoveSentRef.current < 45) return; // Throttled to match ~22Hz tick rates perfectly
      lastMoveSentRef.current = now;

      // Find local player inside your socket tracking dictionary array safely
      const localPlayerObject = Object.values(gameState.players || {}).find(p => p.character === mySlot);
      if (localPlayerObject && localPlayerObject.overheated) return;

      // Corrected to 'move' and matches the target keys { x, y } expected by your server framework
      socket.emit('move', { x: dx, y: dy });
    },
    [mySlot, gameState.players]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Mesh Background Grid (Changes to deep maroon during Glitches)
    ctx.strokeStyle = gameState.cockroachHack ? '#301014' : '#14141c';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
    }

    // 2. Render Garden Vegetables ONLY if the system isn't currently glitched out
    if (!gameState.cockroachHack) {
      (gameState.vegetables || []).forEach((veg) => {
        const vX = veg.x * width;
        const vY = veg.y * height;

        ctx.beginPath();
        ctx.arc(vX, vY, 15, 0, Math.PI * 2);

        if (veg.type === 'golden') {
          ctx.fillStyle = '#ffca28'; ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke();
        } else {
          ctx.fillStyle = veg.type === 'carrot' ? '#e65100' : veg.type === 'tomato' ? '#dd2c00' : '#00b0ff';
          ctx.fill();
        }
        ctx.closePath();
      });
    }

    // 3. Render Custom Player Avatars with Dynamic Labels & Heat bars
    Object.values(gameState.players || {}).forEach((p) => {
      const pX = p.x * width;
      const pY = p.y * height;
      const slotConfig = SLOT_THEMES[p.character] || { color: '#ffffff', label: '?' };
      const isMe = p.character === mySlot;

      // Core Avatar Bubble Shape
      ctx.beginPath();
      ctx.arc(pX, pY, 22, 0, Math.PI * 2);
      ctx.fillStyle = p.overheated ? '#1c1c24' : slotConfig.color;
      ctx.fill();
      ctx.strokeStyle = p.overheated ? '#ff3333' : isMe ? '#ffc83c' : '#ffffff';
      ctx.lineWidth = p.overheated ? 3 : isMe ? 3 : 1.5;
      ctx.stroke();
      ctx.closePath();

      // Core Central Initial Label Letter
      ctx.fillStyle = p.overheated ? '#ff3333' : '#000000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.overheated ? '!' : slotConfig.label, pX, pY + 1);

      // Custom Name Text Label tag above avatar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(p.name, pX, pY - 30);

      // Phone Temperature Heat Tracker Bars
      const barW = 34; const barH = 4;
      ctx.fillStyle = '#08080a';
      ctx.fillRect(pX - barW / 2, pY + 28, barW, barH);
      ctx.fillStyle = p.overheated ? '#ff3333' : '#ffca28';
      ctx.fillRect(pX - barW / 2, pY + 28, barW * ((p.heat || 0) / 100), barH);
    });
  }, [gameState, mySlot]);

  return (
    <div className="canvas-container" style={{ position: 'relative', width: '100%' }}>
      {gameState.cockroachHack && (
        <div className="hack-alert-banner">🚨 SYSTEM DATA CORRUPTION: RADAR DATA BLINDED! ⚡</div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '10px' }}
        className={`battle-canvas ${flashActive ? 'flash-gold' : ''} ${
          gameState.cockroachHack ? 'canvas-glitch' : ''
        }`}
      />

      {/* Floating Joystick component controller anchor wrapper layout */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <Joystick onMove={handleJoystickMove} />
      </div>
    </div>
  );
}

export default GameCanvas;
