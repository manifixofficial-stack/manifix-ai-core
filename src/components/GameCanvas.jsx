import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import Joystick from './Joystick';
import confetti from 'canvas-confetti';

function GameCanvas({ gameState, roomCode, mySlot }) {
  const canvasRef = useRef(null);
  const [flashActive, setFlashActive] = useState(false);
  const lastMoveSentRef = useRef(0);

  // rAF-driven animation state — kept in refs so gameState updates (network tick)
  // don't reset the smooth idle loops (hop / squish / breathe) between packets.
  const rafRef = useRef(null);
  const startTimeRef = useRef(performance.now());
  const particlesRef = useRef([]); // { x, y, vx, vy, life, maxLife }
  const gameStateRef = useRef(gameState);
  const mySlotRef = useRef(mySlot);
  gameStateRef.current = gameState;
  mySlotRef.current = mySlot;

  // Mapped parameters that read from your dynamic color selection inputs
  const SLOT_THEMES = {
    BLUE: { color: '#3a86ff', label: 'B' },
    PURPLE: { color: '#8338ec', label: 'P' },
    PINK: { color: '#ff006e', label: 'P' },
    ORANGE: { color: '#fb5607', label: 'O' }
  };

  const spawnParticleRing = useCallback((nx, ny, width, height) => {
    const cx = nx * width;
    const cy = ny * height;
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 2.4 + Math.random() * 1.6;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1
      });
    }
  }, []);

  useEffect(() => {
    const handleFlash = (data) => {
      if (data.playerId === socket.id) {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.85 } });
      }
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 400);
    };

    // Point-steal / tackle collision — dual-pulse haptic + gold star particle ring
    const handleTackle = (data) => {
      const canvas = canvasRef.current;
      if (canvas && typeof data.x === 'number' && typeof data.y === 'number') {
        spawnParticleRing(data.x, data.y, canvas.width, canvas.height);
      }
      const involvesMe = data.attackerId === socket.id || data.victimId === socket.id;
      if (involvesMe && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 15]); // heavy buzz, short break, light buzz
      }
    };

    socket.on('high-score-flash', handleFlash);
    socket.on('point-steal', handleTackle);
    return () => {
      socket.off('high-score-flash', handleFlash);
      socket.off('point-steal', handleTackle);
    };
  }, [spawnParticleRing]);

  // FIXED EMISSION CHANNEL AND VECTOR VARIABLE PACKAGING STRUCTURE:
  const handleJoystickMove = useCallback(
    (dx, dy) => {
      const now = Date.now();
      if (now - lastMoveSentRef.current < 45) return; // Throttled to match ~22Hz tick rates perfectly
      lastMoveSentRef.current = now;

      const localPlayerObject = Object.values(gameState.players || {}).find(p => p.character === mySlot);
      if (localPlayerObject && localPlayerObject.overheated) return;

      socket.emit('move', { x: dx, y: dy });
    },
    [mySlot, gameState.players]
  );

  // Continuous render loop — decoupled from network tick so idle animations stay smooth.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const drawTriangle = (cx, cy, size, hop) => {
      const y = cy - hop;
      ctx.beginPath();
      ctx.moveTo(cx, y - size);
      ctx.lineTo(cx - size, y + size * 0.8);
      ctx.lineTo(cx + size, y + size * 0.8);
      ctx.closePath();
    };

    const tick = () => {
      const state = gameStateRef.current || {};
      const localMySlot = mySlotRef.current;
      const { width, height } = canvas;
      const t = (performance.now() - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, width, height);

      // 1. Grid — flashes gold -> crimson during a glitch intrusion
      const glitch = !!state.cockroachHack;
      if (glitch) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 10);
        const r = Math.round(48 + pulse * 160);
        ctx.strokeStyle = `rgb(${r}, 16, 20)`;
      } else {
        ctx.strokeStyle = '#14141c';
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }

      const players = Object.values(state.players || {});

      // Helper: nearest-player proximity, used to drive panic/squish intensity locally
      const proximityAt = (nx, ny) => {
        let closest = 1;
        for (const p of players) {
          const d = Math.hypot(p.x - nx, p.y - ny);
          if (d < closest) closest = d;
        }
        return closest; // 0 = right on top of a player, 1 = far away
      };

      // 2. Vegetables — fully hidden during a glitch blackout (still moving server-side)
      if (!glitch) {
        (state.vegetables || []).forEach((veg, idx) => {
          const vX = veg.x * width;
          const vY = veg.y * height;
          const prox = proximityAt(veg.x, veg.y);
          const panic = prox < 0.18; // matches server's 0.18 proximity boundary

          if (veg.type === 'carrot') {
            // Hopping triangle, wave-progression idle loop; shivers faster when panicked
            const hopSpeed = panic ? 14 : 4;
            const hopHeight = panic ? 6 : 3;
            const hop = Math.abs(Math.sin(t * hopSpeed + idx)) * hopHeight;
            const shiverX = panic ? (Math.random() - 0.5) * 3 : 0;
            drawTriangle(vX + shiverX, vY, 14, hop);
            ctx.fillStyle = '#ff7a00';
            ctx.fill();
            ctx.strokeStyle = '#ffb066';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else if (veg.type === 'tomato') {
            // Squish-and-stretch sprint stride when fleeing
            const squishSpeed = panic ? 10 : 3;
            const squish = panic ? 0.35 : 0.1;
            const s = 1 + Math.sin(t * squishSpeed + idx) * squish;
            ctx.save();
            ctx.translate(vX, vY);
            ctx.scale(1 / s, s);
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#dd2c00';
            ctx.fill();
            ctx.restore();
          } else {
            // Rare Golden Matrix Node — breathing halo light rings
            const breathe = 0.5 + 0.5 * Math.sin(t * 2.2 + idx);
            for (let ring = 0; ring < 3; ring++) {
              const ringRadius = 15 + ring * 6 + breathe * 8;
              ctx.beginPath();
              ctx.arc(vX, vY, ringRadius, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(255, 202, 40, ${0.35 - ring * 0.1})`;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(vX, vY, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#ffca28';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        });
      }

      // 3. Player Avatars with Dynamic Labels & Heat bars
      players.forEach((p) => {
        const pX = p.x * width;
        const pY = p.y * height;
        const slotConfig = SLOT_THEMES[p.character] || { color: '#ffffff', label: '?' };
        const isMe = p.character === localMySlot;

        ctx.beginPath();
        ctx.arc(pX, pY, 22, 0, Math.PI * 2);
        ctx.fillStyle = p.overheated ? '#1c1c24' : slotConfig.color;
        ctx.fill();
        ctx.strokeStyle = p.overheated ? '#ff3333' : isMe ? '#ffc83c' : '#ffffff';
        ctx.lineWidth = p.overheated ? 3 : isMe ? 3 : 1.5;
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = p.overheated ? '#ff3333' : '#000000';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.overheated ? '!' : slotConfig.label, pX, pY + 1);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px monospace';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(p.name, pX, pY - 30);

        const barW = 34; const barH = 4;
        ctx.fillStyle = '#08080a';
        ctx.fillRect(pX - barW / 2, pY + 28, barW, barH);
        ctx.fillStyle = p.overheated ? '#ff3333' : '#ffca28';
        ctx.fillRect(pX - barW / 2, pY + 28, barW * ((p.heat || 0) / 100), barH);
      });

      // 4. Particle ring explosions (tackle / point-steal feedback)
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.94;
        pt.vy *= 0.94;
        pt.life -= 0.035;
        if (pt.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = pt.life / pt.maxLife;
        const size = 3 + alpha * 3;
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.life * 4);
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const outerAngle = (k / 5) * Math.PI * 2;
          const innerAngle = outerAngle + Math.PI / 5;
          ctx.lineTo(Math.cos(outerAngle) * size, Math.sin(outerAngle) * size);
          ctx.lineTo(Math.cos(innerAngle) * size * 0.45, Math.sin(innerAngle) * size * 0.45);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255, 202, 40, ${alpha})`;
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
