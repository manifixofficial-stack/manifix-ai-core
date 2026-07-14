// src/App.jsx
//
// FLOW: Name Gate -> Mode Gate (leader picks; others wait) -> World Map
// Lobby -> Live AR Catch Screen -> Victory Card (+ optional Prize Selfie).
//
// THIS REVISION: adds a persistent, account-level "collection book" of
// every veggie TYPE ever caught, synced to native storage via
// @capacitor/preferences. This is separate from `myCaughtVeggies`, which
// is intentionally left untouched — that state still tracks only THIS
// match's catches and continues to feed the Victory Selfie / PrizeCamera
// flow exactly as before. `collectionBook` is the new, longer-lived
// layer: it accumulates unique veggie types across every session, is
// loaded once on boot, and is written back to native Preferences storage
// only when a genuinely new type is unlocked for the first time (so we
// aren't hitting native storage on every single catch).
//
// NOTE: joinRoom()/subscribeToRoom() wiring was already correct in the
// prior revision — see the autoMatchmaker effect (gated on
// hasSubmittedName) and the room-subscription effect right below it.
// That flow is untouched here; adding a second call site for either
// would cause a double room-join / duplicate slot claim.
//
// PRIOR REVISION: fixed the mode-gate "stuck forever" bug. The server can
// (correctly) start the match as soon as BOTH a mode has been picked AND
// enough players have joined — whichever condition lands second. That
// means a client could receive 'tick'/'go' (i.e. the match already
// starting) WITHOUT ever separately receiving a 'timing-mode-updated'
// event of its own, or before its local timingModeChosen flag flipped.
// Previously, onTick/onGo only updated stage/matchPhase, but the render
// gate at the top of this component (`if (!timingModeChosen) return ...`)
// took priority over everything else, so the mode-gate screen never
// released even though the match was actively ticking in the background.
// FIX: onTick and onGo now also call setTimingModeChosen(true), since by
// definition if the match is starting, mode selection is no longer
// relevant and the gate should never block rendering past that point.
//
// PRIOR REVISION: fixed a real iOS-only bug in compass handling. The
// compass-listener effect previously ran once on mount with an empty
// dependency array, checking hasMotionPermissionCached() before the
// player could possibly have granted permission yet (that only happens
// later, when MapView.jsx's CATCH tap calls requestMotionPermission()).
// Since the effect never re-ran, deviceHeading stayed stuck at 0
// forever on iOS Safari even after the user granted permission —
// silently breaking outdoor AR bearing/targeting on iOS specifically
// (Android is unaffected, since it doesn't gate orientation events at
// all). Fixed by tracking permission as state (motionPermissionReady),
// rechecked on mount and on window focus, with the listener effect now
// depending on that state instead of running only once.
//
// motionPermission.js itself required no changes — it was already
// correctly built (feature-detected, tap-gated, safe fallbacks). The
// bug was purely in how App.jsx reacted (or failed to react) to
// permission being granted later.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Preferences } from '@capacitor/preferences'; 
import ConnectionStatus from './components/ConnectionStatus';
import MapView from './components/MapView';
import GameCanvas from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';
import DailyStreakBanner from './components/DailyStreakBanner';
import PrizeCamera from './components/PrizeCamera';
import {
  joinRoom,
  subscribeToRoom,
  initLocalSocketBridge,
} from './lib/gameClient';
import { POSITION_SYNC_THROTTLE_MS } from './config/gameConfig';
import { connectTickServer } from './lib/tickClient';
import { hasMotionPermissionCached } from './lib/motionPermission';

const PUBLIC_FALLBACK_ROOM = 'ARENA_01';
const COLLECTION_BOOK_STORAGE_KEY = 'veggieCollectionBook';

const SLOT_COLORS = {
  SLOT_01: '#3a86ff',
  SLOT_02: '#2ecc71',
  SLOT_03: '#ff006e',
  SLOT_04: '#8338ec',
  SLOT_05: '#e74c3c',
  SLOT_06: '#f1c40f',
};

const MATCH_PHASE = {
  COUNTDOWN: 'COUNTDOWN',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
};

const RARITY_BY_TYPE = {
  tomato: 'rare',
  broccoli: 'common',
  golden: 'ultra-rare',
  banana: 'uncommon',
  grapes: 'uncommon',
  strawberry: 'rare',
};

function veggiesPayloadToArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}

export default function App() {
  // --- Name Gate ---
  const [nameInput, setNameInput] = useState('');
  const [hasSubmittedName, setHasSubmittedName] = useState(false);

  // --- Mode Gate ---
  const [isRoomLeader, setIsRoomLeader] = useState(false);
  const [timingModeChosen, setTimingModeChosen] = useState(false);
  const [pendingTimingMode, setPendingTimingMode] = useState('outdoor');

  // --- Navigation & Flow Router ---
  const [stage, setStage] = useState('MAP'); // 'MAP' | 'ARENA'
  const [roomCode, setRoomCode] = useState('');
  const [players, setPlayers] = useState([]);
  const [veggies, setVeggies] = useState([]);
  const [mySlot, setMySlot] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myName, setMyName] = useState('');
  const [myPosition, setMyPosition] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeVegId, setActiveVegId] = useState(null);

  // --- Motion permission (iOS compass gate) ---
  const [motionPermissionReady, setMotionPermissionReady] = useState(false);

  // --- Dynamic Match State Parameters ---
  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [currentLeaderName, setCurrentLeaderName] = useState(null);
  const [tickStatus, setTickStatus] = useState('idle');

  // --- Prize Camera / caught-veggie tracking (THIS MATCH ONLY) ---
  const [myCaughtVeggies, setMyCaughtVeggies] = useState([]);
  const [showPrizeCamera, setShowPrizeCamera] = useState(false);

  // --- Persistent, account-level collection book (ALL-TIME, synced to
  // native storage via Capacitor Preferences). Distinct from
  // myCaughtVeggies above — this survives app restarts and reinstalls
  // of the JS bundle (though obviously not a fresh app uninstall, since
  // that wipes native storage too). Starts empty until loaded on boot.
  const [collectionBook, setCollectionBook] = useState([]);
  const [collectionBookLoaded, setCollectionBookLoaded] = useState(false);

  // --- Core References ---
  const goAudioRef = useRef(null);
  const tickConnectionRef = useRef(null);
  const gpsWatchIdRef = useRef(null);
  const lastSentPositionRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const currentLeaderNameRef = useRef(null);
  const myPositionRef = useRef(null);
  const deviceHeadingRef = useRef(0);
  const autoJoinAttemptedRef = useRef(false);

  useEffect(() => {
    currentLeaderNameRef.current = currentLeaderName;
  }, [currentLeaderName]);

  useEffect(() => {
    myPositionRef.current = myPosition;
  }, [myPosition]);

  useEffect(() => {
    deviceHeadingRef.current = deviceHeading;
  }, [deviceHeading]);

  // ---- Load the persistent collection book once on boot -----------
  // Runs independently of the name/mode gates below — a returning
  // player's unlocked collection should be available immediately,
  // before they've even entered a name or joined a room.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { value } = await Preferences.get({ key: COLLECTION_BOOK_STORAGE_KEY });
        if (cancelled) return;
        const parsed = value ? JSON.parse(value) : [];
        setCollectionBook(Array.isArray(parsed) ? parsed : []);
      } catch (err) {
        console.error('[App] failed to load collection book from Preferences', err);
        if (!cancelled) setCollectionBook([]);
      } finally {
        if (!cancelled) setCollectionBookLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- Auto-join, gated on hasSubmittedName -----------
  useEffect(() => {
    if (!hasSubmittedName) return undefined;
    if (autoJoinAttemptedRef.current) return undefined;
    autoJoinAttemptedRef.current = true;

    const autoMatchmaker = async () => {
      if (!navigator.geolocation) {
        setErrorMessage('This device does not support location services.');
        return;
      }

      setTickStatus('connecting');
      setMyName(nameInput);

      const urlRoom = new URLSearchParams(window.location.search).get('room');
      const targetRoom = (urlRoom || PUBLIC_FALLBACK_ROOM).trim().toUpperCase();
      setRoomCode(targetRoom);

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude, accuracy } = pos.coords;
            const joined = await joinRoom(targetRoom, latitude, longitude, nameInput);

            if (joined?.playerId) {
              initLocalSocketBridge(joined.playerId);
              setMyPlayerId(joined.playerId);
            }

            setIsRoomLeader(!!joined?.isLeader);
            setPendingTimingMode(joined?.timingMode || 'outdoor');
            setMyPosition({ lat: latitude, lng: longitude, accuracy });

            if (joined?.slotId) {
              setMySlot(joined.slotId);
            } else {
              setErrorMessage('All slots in this arena are full right now.');
            }

            const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${targetRoom}`;
            window.history.replaceState({ path: shareableUrl }, '', shareableUrl);

            setTickStatus('joined');
          } catch (err) {
            console.error('[App] auto-join failed', err);
            setErrorMessage('Could not reach the game server. Check your connection and try again.');
            setTickStatus('failed');
          }
        },
        () => {
          setErrorMessage('Location permission is required to join this outdoor arena.');
          setTickStatus('failed');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    };

    autoMatchmaker();
  }, [hasSubmittedName, nameInput]);

  // ---- Mode gate: listen for the leader's choice landing -----------
  useEffect(() => {
    if (!window.socket) return undefined;

    const handleModeUpdate = (data) => {
      setPendingTimingMode(data?.mode || 'outdoor');
      setTimingModeChosen(true);
    };
    const handlePromotion = (data) => {
      setIsRoomLeader(true);
      setPendingTimingMode(data?.timingMode || 'outdoor');
      setTimingModeChosen(false);
    };

    window.socket.on('timing-mode-updated', handleModeUpdate);
    window.socket.on('promoted-to-leader', handlePromotion);
    return () => {
      window.socket.off('timing-mode-updated', handleModeUpdate);
      window.socket.off('promoted-to-leader', handlePromotion);
    };
  }, []);

  // ---- track which veggies THIS player personally won this match,
  // AND fold any newly-seen type into the persistent collection book. --
  useEffect(() => {
    if (!window.socket) return undefined;

    const handleRoundWin = (data) => {
      if (data?.winnerId !== myPlayerId || !data?.veggieType) return;

      // Existing per-match tracking — feeds the Victory Selfie flow,
      // unchanged from before.
      setMyCaughtVeggies((prev) => [...prev, data.veggieType]);

      // NEW: persistent, all-time collection book. Only writes to
      // native storage when this type hasn't been unlocked before, so
      // recatching the same veggie type repeatedly across matches
      // doesn't spam Preferences writes.
      setCollectionBook((prev) => {
        if (prev.includes(data.veggieType)) return prev;
        const next = [...prev, data.veggieType];
        Preferences.set({
          key: COLLECTION_BOOK_STORAGE_KEY,
          value: JSON.stringify(next),
        }).catch((err) => {
          console.error('[App] failed to persist collection book', err);
        });
        return next;
      });
    };

    window.socket.on('round-win', handleRoundWin);
    return () => window.socket.off('round-win', handleRoundWin);
  }, [myPlayerId]);

  // --- Multi-User Room Real-time Subscription Pipelines ---
  useEffect(() => {
    if (!roomCode) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onRoomUpdate: (room) => {
        if (room && room.current_leader_name && room.current_leader_name !== currentLeaderNameRef.current) {
          setCurrentLeaderName(room.current_leader_name);
        }
      },
      onPlayersUpdate: (rows) => setPlayers(Array.isArray(rows) ? rows : []),
      onVeggiesUpdate: (rows) => setVeggies(veggiesPayloadToArray(rows)),
    });

    return unsubscribe;
  }, [roomCode]);

  // ---- Continuous Geolocation GPS Watcher Loop -------------------------
  useEffect(() => {
    if (!myPlayerId || !navigator.geolocation) return undefined;

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();
        const last = lastSentPositionRef.current;
        const elapsed = now - lastSentAtRef.current;

        setMyPosition({ lat: latitude, lng: longitude, accuracy });

        if (elapsed < POSITION_SYNC_THROTTLE_MS) return;
        if (last && last.lat === latitude && last.lng === longitude) return;

        lastSentPositionRef.current = { lat: latitude, lng: longitude };
        lastSentAtRef.current = now;

        if (window.socket && window.socket.connected) {
          window.socket.emit('update-location', {
            lat: latitude,
            lng: longitude,
            accuracy: typeof accuracy === 'number' ? accuracy : undefined,
            heading: deviceHeadingRef.current,
          });
        }
      },
      (err) => console.error('[App] geolocation watch error', err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (gpsWatchIdRef.current !== null) navigator.geolocation.clearWatch(gpsWatchIdRef.current);
    };
  }, [myPlayerId]);

  // ---- Motion permission tracking ---------------------------------------
  // Rechecks the cached permission flag on mount and on window focus,
  // since there's no native event for "permission just got granted" —
  // the grant happens inside MapView.jsx's CATCH tap handler, on a
  // different component entirely, so this is the bridge that lets
  // App.jsx notice it happened.
  useEffect(() => {
    const check = () => setMotionPermissionReady(hasMotionPermissionCached());
    check();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  // ---- Hardware Compass Absolute Heading Listeners ---------------------
  // Depends on motionPermissionReady instead of running once on mount
  // with an empty dep array — see header note above for why.
  useEffect(() => {
    if (!motionPermissionReady) return undefined;

    const handleOrientation = (evt) => {
      const heading =
        evt.webkitCompassHeading !== undefined
          ? evt.webkitCompassHeading
          : evt.alpha != null
          ? 360 - evt.alpha
          : null;
      if (heading != null) setDeviceHeading(heading);
    };
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [motionPermissionReady]);

  // ---- Socket.io Tick Game Server Coordination Loop --------------------
  // onTick/onGo also force timingModeChosen to true. The server may
  // legitimately start the match (tick/go) without this specific client
  // ever separately resolving its local mode-gate state (e.g. it joined
  // after the leader already picked a mode, or a race between
  // 'timing-mode-updated' and 'tick' delivery). Once the match is
  // actually starting, the mode-gate screen must never be able to block
  // rendering — that was the root cause of the "stuck on waiting for
  // host" bug reported on some devices.
  useEffect(() => {
    if (!roomCode) return undefined;

    tickConnectionRef.current = connectTickServer(roomCode, myPositionRef.current, {
      onStatusChange: setTickStatus,

      onTick: (n) => {
        setTimingModeChosen(true); // FIX — unblock the mode gate
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.COUNTDOWN);
        setCountdownTick(n);
      },

      onGo: () => {
        setTimingModeChosen(true); // FIX — unblock the mode gate (idempotent)
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.ACTIVE);
        setShowGoBurst(true);
        goAudioRef.current?.play().catch(() => {});
        setTimeout(() => setShowGoBurst(false), 650);
      },

      onRoundEnd: (results) => {
        const safeResults = Array.isArray(results) ? results : [];
        const sorted = [...safeResults].sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));

        const mapped = sorted.map((r) => ({
          name: r?.name || 'EXPLORER',
          score: r?.score ?? 0,
          color: SLOT_COLORS[r?.slot_id] || '#00d2d3',
        }));

        let absoluteWinner = { name: 'EXPLORER_1', color: '#00d2d3', score: 0 };
        if (mapped && mapped.length > 0) absoluteWinner = mapped[0];

        setVictoryData({
          winnerName: absoluteWinner.name || 'EXPLORER_1',
          winnerColor: absoluteWinner.color || '#00d2d3',
          results: mapped,
        });

        setMatchPhase(MATCH_PHASE.ENDED);
      },
    });

    return () => {
      tickConnectionRef.current?.disconnect();
      tickConnectionRef.current = null;
    };
  }, [roomCode]);

  // ---- ACTION HANDLERS ----

  const handleSelectVeggieTarget = (vegId) => {
    setActiveVegId(vegId);
    setStage('ARENA');
  };

  const handleReturnToRadar = () => {
    setActiveVegId(null);
    setStage('MAP');
  };

  const handleInstantReplay = () => {
    setVictoryData(null);
    window.location.reload();
  };

  const handlePickTimingMode = (mode) => {
    window.socket?.emit('set-timing-mode', { mode });
    setPendingTimingMode(mode);
    setTimingModeChosen(true);
  };

  // ---- DATA RE-SHAPING FOR RENDERING, WITH NULL-GUARDS ----

  const myColor = mySlot ? SLOT_COLORS[mySlot] : '#00d2d3';

  const myPlayerRow = Array.isArray(players) ? players.find((p) => p && p.id === myPlayerId) : null;
  const myDisplayName = myPlayerRow ? myPlayerRow.name : myName || mySlot || 'EXPLORER_1';

  const playersMap = useMemo(() => {
    if (!Array.isArray(players)) return {};
    return Object.fromEntries(
      players.map((p) => {
        const fallbackSlot = p?.slot_id || 'SLOT_01';
        return [
          fallbackSlot,
          { slotId: fallbackSlot, name: p?.name || 'PILOT', score: p?.score ?? 0, character: fallbackSlot },
        ];
      })
    );
  }, [players]);

  const leaderboard = useMemo(() => {
    if (!Array.isArray(players)) return [];
    return [...players]
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .map((p, index) => ({
        playerId: p?.id || `unknown-${index}`,
        name: p?.name || 'PILOT',
        colorSlot: p?.slot_id || 'SLOT_01',
        score: p?.score ?? 0,
        rank: index + 1,
      }));
  }, [players]);

  const playersById = useMemo(() => {
    if (!Array.isArray(players)) return {};
    return Object.fromEntries(
      players.map((p, index) => [
        p?.id || `unknown-${index}`,
        {
          lat: p?.latitude,
          lng: p?.longitude,
          name: p?.name || 'PILOT',
          colorSlot: p?.slot_id || 'SLOT_01',
          score: p?.score ?? 0,
          mode: p?.mode || null,
        },
      ])
    );
  }, [players]);

  const veggiesById = useMemo(() => {
    if (!Array.isArray(veggies)) return {};
    return Object.fromEntries(
      veggies.map((v, index) => [
        v?.id || `unknown-${index}`,
        {
          lat: v?.lat ?? v?.latitude,
          lng: v?.lng ?? v?.longitude,
          species: v?.species ?? v?.veggie_type ?? 'broccoli',
          rarity: RARITY_BY_TYPE[v?.species ?? v?.veggie_type] ?? 'common',
        },
      ])
    );
  }, [veggies]);

  const selfPosition = useMemo(() => {
    if (!Array.isArray(players)) return myPosition;
    const self = players.find((p) => p && p.id === myPlayerId);
    if (self && self.latitude != null && self.longitude != null) {
      return { lat: self.latitude, lng: self.longitude };
    }
    return myPosition;
  }, [players, myPlayerId, myPosition]);

  // ---- NAME GATE SCREEN ----
  if (!hasSubmittedName) {
    return (
      <div
        className="app-container"
        style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020306', overflow: 'hidden' }}
      >
        <div style={styles.nameGateWrap}>
          <div style={styles.nameGateCard}>
            <p style={styles.nameGateLabel}>ENTER YOUR NAME</p>
            <input
              style={styles.nameGateInput}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={16}
              placeholder="Your name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameInput.trim()) setHasSubmittedName(true);
              }}
            />
            <button
              style={{
                ...styles.nameGateBtn,
                opacity: nameInput.trim() ? 1 : 0.5,
                cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
              }}
              disabled={!nameInput.trim()}
              onClick={() => setHasSubmittedName(true)}
            >
              JOIN ARENA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- MODE GATE SCREEN ----
  if (!timingModeChosen) {
    return (
      <div
        className="app-container"
        style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020306', overflow: 'hidden' }}
      >
        <div style={styles.nameGateWrap}>
          <div style={styles.nameGateCard}>
            {isRoomLeader ? (
              <>
                <p style={styles.nameGateLabel}>CHOOSE MATCH MODE</p>
                <button
                  style={{ ...styles.nameGateBtn, marginBottom: '10px' }}
                  onClick={() => handlePickTimingMode('indoor')}
                >
                  🏠 INSIDE PARTY (45s rounds)
                </button>
                <button
                  style={styles.nameGateBtn}
                  onClick={() => handlePickTimingMode('outdoor')}
                >
                  🌳 OUTDOOR CHASE (60s rounds)
                </button>
              </>
            ) : (
              <p style={styles.nameGateLabel}>WAITING FOR HOST TO CHOOSE MODE…</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-container"
      style={{ position: 'relative', width: '100vw', height: '100vh', background: '#020306', overflow: 'hidden' }}
    >
      <audio ref={goAudioRef} src="/sounds/go.mp3" preload="auto" />

      <DailyStreakBanner />

      <ConnectionStatus roomCode={roomCode || 'SCANNING'} phase={tickStatus} />

      {errorMessage && <div style={styles.errBanner}>{errorMessage}</div>}

      <AnimatePresence mode="wait">
        {stage === 'MAP' && (
          <motion.div
            key="map-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            <MapView
              roomCode={roomCode}
              playerId={myPlayerId}
              mySlot={mySlot}
              onEnterAR={handleSelectVeggieTarget}
              onExit={handleReturnToRadar}
            />
            <div style={styles.sidebarWidget}>
              <Scoreboard players={playersMap} mySlot={mySlot || 'SLOT_01'} leaderboard={leaderboard} />
            </div>
          </motion.div>
        )}

        {stage === 'ARENA' && (
          <motion.div
            key="ar-stage"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            <div style={styles.arenaWrapper}>
              <div style={styles.arenaHeader}>
                <p style={styles.headerTxt}>
                  ARENA MATRIX IDENT: <span style={{ color: '#00d2d3' }}>{roomCode}</span> &nbsp;|&nbsp;
                  PILOT INTERFACE SLOT: <span style={{ color: myColor }}>{myDisplayName?.toUpperCase()}</span>
                </p>
              </div>

              <div style={styles.arenaGrid}>
                <GameCanvas
                  roomCode={roomCode}
                  playerId={myPlayerId}
                  mySlot={mySlot}
                  targetVegId={activeVegId}
                  selfPosition={selfPosition}
                  deviceHeading={deviceHeading}
                  players={playersById}
                  veggies={veggiesById}
                  matchPhase={matchPhase}
                  onExit={handleReturnToRadar}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchPhase === MATCH_PHASE.COUNTDOWN && (
          <motion.div
            key="countdown-shield"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={styles.countdownShield}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdownTick}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={styles.tickLabel}
              >
                {countdownTick}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGoBurst && (
          <motion.div
            key="go-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.goPanelWrap}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={styles.emeraldWave}
            />
            <motion.span
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'backOut' }}
              style={styles.goText}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchPhase === MATCH_PHASE.ENDED && victoryData && (
          <motion.div
            key="victory-shield"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={styles.victoryShield}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{
                ...styles.victoryCard,
                border: `1px solid ${victoryData.winnerColor || '#00d2d3'}`,
                boxShadow: `0 0 40px ${victoryData.winnerColor || '#00d2d3'}55`,
              }}
            >
              <div style={{ fontSize: '56px', marginBottom: '8px' }}>👑</div>
              <p style={styles.roundCompleteTxt}>ROUND MATRIX COMPLETED</p>
              <div
                style={{
                  fontFamily: '"Fredoka", sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: victoryData.winnerColor || '#00d2d3',
                  marginBottom: '20px',
                }}
              >
                {(victoryData.winnerName || 'EXPLORER_1').toUpperCase()}
              </div>

              {Array.isArray(victoryData.results) && (
                <div style={styles.leaderboardScrollContainer}>
                  {victoryData.results.map((r, idx) => (
                    <div
                      key={`${r?.name || 'PILOT'}-${idx}`}
                      style={{
                        ...styles.lobbyRow,
                        color: idx === 0 ? '#fff' : '#b6b6c0',
                        fontWeight: idx === 0 ? 700 : 400,
                      }}
                    >
                      <span>
                        {idx + 1}. {(r?.name || 'PILOT').toUpperCase()}
                      </span>
                      <span style={{ fontFamily: 'monospace' }}>{r?.score ?? 0} pts</span>
                    </div>
                  ))}
                </div>
              )}

              <motion.button whileTap={{ scale: 0.96 }} onClick={handleInstantReplay} style={styles.replayBtn}>
                INSTANT REPLAY
              </motion.button>

              {myCaughtVeggies.length > 0 && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowPrizeCamera(true)}
                  style={{
                    ...styles.replayBtn,
                    marginTop: '10px',
                    background: 'linear-gradient(180deg, #ffc83c, #e0a800)',
                  }}
                >
                  📸 VICTORY SELFIE
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPrizeCamera && (
        <PrizeCamera
          caughtVeggies={myCaughtVeggies}
          winnerName={myDisplayName}
          onClose={() => setShowPrizeCamera(false)}
        />
      )}
    </div>
  );
}

const styles = {
  nameGateWrap: { position: 'fixed', inset: 0, zIndex: 3000, background: '#020306', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nameGateCard: { width: '90%', maxWidth: '320px', textAlign: 'center' },
  nameGateLabel: { color: '#8a8a93', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' },
  nameGateInput: { width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' },
  nameGateBtn: { width: '100%', background: 'linear-gradient(180deg, #06d6a0, #05b989)', color: '#04140f', border: 'none', borderRadius: '10px', padding: '14px', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', cursor: 'pointer' },
  errBanner: { position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 1100, background: '#ff4d4d', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
  arenaWrapper: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#05070a' },
  arenaHeader: { padding: '12px 20px', background: 'rgba(10,15,25,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTxt: { fontSize: '12px', color: '#8a8a93', fontFamily: 'monospace', fontWeight: 'bold', margin: 0 },
  arenaGrid: { flex: 1, position: 'relative' },
  sidebarWidget: { position: 'absolute', top: 80, right: 15, zIndex: 40, width: '220px', pointerEvents: 'none' },
  countdownShield: { position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(4, 4, 8, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tickLabel: { fontFamily: '"Orbitron", sans-serif', fontSize: '120px', fontWeight: '900', color: '#ffc83b', textShadow: '0 0 25px #ffc83c' },
  goPanelWrap: { position: 'fixed', inset: 0, zIndex: 2005, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  emeraldWave: { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,214,160,0.9) 0%, rgba(6,214,160,0) 70%)' },
  goText: { fontFamily: '"Orbitron", sans-serif', fontSize: '96px', fontWeight: 900, color: '#06d6a0', textShadow: '0 0 30px rgba(6,214,160,0.9), 0 0 70px rgba(6,214,160,0.6)' },
  victoryShield: { position: 'fixed', inset: 0, zIndex: 2200, background: 'rgba(4, 4, 8, 0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' },
  victoryCard: { width: '100%', maxWidth: '380px', borderRadius: '20px', background: 'linear-gradient(160deg, rgba(24,24,30,0.95), rgba(10,10,14,0.95))', padding: '28px 24px', textAlign: 'center' },
  roundCompleteTxt: { fontFamily: '"Orbitron", sans-serif', fontSize: '13px', letterSpacing: '2px', color: '#8a8a93', marginBottom: '4px' },
  leaderboardScrollContainer: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' },
  lobbyRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontFamily: 'monospace' },
  replayBtn: { width: '100%', background: 'linear-gradient(180deg, #06d6a0, #05b989)', color: '#04140f', border: 'none', borderRadius: '10px', padding: '14px', fontFamily: '"Orbitron", sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', cursor: 'pointer', boxShadow: '0 0 20px rgba(6,214,160,0.6)' },
};
