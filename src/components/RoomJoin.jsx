// src/components/RoomJoin.jsx
// Stage 1: Premium Unified Single-Page Cyberpunk Onboarding Staging Client.
// ULTRA-HIGH VALUE SECTOR EDITION: Embedded with brutalist animated HUD modules and drift matrices.
// v3: Adds initialRoomCode prop so App.jsx can prefill a shared ?room=
//     link's code (this component is now actually rendered by App.jsx
//     as the real join gate — previously built but never wired in).
//     Everything else — swipe-to-deploy, live username roast commentary,
//     shake-to-sync squad linking — is unchanged from v2.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate as fmAnimate } from 'framer-motion';

const BG_BLACK = '#040508';
const GOLD_START = '#caa24a';
const GOLD_END = '#f4dda0';
const GOLD_SOFT = 'rgba(202, 162, 74, 0.35)';
const MINT = '#34e0a1';
const LIGHT_PINK = '#ff7ebb';
const INK = '#f5f2ea';
const MUTED = '#51596b';

const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD_START}, ${GOLD_END})`;

function generateArenaCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}${pick()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Adaptive multi-player squad states running live inside the terminal telemetry view
const SQUAD_STATES = [
  { count: 2, headline: 'DUO MATRIX ACTIVE', note: 'SYNCING TWO-MAN CO-OP LANES' },
  { count: 3, headline: 'TRIO APEX RUNNING', note: 'THREE-MAN STRIKE TEAM LOCKED' },
  { count: 4, headline: 'CORE FOUR LOCK ON', note: 'QUARTET COMBAT FREQUENCY ON' },
  { count: 5, headline: 'SQUAD STRIKE ONLINE', note: 'QUINTET ASSAULT FORCE OPERATIONAL' },
  { count: 6, headline: 'CLIQUE OVERLORD FORCE', note: '6/6 HEXA MAXIMUM CAPACITY REACHED' }
];

// ── Username roast rule set ────────────────────────────────────────────────
// Deterministic-ish so retyping the same handle gives the same read.
const GENERIC_HANDLES = ['gamer', 'player', 'user', 'test', 'name', 'guest', 'noob', 'pro'];
const HYPE_LINES = [
  'ok this one actually has main-character energy ✨',
  'certified lore-accurate callsign, we accept 🫡',
  'the rizz on this handle is unreasonably high 🔥',
  'squad is gonna remember this one, no cap',
  'this tag passed the vibe check first try 💫'
];
const ROAST_LINES = {
  tooShort: 'bro typed one letter and called it a day 💀',
  repeatedChar: 'mashing the same key isn\'t a personality, npc behavior 😭',
  genericWord: 'username too generic, bro thinks he\'s the main character 💀',
  numberSuffix: 'name + random number, the true starter pack move 🫠',
  keyboardMash: 'bro mashed his keyboard, actual npc behavior 😭',
  allCapsYelling: 'the caps lock is doing a LOT of emotional labor rn'
};

function getRoastForName(rawName) {
  const name = rawName.trim();
  if (!name) return null;
  if (name.length < 2) return ROAST_LINES.tooShort;
  if (/^(.)\1+$/.test(name)) return ROAST_LINES.repeatedChar;
  if (GENERIC_HANDLES.includes(name.toLowerCase().replace(/[^a-z]/g, ''))) return ROAST_LINES.genericWord;
  if (/^[a-z]+_?\d+$/i.test(name)) return ROAST_LINES.numberSuffix;
  if (/^[bcdfghjklmnpqrstvwxyz]{3,}\d*$/i.test(name) && !/[aeiou]/i.test(name)) return ROAST_LINES.keyboardMash;
  if (name.length > 3 && name === name.toUpperCase() && /[A-Z]/.test(name)) return ROAST_LINES.allCapsYelling;
  // Deterministic pick from the hype pool based on a cheap char-sum hash,
  // so the same name always gets the same compliment.
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return HYPE_LINES[hash % HYPE_LINES.length];
}

// Tracks whether the viewport is at/under the mobile breakpoint so JS-driven
// values (particle counts, gesture-track sizing) can scale down accordingly.
function useIsMobile(breakpoint = 480) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

function useAmbientSparks(count = 18) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        delay: (Math.random() * 6).toFixed(2),
        duration: (10 + Math.random() * 8).toFixed(2),
        size: (Math.random() * 2.5 + 1.5).toFixed(1),
        gold: Math.random() > 0.4
      })),
    [count]
  );
}

// Small spinning spiral glyphs drifting slowly through the background.
function useAmbientSpirals(count = 9) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        size: Math.round(18 + Math.random() * 26),
        duration: (18 + Math.random() * 14).toFixed(2),
        spinDuration: (6 + Math.random() * 8).toFixed(2),
        delay: (Math.random() * 8).toFixed(2),
        reverse: Math.random() > 0.5,
        gold: Math.random() > 0.45
      })),
    [count]
  );
}

// Faint scattered "GO!" watermarks that quietly tile the background.
function useAmbientGoText(count = 16) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        rotate: Math.round(Math.random() * 50 - 25),
        size: Math.round(14 + Math.random() * 34),
        duration: (12 + Math.random() * 10).toFixed(2),
        delay: (Math.random() * 8).toFixed(2),
        gold: Math.random() > 0.5
      })),
    [count]
  );
}

function Sparkle({ size = 10, color = GOLD_END, style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 0 C12.8 6.2 13.8 9.4 24 12 C13.8 14.6 12.8 17.8 12 24 C11.2 17.8 10.2 14.6 0 12 C10.2 9.4 11.2 6.2 12 0 Z" fill={color} />
    </svg>
  );
}

// A quiet decorative spiral used for background texture only.
function Spiral({ size = 24, color = GOLD_SOFT }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M20 20 
           m 0,-2 
           a 2,2 0 1 1 -2,2 
           a 5,5 0 1 1 5,5 
           a 9,9 0 1 1 -9,-9 
           a 14,14 0 1 1 14,14"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// The page's signature moment: each letter of "Go!" bounces in on load,
// then keeps a slow, playful idle bounce so the call-to-action never goes quiet.
function AnimatedGo() {
  const letters = ['G', 'o', '!'];
  return (
    <span style={styles.goWrap} aria-label="Go!">
      {letters.map((ch, i) => (
        <motion.span
          key={i}
          className="mx-go-letter"
          style={styles.goLetter}
          initial={{ opacity: 0, y: -24, scale: 0.4, rotate: -12 }}
          animate={{
            opacity: 1,
            y: [0, -9, 0],
            scale: 1,
            rotate: 0
          }}
          transition={{
            opacity: { duration: 0.4, delay: 0.5 + i * 0.1 },
            scale: { type: 'spring', stiffness: 400, damping: 12, delay: 0.5 + i * 0.1 },
            rotate: { duration: 0.4, delay: 0.5 + i * 0.1 },
            y: {
              duration: 1.1,
              repeat: Infinity,
              repeatDelay: 1.4,
              delay: 1.6 + i * 0.12,
              ease: 'easeInOut'
            }
          }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

// ── Swipe-to-deploy control ─────────────────────────────────────────────────
// Drag the track hard to the right to confirm entry, instead of a plain button.
function SwipeDeploy({ canSubmit, connecting, onConfirm }) {
  const thumbSize = 52;
  const trackRef = useRef(null);
  const [maxDrag, setMaxDrag] = useState(240);
  const x = useMotionValue(0);
  const glowOpacity = useTransform(x, [0, maxDrag], [0.15, 0.9]);
  const [settled, setSettled] = useState(false);

  // Measure the actual rendered track width (it's fluid on mobile) so the
  // drag distance always matches the visible track instead of a fixed px.
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setMaxDrag(Math.max(60, trackRef.current.offsetWidth - thumbSize - 8));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const handleDragEnd = () => {
    const current = x.get();
    if (!canSubmit || connecting) {
      fmAnimate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      return;
    }
    if (current > maxDrag * 0.72) {
      fmAnimate(x, maxDrag, { type: 'spring', stiffness: 260, damping: 24 });
      setSettled(true);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([12, 30, 40]);
      onConfirm();
    } else {
      fmAnimate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  useEffect(() => {
    if (!connecting) setSettled(false);
  }, [connecting]);

  const locked = !canSubmit || connecting;

  return (
    <div
      ref={trackRef}
      style={{
        ...styles.swipeTrack,
        opacity: locked && !settled ? 0.45 : 1,
        borderColor: settled ? MINT : GOLD_SOFT
      }}
    >
      <motion.div style={{ ...styles.swipeGlow, opacity: glowOpacity }} />
      <span style={styles.swipeLabel}>
        {settled ? 'SYNCING STAGING CORES…' : locked ? 'FILL FIELDS TO UNLOCK' : 'SWIPE TO DEPLOY SQUAD →'}
      </span>
      <motion.div
        drag={locked ? false : 'x'}
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.05}
        dragMomentum={false}
        style={{ x, ...styles.swipeThumb, cursor: locked ? 'not-allowed' : 'grab' }}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
      >
        ⚡
      </motion.div>
    </div>
  );
}

export default function RoomJoin({ onJoin, error, connecting, globalScans, initialRoomCode = '' }) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState('');
  const [ping, setPing] = useState(21);
  const [lobbiesToday, setLobbiesToday] = useState(1402);
  const [squadIdx, setSquadIdx] = useState(1);
  const [focusField, setFocusField] = useState(null);
  const [logoFailed, setLogoFailed] = useState(false);

  // Roast commentary state
  const [roastLine, setRoastLine] = useState(null);
  const roastTimerRef = useRef(null);

  // Shake-to-sync state
  const [shakeState, setShakeState] = useState('idle'); // idle | listening | denied | unsupported | synced
  const shakeCleanupRef = useRef(null);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0, t: 0 });

  const isMobile = useIsMobile();
  const sparks = useAmbientSparks(isMobile ? 8 : 18);
  const spirals = useAmbientSpirals(isMobile ? 4 : 9);
  const bgGoTexts = useAmbientGoText(isMobile ? 7 : 16);

  useEffect(() => {
    if (!document.getElementById('mx-fonts-node')) {
      const link = document.createElement('link');
      link.id = 'mx-fonts-node';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap';
      document.head.appendChild(link);
    }
    if (!document.getElementById('mx-style-node')) {
      const el = document.createElement("style");
      el.id = "mx-style-node";
      el.textContent = `
        @keyframes mxTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.85) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.15) rotate(12deg); }
        }
        @keyframes mxDrift {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          12% { opacity: var(--mx-op, 0.5); }
          88% { opacity: var(--mx-op, 0.5); }
          100% { transform: translateY(-160px) scale(1.2); opacity: 0; }
        }
        @keyframes mxGridSweep {
          0% { background-position: 0 0; }
          100% { background-position: 0 32px; }
        }
        @keyframes mxSpinCW {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes mxSpinCCW {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes mxFloatText {
          0%, 100% { transform: translateY(0) rotate(var(--mx-rot, 0deg)); opacity: var(--mx-go-op, 0.05); }
          50% { transform: translateY(-14px) rotate(var(--mx-rot, 0deg)); opacity: calc(var(--mx-go-op, 0.05) * 1.8); }
        }
        @keyframes mxShakePulse {
          0%, 100% { box-shadow: 0 0 0 rgba(52,224,161,0); }
          50% { box-shadow: 0 0 22px rgba(52,224,161,0.55); }
        }
        .mx-bg-spiral {
          position: absolute; pointer-events: none; z-index: 1;
        }
        .mx-bg-go {
          position: absolute; pointer-events: none; z-index: 1;
          font-family: 'Space Grotesk', sans-serif; font-weight: 800;
          animation: mxFloatText linear infinite;
        }
        .mx-btn-core:hover:not(:disabled) {
          filter: brightness(1.12);
          box-shadow: 0 0 30px rgba(244, 221, 160, 0.4) !important;
          transform: translateY(-2px);
        }
        .mx-btn-core:active:not(:disabled) {
          transform: translateY(0);
        }
        .mx-shake-btn.listening {
          animation: mxShakePulse 1.4s ease-in-out infinite;
        }
        @media (max-width: 768px) {
          .mx-split-chassis { flex-direction: column !important; padding: 12px !important; }
          .mx-pane-half { width: 100% !important; flex: 1 1 auto !important; }
        }
        @media (max-width: 480px) {
          .mx-card-surface { padding: 16px !important; border-radius: 18px !important; }
          .mx-brand-word { font-size: 16px !important; }
          .mx-veggie-word { font-size: 21px !important; }
          .mx-go-letter { font-size: 24px !important; }
        }
      `;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setPing(Math.floor(Math.random() * 5) + 16);
      setLobbiesToday((prev) => prev + Math.floor(Math.random() * 2));
      setSquadIdx((prev) => (prev + 1) % SQUAD_STATES.length);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // Debounced live roast commentary while the player types their handle.
  useEffect(() => {
    if (roastTimerRef.current) clearTimeout(roastTimerRef.current);
    if (!playerName.trim()) {
      setRoastLine(null);
      return;
    }
    roastTimerRef.current = setTimeout(() => {
      setRoastLine(getRoastForName(playerName));
    }, 400);
    return () => clearTimeout(roastTimerRef.current);
  }, [playerName]);

  const handleSubmit = useCallback(() => {
    const room = roomCode.trim().toUpperCase();
    const name = playerName.trim();
    if (!room || !name || connecting) return;
    onJoin({ room, name });
  }, [roomCode, playerName, connecting, onJoin]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit();
  };

  const handleQuickMatch = () => {
    if (connecting) return;
    setRoomCode(generateArenaCode());
  };

  // Shake-to-sync: two or more phones shaken together auto-generate and
  // share a room seed instead of anyone typing a code.
  const stopShakeListening = useCallback(() => {
    if (shakeCleanupRef.current) {
      shakeCleanupRef.current();
      shakeCleanupRef.current = null;
    }
  }, []);

  const onDeviceMotion = useCallback(
    (evt) => {
      const acc = evt.accelerationIncludingGravity || evt.acceleration;
      if (!acc) return;
      const now = Date.now();
      const prev = lastAccelRef.current;
      if (now - prev.t < 80) return; // throttle sampling
      const dx = (acc.x || 0) - prev.x;
      const dy = (acc.y || 0) - prev.y;
      const dz = (acc.z || 0) - prev.z;
      const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
      lastAccelRef.current = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0, t: now };

      if (delta > 22) {
        setShakeState('synced');
        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([20, 40, 20]);
        setRoomCode((prevRoom) => (prevRoom.trim() ? prevRoom : generateArenaCode()));
        stopShakeListening();
      }
    },
    [stopShakeListening]
  );

  const startShakeListening = useCallback(async () => {
    if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
      setShakeState('unsupported');
      return;
    }
    try {
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const perm = await DeviceMotionEvent.requestPermission();
        if (perm !== 'granted') {
          setShakeState('denied');
          return;
        }
      }
      lastAccelRef.current = { x: 0, y: 0, z: 0, t: Date.now() };
      window.addEventListener('devicemotion', onDeviceMotion);
      shakeCleanupRef.current = () => window.removeEventListener('devicemotion', onDeviceMotion);
      setShakeState('listening');
    } catch {
      setShakeState('unsupported');
    }
  }, [onDeviceMotion]);

  useEffect(() => stopShakeListening, [stopShakeListening]);

  const canSubmit = Boolean(roomCode.trim() && playerName.trim() && !connecting);
  const currentSquadState = SQUAD_STATES[squadIdx];

  const shakeStatusText = {
    idle: 'TAP TO ARM MOTION SENSORS',
    listening: 'LISTENING FOR SQUAD SHAKE…',
    synced: '✅ SHAKE DETECTED — SEED LINKED',
    denied: '🚨 MOTION ACCESS DENIED',
    unsupported: '⚠ MOTION SENSORS UNAVAILABLE'
  }[shakeState];

  return (
    <div style={styles.lobbyShell}>
      <div style={styles.vectorScanGrid} />

      {sparks.map((spark) => (
        <div
          key={spark.id}
          style={{
            ...styles.spark,
            left: `${spark.left}%`,
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            background: spark.gold ? GOLD_END : MINT,
            opacity: spark.gold ? 0.35 : 0.45,
            animation: `mxDrift ${spark.duration}s linear infinite`,
            animationDelay: `${spark.delay}s`,
            '--mx-op': spark.gold ? 0.55 : 0.7
          }}
        />
      ))}

      {/* Small spinning spirals scattered through the backdrop */}
      {spirals.map((s) => (
        <div
          key={`spiral-${s.id}`}
          className="mx-bg-spiral"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            animation: `${s.reverse ? 'mxSpinCCW' : 'mxSpinCW'} ${s.spinDuration}s linear infinite`,
            animationDelay: `${s.delay}s`,
            opacity: s.gold ? 0.16 : 0.14
          }}
        >
          <Spiral size={s.size} color={s.gold ? GOLD_SOFT : 'rgba(52, 224, 161, 0.35)'} />
        </div>
      ))}

      {/* Faint "GO!" watermarks tiling the background */}
      {bgGoTexts.map((g) => (
        <span
          key={`bg-go-${g.id}`}
          className="mx-bg-go"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            fontSize: `${g.size}px`,
            color: g.gold ? GOLD_SOFT : 'rgba(52, 224, 161, 0.3)',
            animationDuration: `${g.duration}s`,
            animationDelay: `${g.delay}s`,
            '--mx-rot': `${g.rotate}deg`,
            '--mx-go-op': g.gold ? 0.07 : 0.06
          }}
        >
          GO!
        </span>
      ))}

      <div className="mx-split-chassis" style={styles.dashboardSplitLayout}>

        {/* ── LEFT BOX: LIVE MULTIPLAYER HUD SQUAD STATUS READOUT ── */}
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mx-pane-half mx-card-surface"
          style={styles.tutorialPanelCard}
        >
          <div style={styles.hudHeaderRow}>
            <span style={styles.hudLabel}>LIVE STAGING STATUS REPORT:</span>
            <span style={{ ...styles.hudActivePulse, color: MINT }}>● COMPILING MATRIX</span>
          </div>

          <div style={styles.hudGlitchBox}>
            <Sparkle size={12} color={GOLD_START} style={styles.decorSparkleLeft} />
            <h3 style={styles.hudStatusHeading}>{currentSquadState.headline}</h3>
            <p style={styles.hudStatusSubText}>{currentSquadState.note}</p>
            <Sparkle size={10} color={GOLD_END} style={styles.decorSparkleRight} />
          </div>

          <div style={styles.conceptRow}>
            <div style={{ ...styles.iconBadge, border: `1.5px solid ${GOLD_SOFT}` }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD_START} strokeWidth="2.5">
                <path d="M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18" opacity="0.4" />
                <circle cx="9" cy="9" r="2" fill={GOLD_START} />
                <path d="M9 9 L15 15" stroke={GOLD_START} strokeWidth="2" strokeLinecap="round" />
                <circle cx="15" cy="15" r="2" fill={GOLD_START} />
              </svg>
            </div>
            <div style={styles.conceptMeta}>
              <span style={{ ...styles.conceptTitle, color: GOLD_END }}>1. RADAR SCANNING</span>
              <span style={styles.conceptDesc}>Stalk rare veggie targets moving across your real local street grids live.</span>
            </div>
          </div>

          <div style={styles.conceptRow}>
            <div style={{ ...styles.iconBadge, border: `1.5px solid rgba(52, 224, 161, 0.15)` }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth="2.5">
                <circle cx="12" cy="12" r="9" opacity="0.2" />
                <circle cx="12" cy="12" r="5" strokeDasharray="3 2" />
                <circle cx="12" cy="12" r="2" fill={MINT} />
              </svg>
            </div>
            <div style={styles.conceptMeta}>
              <span style={{ ...styles.conceptTitle, color: MINT }}>2. CAPTURE ZONE</span>
              <span style={styles.conceptDesc}>Walk within 15 meters of a blip to forcefully override and unlock the catch zone.</span>
            </div>
          </div>

          <div style={styles.conceptRow}>
            <div style={{ ...styles.iconBadge, border: `1.5px solid rgba(255, 126, 187, 0.15)` }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={LIGHT_PINK} strokeWidth="2.5">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4" opacity="0.5" />
                <path d="M8 8 L16 16" strokeLinecap="round" />
              </svg>
            </div>
            <div style={styles.conceptMeta}>
              <span style={{ ...styles.conceptTitle, color: LIGHT_PINK }}>3. DISC FLICKING</span>
              <span style={styles.conceptDesc}>Open your camera feed and flick energy discs into the target rings to capture.</span>
            </div>
          </div>

          {/* Shake-to-sync control */}
          <div style={styles.hudDividerLine} />
          <button
            type="button"
            onClick={shakeState === 'listening' ? stopShakeListening : startShakeListening}
            className={`mx-shake-btn ${shakeState === 'listening' ? 'listening' : ''}`}
            style={{
              ...styles.shakeButton,
              borderColor: shakeState === 'synced' ? MINT : shakeState === 'denied' || shakeState === 'unsupported' ? LIGHT_PINK : GOLD_SOFT,
              color: shakeState === 'synced' ? MINT : shakeState === 'denied' || shakeState === 'unsupported' ? LIGHT_PINK : GOLD_END
            }}
          >
            🤝 SHAKE TO SYNC SQUAD
          </button>
          <div style={styles.shakeStatusLine}>// {shakeStatusText}</div>

          <div style={styles.hudFooterLog}>// ROOM SYSTEM METRICS: MAX CAPACITY 6 / CO-OP BOUNDARY: REQUIRES MULTIPLAYER DUO MATRIX TO ENGAGE.</div>
        </motion.div>

        {/* ── RIGHT BOX: UNIFIED ACCESS FIELDS CONTROL DECK W/ ANIMATED WORDMARK ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
          className="mx-pane-half mx-card-surface"
          style={styles.lobbyCardChassis}
        >
          <div style={styles.statusRowBar}>
            <div style={styles.statusIndicator}>● SQUAD STAGING ENGINE</div>
            <div style={styles.latencyIndicator}>⚡ PING: <span style={{ color: MINT }}>{ping}ms</span></div>
          </div>

          <div style={styles.headerTitleBlock}>
            <motion.h1
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={styles.mainLogoText}
            >
              <span className="mx-brand-word" style={styles.brandWordmark}>MANIFIX AI</span>
              <span className="mx-veggie-word" style={styles.veggieText}>Veggie</span>
              <AnimatedGo />
            </motion.h1>
            <p style={styles.subSubtitlePrompt}>SQUAD STAGING MATRIX TERMINAL</p>
          </div>

          <div style={styles.globalTickerRow}>
            <div style={styles.tickerDataBlock}>
              <span style={styles.tickerLabel}>TOTAL NETWORK EXTRACTIONS IN ARCHIVE</span>
              <span style={styles.tickerValue}>
                {typeof globalScans === 'number' ? globalScans.toLocaleString() : lobbiesToday.toLocaleString()}+ SECURED
              </span>
            </div>
          </div>

          {error && <p style={styles.errorText}>⚠ {error}</p>}

          <form onSubmit={handleFormSubmit} style={styles.accessFormContainer}>
            <div style={styles.inputFieldWrapper}>
              <label style={styles.fieldLabelLabel}>CHOOSE OPERATOR TAG</label>
              <input
                type="text"
                placeholder="ENTER YOUR NICKNAME / TAG..."
                value={playerName}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField(null)}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                required
                style={{
                  ...styles.premiumInputBox,
                  borderColor: focusField === 'name' ? GOLD_START : 'rgba(255,255,255,0.05)',
                  boxShadow: focusField === 'name' ? `0 0 15px ${GOLD_SOFT}` : 'none'
                }}
              />
              {roastLine && (
                <motion.div
                  key={roastLine}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={styles.roastLine}
                >
                  {roastLine}
                </motion.div>
              )}
            </div>

            <div style={styles.inputFieldWrapper}>
              <div style={styles.fieldHeaderLabelRow}>
                <label style={styles.fieldLabelLabel}>SQUAD LOBBY SEED</label>
                <button type="button" onClick={handleQuickMatch} disabled={connecting} style={styles.quickMatchBtn}>
                  ⚡ QUICK MATCH
                </button>
              </div>
              <input
                type="text"
                placeholder="ENTER ROOM CODE SECTOR OR QUICK MATCH..."
                value={roomCode}
                onFocus={() => setFocusField('room')}
                onBlur={() => setFocusField(null)}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={12}
                required
                style={{
                  ...styles.premiumInputBox,
                  borderColor: focusField === 'room' ? GOLD_START : 'rgba(255,255,255,0.05)',
                  boxShadow: focusField === 'room' ? `0 0 15px ${GOLD_SOFT}` : 'none'
                }}
              />
            </div>

            {/* Swipe-to-deploy replaces the plain submit button */}
            <div style={styles.swipeWrapper}>
              <SwipeDeploy canSubmit={canSubmit} connecting={connecting} onConfirm={handleSubmit} />
            </div>
          </form>

          <p style={styles.footNotice}>
            By connecting onto the Manifix AI outpost pipelines, you authorize secure geographical tracking matrix data transfers.
          </p>
        </motion.div>

      </div>
    </div>
  );
}

const styles = {
  lobbyShell: {
    position: 'fixed', inset: 0, background: BG_BLACK, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '24px', boxSizing: 'border-box', overflowY: 'auto', userSelect: 'none'
  },
  vectorScanGrid: {
    position: 'absolute', inset: 0, zIndex: 1,
    backgroundImage: 'linear-gradient(rgba(202,162,74,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(202,162,74,0.012) 1px, transparent 1px)',
    backgroundSize: '34px 34px', animation: 'mxGridSweep 16s linear infinite',
    maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 85%)',
    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 85%)'
  },
  spark: { position: 'absolute', bottom: '-20px', borderRadius: '50%', zIndex: 2, pointerEvents: 'none' },

  dashboardSplitLayout: {
    position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'row', gap: '24px',
    justifyContent: 'center', alignItems: 'stretch', width: '100%', maxWidth: '840px'
  },

  tutorialPanelCard: {
    flex: '1 1 340px', background: 'rgba(6, 8, 14, 0.72)', border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '24px', padding: '28px', boxSizing: 'border-box', display: 'flex',
    flexDirection: 'column', gap: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
    backdropFilter: 'blur(12px)', textAlign: 'left', fontFamily: "'Space Grotesk', sans-serif"
  },
  hudHeaderRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#444', fontWeight: 'bold'
  },
  hudLabel: { fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#666', fontWeight: 'bold', letterSpacing: '0.5px' },
  hudActivePulse: { fontWeight: 'bold', display: 'inline-block' },
  hudGlitchBox: {
    position: 'relative', background: 'rgba(202,162,74,0.02)', border: `1px dashed ${GOLD_SOFT}`,
    borderRadius: '16px', padding: '16px 20px', boxSizing: 'border-box'
  },
  hudStatusHeading: { fontSize: '20px', fontWeight: '900', color: GOLD_END, margin: 0, letterSpacing: '0.5px' },
  hudStatusSubText: { fontSize: '9px', fontWeight: '700', color: MUTED, margin: '4px 0 0 0', letterSpacing: '0.5px' },
  decorSparkleLeft: { position: 'absolute', top: '10px', left: '12px', animation: 'mxTwinkle 3s infinite ease-in-out' },
  decorSparkleRight: { position: 'absolute', bottom: '10px', right: '12px', animation: 'mxTwinkle 3.5s infinite ease-in-out' },

  conceptRow: {
    display: 'flex', gap: '14px', alignItems: 'center', margin: '4px 0', background: 'rgba(255,255,255,0.01)',
    padding: '10px 14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.02)'
  },
  iconBadge: {
    width: '42px', height: '40px', minWidth: '42px', borderRadius: '12px', background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box'
  },
  conceptMeta: { display: 'flex', flexDirection: 'column', gap: '1px' },
  conceptTitle: { fontSize: '11px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '0.5px' },
  conceptDesc: { fontSize: '10px', color: '#9199a6', fontFamily: 'sans-serif', lineHeight: '1.4' },

  hudDividerLine: { height: '1px', background: 'rgba(255,255,255,0.03)', margin: '2px 0' },
  hudFooterLog: { fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#2d313d', fontWeight: 'bold', lineHeight: '1.4' },

  shakeButton: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: 'rgba(0,0,0,0.35)', border: '1.5px solid', borderRadius: '12px',
    padding: '10px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: '11px',
    fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', transition: 'all 0.2s ease'
  },
  shakeStatusLine: {
    fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#555c6b',
    fontWeight: 'bold', letterSpacing: '0.3px', textAlign: 'center'
  },

  lobbyCardChassis: {
    flex: '1 1 380px', background: 'rgba(7, 9, 15, 0.96)', border: `1.5px solid ${GOLD_SOFT}`,
    borderRadius: '24px', padding: '28px', boxSizing: 'border-box', boxShadow: '0 25px 50px rgba(0,0,0,0.85)',
    fontFamily: "'Inter', sans-serif"
  },
  statusRowBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px',
    borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '12px', fontFamily: "'Space Grotesk', sans-serif"
  },
  statusIndicator: { fontSize: '9px', fontWeight: '600', color: GOLD_START, letterSpacing: '0.5px' },
  latencyIndicator: { fontSize: '9px', fontWeight: '600', color: '#444', letterSpacing: '0.5px' },

  headerTitleBlock: {
    textAlign: 'center', marginBottom: '26px', paddingTop: '4px', position: 'relative',
    backgroundImage: 'radial-gradient(ellipse 220px 90px at 50% 30%, rgba(202,162,74,0.14), transparent 70%)'
  },
  mainLogoText: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'center',
    gap: '10px', margin: 0, fontFamily: "'Space Grotesk', sans-serif"
  },
  brandWordmark: {
    fontSize: '22px', fontWeight: '700', letterSpacing: '1px', color: INK, opacity: 0.55
  },
  veggieText: {
    fontSize: '28px', fontWeight: '700', letterSpacing: '0.5px',
    backgroundImage: GOLD_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'
  },
  goWrap: { display: 'inline-flex', gap: '1px' },
  goLetter: {
    display: 'inline-block', fontSize: '32px', fontWeight: '800', color: MINT,
    textShadow: '0 0 18px rgba(52,224,161,0.65), 0 0 4px rgba(52,224,161,0.9)'
  },
  subSubtitlePrompt: {
    fontSize: '9px', fontWeight: '700', color: '#3d4352', fontFamily: "'Space Grotesk', sans-serif",
    margin: '10px 0 0 0', letterSpacing: '1.5px'
  },

  globalTickerRow: {
    display: 'flex', gap: '12px', marginBottom: '22px', background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.02)', borderRadius: '12px', padding: '12px'
  },
  tickerDataBlock: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center' },
  tickerLabel: { fontSize: '8px', fontWeight: '600', color: '#3d4352', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.5px' },
  tickerValue: { fontSize: '13px', fontWeight: '600', color: INK, fontFamily: "'Space Grotesk', sans-serif" },

  accessFormContainer: { display: 'flex', flexDirection: 'column', gap: '18px' },
  inputFieldWrapper: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldHeaderLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabelLabel: {
    fontSize: '9px', fontWeight: '600', fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.5px', transition: 'color 0.2s ease', color: '#8aa1be'
  },
  quickMatchBtn: {
    background: 'none', border: 'none', color: GOLD_START, fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '9px', fontWeight: '600', cursor: 'pointer', padding: 0, outline: 'none'
  },
  premiumInputBox: {
    width: '100%', background: 'rgba(3, 4, 6, 0.7)', border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: '12px', padding: '14px', boxSizing: 'border-box', color: INK,
    fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", outline: 'none', transition: 'all 0.2s ease'
  },
  roastLine: {
    fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: LIGHT_PINK,
    fontWeight: 'bold', letterSpacing: '0.2px', paddingLeft: '2px'
  },

  swipeWrapper: { display: 'flex', justifyContent: 'center' },
  swipeTrack: {
    position: 'relative', width: '100%', maxWidth: '300px', height: '58px', borderRadius: '29px',
    border: '1.5px solid', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
    padding: '3px', boxSizing: 'border-box', overflow: 'hidden',
    transition: 'opacity 0.2s ease, border-color 0.2s ease'
  },
  swipeGlow: {
    position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, ${GOLD_SOFT})`,
    pointerEvents: 'none'
  },
  swipeLabel: {
    position: 'absolute', width: '100%', textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', color: GOLD_END, pointerEvents: 'none'
  },
  swipeThumb: {
    width: '52px', height: '52px', borderRadius: '50%', background: GOLD_GRADIENT,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.5)', zIndex: 2, touchAction: 'none'
  },

  footNotice: { fontSize: '9px', color: '#333845', textAlign: 'center', lineHeight: '1.4', margin: '24px 0 0 0' },
  errorText: {
    fontSize: '12px', background: 'rgba(255,77,77,0.08)', border: '1px solid #ff4d5a', color: '#ff4d5a',
    padding: '10px', borderRadius: '8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold',
    marginBottom: '14px', textAlign: 'center'
  }
};
