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

// Normalize a bearing-minus-heading difference into [-180, 180]
function normalizeRelAngle(deg) {
  return ((deg + 540) % 360) - 180;
}

// Same perspective feel as the old virtual-room canvas, but now nx/ny come from
// real compass-relative bearing and real distance instead of a stored 0-1 grid.
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

  const [permissionStage, setPermissionStage] = useState('idle'); // idle | requesting | ready | denied
  const [permissionError, setPermissionError] = useState('');
  const [flashActive, setFlashActive] = useState(false);
  const [captureOverlay, setCaptureOverlay] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);
  const [nearestCatchable, setNearestCatchable] = useState(null); // { id, distance }
  const [captureToast, setCaptureToast] = useState('');
  const [leavingPlayArea, setLeavingPlayArea] = useState(false);

  const rafRef = useRef(null);
  const scoreRafRef = useRef(null);
  const startTimeRef = useRef(performance.now());
  const particlesRef = useRef([]);
  const gameStateRef = useRef(gameState);
  const mySlotRef = useRef(mySlot);
  const geofenceRef = useRef(geofence);
  const myLocationRef = useRef(null); // { lat, lng }
  const headingRef = useRef(0); // compass degrees, 0 = north
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

  // ---- Compass heading listener ----
  const startCompass = useCallback(() => {
    const handleOrientation = (event) => {
      if (typeof event.webkitCompassHeading === 'number') {
        // iOS Safari: already true-north-corrected
        headingRef.current = event.webkitCompassHeading;
      } else if (typeof event.alpha === 'number') {
        // Android / others: approximate. 'deviceorientationabsolute' gives a
        // true-north-referenced alpha when available; this can still drift
        // without periodic figure-8 calibration on some devices.
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

  // ---- Geolocation watch ----
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

  // ---- Permission gate: camera + geolocation + (iOS) motion/compass ----
  const requestPermissions = useCallback(async () => {
    setPermissionStage('requesting');
    setPermissionError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      if (
        typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result !== 'granted') {
          throw new Error('Compass permission was denied. AR mode needs it to know which way you\'re facing.');
        }
      }

      if (!navigator.geolocation) {
        throw new Error('This device does not support location services.');
      }

      startCompass();
      startGeolocation();
      setPermissionStage('ready');
    } catch (err) {
      setPermissionError(err.message || 'Permission was denied. AR mode needs camera, location, and compass access.');
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

  // ---- Socket event handlers ----
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

  // ---- Render loop ----
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

    const drawBracketLockOn = (boxW, boxH, depthScale) => {
      const armLen = boxW * 0.28;
      const hw = boxW / 2;
      const hh = boxH / 2;
      ctx.strokeStyle = '#facc15';
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
      ctx.font = 'bold 10px monospace';
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

      const glitch = !!state.cockroachHack;

      // Radar sweep tint while active
      if (!glitch) {
        const sweepCycle = 2.6;
        const sweepProgress = (t % sweepCycle) / sweepCycle;
        const sweepY = sweepProgress * height;
        const sweepGrad = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY + 40);
        sweepGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.18)');
        sweepGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = sweepGrad;
        ctx.fillRect(0, sweepY - 40, width, 80);
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(t * 10);
        const r = Math.round(48 + pulse * 160);
        ctx.fillStyle = `rgba(${r}, 16, 20, 0.12)`;
        ctx.fillRect(0, 0, width, height);
      }

      let newNearest = null;

      if (myLoc) {
        // ---- Vegetables ----
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
              drawEdgeIndicator(relAngle, dist, '#facc15', width, height);
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
              const armLift = panic ? 6 * depthScale : 0;

              ctx.strokeStyle = '#dd2c00';
              ctx.lineWidth = 3 * depthScale;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(vX - 12 * depthScale, vY + 2 * depthScale - armLift);
              ctx.lineTo(vX - 12 * depthScale + armSwing, vY + 14 * depthScale - armLift);
              ctx.moveTo(vX + 12 * depthScale, vY + 2 * depthScale - armLift);
              ctx.lineTo(vX + 12 * depthScale - armSwing, vY + 14 * depthScale - armLift);
              ctx.stroke();
              ctx.fillStyle = '#b71c1c';
              [-1, 1].forEach(side => {
                ctx.beginPath();
                ctx.arc(vX + side * 12 * depthScale - side * armSwing, vY + 14 * depthScale - armLift, 3.5 * depthScale, 0, Math.PI * 2);
                ctx.fill();
              });

              ctx.strokeStyle = '#2e7d32';
              ctx.lineWidth = 2.5 * depthScale;
              [-4, 0, 4].forEach(lx => {
                ctx.beginPath();
                ctx.moveTo(vX + lx * depthScale, vY - 13 * depthScale);
                ctx.lineTo(vX + lx * 1.4 * depthScale, vY - 21 * depthScale);
                ctx.stroke();
              });

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
            } else if (veg.type === 'broccoli') {
              const wobbleSpeed = panic ? 11 : 3.5;
              const wobble = Math.sin(t * wobbleSpeed + idx) * (panic ? 3 : 1) * depthScale;
              const shiverX = panic ? (Math.random() - 0.5) * 2.5 * depthScale : 0;
              const cx = vX + shiverX + wobble;
              const cy = vY;

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

              drawEyes(cx, cy - 2 * depthScale, 5, 3.5 * depthScale, depthScale, panic);
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

            // Distance label under each visible vegetable
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(10 * depthScale)}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(dist)}m`, vX, vY + 30 * depthScale);
          });
        }

        // ---- Other players ----
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
          ctx.font = `bold ${Math.round(10 * proj.scale)}px monospace`;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText(p.name || '', proj.x, proj.y - 24 * proj.scale);
        });
      }

      nearestCatchableRef.current = newNearest;
      if ((newNearest?.id) !== (nearestCatchableRef._lastId)) {
        nearestCatchableRef._lastId = newNearest?.id;
        setNearestCatchable(newNearest);
      }

      // ---- Scoreboard ----
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
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText((p.name || '').slice(0, 8), scoreboardX + 22, scoreboardY + 11);
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'right';
        ctx.fillText(String(p.score || 0), scoreboardX + 112, scoreboardY + 11);
        scoreboardY += 26;
      });

      // ---- Geofence warning ----
      if (myLoc && geofenceRef.current) {
        const gf = geofenceRef.current;
        const distFromCenter = distanceMeters(myLoc.lat, myLoc.lng, gf.lat, gf.lng);
        setLeavingPlayArea(distFromCenter > gf.radiusMeters * 0.85);
      }

      // ---- Particles ----
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
        ctx.fillStyle = `rgba(255, 202, 40, ${alpha})`;
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
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', backgroundColor: '#000000' }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      />

      {gameState.cockroachHack && (
        <div style={styles.hackBanner}>🚨 SYSTEM DATA CORRUPTION: RADAR DATA BLINDED! ⚡</div>
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
        <div style={{ ...styles.crosshair, borderColor: nearestCatchable ? '#ffc83c' : 'rgba(255,255,255,0.5)' }} />
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
    minHeight: '100vh', backgroundColor: '#080808', color: '#ffffff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '32px', fontFamily: '"DM Mono", monospace', textAlign: 'center'
  },
  permissionTitle: { fontFamily: '"Bebas Neue", sans-serif', fontSize: '32px', color: '#ffc83c', letterSpacing: '2px', marginBottom: '16px' },
  permissionText: { fontSize: '14px', color: '#c8a84b', maxWidth: '320px', marginBottom: '24px', lineHeight: 1.5 },
  permissionError: { color: '#ff5c5c', fontSize: '13px', marginBottom: '16px', maxWidth: '320px' },
  permissionButton: {
    backgroundColor: '#ffc83c', color: '#080808', fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '18px', letterSpacing: '2px', border: 'none', borderRadius: '8px',
    padding: '14px 36px', cursor: 'pointer'
  },
  hackBanner: {
    position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
    background: 'rgba(220,38,38,0.9)', color: 'white', padding: '6px 16px', borderRadius: '6px',
    fontWeight: 'black', fontSize: '12px'
  },
  geofenceBanner: {
    position: 'absolute', top: '56px', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
    background: 'rgba(255,200,60,0.9)', color: '#080808', padding: '6px 16px', borderRadius: '6px',
    fontWeight: 'black', fontSize: '12px'
  },
  toast: {
    position: 'absolute', top: '96px', left: '50%', transform: 'translateX(-50%)', zIndex: 25,
    background: 'rgba(0,0,0,0.75)', color: '#ffc83c', padding: '8px 18px', borderRadius: '20px',
    fontSize: '12px', fontFamily: '"DM Mono", monospace'
  },
  crosshairWrap: {
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 15, pointerEvents: 'none'
  },
  crosshair: { width: '46px', height: '46px', borderRadius: '50%', border: '2px solid', boxSizing: 'border-box' },
  captureButton: {
    position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 40,
    backgroundColor: '#ffc83c', color: '#080808', fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '18px', letterSpacing: '1.5px', border: 'none', borderRadius: '32px',
    padding: '16px 32px', cursor: 'pointer'
  },
  captureVignette: {
    position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.85) 72%)',
    transition: 'opacity 0.45s ease', pointerEvents: 'none'
  },
  captureCircle: {
    width: '185px', height: '185px', borderRadius: '50%', backgroundColor: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 65px white'
  },
  captureLabel: {
    fontSize: '38px', fontWeight: '950', marginTop: '20px', color: '#ef4444',
    WebkitTextStroke: '2px #facc15', textShadow: '2px 2px 0px #000',
    fontFamily: 'Impact, sans-serif', letterSpacing: '2px'
  },
  captureScoreRow: {
    display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px',
    background: 'rgba(0,0,0,0.5)', padding: '6px 18px', borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  captureAvatar: {
    width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px'
  },
  captureScoreText: { color: '#facc15', fontWeight: 'bold', fontSize: '22px', fontFamily: 'monospace' }
};

export default GameARView;
