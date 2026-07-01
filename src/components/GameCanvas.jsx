import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import Joystick from './Joystick';
import confetti from 'canvas-confetti';

function GameCanvas({ gameState, roomCode, mySlot }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [flashActive, setFlashActive] = useState(false);
  const [captureOverlay, setCaptureOverlay] = useState(null); // { type, color, name, targetScore }
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(0); // animated count-up value shown in the overlay
  const lastMoveSentRef = useRef(0);

  const rafRef = useRef(null);
  const scoreRafRef = useRef(null);
  const startTimeRef = useRef(performance.now());
  const particlesRef = useRef([]); // { x, y, vx, vy, life, maxLife }
  const gameStateRef = useRef(gameState);
  const mySlotRef = useRef(mySlot);
  const faceImagesRef = useRef({}); // cache: character -> HTMLImageElement
  gameStateRef.current = gameState;
  mySlotRef.current = mySlot;

  const SLOT_THEMES = {
    BLUE: { color: '#3a86ff', label: 'B' },
    PURPLE: { color: '#8338ec', label: 'P' },
    PINK: { color: '#ff006e', label: 'P' },
    ORANGE: { color: '#fb5607', label: 'O' }
  };

  // 3D Perspective Matrix Translation Function
  const project = useCallback((nx, ny, width, height) => {
    const zFactor = 0.7 + (1.0 - ny) * 0.9;
    const centerX = width / 2;
    return {
      x: centerX + ((nx - 0.5) * width) / zFactor,
      y: height * (0.15 + ny * 0.8),
      scale: 1.1 / zFactor
    };
  }, []);

  const spawnParticleRing = useCallback((cx, cy, zFactor) => {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = (2.4 + Math.random() * 1.6) * (1.1 / zFactor);
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

  // ---- Rear camera activation ----
  useEffect(() => {
    let cameraStream = null;
    async function activateCamera() {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', aspectRatio: 1.3333 },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = cameraStream;
      } catch (err) {
        console.error('Camera channel blocked:', err);
      }
    }
    activateCamera();
    return () => {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ---- Preload player face images (falls back to initial-letter avatar if none supplied) ----
  useEffect(() => {
    const players = Object.values(gameState.players || {});
    players.forEach((p) => {
      if (p.faceUrl && !faceImagesRef.current[p.character]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = p.faceUrl;
        faceImagesRef.current[p.character] = img; // stored even before load completes; drawImage checks .complete
      }
    });
  }, [gameState.players]);

  useEffect(() => {
    const handleFlash = (data) => {
      if (data.playerId === socket.id) {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.85 } });
      }
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 400);
    };

    const handleTackle = (data) => {
      const canvas = canvasRef.current;
      if (canvas && typeof data.x === 'number' && typeof data.y === 'number') {
        const width = canvas.width;
        const height = canvas.height;
        const zFactor = 0.7 + (1.0 - data.y) * 0.9;
        const cx = (width / 2) + ((data.x - 0.5) * width) / zFactor;
        const cy = height * (0.15 + data.y * 0.8);
        spawnParticleRing(cx, cy, zFactor);
      }
      const involvesMe = data.attackerId === socket.id || data.victimId === socket.id;
      if (involvesMe && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 15]);
      }
    };

    // Spotlight "first catch" card — score is the player's REAL running total from the
    // authoritative server tick, not a static fallback number. We animate a count-up
    // from the player's pre-catch score to their new post-catch score.
    const handleVeggieCaught = (data) => {
      const players = gameStateRef.current?.players || {};
      const player = players[data.playerId] || Object.values(players).find(p => p.character === data.playerColor);
      const newTotal = typeof data.newScore === 'number'
        ? data.newScore
        : (player?.score || 0) + (data.points || 0);
      const startFrom = typeof data.newScore === 'number'
        ? newTotal - (data.points || 0)
        : (player?.score || 0);

      setCaptureOverlay({
        type: data.veggieType === 'carrot' ? 'CARROTATOR' : 'TOMATOR',
        color: data.playerColor || player?.character && SLOT_THEMES[player.character]?.color || '#fb5607',
        name: data.playerName || player?.name || 'Player',
        targetScore: newTotal
      });
      setDisplayScore(startFrom);

      requestAnimationFrame(() => setOverlayVisible(true));

      // Animate count-up over ~600ms
      const animStart = performance.now();
      const animDuration = 600;
      const from = startFrom;
      const to = newTotal;
      if (scoreRafRef.current) cancelAnimationFrame(scoreRafRef.current);
      const stepScore = (now) => {
        const progress = Math.min(1, (now - animStart) / animDuration);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplayScore(Math.round(from + (to - from) * eased));
        if (progress < 1) {
          scoreRafRef.current = requestAnimationFrame(stepScore);
        }
      };
      scoreRafRef.current = requestAnimationFrame(stepScore);

      setTimeout(() => setOverlayVisible(false), 1700);
      setTimeout(() => setCaptureOverlay(null), 2200);
    };

    socket.on('high-score-flash', handleFlash);
    socket.on('point-steal', handleTackle);
    socket.on('veggieCaught', handleVeggieCaught);
    return () => {
      socket.off('high-score-flash', handleFlash);
      socket.off('point-steal', handleTackle);
      socket.off('veggieCaught', handleVeggieCaught);
      if (scoreRafRef.current) cancelAnimationFrame(scoreRafRef.current);
    };
  }, [spawnParticleRing]);

  const handleJoystickMove = useCallback(
    (dx, dy) => {
      const now = Date.now();
      if (now - lastMoveSentRef.current < 45) return;
      lastMoveSentRef.current = now;

      const localPlayerObject = Object.values(gameState.players || {}).find(p => p.character === mySlot);
      if (localPlayerObject && localPlayerObject.overheated) return;

      socket.emit('move', { x: dx, y: dy });
    },
    [mySlot, gameState.players]
  );

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

    const drawEyes = (cx, eyeY, spacing, eyeR, depthScale, panic) => {
      [-spacing, spacing].forEach(ex => {
        ctx.beginPath();
        ctx.arc(cx + ex * depthScale, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 * depthScale;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + ex * depthScale + (panic ? 1.5 : 0), eyeY, eyeR * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
      });
    };

    // Bracket-corner lock-on frame — four independent corner brackets instead of a closed box
    const drawBracketLockOn = (boxW, boxH, depthScale) => {
      const armLen = boxW * 0.28;
      const hw = boxW / 2;
      const hh = boxH / 2;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5 * depthScale;
      ctx.lineCap = 'round';
      const corners = [
        [-hw, -hh, 1, 1],   // top-left
        [hw, -hh, -1, 1],   // top-right
        [-hw, hh, 1, -1],   // bottom-left
        [hw, hh, -1, -1]    // bottom-right
      ];
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + armLen * dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + armLen * dx, cy);
        ctx.stroke();
      });
    };

    const tick = () => {
      const state = gameStateRef.current || {};
      const localMySlot = mySlotRef.current;
      const { width, height } = canvas;
      const t = (performance.now() - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, width, height);

      // ---- 1. Perspective Grid Mesh ----
      const glitch = !!state.cockroachHack;
      ctx.lineWidth = 1.5;
      if (glitch) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 10);
        const r = Math.round(48 + pulse * 160);
        ctx.strokeStyle = `rgb(${r}, 16, 20)`;
      } else {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
      }

      const verticalTracks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
      verticalTracks.forEach(nx => {
        const top = project(nx, 0, width, height);
        const bottom = project(nx, 1.0, width, height);
        ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke();
      });

      const horizontalTracks = [0, 0.15, 0.35, 0.55, 0.75, 0.95, 1.0];
      horizontalTracks.forEach(ny => {
        const left = project(0, ny, width, height);
        const right = project(1.0, ny, width, height);
        ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
      });

      // ---- 2. Radar sweep beam — sweeps top to bottom, lightweight single gradient bar ----
      if (!glitch) {
        const sweepCycle = 2.6; // seconds per full sweep
        const sweepProgress = (t % sweepCycle) / sweepCycle;
        const sweepY = sweepProgress * height;
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY + 40);
        sweepGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.28)');
        sweepGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 40, width, 80);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, sweepY);
        ctx.lineTo(width, sweepY);
        ctx.stroke();
      }

      const players = Object.values(state.players || {});

      const proximityAt = (nx, ny) => {
        let closest = 1;
        for (const p of players) {
          const d = Math.hypot(p.x - nx, p.y - ny);
          if (d < closest) closest = d;
        }
        return closest;
      };

      // ---- 3. Vegetables — cartoon features + bracket lock-on ----
      if (!glitch) {
        (state.vegetables || []).forEach((veg, idx) => {
          const proj = project(veg.x, veg.y, width, height);
          const vX = proj.x;
          const vY = proj.y;
          const depthScale = proj.scale;
          const prox = proximityAt(veg.x, veg.y);
          const panic = prox < 0.18;

          // Rotating dashed bracket lock-on (behind veggie)
          const targetBoxW = 85 * depthScale;
          const targetBoxH = 85 * depthScale;
          const rotationSpeed = panic ? 3.5 : 1.2;
          ctx.save();
          ctx.translate(vX, vY);
          ctx.rotate(t * rotationSpeed);
          ctx.setLineDash([]);
          drawBracketLockOn(targetBoxW, targetBoxH, depthScale);
          ctx.restore();

          if (veg.type === 'carrot') {
            const hopSpeed = panic ? 14 : 4;
            const hopHeight = (panic ? 6 : 3) * depthScale;
            const hop = Math.abs(Math.sin(t * hopSpeed + idx)) * hopHeight;
            const shiverX = panic ? (Math.random() - 0.5) * 3 * depthScale : 0;
            const armSwing = Math.sin(t * hopSpeed * 1.5 + idx) * 10 * depthScale;

            const cx = vX + shiverX;
            const cy = vY - hop;

            ctx.strokeStyle = '#ff7a00';
            ctx.lineWidth = 3 * depthScale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 8 * depthScale, cy + 4 * depthScale);
            ctx.lineTo(cx - 8 * depthScale + armSwing, cy + 16 * depthScale);
            ctx.moveTo(cx + 8 * depthScale, cy + 4 * depthScale);
            ctx.lineTo(cx + 8 * depthScale - armSwing, cy + 16 * depthScale);
            ctx.stroke();

            // Leafy tuft
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 2.5 * depthScale;
            [-4, 0, 4].forEach(lx => {
              ctx.beginPath();
              ctx.moveTo(cx + lx * depthScale, cy - 14 * depthScale);
              ctx.lineTo(cx + lx * 1.4 * depthScale, cy - 22 * depthScale);
              ctx.stroke();
            });

            drawTriangle(cx, vY, 14 * depthScale, hop);
            ctx.fillStyle = '#ff7a00';
            ctx.fill();
            ctx.strokeStyle = '#7a3d00';
            ctx.lineWidth = 2.5 * depthScale;
            ctx.stroke();

            drawEyes(cx, cy - 3 * depthScale, 5, 4 * depthScale, depthScale, panic);
          } else if (veg.type === 'tomato') {
            const squishSpeed = panic ? 10 : 3;
            const squish = panic ? 0.35 : 0.1;
            const s = 1 + Math.sin(t * squishSpeed + idx) * squish;
            const armSwing = Math.sin(t * squishSpeed * 1.5 + idx) * 9 * depthScale;
            const armLift = panic ? 6 * depthScale : 0; // arms raise higher when fleeing (boxing-glove pose)

            // Arms with rounded "glove" tips
            ctx.strokeStyle = '#dd2c00';
            ctx.lineWidth = 3 * depthScale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(vX - 12 * depthScale, vY + 2 * depthScale - armLift);
            ctx.lineTo(vX - 12 * depthScale + armSwing, vY + 14 * depthScale - armLift);
            ctx.moveTo(vX + 12 * depthScale, vY + 2 * depthScale - armLift);
            ctx.lineTo(vX + 12 * depthScale - armSwing, vY + 14 * depthScale - armLift);
            ctx.stroke();
            // Glove tips
            ctx.fillStyle = '#b71c1c';
            [-1, 1].forEach(side => {
              ctx.beginPath();
              ctx.arc(
                vX + side * 12 * depthScale - side * armSwing,
                vY + 14 * depthScale - armLift,
                3.5 * depthScale, 0, Math.PI * 2
              );
              ctx.fill();
            });

            // Leafy tuft on top
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 2.5 * depthScale;
            [-4, 0, 4].forEach(lx => {
              ctx.beginPath();
              ctx.moveTo(vX + lx * depthScale, vY - 13 * depthScale);
              ctx.lineTo(vX + lx * 1.4 * depthScale, vY - 21 * depthScale);
              ctx.stroke();
            });

            // Body
            ctx.save();
            ctx.translate(vX, vY);
            ctx.scale(depthScale / s, depthScale * s);
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#dd2c00';
            ctx.fill();
            ctx.strokeStyle = '#7a0000';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();

            // Open mouth with two teeth (only while panicked/fleeing)
            if (panic) {
              const mouthY = vY + 5 * depthScale;
              ctx.beginPath();
              ctx.ellipse(vX, mouthY, 6 * depthScale, 4 * depthScale, 0, 0, Math.PI * 2);
              ctx.fillStyle = '#4a0000';
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(vX - 3 * depthScale, mouthY - 3 * depthScale, 2 * depthScale, 3 * depthScale);
              ctx.fillRect(vX + 1 * depthScale, mouthY - 3 * depthScale, 2 * depthScale, 3 * depthScale);
            }

            drawEyes(vX, vY - 4 * depthScale, 6, 4.5 * depthScale, depthScale, panic);
          } else {
            const breathe = 0.5 + 0.5 * Math.sin(t * 2.2 + idx);
            for (let ring = 0; ring < 3; ring++) {
              const ringRadius = (15 + ring * 6 + breathe * 8) * depthScale;
              ctx.beginPath();
              ctx.arc(vX, vY, ringRadius, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(255, 202, 40, ${0.35 - ring * 0.1})`;
              ctx.lineWidth = 2 * depthScale;
              ctx.stroke();
            }
            ctx.beginPath();
            ctx.arc(vX, vY, 15 * depthScale, 0, Math.PI * 2);
            ctx.fillStyle = '#ffca28';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5 * depthScale;
            ctx.stroke();
          }
        });
      }

      // ---- 4. Player Avatars — circular face-plate frames ----
      players.forEach((p) => {
        const proj = project(p.x, p.y, width, height);
        const slotConfig = SLOT_THEMES[p.character] || { color: '#ffffff', label: '?' };
        const isMe = p.character === localMySlot;

        const dynRadius = 22 * proj.scale;
        const dynBarW = 34 * proj.scale;
        const dynBarH = 4 * proj.scale;

        const faceImg = faceImagesRef.current[p.character];
        const hasFace = faceImg && faceImg.complete && faceImg.naturalWidth > 0;

        if (hasFace) {
          // Circular clipped face-plate
          ctx.save();
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, dynRadius, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(faceImg, proj.x - dynRadius, proj.y - dynRadius, dynRadius * 2, dynRadius * 2);
          ctx.restore();
        } else {
          // Fallback: colored plate with initial letter
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, dynRadius, 0, Math.PI * 2);
          ctx.fillStyle = p.overheated ? '#1c1c24' : slotConfig.color;
          ctx.fill();
          ctx.closePath();

          ctx.fillStyle = p.overheated ? '#ff3333' : '#000000';
          ctx.font = `bold ${Math.round(16 * proj.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.overheated ? '!' : slotConfig.label, proj.x, proj.y + (1 * proj.scale));
        }

        // Ring frame around the face-plate (color-coded, gold if it's you)
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, dynRadius, 0, Math.PI * 2);
        ctx.strokeStyle = p.overheated ? '#ff3333' : isMe ? '#ffc83c' : '#ffffff';
        ctx.lineWidth = (p.overheated ? 3 : isMe ? 3 : 1.5) * proj.scale;
        ctx.stroke();

        if (p.overheated && hasFace) {
          ctx.fillStyle = '#ff3333';
          ctx.font = `bold ${Math.round(16 * proj.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('!', proj.x, proj.y + (1 * proj.scale));
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(11 * proj.scale)}px monospace`;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
        ctx.fillText(p.name, proj.x, proj.y - (30 * proj.scale));

        ctx.fillStyle = '#08080a';
        ctx.fillRect(proj.x - dynBarW / 2, proj.y + (28 * proj.scale), dynBarW, dynBarH);
        ctx.fillStyle = p.overheated ? '#ff3333' : '#ffca28';
        ctx.fillRect(proj.x - dynBarW / 2, proj.y + (28 * proj.scale), dynBarW * ((p.heat || 0) / 100), dynBarH);
      });

      // ---- 5. Floating scoreboard indicators inside the canvas viewport ----
      const scoreboardX = 14;
      let scoreboardY = 14;
      const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
      sortedPlayers.forEach((p) => {
        const theme = SLOT_THEMES[p.character] || { color: '#ffffff' };
        ctx.fillStyle = 'rgba(8, 8, 10, 0.55)';
        ctx.fillRect(scoreboardX, scoreboardY, 118, 22);
        ctx.fillStyle = theme.color;
        ctx.beginPath();
        ctx.arc(scoreboardX + 12, scoreboardY + 11, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText((p.name || '').slice(0, 8), scoreboardX + 22, scoreboardY + 11);
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(String(p.score || 0), scoreboardX + 112, scoreboardY + 11);
        scoreboardY += 26;
      });

      // ---- 6. Particle ring explosions ----
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
  }, [project]);

  return (
    <div
      className="canvas-container"
      style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '10px', perspective: '600px' }}
    >
      {/*
        Live rear-camera background, warped toward a horizon using a cheap
        GPU-composited CSS 3D transform instead of per-frame canvas pixel-slicing.
        Per-frame drawImage slicing (40-60+ calls/frame) is measurably heavier on
        mobile GPUs than a single transformed layer — this gets a very similar
        "stretch toward the horizon" look for near-zero extra render cost.
      */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-10%',
          width: '120%',
          height: '130%',
          objectFit: 'cover',
          zIndex: 0,
          transform: 'rotateX(18deg) scale(1.08)',
          transformOrigin: 'center 30%'
        }}
      />

      {gameState.cockroachHack && (
        <div
          className="hack-alert-banner"
          style={{
            position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, background: 'rgba(220,38,38,0.9)', color: 'white', padding: '6px 16px',
            borderRadius: '6px', fontWeight: 'black', fontSize: '12px'
          }}
        >
          🚨 SYSTEM DATA CORRUPTION: RADAR DATA BLINDED! ⚡
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{
          width: '100%', height: 'auto', display: 'block', position: 'relative',
          backgroundColor: 'transparent', zIndex: 10
        }}
        className={`battle-canvas ${flashActive ? 'flash-gold' : ''} ${
          gameState.cockroachHack ? 'canvas-glitch' : ''
        }`}
      />

      {captureOverlay && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 30,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.85) 72%)',
            backdropFilter: overlayVisible ? 'blur(6px)' : 'blur(0px)',
            WebkitBackdropFilter: overlayVisible ? 'blur(6px)' : 'blur(0px)',
            opacity: overlayVisible ? 1 : 0,
            transition: 'opacity 0.45s ease, backdrop-filter 0.45s ease',
            pointerEvents: 'none'
          }}
        >
          <div
            style={{
              width: '185px', height: '185px', borderRadius: '50%', backgroundColor: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 65px white'
            }}
          >
            <span style={{ fontSize: '72px' }}>{captureOverlay.type === 'TOMATOR' ? '🍅' : '🥕'}</span>
          </div>

          <h2
            style={{
              fontSize: '38px', fontWeight: '950', marginTop: '20px', color: '#ef4444',
              WebkitTextStroke: '2px #facc15', textShadow: '2px 2px 0px #000',
              fontFamily: 'Impact, sans-serif', letterSpacing: '2px'
            }}
          >
            {captureOverlay.type}
          </h2>

          {/* Dynamic, real-time animated score readout — counts up from pre-catch to post-catch total */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px',
              background: 'rgba(0,0,0,0.5)', padding: '6px 18px', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '50%', backgroundColor: captureOverlay.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                fontWeight: 'bold', fontSize: '12px'
              }}
            >
              {captureOverlay.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#facc15', fontWeight: 'bold', fontSize: '22px', fontFamily: 'monospace' }}>
              {displayScore.toString().padStart(4, '0')}
            </span>
          </div>
        </div>
      )}

      <div
        style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 40 }}
      >
        <Joystick onMove={handleJoystickMove} />
      </div>
    </div>
  );
}

export default GameCanvas;
