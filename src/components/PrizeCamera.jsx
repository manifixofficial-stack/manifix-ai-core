// src/components/PrizeCamera.jsx
//
// Post-game victory/share screen.
//
// ═══════════════════════════════════════════════════════════════════
// REQUIRED SETUP FOR THIS FILE TO ACTUALLY WORK (read before shipping)
// ═══════════════════════════════════════════════════════════════════
//
//  1. FACE TRACKING (real, needs assets you must add):
//     Uses `@vladmandic/face-api`. Download the tiny-face-detector and
//     face-landmark-68-tiny model weight files and place them at
//     `public/models/face-api/`. If those files aren't there, model
//     loading fails, is caught, and the component silently falls back
//     to fixed default anchors — it will NOT crash, but tracking won't
//     work until the assets exist.
//
//  2. VeggieModel.jsx PROP CONTRACT — ASSUMED, NOT VERIFIED. I don't
//     have that file's source. This component now passes it:
//       idleAction   'blink' | 'lean' | 'balance' | 'lookAtPlayer' | 'hug'
//       idleSeed     number — per-instance phase offset
//       isJumping    bool — true for ~900ms right after a tap
//       scale        number — uniform scale multiplier (used by AR Hug
//                    mode to blow the model up to HUG_SCALE_MULTIPLIER)
//     If VeggieModel doesn't read these props yet, the models will
//     still render (using whatever their internal defaults are) but
//     won't idle-animate, bounce, scale, or "hug" until you wire them
//     in. In particular there is no 'hug' idle action defined anywhere
//     except as a prop value — it's on VeggieModel to interpret it.
//
//  3. AR HUG MODE — APPROXIMATION, NOT SKELETAL IK. Marketing copy for
//     this feature describes literal skeletal arm bones wrapping around
//     the player's neck. That requires real-time BODY/POSE tracking
//     (shoulders, neck, arms) — e.g. MediaPipe Pose/Holistic — which is
//     a different, heavier model than the face-only detector this file
//     already loads (see note #1), and isn't wired in here. What this
//     file actually does: reuses the existing FACE detection to
//     estimate a neck point just below the detected chin, places ONE
//     enlarged veggie model there (`HUG_SCALE_MULTIPLIER`), and passes
//     `isHugging` so VeggieModel can play whatever "arms in" pose/anim
//     it has. It looks close to the pitch at a glance but is not
//     tracking the user's actual shoulders/arms. If you want the real
//     thing, add a pose model and swap the neck-anchor estimate below
//     for real shoulder/neck landmarks.
//
//  4. STYLE TRANSFER (BETA, OFF BY DEFAULT) — this is a genuine
//     network call to `STYLE_TRANSFER_ENDPOINT`, which does NOT exist
//     yet (see SERVER TODO #3). Two things to know before enabling it:
//       a) It sends the composite photo (which includes the player's
//          real face) off the device to your server, which then must
//          proxy it to Gemini's image API. NEVER call Gemini directly
//          from this client with an API key — that leaks the key to
//          anyone who opens devtools. The key must live server-side.
//       b) This directly contradicts a "100% local, nothing ever
//          leaves the phone" privacy claim — that claim is only true
//          when this toggle is off. Decide your actual privacy policy
//          before shipping this on, and update your privacy copy to
//          match reality rather than leaving both claims standing.
//     If the endpoint is missing or errors/times out, this fails
//     silently and the original (un-stylized) capture is used — the
//     feature degrades, it doesn't block capture.
//
//  5. VIDEO EXPORT — real MediaRecorder capture of a live-redrawn
//     canvas, not a screenshot. Format support is genuinely
//     browser-dependent: Safari/iOS can produce actual .mp4, Chrome/
//     Android generally only supports .webm via MediaRecorder. This
//     file detects supported mime types at runtime and uses whichever
//     is available; if NONE are supported it falls back to the
//     still-PNG capture path automatically.
//
//  6. NATIVE SHARE — uses `@capacitor/filesystem` + `@capacitor/share`
//     when running inside a native Capacitor build. If those packages
//     aren't installed, the dynamic import fails safely and it falls
//     back to the Web Share API. Either path opens the OS's generic
//     share sheet — there is no way from client code to force-open a
//     specific app's Stories composer pre-loaded; that's an OS/app
//     limitation, not something fixable here.
//
// SERVER TODOs (not solvable from this file alone):
//   1. `GET /api/leaderboard/top5` — needs to exist on your server and
//      query Atlas; this file just calls it.
//   2. `request-rematch` socket handler — needs to clear round state
//      server-side; this file only emits the request.
//   3. `POST /api/style-transfer` — needs to exist if you turn the
//      beta stylize toggle on. Expected contract: accepts
//      `{ image: base64String, mimeType: string }`, returns
//      `{ image: base64String, mimeType: string }` for the stylized
//      result. This is where your Gemini API key and the actual
//      image-to-image call belong — never in this client file.

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import VeggieModel from './veggies/VeggieModel';

const NEON_GREEN = '#39ff88';
const DEEP_DARK_BLUE = 'rgba(7, 9, 22, 0.85)';
const RIVAL_BLUE_BORDER = '#3f5cff';
const GOLD = '#ffc83c';
const PRISTINE_WHITE = '#ffffff';

// SERVER TODO #1 — doesn't exist yet, see header.
const LEADERBOARD_ENDPOINT = '/api/leaderboard/top5';
// SERVER TODO #3 — doesn't exist yet, see header note #4. Only ever
// called if the user opts into the beta stylize toggle.
const STYLE_TRANSFER_ENDPOINT = '/api/style-transfer';
const STYLE_TRANSFER_TIMEOUT_MS = 8000;

const STREAK_KEY = 'manifix_streak';
const STREAK_DATE_KEY = 'manifix_streak_last_date';

// Fixed fallback anchors (percent of viewport) — used until/unless
// live face tracking produces real coordinates. See setup note #1.
const DEFAULT_WINNER_ANCHOR = { xPct: 30, yPct: 22 };
const DEFAULT_RUNNERUP_ANCHOR = { xPct: 70, yPct: 22 };
// Fallback neck anchor for AR Hug mode when no face is detected yet.
const DEFAULT_NECK_ANCHOR = { xPct: 50, yPct: 48 };

// Must match the <Canvas camera={...}> props below exactly, since the
// tap-to-speech-bubble projection math and the AR-hug world-position
// math both need to mirror whatever three.js is actually using to
// render the scene.
const CANVAS_CAMERA_POS = [0, 0.4, 2.2];
const CANVAS_FOV_DEG = 45;
// How far in front of the camera (world units) the hug model sits.
// Matches the depth suggested for a chest/neck-level hug.
const HUG_DEPTH_Z = 1.5;

const IDLE_ACTIONS = ['blink', 'lean', 'balance', 'lookAtPlayer'];
// Multiplier applied to the hero model's scale in AR Hug mode. See
// setup note #3 — this is a real prop, not just decoration, but only
// does something once VeggieModel reads `scale`.
const HUG_SCALE_MULTIPLIER = 3.5;
const JUMP_DURATION_MS = 900;
const BUBBLE_DURATION_MS = 1400;
const VIDEO_RECORD_MS = 3000;
const FACE_DETECT_INTERVAL_MS = 250; // throttled, not per-frame — full-rate face detection is too expensive for a phone
const BRAND_TAG = '👾 manifixai.com — tap to challenge our high scores';
const FACE_API_MODEL_URL = '/models/face-api'; // see setup note #1

// Local, fully-offline roast caption bank. No AI call needed for this
// part — it's just parameterized template text, so it's genuinely
// instant and genuinely never leaves the device.
const ROAST_TEMPLATES = [
  (c) => `Caught a ${c.veggie} in record time but still can't catch a text back 💀`,
  (c) => `Scored ${c.score.toLocaleString()} pts on the server but hasn't touched grass since 2024 🪓`,
  (c) => `Speedran the ${c.veggie} like their life depended on it — no such urgency for the group chat 😭`,
  (c) => (c.streak
    ? `${c.streak}-day streak on the leaderboard, zero-day streak on replying to anyone 🍓`
    : `Scored ${c.score.toLocaleString()} pts and STILL let the group chat go silent 🍓`),
  (c) => `Quantum-caught a ${c.veggie} but somehow still can't lock in a group hangout 👾`,
];

function generateRoastLine({ score, veggieType, streak }) {
  const ctx = { score: score || 0, veggie: veggieType || 'veggie', streak: streak || 0 };
  const pick = ROAST_TEMPLATES[Math.floor(Math.random() * ROAST_TEMPLATES.length)];
  return pick(ctx);
}

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function yesterdayStamp() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

async function getStreakStorage() {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      return {
        async get(key) {
          const { value } = await Preferences.get({ key });
          return value;
        },
        async set(key, value) {
          await Preferences.set({ key, value });
        },
      };
    } catch {
      // @capacitor/preferences not installed in this native build — falls
      // through to localStorage so the app doesn't crash.
    }
  }
  return {
    async get(key) {
      return window.localStorage.getItem(key);
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
    },
  };
}

async function bumpDailyStreak() {
  const storage = await getStreakStorage();
  const lastDate = await storage.get(STREAK_DATE_KEY);
  const prevStreak = parseInt((await storage.get(STREAK_KEY)) || '0', 10) || 0;
  const today = todayStamp();
  if (lastDate === today) return prevStreak;
  const nextStreak = lastDate === yesterdayStamp() ? prevStreak + 1 : 1;
  await storage.set(STREAK_KEY, String(nextStreak));
  await storage.set(STREAK_DATE_KEY, today);
  return nextStreak;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Simple orbit layout: spreads N models evenly around a circle in front
// of the camera, each with a slightly different depth/height so they
// don't overlap visually. Used in ORBIT mode (AR Hug mode uses a single
// fixed hug position instead — see huggerWorldPosition below).
function orbitPosition(index, total, radius = 1.6) {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2;
  const x = Math.sin(angle) * radius;
  const z = -1.2 - Math.cos(angle) * radius * 0.4;
  const y = 0.2 + Math.sin(angle * 2) * 0.25;
  return [x, y, z];
}

// Projects a 3D orbit-ring position to 2D screen space using the same
// camera position/FOV as the <Canvas> below, so tap-triggered speech
// bubbles land on the actual rendered model instead of drifting off.
function projectOrbitToScreen(position, screenW, screenH, fovDeg, camPos) {
  const x = position[0] - camPos[0];
  const y = position[1] - camPos[1];
  const z = position[2] - camPos[2];
  if (z >= -0.01) return null;
  const fovRad = (fovDeg * Math.PI) / 180;
  const aspect = screenW / screenH;
  const tanHalfV = Math.tan(fovRad / 2);
  const tanHalfH = tanHalfV * aspect;
  const ndcX = x / (-z * tanHalfH);
  const ndcY = y / (-z * tanHalfV);
  return {
    x: (ndcX * 0.5 + 0.5) * screenW,
    y: (1 - (ndcY * 0.5 + 0.5)) * screenH,
  };
}

// Inverse of projectOrbitToScreen: given a 2D screen anchor (percent)
// and a fixed depth in front of the camera, returns the 3D world
// position that would project back to that screen point. Used to place
// the AR Hug model at the live-tracked neck anchor.
function screenPctToWorld(xPct, yPct, depthZ, screenW, screenH, fovDeg, camPos) {
  const ndcX = 2 * (xPct / 100) - 1;
  const ndcY = 1 - 2 * (yPct / 100);
  const fovRad = (fovDeg * Math.PI) / 180;
  const aspect = screenW / screenH;
  const tanHalfV = Math.tan(fovRad / 2);
  const tanHalfH = tanHalfV * aspect;
  const zRel = -Math.abs(depthZ);
  const x = ndcX * (-zRel) * tanHalfH;
  const y = ndcY * (-zRel) * tanHalfV;
  return [camPos[0] + x, camPos[1] + y, camPos[2] + zRel];
}

function FloatingVeggieRing({ types, idleAction, jumpingKeys, onTap }) {
  return (
    <>
      <hemisphereLight skyColor="#ffffff" groundColor="#4a4a4a" intensity={0.7} />
      <directionalLight position={[2, 4, 3]} intensity={2.2} />
      <ambientLight intensity={0.4} />
      <Environment preset="apartment" background={false} />
      {types.map((type, i) => {
        const key = `${type}-${i}`;
        const position = orbitPosition(i, types.length);
        return (
          <group
            key={key}
            position={position}
            onClick={(e) => {
              e.stopPropagation();
              onTap(type, i, position);
            }}
          >
            <Suspense fallback={null}>
              <VeggieModel
                type={type}
                panic={false}
                leanDirection={0}
                isDodging={false}
                idleAction={idleAction}
                idleSeed={i}
                isJumping={jumpingKeys.has(key)}
              />
            </Suspense>
          </group>
        );
      })}
    </>
  );
}

// AR Hug mode: a single enlarged hero model, positioned at the live
// (approximate) neck anchor. See setup note #3 for what this is and
// isn't actually tracking.
function ArHugRig({ heroType, worldPosition, isJumping, onTap }) {
  return (
    <>
      <hemisphereLight skyColor="#ffffff" groundColor="#4a4a4a" intensity={0.8} />
      <directionalLight position={[1.5, 3, 2.5]} intensity={2.6} />
      <ambientLight intensity={0.5} />
      <Environment preset="apartment" background={false} />
      <group
        position={worldPosition}
        onClick={(e) => {
          e.stopPropagation();
          onTap();
        }}
      >
        <Suspense fallback={null}>
          <VeggieModel
            type={heroType}
            panic={false}
            leanDirection={0}
            isDodging={false}
            idleAction="hug"
            idleSeed={0}
            isJumping={isJumping}
            scale={HUG_SCALE_MULTIPLIER}
          />
        </Suspense>
      </group>
    </>
  );
}

export default function PrizeCamera({
  caughtVeggies = [],
  winnerName = 'EXPLORER',
  winnerScore = 0,
  runnerUp = null, // { name, score } | null
  roomCode = '',
  onRematch,
  onClose,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const glCanvasRef = useRef(null);
  const [cameraState, setCameraState] = useState('initializing');
  const [shareState, setShareState] = useState('idle'); // idle | preparing | ready | error
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);
  const [windowDims, setWindowDims] = useState({ w: window.innerWidth, h: window.innerHeight });

  const [streakCount, setStreakCount] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ status: 'loading', rows: [] });
  const [rematchState, setRematchState] = useState('idle'); // idle | requesting | requested

  // ── AR Hug mode + beta stylize toggle ───────────────────────────
  // Defaults to hug mode on, matching the "boots straight into it"
  // pitch. Both are simple user-facing toggles, not hidden flags.
  const [arHugMode, setArHugMode] = useState(true);
  const [stylizeEnabled, setStylizeEnabled] = useState(false); // off by default, see setup note #4

  const heroType = caughtVeggies.length
    ? (typeof caughtVeggies[caughtVeggies.length - 1] === 'string'
      ? caughtVeggies[caughtVeggies.length - 1]
      : caughtVeggies[caughtVeggies.length - 1].type)
    : 'broccoli';

  const [roastLine, setRoastLine] = useState(() =>
    generateRoastLine({ score: winnerScore, veggieType: heroType, streak: null }));

  // ── Face tracking state (see setup note #1) ─────────────────────
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [liveWinnerAnchor, setLiveWinnerAnchor] = useState(null);
  const [liveRunnerUpAnchor, setLiveRunnerUpAnchor] = useState(null);
  const [liveNeckAnchor, setLiveNeckAnchor] = useState(null);

  // ── Idle animation + tap interaction state ──────────────────────
  const [idleAction, setIdleAction] = useState('blink');
  const [jumpingKeys, setJumpingKeys] = useState(() => new Set());
  const [huggerJumping, setHuggerJumping] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState([]);

  const winnerBadgePos = liveWinnerAnchor || DEFAULT_WINNER_ANCHOR;
  const runnerUpBadgePos = liveRunnerUpAnchor || DEFAULT_RUNNERUP_ANCHOR;
  const neckAnchorPos = liveNeckAnchor || DEFAULT_NECK_ANCHOR;

  const huggerWorldPosition = screenPctToWorld(
    neckAnchorPos.xPct,
    neckAnchorPos.yPct,
    HUG_DEPTH_Z,
    windowDims.w,
    windowDims.h,
    CANVAS_FOV_DEG,
    CANVAS_CAMERA_POS,
  );

  useEffect(() => {
    const handleResize = () => setWindowDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Front camera for the selfie shot.
  useEffect(() => {
    let cancelled = false;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setCameraState('ready');
        }
      } catch {
        setCameraState('denied');
      }
    }
    startCamera();
    return () => {
      cancelled = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    bumpDailyStreak().then((count) => {
      if (!cancelled) {
        setStreakCount(count);
        setRoastLine(generateRoastLine({ score: winnerScore, veggieType: heroType, streak: count }));
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadLeaderboard() {
      try {
        const res = await fetch(LEADERBOARD_ENDPOINT);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (!cancelled) setLeaderboard({ status: 'ready', rows: Array.isArray(data) ? data.slice(0, 5) : [] });
      } catch (err) {
        console.error('[PrizeCamera] leaderboard fetch failed', err);
        if (!cancelled) setLeaderboard({ status: 'error', rows: [] });
      }
    }
    loadLeaderboard();
    return () => { cancelled = true; };
  }, []);

  // Load face-api models once. Fails safely to fixed anchors if the
  // model weight files aren't present at FACE_API_MODEL_URL (see setup
  // note #1) — this is the single most likely thing to not "just work"
  // without you adding the model assets.
  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      try {
        const faceapi = await import('@vladmandic/face-api');
        await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_API_MODEL_URL);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_API_MODEL_URL);
        if (!cancelled) setFaceApiReady(true);
      } catch (err) {
        console.error('[PrizeCamera] face-api model load failed — using fixed badge/neck anchors instead', err);
        if (!cancelled) setFaceApiReady(false);
      }
    }
    loadModels();
    return () => { cancelled = true; };
  }, []);

  // Throttled detection loop. Runs at FACE_DETECT_INTERVAL_MS, not per
  // animation frame — running a face detector at 60fps on a phone is
  // both unnecessary for this UI and a real battery/heat problem.
  useEffect(() => {
    if (!faceApiReady || cameraState !== 'ready') return undefined;
    let stopped = false;
    let timeoutId;

    async function detect() {
      if (stopped || !videoRef.current) return;
      try {
        const faceapi = await import('@vladmandic/face-api');
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true);

        if (detections?.length) {
          const vw = videoRef.current.videoWidth || 1;
          const vh = videoRef.current.videoHeight || 1;
          // Sort left-to-right in the MIRRORED display (the <video> is
          // CSS-flipped via scaleX(-1)), so screen-left is the largest
          // raw x. We don't know who's "the winner" from pixels alone —
          // heuristic: leftmost on-screen = winner slot, next = rival.
          // Override manually if that's wrong for your layout.
          const sorted = [...detections].sort((a, b) => a.detection.box.x - b.detection.box.x);
          const toAnchor = (det) => {
            const box = det.detection.box;
            const cx = box.x + box.width / 2;
            const cy = box.y + box.height / 2;
            return {
              xPct: 100 - (cx / vw) * 100, // mirrored to match the flipped video
              yPct: Math.max(4, (cy / vh) * 100 - 10), // lift the badge above the head
              boxHeightPct: (box.height / vh) * 100,
            };
          };
          if (sorted[0]) {
            const winnerAnchor = toAnchor(sorted[0]);
            setLiveWinnerAnchor(winnerAnchor);
            // Neck-anchor approximation (see setup note #3): no body/pose
            // tracking exists here, so we estimate a neck point just
            // below the winner's detected chin, offset proportionally
            // to their own detected face size so it scales sensibly at
            // different distances from the camera.
            setLiveNeckAnchor({
              xPct: 100 - (sorted[0].detection.box.x + sorted[0].detection.box.width / 2) / vw * 100,
              yPct: Math.min(92, ((sorted[0].detection.box.y + sorted[0].detection.box.height) / vh) * 100
                + winnerAnchor.boxHeightPct * 0.35),
            });
          }
          if (sorted[1]) setLiveRunnerUpAnchor(toAnchor(sorted[1]));
        }
      } catch (err) {
        // Skip this frame silently — a single failed detection shouldn't
        // spam the console every 250ms.
      }
      if (!stopped) timeoutId = window.setTimeout(detect, FACE_DETECT_INTERVAL_MS);
    }

    detect();
    return () => {
      stopped = true;
      window.clearTimeout(timeoutId);
    };
  }, [faceApiReady, cameraState]);

  // Idle animation state machine — cycles the ORBIT ring through a
  // random idle action every ~2.2-3.6s. Not used in AR Hug mode, which
  // pins its single model to a constant 'hug' idleAction instead. See
  // setup note #2: VeggieModel has to actually read these props for
  // any of this to visibly do anything.
  useEffect(() => {
    if (arHugMode) return undefined;
    const id = setInterval(() => {
      setIdleAction(IDLE_ACTIONS[Math.floor(Math.random() * IDLE_ACTIONS.length)]);
    }, 2200 + Math.random() * 1400);
    return () => clearInterval(id);
  }, [arHugMode]);

  // Tap-to-interact: bounce the tapped model and spawn a screen-space
  // speech bubble at its projected position. Works for both ORBIT
  // models (position passed in) and the single AR Hug model.
  const handleVeggieTap = useCallback((type, index, position) => {
    const key = `${type}-${index}`;
    setJumpingKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    window.setTimeout(() => {
      setJumpingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, JUMP_DURATION_MS);

    const screen = projectOrbitToScreen(position, windowDims.w, windowDims.h, CANVAS_FOV_DEG, CANVAS_CAMERA_POS);
    if (screen) {
      const bubbleId = `${key}-${Date.now()}`;
      setSpeechBubbles((prev) => [...prev, { id: bubbleId, x: screen.x, y: screen.y }]);
      window.setTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      }, BUBBLE_DURATION_MS);
    }
  }, [windowDims]);

  const handleHuggerTap = useCallback(() => {
    setHuggerJumping(true);
    window.setTimeout(() => setHuggerJumping(false), JUMP_DURATION_MS);

    const screen = projectOrbitToScreen(huggerWorldPosition, windowDims.w, windowDims.h, CANVAS_FOV_DEG, CANVAS_CAMERA_POS);
    if (screen) {
      const bubbleId = `hug-${Date.now()}`;
      setSpeechBubbles((prev) => [...prev, { id: bubbleId, x: screen.x, y: screen.y }]);
      window.setTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
      }, BUBBLE_DURATION_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huggerWorldPosition, windowDims]);

  function drawBadgeOnCanvas(ctx, composite, anchor, text, color) {
    const x = (anchor.xPct / 100) * composite.width;
    const y = (anchor.yPct / 100) * composite.height;
    ctx.save();
    ctx.font = 'bold 28px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 6;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawMemeBanner(ctx, composite) {
    // Meme-style banner bar: dark translucent strip behind the roast
    // line so it stays legible over any background.
    const bannerH = 64;
    const y = composite.height - 118;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, y, composite.width, bannerH);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = PRISTINE_WHITE;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 4;
    // Basic manual wrap so long roast lines don't run off-canvas.
    const maxWidth = composite.width - 40;
    const words = roastLine.split(' ');
    let line = '';
    const lines = [];
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    const lineHeight = 26;
    const startY = y + bannerH / 2 - ((lines.length - 1) * lineHeight) / 2 + 8;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, composite.width / 2, startY + i * lineHeight);
    });
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = NEON_GREEN;
    ctx.globalAlpha = 0.9;
    ctx.textAlign = 'center';
    ctx.fillText(BRAND_TAG, composite.width / 2, composite.height - 40);
    ctx.restore();
  }

  function drawCompositeFrame(ctx, composite) {
    const video = videoRef.current;
    const glCanvas = glCanvasRef.current;

    ctx.save();
    ctx.translate(composite.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, composite.width, composite.height);
    ctx.restore();

    ctx.save();
    ctx.translate(composite.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(glCanvas, 0, 0, composite.width, composite.height);
    ctx.restore();

    if (!arHugMode) {
      drawBadgeOnCanvas(ctx, composite, winnerBadgePos, `👑 ${winnerName?.toUpperCase() || 'EXPLORER'}`, NEON_GREEN);
      if (runnerUp?.name) {
        drawBadgeOnCanvas(ctx, composite, runnerUpBadgePos, `😭 ${runnerUp.name.toUpperCase()}`, RIVAL_BLUE_BORDER);
      }
    }

    ctx.save();
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillText(`${winnerScore.toLocaleString()} PTS`, composite.width / 2, composite.height - 150);
    ctx.restore();

    // Roast caption + brand tag — burned into the pixels, not just
    // share text. Fully local/offline (see ROAST_TEMPLATES above).
    drawMemeBanner(ctx, composite);
  }

  // Optional beta step: sends the finished composite blob to your
  // server's style-transfer proxy and swaps in the stylized result.
  // Best-effort — any failure (missing endpoint, timeout, bad
  // response) just keeps the original blob. See setup note #4.
  async function styleTransferComposite(blob) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), STYLE_TRANSFER_TIMEOUT_MS);
    try {
      const base64 = await blobToBase64(blob);
      const res = await fetch(STYLE_TRANSFER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: blob.type }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (!data?.image) throw new Error('style-transfer response missing image field');
      const stylizedRes = await fetch(`data:${data.mimeType || blob.type};base64,${data.image}`);
      return await stylizedRes.blob();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // Still-image capture — kept as the reliable fallback if video
  // recording isn't supported on this device/browser.
  const handleCaptureImage = useCallback(async () => {
    if (!videoRef.current || !glCanvasRef.current) return;
    setShareState('preparing');
    try {
      const video = videoRef.current;
      const composite = document.createElement('canvas');
      composite.width = video.videoWidth || 720;
      composite.height = video.videoHeight || 1280;
      const ctx = composite.getContext('2d');
      drawCompositeFrame(ctx, composite);

      composite.toBlob(async (blob) => {
        if (!blob) {
          setShareState('error');
          return;
        }
        let finalBlob = blob;
        if (stylizeEnabled) {
          try {
            finalBlob = await styleTransferComposite(blob);
          } catch (err) {
            console.error('[PrizeCamera] style-transfer failed — using original capture', err);
          }
        }
        setPreviewUrl(URL.createObjectURL(finalBlob));
        setPreviewIsVideo(false);
        setShareState('ready');
      }, 'image/png');
    } catch (err) {
      console.error('[PrizeCamera] image capture failed', err);
      setShareState('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winnerBadgePos, runnerUpBadgePos, winnerName, winnerScore, runnerUp, arHugMode, roastLine, stylizeEnabled]);

  // Real MediaRecorder-based video capture: redraws the composite frame
  // every animation frame for VIDEO_RECORD_MS, records that canvas's
  // captureStream(), and produces an actual short clip. Falls back to
  // the still-image path if no supported mime type exists (see setup
  // note #5). NOTE: the beta style-transfer step only applies to still
  // captures — running per-frame image-to-image on a live 3s video
  // would mean ~90 separate AI calls per capture, which isn't something
  // to do silently; if you want stylized video, that needs its own
  // dedicated (and rate-limited) server design.
  const handleCaptureVideo = useCallback(async () => {
    if (!videoRef.current || !glCanvasRef.current) return;
    setShareState('preparing');

    try {
      const video = videoRef.current;
      const composite = document.createElement('canvas');
      composite.width = video.videoWidth || 720;
      composite.height = video.videoHeight || 1280;
      const ctx = composite.getContext('2d');

      if (!composite.captureStream || !window.MediaRecorder) {
        throw new Error('MediaRecorder/captureStream unsupported on this browser');
      }

      const mimeCandidates = [
        'video/mp4;codecs=h264', // Safari/iOS, when supported
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
      if (!mimeType) throw new Error('No supported video mime type on this browser/device');

      const stream = composite.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };

      let rafId;
      const loop = () => {
        drawCompositeFrame(ctx, composite);
        rafId = requestAnimationFrame(loop);
      };

      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      recorder.start();
      loop();
      await new Promise((resolve) => window.setTimeout(resolve, VIDEO_RECORD_MS));
      recorder.stop();
      cancelAnimationFrame(rafId);
      await stopped;

      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewIsVideo(true);
      setShareState('ready');
    } catch (err) {
      console.error('[PrizeCamera] video capture failed — falling back to still image', err);
      await handleCaptureImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleCaptureImage, winnerBadgePos, runnerUpBadgePos, winnerName, winnerScore, runnerUp, arHugMode, roastLine]);

  // Share/save. Tries native Capacitor Filesystem+Share first (real
  // file on disk, real native share sheet), falls back to Web Share,
  // falls back to plain download. Neither path force-launches a
  // specific app's Stories composer — see header note #6.
  const handleShareOrDownload = async () => {
    if (!previewUrl) return;
    try {
      const blob = await (await fetch(previewUrl)).blob();
      const ext = previewIsVideo ? (blob.type.includes('mp4') ? 'mp4' : 'webm') : 'png';
      const fileName = `veggie-victory-${Date.now()}.${ext}`;
      const joinUrl = roomCode
        ? `${window.location.origin}?room=${encodeURIComponent(roomCode)}`
        : window.location.origin;
      const shareText = `${roastLine} Scored ${winnerScore.toLocaleString()} pts and caught ${caughtVeggies.length} veggie${caughtVeggies.length === 1 ? '' : 's'}! 🥕📸 ${joinUrl}`;

      if (window.Capacitor?.isNativePlatform?.()) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');
          const base64 = await blobToBase64(blob);
          await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
          const uriResult = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
          await Share.share({
            title: 'Veggie Go Victory',
            text: shareText,
            url: uriResult.uri,
            dialogTitle: 'Share your victory',
          });
          return;
        } catch (nativeErr) {
          console.error('[PrizeCamera] native share failed — falling back to web share', nativeErr);
        }
      }

      const file = new File([blob], fileName, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Veggie Go Victory', text: shareText });
      } else {
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = fileName;
        a.click();
      }
    } catch {
      // user cancelled the share sheet — no action needed
    }
  };

  const handleRematch = useCallback(() => {
    setRematchState('requesting');
    if (window.socket) {
      window.socket.emit('request-rematch', { roomCode });
      window.setTimeout(() => {
        setRematchState('requested');
        onRematch?.();
      }, 350);
    } else {
      setRematchState('requested');
      onRematch?.();
    }
  }, [roomCode, onRematch]);

  return (
    <div style={styles.wrap}>
      <style>{`
        @keyframes streakGlow {
          0%, 100% { box-shadow: 0 0 14px rgba(57,255,136,0.35); }
          50% { box-shadow: 0 0 22px rgba(57,255,136,0.65); }
        }
        @keyframes bubblePop {
          0% { opacity: 0; transform: translate(-50%, -20%) scale(0.6); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
          35% { transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -70%) scale(0.95); }
        }
        @keyframes winnerAura {
          0%, 100% { box-shadow: 0 0 10px rgba(57,255,136,0.4); }
          50% { box-shadow: 0 0 20px rgba(57,255,136,0.8); }
        }
      `}</style>

      {cameraState === 'denied' ? (
        <div style={styles.errorOverlay}>
          <h3 style={styles.errorText}>CAMERA ACCESS REJECTED</h3>
          <button style={styles.retryBtn} onClick={onClose}>CLOSE</button>
        </div>
      ) : (
        <>
          {/* Dedicated matte-black placeholder — sits behind the video
              at all times so there's never a flash of default white/
              transparent background before the stream attaches. */}
          <div style={styles.mattePlaceholder} />

          <video ref={videoRef} autoPlay playsInline muted style={styles.video} />

          {cameraState === 'ready' && (
            <div style={styles.canvasLayer}>
              <Canvas
                camera={{ position: CANVAS_CAMERA_POS, fov: CANVAS_FOV_DEG }}
                gl={{ alpha: true, preserveDrawingBuffer: true }}
                onCreated={({ gl }) => { glCanvasRef.current = gl.domElement; }}
                style={{ background: 'transparent', pointerEvents: 'auto' }}
              >
                {arHugMode ? (
                  <ArHugRig
                    heroType={heroType}
                    worldPosition={huggerWorldPosition}
                    isJumping={huggerJumping}
                    onTap={handleHuggerTap}
                  />
                ) : (
                  <FloatingVeggieRing
                    types={caughtVeggies.map((v) => (typeof v === 'string' ? v : v.type))}
                    idleAction={idleAction}
                    jumpingKeys={jumpingKeys}
                    onTap={handleVeggieTap}
                  />
                )}
              </Canvas>
            </div>
          )}

          {/* Tap-triggered speech bubbles — HTML overlay positioned via
              the same camera projection math used by the 3D ring/hug rig. */}
          {speechBubbles.map((bubble) => (
            <div
              key={bubble.id}
              style={{ ...styles.speechBubble, left: bubble.x, top: bubble.y }}
            >
              {arHugMode ? 'SQUEEZE! 🤗' : 'CATCH SECURED! 💥'}
            </div>
          ))}

          {cameraState === 'initializing' && (
            <div style={styles.loadingOverlay}>
              <p style={styles.loadingText}>STARTING CAMERA...</p>
            </div>
          )}

          {/* Name badges — only shown in ORBIT mode. In AR Hug mode the
              winner's identity is carried by the header title + score
              readout instead, since the neck anchor area is occupied by
              the hug model itself. */}
          {cameraState === 'ready' && !arHugMode && (
            <>
              <div
                style={{
                  ...styles.nameBadge,
                  left: `${winnerBadgePos.xPct}%`,
                  top: `${winnerBadgePos.yPct}%`,
                  borderColor: NEON_GREEN,
                  color: PRISTINE_WHITE,
                  animation: 'winnerAura 1.8s ease-in-out infinite',
                }}
              >
                <span style={{ color: NEON_GREEN }}>👑 CROWNED WINNER</span>
                <div style={styles.nameBadgeSub}>{winnerName?.toUpperCase() || 'EXPLORER'}</div>
              </div>
              {runnerUp?.name && (
                <div
                  style={{
                    ...styles.nameBadge,
                    left: `${runnerUpBadgePos.xPct}%`,
                    top: `${runnerUpBadgePos.yPct}%`,
                    borderColor: RIVAL_BLUE_BORDER,
                    color: PRISTINE_WHITE,
                    background: DEEP_DARK_BLUE,
                  }}
                >
                  😭 DEFEATED RIVAL
                  <div style={styles.nameBadgeSub}>{runnerUp.name.toUpperCase()}</div>
                </div>
              )}
            </>
          )}

          <div style={styles.header}>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
            <h3 style={styles.title}>{winnerName?.toUpperCase() || 'EXPLORER'}'S VICTORY SHOT</h3>
          </div>

          {/* Mode toggles */}
          <div style={styles.modeToggleRow}>
            <button
              style={{ ...styles.modeToggleBtn, ...(arHugMode ? styles.modeToggleBtnActive : {}) }}
              onClick={() => setArHugMode(true)}
            >
              🤗 AR HUG
            </button>
            <button
              style={{ ...styles.modeToggleBtn, ...(!arHugMode ? styles.modeToggleBtnActive : {}) }}
              onClick={() => setArHugMode(false)}
            >
              🛰 ORBIT
            </button>
          </div>

          {streakCount != null && (
            <div style={styles.streakBadge}>
              🔥 DAILY HABIT STREAK: {streakCount} DAY{streakCount === 1 ? '' : 'S'}
            </div>
          )}

          <div style={styles.leaderboardPanel}>
            <div style={styles.leaderboardTitle}>GLOBAL TOP 5</div>
            {leaderboard.status === 'loading' && <div style={styles.leaderboardMuted}>LOADING…</div>}
            {leaderboard.status === 'error' && <div style={styles.leaderboardMuted}>UNAVAILABLE</div>}
            {leaderboard.status === 'ready' && leaderboard.rows.map((row, idx) => (
              <div key={`${row.name}-${idx}`} style={styles.leaderboardRow}>
                <span style={styles.leaderboardRank}>#{idx + 1}</span>
                <span style={styles.leaderboardName}>{row.name}</span>
                <span style={styles.leaderboardScore}>{(row.score ?? 0).toLocaleString()}</span>
              </div>
            ))}
            {leaderboard.status === 'ready' && leaderboard.rows.length === 0 && (
              <div style={styles.leaderboardMuted}>NO SCORES YET</div>
            )}
          </div>

          <div style={styles.footer}>
            {shareState === 'ready' && previewUrl ? (
              <>
                {previewIsVideo ? (
                  <video src={previewUrl} style={styles.previewThumb} muted loop autoPlay playsInline />
                ) : (
                  <img src={previewUrl} alt="Victory preview" style={styles.previewThumb} />
                )}
                <button style={styles.shareBtn} onClick={handleShareOrDownload}>SHARE / SAVE</button>
                <button
                  style={styles.retakeBtn}
                  onClick={() => { setPreviewUrl(null); setPreviewIsVideo(false); setShareState('idle'); }}
                >
                  RETAKE
                </button>
              </>
            ) : (
              <>
                <label style={styles.stylizeToggle}>
                  <input
                    type="checkbox"
                    checked={stylizeEnabled}
                    onChange={(e) => setStylizeEnabled(e.target.checked)}
                    style={{ marginRight: '6px' }}
                  />
                  ✨ STYLIZE (BETA) — sends photo to server for AI redraw
                </label>
                <button
                  style={styles.captureBtn}
                  onClick={handleCaptureVideo}
                  disabled={shareState === 'preparing' || cameraState !== 'ready'}
                >
                  {shareState === 'preparing' ? 'CAPTURING...' : (arHugMode ? '🤗 CAPTURE THE HUG' : '📸 FLEX DUAL-SELFIE ON STORIES')}
                </button>
                <button
                  style={styles.stillBtn}
                  onClick={handleCaptureImage}
                  disabled={shareState === 'preparing' || cameraState !== 'ready'}
                >
                  or capture a still instead
                </button>
              </>
            )}

            <button style={styles.rematchBtn} onClick={handleRematch} disabled={rematchState !== 'idle'}>
              {rematchState === 'idle' && '⟳ REMATCH'}
              {rematchState === 'requesting' && 'STARTING REMATCH…'}
              {rematchState === 'requested' && 'REMATCH REQUESTED'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  wrap: { position: 'fixed', inset: 0, background: '#080808', zIndex: 1000, overflow: 'hidden', fontFamily: "'DM Mono', monospace" },
  mattePlaceholder: { position: 'absolute', inset: 0, background: '#080808', zIndex: 0 },
  video: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', zIndex: 1 },
  canvasLayer: { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(180deg, rgba(8,8,8,0.85), transparent)', zIndex: 5 },
  title: { fontFamily: "'Bebas Neue', sans-serif", color: GOLD, fontSize: '22px', letterSpacing: '1px', margin: 0 },
  closeBtn: { background: 'transparent', border: `1px solid ${GOLD}`, color: GOLD, width: '36px', height: '36px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer' },

  modeToggleRow: { position: 'absolute', top: 72, left: 20, zIndex: 5, display: 'flex', gap: '8px' },
  modeToggleBtn: { fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.5px', background: 'rgba(8,8,8,0.6)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '999px', padding: '6px 12px', cursor: 'pointer' },
  modeToggleBtnActive: { color: NEON_GREEN, borderColor: NEON_GREEN, boxShadow: '0 0 10px rgba(57,255,136,0.4)' },

  nameBadge: { position: 'absolute', transform: 'translate(-50%, -50%)', zIndex: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(8,8,8,0.55)', border: '2px solid', borderRadius: '12px', padding: '6px 14px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', letterSpacing: '1px', textShadow: '0 0 8px rgba(0,0,0,0.8)', pointerEvents: 'none' },
  nameBadgeSub: { fontFamily: "'DM Mono', monospace", color: PRISTINE_WHITE, fontSize: '11px', letterSpacing: '0.5px', marginTop: '2px' },

  speechBubble: { position: 'absolute', transform: 'translate(-50%, -50%)', zIndex: 7, background: PRISTINE_WHITE, color: '#080808', fontFamily: "'Bebas Neue', sans-serif", fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px', padding: '6px 12px', borderRadius: '999px', border: `2px solid ${NEON_GREEN}`, boxShadow: `0 0 12px rgba(57,255,136,0.6)`, pointerEvents: 'none', animation: `bubblePop ${BUBBLE_DURATION_MS}ms ease-out forwards` },

  streakBadge: { position: 'absolute', top: 112, left: '50%', transform: 'translateX(-50%)', zIndex: 5, background: 'rgba(8,8,8,0.7)', border: `1.5px solid ${NEON_GREEN}`, color: NEON_GREEN, borderRadius: '999px', padding: '6px 18px', fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', letterSpacing: '1px', animation: 'streakGlow 1.8s ease-in-out infinite' },

  leaderboardPanel: { position: 'absolute', top: 164, right: 14, zIndex: 5, width: 190, background: DEEP_DARK_BLUE, border: '1px solid rgba(120,150,255,0.35)', borderRadius: '12px', padding: '10px 12px', backdropFilter: 'blur(6px)' },
  leaderboardTitle: { color: '#9db4ff', fontFamily: "'Bebas Neue', sans-serif", fontSize: '12px', letterSpacing: '1.5px', marginBottom: '6px', textAlign: 'center' },
  leaderboardMuted: { color: 'rgba(255,255,255,0.5)', fontSize: '11px', textAlign: 'center', padding: '6px 0' },
  leaderboardRow: { display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 2px', fontSize: '12px' },
  leaderboardRank: { color: '#9db4ff', width: '20px' },
  leaderboardName: { flex: 1, color: PRISTINE_WHITE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  leaderboardScore: { color: NEON_GREEN, fontWeight: 700 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', background: 'linear-gradient(0deg, rgba(8,8,8,0.9), transparent)', zIndex: 5 },
  stylizeToggle: { fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', cursor: 'pointer' },
  captureBtn: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '1px', background: 'transparent', color: NEON_GREEN, border: `2px solid ${NEON_GREEN}`, borderRadius: '999px', padding: '14px 28px', cursor: 'pointer', boxShadow: '0 0 14px rgba(57,255,136,0.3)' },
  stillBtn: { fontFamily: "'DM Mono', monospace", fontSize: '11px', background: 'transparent', color: 'rgba(255,255,255,0.55)', border: 'none', textDecoration: 'underline', cursor: 'pointer' },
  shareBtn: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', letterSpacing: '1.5px', background: NEON_GREEN, color: '#080808', border: 'none', borderRadius: '999px', padding: '14px 40px', cursor: 'pointer' },
  retakeBtn: { fontFamily: "'DM Mono', monospace", fontSize: '14px', background: 'transparent', color: RIVAL_BLUE_BORDER, border: `1px solid ${RIVAL_BLUE_BORDER}`, borderRadius: '999px', padding: '10px 24px', cursor: 'pointer' },
  rematchBtn: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '1px', background: 'transparent', color: '#9db4ff', border: '1.5px solid #9db4ff', borderRadius: '999px', padding: '10px 26px', cursor: 'pointer' },
  previewThumb: { width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: `2px solid ${NEON_GREEN}` },

  errorOverlay: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '0 30px', textAlign: 'center' },
  errorText: { fontFamily: "'Bebas Neue', sans-serif", color: RIVAL_BLUE_BORDER, fontSize: '24px', letterSpacing: '1px' },
  retryBtn: { fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: '999px', padding: '12px 36px', cursor: 'pointer' },
  loadingOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  loadingText: { fontFamily: "'DM Mono', monospace", color: GOLD, fontSize: '16px', letterSpacing: '1px' },
};
