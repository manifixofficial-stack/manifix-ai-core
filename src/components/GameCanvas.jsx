import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import Joystick from './Joystick';
import confetti from 'canvas-confetti';

// gameState shape expected:
// {
//   cockroachHack: boolean,
//   vegetables: [{ x, y, type }],   // x/y normalized 0..1
//   players: {
//     [slotId]: { x, y, character, name, overheated, heat, score }
//   }
// }
// roomCode: the joined room, used to scope the emitted move events.
function GameCanvas({ gameState, roomCode, mySlot }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [flashActive, setFlashActive] = useState(false);
  const lastMoveSentRef = useRef(0);

  // Unique letter + color per slot — no duplicate initials.
  const SLOT_THEMES = {
    BLUE: { color: '#3a86ff', initial: 'B' },
    PURPLE: { color: '#8338ec', initial: 'X' },
    PINK: { color: '#ff006e', initial: 'K' },
    ORANGE: { color: '#fb5607', initial: 'O' }
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

  // Joystick -> socket, throttled ~20/sec. Blocked locally while overheated
  // so a stale UI can't send moves the server will reject anyway.
  const handleJoystickMove = useCallback(
    (dx, dy) => {
      const now = Date.now();
      if (now - lastMoveSentRef.current < 50) return;
      lastMoveSentRef.current = now;

      const me = gameState.players ? gameState.players[mySlot] : null;
      if (me && me.overheated) return;

      socket.emit('player-move', { roomCode, dx, dy });
    },
    [roomCode, mySlot, gameState.players]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = gameState.cockroachHack ? '#301014' : '#14141c';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let j = 0; j < height; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(width, j);
      ctx.stroke();
    }

    if (!gameState.cockroachHack) {
      (gameState.vegetables || []).forEach((veg) => {
        const vX = veg.x * width;
        const vY = veg.y * height;

        ctx.beginPath();
        ctx.arc(vX, vY, 15, 0, Math.PI * 2);

        if (veg.type === 'golden') {
          ctx.fillStyle = '#ffca28';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else {
          ctx.fillStyle =
            veg.type === 'carrot' ? '#e65100' : veg.type === 'tomato' ? '#dd2c00' : '#00b0ff';
          ctx.fill();
        }
        ctx.closePath();
      });
    }

    Object.entries(gameState.players || {}).forEach(([slotId, p]) => {
      const pX = p.x * width;
      const pY = p.y * height;
      const slotConfig = SLOT_THEMES[slotId] || SLOT_THEMES[p.character] || { color: '#ffffff', initial: '?' };

      ctx.beginPath();
      ctx.arc(pX, pY, 22, 0, Math.PI * 2);
      ctx.fillStyle = p.overheated ? '#1c1c24' : slotConfig.color;
      ctx.fill();
      ctx.strokeStyle = p.overheated ? '#ff3333' : slotId === mySlot ? '#ffc83c' : '#ffffff';
      ctx.lineWidth = p.overheated ? 3 : slotId === mySlot ? 3 : 1.5;
      ctx.stroke();
      ctx.closePath();

      ctx.fillStyle = p.overheated ? '#ff3333' : '#000000';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.overheated ? '!' : slotConfig.initial, pX, pY + 1);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(p.name || slotId, pX, pY - 30);

      const barW = 34;
      const barH = 4;
      ctx.fillStyle = '#08080a';
      ctx.fillRect(pX - barW / 2, pY + 28, barW, barH);
      ctx.fillStyle = p.overheated ? '#ff3333' : '#ffca28';
      ctx.fillRect(pX - barW / 2, pY + 28, barW * ((p.heat || 0) / 100), barH);
    });
  }, [gameState, mySlot]);

  return (
    <div ref={wrapperRef} className="canvas-container" style={{ position: 'relative', width: '100%' }}>
      {gameState.cockroachHack && (
        <div className="hack-alert-banner">🚨 COCKROACH NETWORK INTRUSION: RADAR BLINDED! 🪳</div>
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

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <Joystick onMove={handleJoystickMove} />
      </div>
    </div>
  );
}

export default GameCanvas;
