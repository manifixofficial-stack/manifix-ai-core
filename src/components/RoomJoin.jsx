// src/components/RoomJoin.native.jsx
//
// REACT NATIVE PORT of RoomJoin.jsx (was: web build using framer-motion,
// raw DOM elements, CSS injection, navigator.vibrate/DeviceMotionEvent).
//
// ============================================================================
// Why this port exists / what it's for
// ============================================================================
// Per the mobile-app strategy doc, this screen is the REAL first screen a
// player sees — App.jsx's flow starts here with no auth/legal gate ahead
// of it. It's also the ONLY reachable path to Privacy/Terms in the live
// app (the footer's Terms/Privacy buttons are load-bearing for Play Store
// compliance, not decoration) — so those two buttons had to survive the
// port working correctly, not just visually.
//
// ============================================================================
// Library / API swaps made for RN
// ============================================================================
//   framer-motion (motion.div, AnimatePresence)  -> Animated (RN core).
//                                                    Spring/timing configs
//                                                    instead of variants;
//                                                    AnimatePresence's
//                                                    mount/unmount fade
//                                                    replaced with a small
//                                                    local Fade wrapper.
//   Drag-to-confirm (framer-motion `drag="x"`)    -> PanResponder (RN core,
//                                                    no extra native module
//                                                    needed — deliberately
//                                                    NOT react-native-
//                                                    gesture-handler, to
//                                                    avoid adding a new
//                                                    native dependency for
//                                                    one control).
//   navigator.vibrate([...])                      -> expo-haptics
//                                                    (Haptics.notificationAsync
//                                                    / impactAsync) — RN has
//                                                    no vibrate-pattern API,
//                                                    haptics is the native
//                                                    equivalent gesture.
//   DeviceMotionEvent.requestPermission /
//   window.addEventListener('devicemotion')       -> expo-sensors
//                                                    DeviceMotion, same
//                                                    module GameCanvas.
//                                                    native.jsx already
//                                                    uses for the camera-
//                                                    pitch rig, so no new
//                                                    dependency introduced.
//   navigator.getBattery()                        -> expo-battery
//                                                    (getBatteryLevelAsync
//                                                    + isBatteryCharging
//                                                    Async, polled — RN has
//                                                    no levelchange event).
//   document.createElement('style'/'link') font
//   + @keyframes injection                        -> DROPPED. RN has no
//                                                    CSS/DOM. Space Grotesk
//                                                    /Inter/JetBrains Mono
//                                                    are loaded via
//                                                    expo-font in App's
//                                                    root (see AR_HOOK-style
//                                                    FONT_HOOK note below)
//                                                    with a system-font
//                                                    fallback so this file
//                                                    never hard-depends on
//                                                    that load succeeding.
//   <div>/<button>/<input>                        -> View/TouchableOpacity/
//                                                    TextInput.
//   backdropFilter: blur(...)                     -> DROPPED (unsupported
//                                                    in RN). Panels use a
//                                                    slightly more opaque
//                                                    solid background
//                                                    instead to recover
//                                                    some of the same
//                                                    depth without the
//                                                    blur.
//   CSS gradient text (WebkitBackgroundClip)       -> DROPPED — RN can't
//                                                    clip text to a
//                                                    gradient without a
//                                                    masked-image library.
//                                                    Wordmark renders as a
//                                                    solid gold color
//                                                    instead; visually
//                                                    close, not identical.
//   Inline decorative <svg> (Sparkle/Spiral)       -> react-native-svg
//                                                    (Svg/Path), same
//                                                    path data.
//   CSS keyframe ambient loops (sparks/spirals/
//   floating GO! text/grid sweep)                 -> Animated.loop timing
//                                                    sequences. Kept the
//                                                    same low-power/mobile
//                                                    gating logic and
//                                                    count scaling as the
//                                                    web version — RN is
//                                                    mobile-only, so
//                                                    isMobile is always
//                                                    true here and the
//                                                    "desktop" tier of
//                                                    sparkCount/spiralCount
//                                                    /goTextCount is
//                                                    unreachable by
//                                                    construction (this
//                                                    mirrors the same
//                                                    "mid-tier already dead
//                                                    code on real devices"
//                                                    situation the web file
//                                                    itself already noted).
//   window.matchMedia('prefers-reduced-motion')    -> AccessibilityInfo.
//                                                    isReduceMotionEnabled()
//                                                    (RN's real equivalent).
//   visibilitychange (pause ticker when hidden)    -> AppState listener,
//                                                    same intent: pause the
//                                                    decorative ticker
//                                                    interval when the app
//                                                    is backgrounded.
//
// Unchanged logic (still lives here, same behavior/contract):
//   roast-engine string rules (getRoastForName), SQUAD_STATES rotation,
//   generateArenaCode, canSubmit gating, onJoin({room, name}) contract,
//   initialRoomCode prop, error/connecting prop contract, PrivacyModal/
//   TermsModal usage (now importing the .native versions of those files —
//   see FONT_HOOK/MODAL_HOOK notes below for what still needs to exist).
//
// MODAL_HOOK: this file imports PrivacyModal and TermsModal from
// './PrivacyModal' and './TermsModal' exactly as the web version did. If
// those two files haven't been ported to RN yet (Modal + ScrollView
// instead of a DOM overlay), that's the next real blocker after this file
// — same category of issue this file itself was fixing for RoomJoin.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  AppState,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { DeviceMotion } from 'expo-sensors';
import * as Battery from 'expo-battery';
import PrivacyModal from './PrivacyModal.native';
import TermsModal from './TermsModal.native';

const BG_BLACK = '#040508';
const GOLD_START = '#caa24a';
const GOLD_END = '#f4dda0';
const GOLD_SOFT = 'rgba(202, 162, 74, 0.35)';
const MINT = '#34e0a1';
const LIGHT_PINK = '#ff7ebb';
const INK = '#f5f2ea';
const MUTED = '#51596b';

// FONT_HOOK: register these three families via expo-font in App's root
// (Font.loadAsync) using the same Google Fonts files the web version
// pulled from fonts.googleapis.com. Until that's wired, RN silently falls
// back to the platform system font for any unmatched fontFamily — the
// screen stays fully functional, just not pixel-identical to web.
const FONT_DISPLAY = Platform.select({ ios: 'SpaceGrotesk-Bold', android: 'SpaceGrotesk-Bold', default: undefined });
const FONT_BODY = Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: undefined });
const FONT_MONO = Platform.select({ ios: 'JetBrainsMono-Medium', android: 'JetBrainsMono-Medium', default: 'monospace' });

const TICKER_INTERVAL_MS = 4000;
const BATTERY_POLL_MS = 15000;

function generateArenaCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const pick = () => letters[Math.floor(Math.random() * letters.length)];
  return `${pick()}${pick()}${pick()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

const SQUAD_STATES = [
  { count: 2, headline: 'DUO MATRIX ACTIVE', note: 'SYNCING TWO-MAN CO-OP LANES' },
  { count: 3, headline: 'TRIO APEX RUNNING', note: 'THREE-MAN STRIKE TEAM LOCKED' },
  { count: 4, headline: 'CORE FOUR LOCK ON', note: 'QUARTET COMBAT FREQUENCY ON' },
  { count: 5, headline: 'SQUAD STRIKE ONLINE', note: 'QUINTET ASSAULT FORCE OPERATIONAL' },
  { count: 6, headline: 'CLIQUE OVERLORD FORCE', note: '6/6 HEXA MAXIMUM CAPACITY REACHED' },
];

// ── Username roast rule set — unchanged from web ──────────────────────────
const GENERIC_HANDLES = ['gamer', 'player', 'user', 'test', 'name', 'guest', 'noob', 'pro'];
const HYPE_LINES = [
  'ok this one actually has main-character energy ✨',
  'certified lore-accurate callsign, we accept 🫡',
  'the rizz on this handle is unreasonably high 🔥',
  'squad is gonna remember this one, no cap',
  'this tag passed the vibe check first try 💫',
];
const ROAST_LINES = {
  tooShort: 'bro typed one letter and called it a day 💀',
  repeatedChar: "mashing the same key isn't a personality, npc behavior 😭",
  genericWord: "username too generic, bro thinks he's the main character 💀",
  numberSuffix: 'name + random number, the true starter pack move 🫠',
  keyboardMash: 'bro mashed his keyboard, actual npc behavior 😭',
  allCapsYelling: 'the caps lock is doing a LOT of emotional labor rn',
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
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return HYPE_LINES[hash % HYPE_LINES.length];
}

// RN is mobile-only, so this is always true by construction — kept as a
// function (not a bare constant) so the low-power hook below reads the
// same way it did on web, for anyone diffing the two files later.
function useIsMobile() {
  return true;
}

// Same intent as web: strip ambient decoration under reduce-motion or low
// battery. RN equivalents: AccessibilityInfo for reduce-motion,
// expo-battery (polled, since RN has no native levelchange event) for
// power state.
function useLowPowerMode(isMobile) {
  const [lowPower, setLowPower] = useState(isMobile);

  useEffect(() => {
    let cancelled = false;
    let pollId = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        setLowPower(true);
        return;
      }
      const evaluate = async () => {
        try {
          const [level, charging] = await Promise.all([
            Battery.getBatteryLevelAsync(),
            Battery.isBatteryChargingAsync(),
          ]);
          if (cancelled) return;
          const critical = level >= 0 && level <= 0.15;
          const lowAndUnplugged = level >= 0 && level <= 0.2 && !charging;
          setLowPower(isMobile || critical || lowAndUnplugged);
        } catch {
          if (!cancelled) setLowPower(isMobile);
        }
      };
      evaluate();
      pollId = setInterval(evaluate, BATTERY_POLL_MS);
    });

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
    };
  }, [isMobile]);

  return lowPower;
}

function useAmbientSparks(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        delay: Math.random() * 4000,
        duration: 6000 + Math.random() * 5000,
        size: Math.random() * 2.5 + 2.5,
        gold: Math.random() > 0.4,
      })),
    [count]
  );
}

function useAmbientSpirals(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        size: Math.round(16 + Math.random() * 20),
        spinDuration: 6000 + Math.random() * 7000,
        reverse: Math.random() > 0.5,
        gold: Math.random() > 0.45,
      })),
    [count]
  );
}

function useAmbientGoText(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        top: Math.round(Math.random() * 100),
        rotate: Math.round(Math.random() * 50 - 25),
        size: Math.round(12 + Math.random() * 22),
        duration: 5000 + Math.random() * 4000,
        gold: Math.random() > 0.5,
      })),
    [count]
  );
}

// One drifting spark: fades/rises on an Animated.loop, same visual role as
// the web version's mxDrift keyframe.
function AmbientSpark({ spark }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spark.delay),
        Animated.timing(progress, { toValue: 1, duration: spark.duration, useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -160] });
  const opacity = progress.interpolate({ inputRange: [0, 0.12, 0.88, 1], outputRange: [0, spark.gold ? 0.35 : 0.45, spark.gold ? 0.35 : 0.45, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.spark,
        {
          left: `${spark.left}%`,
          width: spark.size,
          height: spark.size,
          borderRadius: spark.size / 2,
          backgroundColor: spark.gold ? GOLD_END : MINT,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  );
}

function AmbientSpiral({ spiral }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: spiral.spinDuration, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: spiral.reverse ? ['360deg', '0deg'] : ['0deg', '360deg'],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bgDecor,
        { left: `${spiral.left}%`, top: `${spiral.top}%`, opacity: spiral.gold ? 0.16 : 0.14, transform: [{ rotate }] },
      ]}
    >
      <Spiral size={spiral.size} color={spiral.gold ? GOLD_SOFT : 'rgba(52, 224, 161, 0.35)'} />
    </Animated.View>
  );
}

function AmbientGoText({ item }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: item.duration / 2, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: item.duration / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.bgGoText,
        {
          left: `${item.left}%`,
          top: `${item.top}%`,
          fontSize: item.size,
          color: item.gold ? GOLD_SOFT : 'rgba(52, 224, 161, 0.3)',
          transform: [{ translateY }, { rotate: `${item.rotate}deg` }],
        },
      ]}
    >
      GO!
    </Animated.Text>
  );
}

function Sparkle({ size = 10, color = GOLD_END }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 0 C12.8 6.2 13.8 9.4 24 12 C13.8 14.6 12.8 17.8 12 24 C11.2 17.8 10.2 14.6 0 12 C10.2 9.4 11.2 6.2 12 0 Z" fill={color} />
    </Svg>
  );
}

function Spiral({ size = 24, color = GOLD_SOFT }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M20 20 m 0,-2 a 2,2 0 1 1 -2,2 a 5,5 0 1 1 5,5 a 9,9 0 1 1 -9,-9 a 14,14 0 1 1 14,14"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

// The idle-bounce "Go!" wordmark — small, one-time + slow idle loop, kept
// exactly as cheap as the web version treated it (not gated by low-power).
function AnimatedGo() {
  const letters = ['G', 'o', '!'];
  const anims = useRef(letters.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    letters.forEach((_, i) => {
      Animated.sequence([
        Animated.delay(500 + i * 100),
        Animated.spring(anims[i], { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(1100 + i * 120),
            Animated.timing(anims[i], { toValue: 1.4, duration: 550, useNativeDriver: true }),
            Animated.timing(anims[i], { toValue: 1, duration: 550, useNativeDriver: true }),
            Animated.delay(1400),
          ])
        ).start();
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.goWrap}>
      {letters.map((ch, i) => {
        const translateY = anims[i].interpolate({ inputRange: [0, 1, 1.4], outputRange: [-24, 0, -9] });
        const opacity = anims[i].interpolate({ inputRange: [0, 0.4, 1, 1.4], outputRange: [0, 1, 1, 1] });
        return (
          <Animated.Text key={i} style={[styles.goLetter, { opacity, transform: [{ translateY }] }]}>
            {ch}
          </Animated.Text>
        );
      })}
    </View>
  );
}

// ── Swipe-to-deploy control, ported from framer-motion drag to PanResponder ──
function SwipeDeploy({ canSubmit, connecting, error, onConfirm }) {
  const thumbSize = 52;
  const [trackWidth, setTrackWidth] = useState(280);
  const maxDrag = Math.max(60, trackWidth - thumbSize - 8);
  const x = useRef(new Animated.Value(0)).current;
  const dragStartX = useRef(0);
  const [settled, setSettled] = useState(false);

  const snapTo = useCallback((toValue, cb) => {
    Animated.spring(x, { toValue, friction: 8, tension: 60, useNativeDriver: true }).start(cb);
  }, [x]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canSubmit && !connecting,
      onMoveShouldSetPanResponder: () => canSubmit && !connecting,
      onPanResponderGrant: () => {
        x.stopAnimation((val) => { dragStartX.current = val; });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(maxDrag, Math.max(0, dragStartX.current + gesture.dx));
        x.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        const final = Math.min(maxDrag, Math.max(0, dragStartX.current + gesture.dx));
        if (!canSubmit || connecting) {
          snapTo(0);
          return;
        }
        if (final > maxDrag * 0.72) {
          snapTo(maxDrag);
          setSettled(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onConfirm();
        } else {
          snapTo(0);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!connecting) setSettled(false);
  }, [connecting]);

  // Same bugfix as web v5: a failed join must snap the thumb back so the
  // control is visibly ready to swipe again.
  useEffect(() => {
    if (error) snapTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const locked = !canSubmit || connecting;
  const glowOpacity = x.interpolate({ inputRange: [0, maxDrag], outputRange: [0.15, 0.9], extrapolate: 'clamp' });

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      style={[styles.swipeTrack, { opacity: locked && !settled ? 0.45 : 1, borderColor: settled ? MINT : GOLD_SOFT }]}
    >
      <Animated.View style={[styles.swipeGlow, { opacity: glowOpacity }]} />
      <Text style={styles.swipeLabel} pointerEvents="none">
        {settled ? 'SYNCING STAGING CORES…' : locked ? 'FILL FIELDS TO UNLOCK' : 'SWIPE TO DEPLOY SQUAD →'}
      </Text>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.swipeThumb, { transform: [{ translateX: x }] }]}
      >
        <Text style={{ fontSize: 20 }}>⚡</Text>
      </Animated.View>
    </View>
  );
}

// Small fade-mount/unmount wrapper — RN's answer to AnimatePresence for
// the roast-line and error banner, which only need enter/exit fade+slide.
function Fade({ visible, children, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible, anim]);

  if (!mounted) return null;
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function RoomJoin({ onJoin, error, connecting, globalScans, initialRoomCode = '' }) {
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [playerName, setPlayerName] = useState('');
  const [ping, setPing] = useState(21);
  const [lobbiesToday, setLobbiesToday] = useState(1402);
  const [squadIdx, setSquadIdx] = useState(1);
  const [focusField, setFocusField] = useState(null);

  const [roastLine, setRoastLine] = useState(null);
  const roastTimerRef = useRef(null);

  const [shakeState, setShakeState] = useState('idle'); // idle | listening | denied | unsupported | synced
  const shakeSubRef = useRef(null);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0, t: 0 });

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const isMobile = useIsMobile();
  const lowPower = useLowPowerMode(isMobile);

  // On RN, isMobile is always true — so this always takes the lowest
  // (mobile) tier, same as the web build's real-device behavior. The
  // "desktop" tier from the web file has no RN equivalent and is omitted
  // rather than left as unreachable dead code here.
  const sparkCount = lowPower ? 0 : 5;
  const spiralCount = lowPower ? 0 : 2;
  const goTextCount = lowPower ? 0 : 3;

  const sparks = useAmbientSparks(sparkCount);
  const spirals = useAmbientSpirals(spiralCount);
  const bgGoTexts = useAmbientGoText(goTextCount);

  // Ticker — pauses while backgrounded via AppState, same intent as the
  // web version's visibilitychange handling.
  useEffect(() => {
    let id = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => {
        setPing(Math.floor(Math.random() * 5) + 16);
        setLobbiesToday((prev) => prev + Math.floor(Math.random() * 2));
        setSquadIdx((prev) => (prev + 1) % SQUAD_STATES.length);
      }, TICKER_INTERVAL_MS);
    };
    const stop = () => {
      if (id) { clearInterval(id); id = null; }
    };
    start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });
    return () => {
      stop();
      sub.remove();
    };
  }, []);

  // Debounced roast commentary — unchanged logic from web.
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

  const handleQuickMatch = () => {
    if (connecting) return;
    setRoomCode(generateArenaCode());
  };

  // Shake-to-sync, ported from window devicemotion to expo-sensors
  // DeviceMotion — same sample-delta-magnitude threshold logic as web.
  const stopShakeListening = useCallback(() => {
    if (shakeSubRef.current) {
      shakeSubRef.current.remove();
      shakeSubRef.current = null;
    }
  }, []);

  const startShakeListening = useCallback(async () => {
    try {
      const available = await DeviceMotion.isAvailableAsync();
      if (!available) {
        setShakeState('unsupported');
        return;
      }
      const { status } = await DeviceMotion.requestPermissionsAsync();
      if (status !== 'granted') {
        setShakeState('denied');
        return;
      }
      lastAccelRef.current = { x: 0, y: 0, z: 0, t: Date.now() };
      DeviceMotion.setUpdateInterval(80);
      shakeSubRef.current = DeviceMotion.addListener(({ accelerationIncludingGravity, acceleration }) => {
        const acc = accelerationIncludingGravity || acceleration;
        if (!acc) return;
        const now = Date.now();
        const prev = lastAccelRef.current;
        if (now - prev.t < 80) return;
        const dx = (acc.x || 0) - prev.x;
        const dy = (acc.y || 0) - prev.y;
        const dz = (acc.z || 0) - prev.z;
        const delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
        lastAccelRef.current = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0, t: now };

        if (delta > 22) {
          setShakeState('synced');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setRoomCode((prevRoom) => (prevRoom.trim() ? prevRoom : generateArenaCode()));
          stopShakeListening();
        }
      });
      setShakeState('listening');
    } catch {
      setShakeState('unsupported');
    }
  }, [stopShakeListening]);

  useEffect(() => stopShakeListening, [stopShakeListening]);

  const canSubmit = Boolean(roomCode.trim() && playerName.trim() && !connecting);
  const currentSquadState = SQUAD_STATES[squadIdx];

  const shakeStatusText = {
    idle: 'TAP TO ARM MOTION SENSORS',
    listening: 'LISTENING FOR SQUAD SHAKE…',
    synced: '✅ SHAKE DETECTED — SEED LINKED',
    denied: '🚨 MOTION ACCESS DENIED',
    unsupported: '⚠ MOTION SENSORS UNAVAILABLE',
  }[shakeState];

  return (
    <View style={styles.lobbyShell}>
      {sparks.map((s) => <AmbientSpark key={s.id} spark={s} />)}
      {spirals.map((s) => <AmbientSpiral key={`spiral-${s.id}`} spiral={s} />)}
      {bgGoTexts.map((g) => <AmbientGoText key={`go-${g.id}`} item={g} />)}

      <View style={styles.scrollArea}>
        {/* ── LIVE MULTIPLAYER HUD SQUAD STATUS ── */}
        <View style={styles.tutorialPanelCard}>
          <View style={styles.hudHeaderRow}>
            <Text style={styles.hudLabel}>LIVE LOBBY WAITING ROOM:</Text>
            <Text style={[styles.hudActivePulse, { color: MINT }]}>● FINDING PLAYERS</Text>
          </View>

          <View style={styles.hudGlitchBox}>
            <View style={styles.decorSparkleLeft}><Sparkle size={12} color={GOLD_START} /></View>
            <Text style={styles.hudStatusHeading}>{currentSquadState.headline}</Text>
            <Text style={styles.hudStatusSubText}>{currentSquadState.note}</Text>
            <View style={styles.decorSparkleRight}><Sparkle size={10} color={GOLD_END} /></View>
          </View>

          <View style={styles.conceptRow}>
            <View style={[styles.iconBadge, { borderColor: GOLD_SOFT, borderWidth: 1.5 }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={GOLD_START} strokeWidth={2.5}>
                <Path d="M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18 M15 3v18" opacity={0.4} />
                <Circle cx={9} cy={9} r={2} fill={GOLD_START} />
                <Path d="M9 9 L15 15" stroke={GOLD_START} strokeWidth={2} strokeLinecap="round" />
                <Circle cx={15} cy={15} r={2} fill={GOLD_START} />
              </Svg>
            </View>
            <View style={styles.conceptMeta}>
              <Text style={[styles.conceptTitle, { color: GOLD_END }]}>1. MAP TRACKER</Text>
              <Text style={styles.conceptDesc}>Spot mutant vegetables invading your actual local streets in real time.</Text>
            </View>
          </View>

          <View style={styles.conceptRow}>
            <View style={[styles.iconBadge, { borderColor: 'rgba(52, 224, 161, 0.15)', borderWidth: 1.5 }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={MINT} strokeWidth={2.5}>
                <Circle cx={12} cy={12} r={9} opacity={0.2} />
                <Circle cx={12} cy={12} r={5} strokeDasharray="3 2" />
                <Circle cx={12} cy={12} r={2} fill={MINT} />
              </Svg>
            </View>
            <View style={styles.conceptMeta}>
              <Text style={[styles.conceptTitle, { color: MINT }]}>2. RUN TO CATCH</Text>
              <Text style={styles.conceptDesc}>You must physically sprint within 15 meters of the veggie to unlock the Catch button!</Text>
            </View>
          </View>

          <View style={styles.conceptRow}>
            <View style={[styles.iconBadge, { borderColor: 'rgba(255, 126, 187, 0.15)', borderWidth: 1.5 }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={LIGHT_PINK} strokeWidth={2.5}>
                <Circle cx={12} cy={12} r={8} />
                <Path d="M12 2v4 M12 18v4 M2 12h4 M18 12h4" opacity={0.5} />
                <Path d="M8 8 L16 16" strokeLinecap="round" />
              </Svg>
            </View>
            <View style={styles.conceptMeta}>
              <Text style={[styles.conceptTitle, { color: LIGHT_PINK }]}>3. AR CAMERA HUNT</Text>
              <Text style={styles.conceptDesc}>Spot them hiding behind real trees and slap that Catch button before anyone else!</Text>
            </View>
          </View>

          <View style={styles.hudDividerLine} />
          <TouchableOpacity
            onPress={shakeState === 'listening' ? stopShakeListening : startShakeListening}
            activeOpacity={0.8}
            style={[
              styles.shakeButton,
              {
                borderColor: shakeState === 'synced' ? MINT : shakeState === 'denied' || shakeState === 'unsupported' ? LIGHT_PINK : GOLD_SOFT,
              },
            ]}
          >
            <Text
              style={{
                color: shakeState === 'synced' ? MINT : shakeState === 'denied' || shakeState === 'unsupported' ? LIGHT_PINK : GOLD_END,
                fontWeight: '700',
                fontSize: 11,
                letterSpacing: 0.5,
              }}
            >
              🤝 SHAKE TO SYNC SQUAD
            </Text>
          </TouchableOpacity>
          <Text style={styles.shakeStatusLine}>// {shakeStatusText}</Text>

          <Text style={styles.hudFooterLog}>// MAX PLAYERS IN ROOM: 6 · CO-OP MODE REQUIRES AT LEAST 2 CHASERS TO START.</Text>
        </View>

        {/* ── ACCESS FIELDS CONTROL DECK ── */}
        <View style={styles.lobbyCardChassis}>
          <View style={styles.statusRowBar}>
            <Text style={styles.statusIndicator}>● LOBBY WAITING ROOM</Text>
            <Text style={styles.latencyIndicator}>⚡ PING: <Text style={{ color: MINT }}>{ping}ms</Text></Text>
          </View>

          <View style={styles.headerTitleBlock}>
            <View style={styles.mainLogoText}>
              <Text style={styles.brandWordmark}>MANIFIX AI</Text>
              <Text style={styles.veggieText}>Veggie</Text>
              <AnimatedGo />
            </View>
            <Text style={styles.subSubtitlePrompt}>ROOM LOBBY — GET READY TO CHASE</Text>
          </View>

          <View style={styles.globalTickerRow}>
            <View style={styles.tickerDataBlock}>
              <Text style={styles.tickerLabel}>VEGGIES CAUGHT WORLDWIDE TODAY</Text>
              <Text style={styles.tickerValue}>
                {typeof globalScans === 'number' ? globalScans.toLocaleString() : lobbiesToday.toLocaleString()}+ CAUGHT
              </Text>
            </View>
          </View>

          <Fade visible={!!error} style={{ marginBottom: 14 }}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </Fade>

          <View style={styles.accessFormContainer}>
            <View style={styles.inputFieldWrapper}>
              <Text style={styles.fieldLabelLabel}>CHASER CALLSIGN (TAG)</Text>
              <TextInput
                placeholder="ENTER YOUR NICKNAME / TAG..."
                placeholderTextColor="#3d4352"
                value={playerName}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField(null)}
                onChangeText={setPlayerName}
                maxLength={20}
                style={[
                  styles.premiumInputBox,
                  { borderColor: focusField === 'name' ? GOLD_START : 'rgba(255,255,255,0.08)' },
                ]}
              />
              <Fade visible={!!roastLine}>
                <Text style={styles.roastLine}>{roastLine}</Text>
              </Fade>
            </View>

            <View style={styles.inputFieldWrapper}>
              <View style={styles.fieldHeaderLabelRow}>
                <Text style={styles.fieldLabelLabel}>ENTER ROOM CODE</Text>
                <TouchableOpacity onPress={handleQuickMatch} disabled={connecting}>
                  <Text style={styles.quickMatchBtn}>⚡ QUICK MATCH</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                placeholder="TYPE ROOM CODE OR HIT QUICK MATCH..."
                placeholderTextColor="#3d4352"
                value={roomCode}
                onFocus={() => setFocusField('room')}
                onBlur={() => setFocusField(null)}
                onChangeText={(t) => setRoomCode(t.toUpperCase())}
                maxLength={12}
                autoCapitalize="characters"
                style={[
                  styles.premiumInputBox,
                  { borderColor: focusField === 'room' ? GOLD_START : 'rgba(255,255,255,0.08)' },
                ]}
              />
            </View>

            <View style={styles.swipeWrapper}>
              <SwipeDeploy canSubmit={canSubmit} connecting={connecting} error={error} onConfirm={handleSubmit} />
            </View>
          </View>

          {/* Load-bearing for Play Store compliance — see file header. */}
          <Text style={styles.footNotice}>
            By continuing, you agree to Veggie Go's{' '}
            <Text onPress={() => setShowTerms(true)} style={styles.footLinkBtn}>Terms</Text>{' '}
            and{' '}
            <Text onPress={() => setShowPrivacy(true)} style={styles.footLinkBtn}>Privacy Policy</Text>,
            {' '}including location and camera use for live gameplay.
          </Text>
        </View>
      </View>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </View>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');
const isNarrow = SCREEN_W < 700;

const styles = StyleSheet.create({
  lobbyShell: { flex: 1, backgroundColor: BG_BLACK },
  scrollArea: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 32,
    flexDirection: isNarrow ? 'column' : 'row',
    gap: 16,
  },

  spark: { position: 'absolute', bottom: -20 },
  bgDecor: { position: 'absolute' },
  bgGoText: { position: 'absolute', fontWeight: '800' },

  tutorialPanelCard: {
    flex: 1,
    backgroundColor: 'rgba(10, 13, 20, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  hudHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudLabel: { fontSize: 9, color: '#666', fontWeight: '700', letterSpacing: 0.5 },
  hudActivePulse: { fontWeight: '700', fontSize: 9 },
  hudGlitchBox: {
    position: 'relative',
    backgroundColor: 'rgba(202,162,74,0.04)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
  },
  hudStatusHeading: { fontSize: 20, fontWeight: '900', color: GOLD_END, letterSpacing: 0.5 },
  hudStatusSubText: { fontSize: 9, fontWeight: '700', color: MUTED, marginTop: 4, letterSpacing: 0.5 },
  decorSparkleLeft: { position: 'absolute', top: 10, left: 12 },
  decorSparkleRight: { position: 'absolute', bottom: 10, right: 12 },

  conceptRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: 14,
  },
  iconBadge: { width: 42, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  conceptMeta: { flex: 1, gap: 1 },
  conceptTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  conceptDesc: { fontSize: 10, color: '#9199a6', lineHeight: 14 },

  hudDividerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  hudFooterLog: { fontSize: 9, color: '#2d313d', fontWeight: '700', lineHeight: 13 },

  shakeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
  },
  shakeStatusLine: { fontSize: 9, color: '#555c6b', fontWeight: '700', textAlign: 'center' },

  lobbyCardChassis: {
    flex: 1,
    backgroundColor: 'rgba(9, 12, 19, 0.97)',
    borderWidth: 1.5,
    borderColor: GOLD_SOFT,
    borderRadius: 24,
    padding: 22,
  },
  statusRowBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 12,
  },
  statusIndicator: { fontSize: 9, fontWeight: '700', color: GOLD_START, letterSpacing: 0.5 },
  latencyIndicator: { fontSize: 9, fontWeight: '700', color: '#666', letterSpacing: 0.5 },

  headerTitleBlock: { alignItems: 'center', marginBottom: 24 },
  mainLogoText: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'center', gap: 8 },
  brandWordmark: { fontSize: 18, fontWeight: '700', letterSpacing: 1, color: INK, opacity: 0.55 },
  veggieText: { fontSize: 26, fontWeight: '700', letterSpacing: 0.5, color: GOLD_END },
  goWrap: { flexDirection: 'row', gap: 1 },
  goLetter: { fontSize: 28, fontWeight: '800', color: MINT },
  subSubtitlePrompt: { fontSize: 9, fontWeight: '700', color: '#3d4352', marginTop: 10, letterSpacing: 1.5 },

  globalTickerRow: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 22,
  },
  tickerDataBlock: { alignItems: 'center', gap: 4 },
  tickerLabel: { fontSize: 8, fontWeight: '600', color: '#3d4352', letterSpacing: 0.5 },
  tickerValue: { fontSize: 13, fontWeight: '600', color: INK },

  accessFormContainer: { gap: 18 },
  inputFieldWrapper: { gap: 6 },
  fieldHeaderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabelLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5, color: '#8aa1be' },
  quickMatchBtn: { color: GOLD_START, fontSize: 9, fontWeight: '600' },
  premiumInputBox: {
    backgroundColor: 'rgba(3, 4, 6, 0.85)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: INK,
    fontSize: 13,
    fontFamily: FONT_MONO,
  },
  roastLine: { fontSize: 10, color: LIGHT_PINK, fontWeight: '700', paddingLeft: 2 },

  swipeWrapper: { alignItems: 'center' },
  swipeTrack: {
    width: '100%',
    maxWidth: 300,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 3,
    overflow: 'hidden',
  },
  swipeGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: GOLD_SOFT },
  swipeLabel: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: GOLD_END,
  },
  swipeThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GOLD_START,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footNotice: { fontSize: 9, color: '#333845', textAlign: 'center', lineHeight: 14, marginTop: 24 },
  footLinkBtn: { color: '#8a93a6', textDecorationLine: 'underline', fontWeight: '600', fontSize: 9 },
  errorText: {
    fontSize: 12,
    backgroundColor: 'rgba(255,77,77,0.1)',
    borderWidth: 1,
    borderColor: '#ff4d5a',
    color: '#ff4d5a',
    padding: 10,
    borderRadius: 8,
    fontWeight: '700',
    textAlign: 'center',
  },
});
