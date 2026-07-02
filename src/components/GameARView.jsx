import React, { useRef, useEffect, useState, useCallback } from 'react';
import { socket } from '../socket';
import confetti from 'canvas-confetti';

const CAPTURE_META = {
  carrot: { label: 'CARROTATOR', emoji: '🥕' },
  tomato: { label: 'TOMATOR', emoji: '🍅' },
  broccoli: { label: 'BROCCOLATOR', emoji: '🥦' },
  golden: { label: 'GOLDATOR', emoji: '⭐' }
};

const SLOT_THEMES = {
  BLUE: { color: '#3a86ff', label: 'B' },
  PURPLE: { color: '#8338ec', label: 'P' },
  PINK: { color: '#ff006e', label: 'P' },
  ORANGE: { color: '#fb5607', label: 'O' }
};

// Assumed horizontal field of view of a rear phone camera. Varies by device —
// this is a reasonable default, not a per-device calibration.
const FOV_DEG = 65;
const VEG_PANIC_RADIUS_M = 40;
const CATCH_RADIUS_METERS = 20;
const MAX_VIEW_DISTANCE_M = 120; // objects beyond this aren't drawn even if bearing lines up

const EARTH_RADIUS_M = 6371000;
function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }

function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function bearingDegrees(lat1, lng1, lat2, lng2) {
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function normalizeRelAngle(deg) {
  return ((deg + 540) % 360) - 180;
}

function project(nx, ny, width, height) {
  const zFactor = 0.7 + (1.0 - ny) * 0.9;
  const centerX = width / 2;
  return {
    x: centerX + ((nx - 0.5) * width) / zFactor,
    y: height * (0.15 + ny * 0.8),
    scale: 1.1 / zFactor
  };
}

function GameARView({ gameState, roomCode, mySlot, geofence }) {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const [permissionStage, setPermissionStage] = useState('idle');
  const [permissionError, setPermissionError] = useState('');
  const [flashActive, setFlashActive] = useState(false);
  const [captureOverlay, setCaptureOverlay] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [nearestCatchable, setNearestCatchable] = useState(null);
  const [captureToast, setCaptureToast] = useState('');
  const [leavingPlayArea, setLeavingPlayArea] = useState(false);

  const rafRef = useRef(null);
  const scoreRafRef = useRef(null);
  const startTimeRef = useRef(performance.now());
  const particlesRef = useRef([]);
  const gameStateRef = useRef(gameState);
  const mySlotRef = useRef(mySlot);
  const geofenceRef = useRef(geofence);
  const myLocationRef = useRef(null);
  const headingRef = useRef(0);
  const nearestCatchableRef = useRef(null);
  const watchIdRef = useRef(null);
  const streamRef = useRef(null);

  gameStateRef.current = gameState;
  mySlotRef.current = mySlot;
  geofenceRef.current = geofence;

  const spawnParticleRing = useCallback((cx, cy, zFactor) => {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = (2.4 + Math.random() * 1.6) * (1.1 / zFactor);
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1
      });
    }
  }, []);

  const startCompass = useCallback(() => {
    const handleOrientation = (event) => {
      if (typeof event.webkitCompassHeading === 'number') {
        headingRef.current = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        headingRef.current = (360 - event.alpha) % 360;
      }
    };

    if ('ondeviceorientationabsolute' in window) {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      return () => window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    }
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  const startGeolocation = useCallback(() => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        myLocationRef.current = { lat, lng };
        socket.emit('location-update', { lat, lng });
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  const requestPermissions = useCallback(async () => {
    setPermissionStage('requesting');
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          throw new Error('Compass permission was denied.');
        }
      }

      if (!navigator.geolocation) {
        throw new Error('This device does not support location services.');
      }

      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            myLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            resolve();
          },
          (err) => reject(new Error('Location permission denied or unavailable: ' + err.message)),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      startCompass();
      startGeolocation();
      setPermissionStage('ready');
    } catch (err) {
      setPermissionError(err.message || 'Permission was denied.');
      setPermissionStage('denied');
    }
  }, [startCompass, startGeolocation]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scoreRafRef.current) cancelAnimationFrame(scoreRafRef.current);
    };
  }, []);

  useEffect(() => {
    const handleFlash = (data) => {
      if (data.playerId === socket.id) {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.85 } });
      }
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 400);
    };

    const handleTackle = (data) => {
      const involvesMe = data.attackerId === socket.id || data.victimId === socket.id;
      const myLoc = myLocationRef.current;
      const canvas = canvasRef.current;

      if (canvas && myLoc && typeof data.lat === 'number' && typeof data.lng === 'number') {
        const dist = distanceMeters(myLoc.lat, myLoc.lng, data.lat, data.lng);
        if (dist <= MAX_VIEW_DISTANCE_M) {
          const bearing = bearingDegrees(myLoc.lat, myLoc.lng, data.lat, data.lng);
          const relAngle = normalizeRelAngle(bearing - headingRef.current);
          if (Math.abs(relAngle) <= FOV_DEG / 2) {
            const nx = 0.5 + (relAngle / (FOV_DEG / 2)) * 0.5;
            const ny = Math.max(0.02, Math.min(1, 1 - dist / MAX_VIEW_DISTANCE_M));
            const proj = project(nx, ny, canvas.width, canvas.height);
            spawnParticleRing(proj.x, proj.y, 1.1 / proj.scale);
          }
        }
      }

      if (involvesMe) {
        if ('vibrate' in navigator) navigator.vibrate([40, 30, 15]);
        setCaptureToast(data.victimId === socket.id ? 'POINTS STOLEN!' : 'STOLE A POINT!');
        setTimeout(() => setCaptureToast(''), 1200);
      }
    };

    const handleVeggieCaught = (data) => {
      const players = gameStateRef.current?.players || {};
      const player = players[data.playerId] || Object.values(players).find(p => p.character === data.playerColor);
      const newTotal = typeof data.newScore === 'number' ? data.newScore : (player?.score || 0) + (data.points || 0);
      const startFrom = typeof data.newScore === 'number' ? newTotal - (data.points || 0) : (player?.score || 0);

      setCaptureOverlay({
        veggieType: data.veggieType || 'carrot',
        color: data.playerColor || (player?.character && SLOT_THEMES[player.character]?.color) || '#fb5607',
        name: data.playerName || player?.name || 'Player'
      });
      setDisplayScore(startFrom);
      requestAnimationFrame(() => setOverlayVisible(true));

      const animStart = performance.now();
      const animDuration = 600;
      if (scoreRafRef.current) cancelAnimationFrame(scoreRafRef.current);
      const stepScore = (now) => {
        const progress = Math.min(1, (now - animStart) / animDuration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(Math.round(startFrom + (newTotal - startFrom) * eased));
        if (progress < 1) scoreRafRef.current = requestAnimationFrame(stepScore);
      };
      scoreRafRef.current = requestAnimationFrame(stepScore);

      setTimeout(() => setOverlayVisible(false), 1700);
      setTimeout(() => setCaptureOverlay(null), 2200);
    };

    const handleCaptureFailed = (data) => {
      setCaptureToast(`Get closer! ${data.distanceMeters}m away (need ${data.requiredMeters}m)`);
      setTimeout(() => setCaptureToast(''), 1500);
    };

    socket.on('high-score-flash', handleFlash);
    socket.on('point-steal', handleTackle);
    socket.on('veggieCaught', handleVeggieCaught);
    socket.on('capture-failed', handleCaptureFailed);
    return () => {
      socket.off('high-score-flash', handleFlash);
      socket.off('point-steal', handleTackle);
      socket.off('veggieCaught', handleVeggieCaught);
      socket.off('capture-failed', handleCaptureFailed);
    };
  }, [spawnParticleRing]);

  const handleCapture = useCallback(() => {
    if (!nearestCatchableRef.current) return;
    socket.emit('capture-attempt', { vegId: nearestCatchableRef.current.id });
  }, []);

  useEffect(() => {
    if (permissionStage !== 'ready') return;
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

    // Always-on big cartoon eyes with a natural periodic blink — every
    // veggie is cute all the time, panic just makes the pupils jitter and
    // the blink speed up.
    const drawEyes = (cx, eyeY, spacing, eyeR, depthScale, panic, t, idx) => {
      const blinkCycle = panic ? 1.1 : 3.4;
      const cyclePos = ((t + idx * 0.7) % blinkCycle) / blinkCycle;
      const blinkAmount = cyclePos > 0.94 ? (1 - (cyclePos - 0.94) / 0.06) : 0; // 0=open,1=closed
      const openness = 1 - Math.min(1, blinkAmount * 1.4);

      [-spacing, spacing].forEach(ex => {
        const eyeCx = cx + ex * depthScale;
        if (openness < 0.15) {
          ctx.beginPath();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.6 * depthScale;
          ctx.lineCap = 'round';
          ctx.moveTo(eyeCx - eyeR * 0.8, eyeY);
          ctx.quadraticCurveTo(eyeCx, eyeY + eyeR * 0.6, eyeCx + eyeR * 0.8, eyeY);
          ctx.stroke();
          return;
        }
        const ry = eyeR * Math.max(0.18, openness);
        ctx.beginPath();
        ctx.ellipse(eyeCx, eyeY, eyeR, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1 * depthScale;
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(eyeCx + (panic ? 1.5 : 0), eyeY, eyeR * 0.45, ry * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeCx - eyeR * 0.2, eyeY - ry * 0.3, eyeR * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });
    };

    // Spiky "hair"/leaf crown like the reference mascot art — a fan of
    // tapered triangles poking up from the top of the head.
    const drawHairSpikes = (cx, topY, spread, depthScale, color, count = 5) => {
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1 * depthScale;
      for (let k = 0; k < count; k++) {
        const frac = count === 1 ? 0.5 : k / (count - 1);
        const sx = cx + (frac - 0.5) * spread * depthScale;
        const leanBias = (frac - 0.5) * 6 * depthScale;
        const spikeLen = (13 - Math.abs(frac - 0.5) * 6) * depthScale;
        const spikeW = 4 * depthScale;
        ctx.beginPath();
        ctx.moveTo(sx - spikeW, topY);
        ctx.lineTo(sx + leanBias, topY - spikeLen);
        ctx.lineTo(sx + spikeW, topY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    };

    // A round mitten hand — used for arms so the veggies look like they're
    // waving "hi" rather than just having bare stick-arms.
    const drawMitten = (x, y, r, color) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = r * 0.25;
      ctx.stroke();
    };

    // A cute "Hii!" speech bubble that pops up above a friendly (non-panicked)
    // veggie every few seconds, greeting whoever's nearby.
    const drawSpeechBubble = (cx, topY, depthScale, t, idx) => {
      const cycle = 5.5;
      const phase = (t + idx * 1.9) % cycle;
      if (phase > 1.6) return;
      const show = phase < 0.25 ? phase / 0.25 : (phase > 1.35 ? (1.6 - phase) / 0.25 : 1);
      const alpha = Math.max(0, Math.min(1, show));
      const w = 34 * depthScale;
      const h = 18 * depthScale;
      const bx = cx;
      const by = topY - 8 * depthScale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.2 * depthScale;
      const r = 6 * depthScale;
      ctx.beginPath();
      ctx.moveTo(bx - w / 2 + r, by - h);
      ctx.lineTo(bx + w / 2 - r, by - h);
      ctx.quadraticCurveTo(bx + w / 2, by - h, bx + w / 2, by - h + r);
      ctx.lineTo(bx + w / 2, by - r);
      ctx.quadraticCurveTo(bx + w / 2, by, bx + w / 2 - r, by);
      ctx.lineTo(bx + 4 * depthScale, by);
      ctx.lineTo(bx, by + 6 * depthScale);
      ctx.lineTo(bx - 2 * depthScale, by);
      ctx.lineTo(bx - w / 2 + r, by);
      ctx.quadraticCurveTo(bx - w / 2, by, bx - w / 2, by - r);
      ctx.lineTo(bx - w / 2, by - h + r);
      ctx.quadraticCurveTo(bx - w / 2, by - h, bx - w / 2 + r, by - h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff006e';
      ctx.font = `bold ${Math.round(11 * depthScale)}px "Fredoka", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Hii!', bx, by - h / 2);
      ctx.restore();
    };

    // Permanent open, toothy grin — always visible now, just widens when panicked.
    const drawSmile = (cx, cy, width, depthScale, panic) => {
      const w = width * depthScale;
      const h = (panic ? 0.85 : 0.55) * w;
      ctx.beginPath();
      ctx.moveTo(cx - w, cy);
      ctx.quadraticCurveTo(cx, cy + h, cx + w, cy);
      ctx.quadraticCurveTo(cx, cy + h * 0.35, cx - w, cy);
      ctx.closePath();
      ctx.fillStyle = '#4a0000';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      const toothCount = 5;
      for (let k = 0; k < toothCount; k++) {
        const tx = cx - w + (w * 2 * (k + 0.5)) / toothCount;
        ctx.fillRect(tx - w * 0.09, cy, w * 0.16, h * 0.35);
      }
    };

    // Two marching "in place" legs — sells a walking/alive feel even though
    // the character's screen position is anchored by real GPS bearing, not
    // by simulated horizontal movement.
    const drawLegs = (cx, baseY, spacing, depthScale, walkSpeed, idx, panic, t) => {
      const legLen = 11 * depthScale;
      const legW = 4.5 * depthScale;
      [-1, 1].forEach((side) => {
        const phase = t * walkSpeed + idx + (side === 1 ? Math.PI : 0);
        const lift = Math.max(0, Math.sin(phase)) * (panic ? 7 : 3) * depthScale;
        const legX = cx + side * spacing * depthScale;
        const footY = baseY + legLen - lift;

        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = legW;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(legX, baseY);
        ctx.lineTo(legX + side * 3 * depthScale, footY);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(legX + side * 3 * depthScale, footY, legW * 0.9, legW * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fill();
      });
    };

    const drawBracketLockOn = (boxW, boxH, depthScale) => {
      const armLen = boxW * 0.28;
      const hw = boxW / 2;
      const hh = boxH / 2;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2.5 * depthScale;
      ctx.lineCap = 'round';
      const corners = [
        [-hw, -hh, 1, 1], [hw, -hh, -1, 1], [-hw, hh, 1, -1], [hw, hh, -1, -1]
      ];
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + armLen * dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + armLen * dx, cy);
        ctx.stroke();
      });
    };

    const drawEdgeIndicator = (relAngle, distance, color, width, height) => {
      const side = relAngle < 0 ? 'left' : 'right';
      const x = side === 'left' ? 24 : width - 24;
      const y = height * 0.4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(side === 'left' ? -Math.PI / 2 : Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(-9, 8);
      ctx.lineTo(9, 8);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(distance)}m`, x, y + (side === 'left' ? 26 : 26));
    };

    const tick = () => {
      const state = gameStateRef.current || {};
      const localMySlot = mySlotRef.current;
      const myLoc = myLocationRef.current;
      const heading = headingRef.current;
      const { width, height } = canvas;
      const t = (performance.now() - startTimeRef.current) / 1000;

      ctx.clearRect(0, 0, width, height);

      const glitch = !!state.systemGlitch;

      if (!glitch) {
        const sweepCycle = 2.6;
        const sweepProgress = (t % sweepCycle) / sweepCycle;
        const sweepY = sweepProgress * height;
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY + 40);
        sweepGrad.addColorStop(0, 'rgba(255, 215, 0, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.18)');
        sweepGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 40, width, 80);
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(t * 10);
        const r = Math.round(48 + pulse * 160);
        ctx.fillStyle = `rgba(${r}, 16, 20, 0.12)`;
        ctx.fillRect(0, 0, width, height);
      }

      let newNearest = null;

      const huntersNear = {};
      if (myLoc) {
        (state.vegetables || []).forEach((veg) => {
          let count = 0;
          Object.values(state.players || {}).forEach((p) => {
            if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
            if (distanceMeters(p.lat, p.lng, veg.lat, veg.lng) < VEG_PANIC_RADIUS_M) count++;
          });
          huntersNear[veg.id] = count;
        });
      }

      if (myLoc) {
        if (!glitch) {
          (state.vegetables || []).forEach((veg, idx) => {
            const dist = distanceMeters(myLoc.lat, myLoc.lng, veg.lat, veg.lng);
            if (dist > MAX_VIEW_DISTANCE_M) return;

            if (dist <= CATCH_RADIUS_METERS && (!newNearest || dist < newNearest.distance)) {
              newNearest = { id: veg.id, distance: dist };
            }

            const bearing = bearingDegrees(myLoc.lat, myLoc.lng, veg.lat, veg.lng);
            const relAngle = normalizeRelAngle(bearing - heading);
            const panic = dist < VEG_PANIC_RADIUS_M;

            if (Math.abs(relAngle) > FOV_DEG / 2) {
              drawEdgeIndicator(relAngle, dist, '#FFD700', width, height);
              return;
            }

            const nx = 0.5 + (relAngle / (FOV_DEG / 2)) * 0.5;
            const ny = Math.max(0.02, Math.min(1, 1 - dist / MAX_VIEW_DISTANCE_M));
            const proj = project(nx, ny, width, height);
            const vX = proj.x;
            const vY = proj.y;
            const depthScale = proj.scale;

            const targetBoxW = 85 * depthScale;
            const targetBoxH = 85 * depthScale;
            const rotationSpeed = panic ? 3.5 : 1.2;
            ctx.save();
            ctx.translate(vX, vY);
            ctx.rotate(t * rotationSpeed);
            drawBracketLockOn(targetBoxW, targetBoxH, depthScale);
            ctx.restore();

            if (veg.type === 'carrot') {
              const hopSpeed = panic ? 14 : 4;
              const hopHeight = (panic ? 6 : 3) * depthScale;
              const hop = Math.abs(Math.sin(t * hopSpeed + idx)) * hopHeight;
              const shiverX = panic ? (Math.random() - 0.5) * 3 * depthScale : 0;
              const waveAngle = panic
                ? Math.sin(t * hopSpeed * 1.5 + idx) * 10 * depthScale
                : Math.sin(t * 2.2 + idx) * 6 * depthScale;
              const armLift = panic ? 2 * depthScale : 10 * depthScale;
              const cx = vX + shiverX;
              const cy = vY - hop;

              drawLegs(cx, vY + 12 * depthScale, 6, depthScale, hopSpeed, idx, panic, t);

              ctx.strokeStyle = '#ff7a00';
              ctx.lineWidth = 3 * depthScale;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cx - 8 * depthScale, cy + 2 * depthScale);
              ctx.lineTo(cx - 12 * depthScale + waveAngle, cy - armLift);
              ctx.moveTo(cx + 8 * depthScale, cy + 2 * depthScale);
              ctx.lineTo(cx + 12 * depthScale - waveAngle, cy - armLift);
              ctx.stroke();
              drawMitten(cx - 12 * depthScale + waveAngle, cy - armLift, 3.2 * depthScale, '#ff7a00');
              drawMitten(cx + 12 * depthScale - waveAngle, cy - armLift, 3.2 * depthScale, '#ff7a00');

              drawHairSpikes(cx, cy - 14 * depthScale, 16, depthScale, '#2e7d32');

              drawTriangle(cx, vY, 14 * depthScale, hop);
              ctx.fillStyle = '#ff7a00';
              ctx.fill();
              ctx.strokeStyle = '#7a3d00';
              ctx.lineWidth = 2.5 * depthScale;
              ctx.stroke();

              drawSmile(cx, cy + 4 * depthScale, 6, depthScale, panic);
              drawEyes(cx, cy - 3 * depthScale, 5, 4.5 * depthScale, depthScale, panic, t, idx);
              if (!panic) drawSpeechBubble(cx, cy - 24 * depthScale, depthScale, t, idx);
            } else if (veg.type === 'tomato') {
              const squishSpeed = panic ? 10 : 3;
              const squish = panic ? 0.35 : 0.1;
              const s = 1 + Math.sin(t * squishSpeed + idx) * squish;
              const idleRaise = Math.sin(t * 2.4 + idx) * 3 * depthScale;
              const armSwing = panic ? Math.sin(t * squishSpeed * 1.5 + idx) * 9 * depthScale : 0;
              const armLift = panic ? -4 * depthScale : (14 * depthScale + idleRaise);

              drawLegs(vX, vY + 14 * depthScale, 7, depthScale, squishSpeed, idx, panic, t);

              const handX1 = vX - 14 * depthScale + armSwing;
              const handY1 = vY + 4 * depthScale - armLift;
              const handX2 = vX + 14 * depthScale - armSwing;
              const handY2 = vY + 4 * depthScale - armLift;

              ctx.strokeStyle = '#dd2c00';
              ctx.lineWidth = 3 * depthScale;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(vX - 12 * depthScale, vY + 2 * depthScale);
              ctx.lineTo(handX1, handY1);
              ctx.moveTo(vX + 12 * depthScale, vY + 2 * depthScale);
              ctx.lineTo(handX2, handY2);
              ctx.stroke();
              drawMitten(handX1, handY1, 4 * depthScale, '#dd2c00');
              drawMitten(handX2, handY2, 4 * depthScale, '#dd2c00');

              drawHairSpikes(vX, vY - 15 * depthScale, 20, depthScale, '#4a7c34', 6);

              ctx.save();
              ctx.translate(vX, vY);
              ctx.scale(depthScale / s, depthScale * s);
              ctx.beginPath();
              ctx.arc(0, 0, 15, 0, Math.PI * 2);
              ctx.fillStyle = '#e8391f';
              ctx.fill();
              ctx.strokeStyle = '#7a0000';
              ctx.lineWidth = 2.5;
              ctx.stroke();
              ctx.beginPath();
              ctx.ellipse(-5, -6, 5, 3, -0.5, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(255,255,255,0.35)';
              ctx.fill();
              ctx.restore();

              drawSmile(vX, vY + 5 * depthScale, 6.5, depthScale, panic);
              drawEyes(vX, vY - 4 * depthScale, 6, 5 * depthScale, depthScale, panic, t, idx);
              if (!panic) drawSpeechBubble(vX, vY - 26 * depthScale, depthScale, t, idx);
            } else if (veg.type === 'broccoli') {
              const wobbleSpeed = panic ? 11 : 3.5;
              const wobble = Math.sin(t * wobbleSpeed + idx) * (panic ? 3 : 1) * depthScale;
              const shiverX = panic ? (Math.random() - 0.5) * 2.5 * depthScale : 0;
              const cx = vX + shiverX + wobble;
              const cy = vY;

              drawLegs(cx, cy + 16 * depthScale, 5, depthScale, wobbleSpeed, idx, panic, t);

              const armWave = panic ? 0 : Math.sin(t * 2.2 + idx) * 4 * depthScale;
              ctx.strokeStyle = '#3f8f3f';
              ctx.lineWidth = 2.6 * depthScale;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(cx - 8 * depthScale, cy + 3 * depthScale);
              ctx.lineTo(cx - 13 * depthScale, cy - 4 * depthScale - armWave);
              ctx.moveTo(cx + 8 * depthScale, cy + 3 * depthScale);
              ctx.lineTo(cx + 13 * depthScale, cy - 4 * depthScale - armWave);
              ctx.stroke();
              drawMitten(cx - 13 * depthScale, cy - 4 * depthScale - armWave, 3 * depthScale, '#3f8f3f');
              drawMitten(cx + 13 * depthScale, cy - 4 * depthScale - armWave, 3 * depthScale, '#3f8f3f');

              ctx.fillStyle = '#c9e4b0';
              ctx.fillRect(cx - 5 * depthScale, cy + 4 * depthScale, 10 * depthScale, 12 * depthScale);
              ctx.strokeStyle = '#7a9c5c';
              ctx.lineWidth = 1.5 * depthScale;
              ctx.strokeRect(cx - 5 * depthScale, cy + 4 * depthScale, 10 * depthScale, 12 * depthScale);

              [
                { dx: 0, dy: -4, r: 11 }, { dx: -9, dy: 1, r: 8 }, { dx: 9, dy: 1, r: 8 },
                { dx: -5, dy: -10, r: 7 }, { dx: 5, dy: -10, r: 7 }
              ].forEach(({ dx, dy, r }) => {
                ctx.beginPath();
                ctx.arc(cx + dx * depthScale, cy + dy * depthScale, r * depthScale, 0, Math.PI * 2);
                ctx.fillStyle = '#3f8f3f';
                ctx.fill();
                ctx.strokeStyle = '#245c24';
                ctx.lineWidth = 2 * depthScale;
                ctx.stroke();
              });

              drawSmile(cx, cy - 1 * depthScale, 5, depthScale, panic);
              drawEyes(cx, cy - 3 * depthScale, 5, 4 * depthScale, depthScale, panic, t, idx);
              if (!panic) drawSpeechBubble(cx, cy - 22 * depthScale, depthScale, t, idx);
            } else {
              const breathe = 0.5 + 0.5 * Math.sin(t * 2.2 + idx);
              drawLegs(vX, vY + 15 * depthScale, 5, depthScale, 6, idx, false, t);
              for (let ring = 0; ring < 3; ring++) {
                const ringRadius = (15 + ring * 6 + breathe * 8) * depthScale;
                ctx.beginPath();
                ctx.arc(vX, vY, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 215, 0, ${0.35 - ring * 0.1})`;
                ctx.lineWidth = 2 * depthScale;
                ctx.stroke();
              }
              ctx.beginPath();
              ctx.arc(vX, vY, 15 * depthScale, 0, Math.PI * 2);
              ctx.fillStyle = '#FFD700';
              ctx.fill();
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2.5 * depthScale;
              ctx.stroke();
              drawSmile(vX, vY + 4 * depthScale, 5, depthScale, false);
              drawEyes(vX, vY - 3 * depthScale, 5, 4 * depthScale, depthScale, false, t, idx);
              drawSpeechBubble(vX, vY - 26 * depthScale, depthScale, t, idx);
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(10 * depthScale)}px "Orbitron", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(dist)}m`, vX, vY + 30 * depthScale);

            if (huntersNear[veg.id] >= 2) {
              ctx.fillStyle = '#FFD700';
              ctx.font = `bold ${Math.round(9 * depthScale)}px "Orbitron", monospace`;
              ctx.fillText(`👥 ${huntersNear[veg.id]} HUNTERS CLOSING IN`, vX, vY - 42 * depthScale);
            }
          });
        }

        Object.values(state.players || {}).forEach((p) => {
          if (p.character === localMySlot) return;
          if (typeof p.lat !== 'number' || typeof p.lng !== 'number') return;
          const dist = distanceMeters(myLoc.lat, myLoc.lng, p.lat, p.lng);
          if (dist > MAX_VIEW_DISTANCE_M) return;

          const bearing = bearingDegrees(myLoc.lat, myLoc.lng, p.lat, p.lng);
          const relAngle = normalizeRelAngle(bearing - heading);
          const theme = SLOT_THEMES[p.character] || { color: '#ffffff', label: '?' };

          if (Math.abs(relAngle) > FOV_DEG / 2) {
            drawEdgeIndicator(relAngle, dist, theme.color, width, height);
            return;
          }

          const nx = 0.5 + (relAngle / (FOV_DEG / 2)) * 0.5;
          const ny = Math.max(0.02, Math.min(1, 1 - dist / MAX_VIEW_DISTANCE_M));
          const proj = project(nx, ny, width, height);
          const dynRadius = 18 * proj.scale;

          ctx.beginPath();
          ctx.arc(proj.x, proj.y, dynRadius, 0, Math.PI * 2);
          ctx.fillStyle = theme.color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5 * proj.scale;
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.font = `bold ${Math.round(14 * proj.scale)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(theme.label, proj.x, proj.y + proj.scale);

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.round(10 * proj.scale)}px "Orbitron", monospace`;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(p.name || '', proj.x, proj.y - 24 * proj.scale);
        });
      }

      nearestCatchableRef.current = newNearest;
      if ((newNearest?.id) !== (nearestCatchableRef._lastId)) {
        nearestCatchableRef._lastId = newNearest?.id;
        setNearestCatchable(newNearest);
      }

      const scoreboardX = 14;
      let scoreboardY = 14;
      const sortedPlayers = Object.values(state.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
      sortedPlayers.forEach((p) => {
        const theme = SLOT_THEMES[p.character] || { color: '#ffffff' };
        ctx.fillStyle = 'rgba(8, 8, 10, 0.55)';
        ctx.fillRect(scoreboardX, scoreboardY, 118, 22);
        ctx.fillStyle = theme.color;
        ctx.beginPath();
        ctx.arc(scoreboardX + 12, scoreboardY + 11, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Orbitron", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText((p.name || '').slice(0, 8), scoreboardX + 22, scoreboardY + 11);
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'right';
        ctx.fillText(String(p.score || 0), scoreboardX + 112, scoreboardY + 11);
        scoreboardY += 26;
      });

      if (myLoc && geofenceRef.current) {
        const gf = geofenceRef.current;
        const distFromCenter = distanceMeters(myLoc.lat, myLoc.lng, gf.lat, gf.lng);
        setLeavingPlayArea(distFromCenter > gf.radiusMeters * 0.85);
      }

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        pt.vx *= 0.94; pt.vy *= 0.94;
        pt.life -= 0.035;
        if (pt.life <= 0) { particles.splice(i, 1); continue; }
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
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [permissionStage]);

  if (permissionStage !== 'ready') {
    return (
      <div style={styles.permissionWrapper}>
        <h1 style={styles.permissionTitle}>VEGGIE GO — AR HUNT</h1>
        <p style={styles.permissionText}>
          This mode needs your camera, live location, and compass to place vegetables
          in the real world around you.
        </p>
        {permissionError ? <p style={styles.permissionError}>{permissionError}</p> : null}
        <button
          style={styles.permissionButton}
          onClick={requestPermissions}
          disabled={permissionStage === 'requesting'}
        >
          {permissionStage === 'requesting' ? 'REQUESTING ACCESS…' : 'START AR HUNT'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#08080a' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />

      {gameState.systemGlitch && (
        <div style={styles.glitchBanner}>🚨 SYSTEM DATA CORRUPTION: RADAR DATA BLINDED! ⚡</div>
      )}

      {leavingPlayArea && (
        <div style={styles.geofenceBanner}>⚠️ LEAVING PLAY AREA</div>
      )}

      {captureToast ? <div style={styles.toast}>{captureToast}</div> : null}

      <canvas
        ref={canvasRef}
        width={800}
        height={1200}
        style={{
          width: '100%', height: '100%', display: 'block', position: 'absolute', inset: 0,
          zIndex: 10, filter: flashActive ? 'brightness(1.4)' : 'none'
        }}
      />

      {captureOverlay && (
        <div style={{ ...styles.captureVignette, opacity: overlayVisible ? 1 : 0 }}>
          <div style={styles.captureCircle}>
            <span style={{ fontSize: '72px' }}>{(CAPTURE_META[captureOverlay.veggieType] || CAPTURE_META.carrot).emoji}</span>
          </div>
          <h2 style={styles.captureLabel}>{(CAPTURE_META[captureOverlay.veggieType] || CAPTURE_META.carrot).label}</h2>
          <div style={styles.captureScoreRow}>
            <div style={{ ...styles.captureAvatar, backgroundColor: captureOverlay.color }}>
              {captureOverlay.name.charAt(0).toUpperCase()}
            </div>
            <span style={styles.captureScoreText}>{displayScore.toString().padStart(4, '0')}</span>
          </div>
        </div>
      )}

      <div style={styles.crosshairWrap}>
        <div style={{ ...styles.crosshair, borderColor: nearestCatchable ? '#FFD700' : 'rgba(255,255,255,0.5)' }} />
      </div>

      <button
        style={{ ...styles.captureButton, opacity: nearestCatchable ? 1 : 0.45 }}
        onClick={handleCapture}
        disabled={!nearestCatchable}
      >
        {nearestCatchable ? `CATCH (${Math.round(nearestCatchable.distance)}m)` : 'GET CLOSER'}
      </button>
    </div>
  );
}

const styles = {
  permissionWrapper: {
    minHeight: '100vh', backgroundColor: '#08080a', color: '#F5F0E8',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px', fontFamily: "'Fredoka', sans-serif", textAlign: 'center'
  },
  permissionTitle: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: '30px', color: '#FFD700', letterSpacing: '2px', marginBottom: '16px' },
  permissionText: { fontSize: '14px', color: '#e0c98a', maxWidth: '320px', marginBottom: '24px', lineHeight: 1.5 },
  permissionError: { color: '#ff5c5c', fontSize: '13px', marginBottom: '16px', maxWidth: '320px' },
  permissionButton: {
    background: 'linear-gradient(180deg, #FFD700, #B8860B)', color: '#08080a', fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700, fontSize: '17px', letterSpacing: '1.5px', border: 'none', borderRadius: '10px',
    padding: '14px 36px', cursor: 'pointer'
  },
  glitchBanner: {
    position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
    background: 'rgba(220,38,38,0.9)', color: 'white', padding: '6px 16px', borderRadius: '6px',
    fontWeight: 800, fontFamily: "'Orbitron', sans-serif", fontSize: '11px'
  },
  geofenceBanner: {
    position: 'absolute', top: '56px', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
    background: 'rgba(255,215,0,0.92)', color: '#08080a', padding: '6px 16px', borderRadius: '6px',
    fontWeight: 800, fontFamily: "'Orbitron', sans-serif", fontSize: '11px'
  },
  toast: {
    position: 'absolute', top: '96px', left: '50%', transform: 'translateX(-50%)', zIndex: 25,
    background: 'rgba(8,8,10,0.8)', color: '#FFD700', padding: '8px 18px', borderRadius: '20px',
    fontSize: '12px', fontFamily: "'Orbitron', monospace", border: '1px solid rgba(255,215,0,0.3)'
  },
  crosshairWrap: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 15, pointerEvents: 'none'
  },
  crosshair: { width: '46px', height: '46px', borderRadius: '50%', border: '2px solid', boxSizing: 'border-box' },
  captureButton: {
    position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 40,
    background: 'linear-gradient(180deg, #FFD700, #B8860B)', color: '#08080a', fontFamily: "'Orbitron', sans-serif",
    fontWeight: 700, fontSize: '17px', letterSpacing: '1px', border: 'none', borderRadius: '32px',
    padding: '16px 32px', cursor: 'pointer'
  },
  captureVignette: {
    position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at center, transparent 0%, rgba(8,8,10,0.9) 72%)',
    transition: 'opacity 0.45s ease', pointerEvents: 'none'
  },
  captureCircle: {
    width: '185px', height: '185px', borderRadius: '50%', backgroundColor: '#F5F0E8',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 65px #FFD700'
  },
  captureLabel: {
    fontSize: '32px', fontWeight: 800, marginTop: '20px', color: '#FFD700',
    textShadow: '2px 2px 0px #000', fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px'
  },
  captureScoreRow: {
    display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px',
    background: 'rgba(8,8,10,0.6)', padding: '6px 18px', borderRadius: '20px',
    border: '1px solid rgba(255,215,0,0.25)'
  },
  captureAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px'
  },
  captureScoreText: { color: '#FFD700', fontWeight: 'bold', fontSize: '22px', fontFamily: "'Orbitron', monospace" }
};

export default GameARView;
