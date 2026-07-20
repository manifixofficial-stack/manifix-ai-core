// src/App.jsx
//
// THIS REVISION: forwards isNative (computed in main.jsx from
// window.Capacitor?.isNativePlatform?.()) down to GameCanvas, so it can
// skip WebXR entirely inside the Capacitor Android WebView — that
// environment doesn't implement real WebXR sessions (navigator.xr can
// exist and isSessionSupported can even resolve true, but
// requestSession then fails/hangs with no usable passthrough), which is
// exactly what produced the "Start AR Hunt does nothing" screenshot.
//
// Everything else — RoomJoin gate, ConnectionStatus phase normalization,
// consolidated subscribeToRoom pipeline, onCountdownCancelled handling,
// motion-permission gate, single-GPS-owner fix, arena race-condition
// fix — is UNCHANGED from the prior revision.
//
// ⚠️ STILL FLAGGED, NOT FIXED (carried over):
//   - handlePrizeRematch emits 'request-rematch', which server.js has
//     no handler for. Fix belongs in server.js.
//   - server.js's room-joined payload includes `geofence: { lat, lng,
//     radiusMeters }` that this file never captures into state.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectionStatus from './components/ConnectionStatus';
import RoomJoin from './components/RoomJoin';
import MapView from './components/MapView';
import GameCanvas from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';
import DailyStreakBanner from './components/DailyStreakBanner';
import PrizeCamera from './components/PrizeCamera';
import { joinRoom, subscribeToRoom } from './lib/gameClient';
import { POSITION_SYNC_THROTTLE_MS, RARITY_BY_SPECIES } from './config/gameConfig';
import { connectTickServer } from './lib/tickClient';
import { hasMotionPermissionCached } from './lib/motionPermission';

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

function toConnectionPhase(tickStatus) {
  if (tickStatus === 'connected' || tickStatus === 'joined') return 'local';
  if (tickStatus === 'disconnected' || tickStatus === 'error' || tickStatus === 'failed') return 'disconnected';
  return 'idle';
}

function veggiesPayloadToArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}

export default function App({ isNative = false } = {}) {
  // --- Room Join Gate ---
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const initialRoomCodeRef = useRef(
    (new URLSearchParams(window.location.search).get('room') || '').trim().toUpperCase()
  );

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

  const [gpsError, setGpsError] = useState('');

  // --- Motion permission (iOS compass gate) ---
  const [motionPermissionReady, setMotionPermissionReady] = useState(false);

  // --- Dynamic Match State Parameters ---
  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [tickStatus, setTickStatus] = useState('idle');

  // --- Prize Camera / caught-veggie tracking ---
  const [myCaughtVeggies, setMyCaughtVeggies] = useState([]);
  const [showPrizeCamera, setShowPrizeCamera] = useState(false);

  // --- Core References ---
  const goAudioRef = useRef(null);
  const tickConnectionRef = useRef(null);
  const gpsWatchIdRef = useRef(null);
  const lastSentPositionRef = useRef(null);
  const lastSentAtRef = useRef(0);
  const myPositionRef = useRef(null);
  const deviceHeadingRef = useRef(0);
  const myPlayerIdRef = useRef(null);

  useEffect(() => {
    myPositionRef.current = myPosition;
  }, [myPosition]);

  useEffect(() => {
    deviceHeadingRef.current = deviceHeading;
  }, [deviceHeading]);

  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  // ---- Room join, triggered by RoomJoin's onJoin({ room, name }) -------
  const handleJoinRoom = async ({ room, name }) => {
    if (!navigator.geolocation) {
      setErrorMessage('This device does not support location services.');
      setGpsError('This device has no GPS sensor available.');
      return;
    }

    setErrorMessage('');
    setTickStatus('connecting');
    setMyName(name);

    const targetRoom = room.trim().toUpperCase();
    setRoomCode(targetRoom);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude, accuracy } = pos.coords;
          const joined = await joinRoom(targetRoom, latitude, longitude, name);

          if (joined && joined.success === false) {
            setErrorMessage(joined.message || 'Could not join that arena. Try a different code.');
            setTickStatus('failed');
            return;
          }

          if (joined?.playerId) {
            setMyPlayerId(joined.playerId);
          }

          setIsRoomLeader(!!joined?.isLeader);
          setPendingTimingMode(joined?.timingMode || 'outdoor');
          setMyPosition({ lat: latitude, lng: longitude, accuracy });
          setGpsError('');

          if (joined?.slotId) {
            setMySlot(joined.slotId);
            setHasJoinedRoom(true);
          } else {
            setErrorMessage('All slots in this arena are full right now.');
            setTickStatus('failed');
            return;
          }

          const shareableUrl = `${window.location.origin}${window.location.pathname}?room=${targetRoom}`;
          window.history.replaceState({ path: shareableUrl }, '', shareableUrl);

          setTickStatus('joined');
        } catch (err) {
          console.error('[App] join failed', err);
          setErrorMessage('Could not reach the game server. Check your connection and try again.');
          setTickStatus('failed');
        }
      },
      () => {
        setErrorMessage('Location permission is required to join this arena.');
        setGpsError('Location permission denied — enable it in site settings.');
        setTickStatus('failed');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  // --- Multi-User Room Real-time Subscription Pipeline ---
  useEffect(() => {
    if (!roomCode) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onPlayersUpdate: (rows) => setPlayers(Array.isArray(rows) ? rows : []),
      onVeggiesUpdate: (rows) => setVeggies(veggiesPayloadToArray(rows)),

      onTimingModeUpdated: (data) => {
        setPendingTimingMode(data?.mode || 'outdoor');
        setTimingModeChosen(true);
      },
      onPromotedToLeader: (data) => {
        setIsRoomLeader(true);
        setPendingTimingMode(data?.timingMode || 'outdoor');
        setTimingModeChosen(false);
      },
      onRoundWin: (data) => {
        if (data?.winnerId === myPlayerIdRef.current && data?.veggieType) {
          setMyCaughtVeggies((prev) => [...prev, data.veggieType]);
        }
      },
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
        setGpsError('');

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
      (err) => {
        console.error('[App] geolocation watch error', err);
        setGpsError(
          err && err.code === 1
            ? 'Location permission denied — enable it in site settings.'
            : 'GPS signal unavailable. Move outdoors or check location services.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (gpsWatchIdRef.current !== null) navigator.geolocation.clearWatch(gpsWatchIdRef.current);
    };
  }, [myPlayerId]);

  // ---- Motion permission tracking ---------------------------------------
  useEffect(() => {
    const check = () => setMotionPermissionReady(hasMotionPermissionCached());
    check();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  // ---- Hardware Compass Absolute Heading Listeners ---------------------
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
  useEffect(() => {
    if (!roomCode || !myPlayerId) return undefined;

    tickConnectionRef.current = connectTickServer(roomCode, myPositionRef.current, {
      onStatusChange: setTickStatus,

      onTick: (n) => {
        setStage('ARENA');
        setMatchPhase(MATCH_PHASE.COUNTDOWN);
        setCountdownTick(n);
      },

      onGo: () => {
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

      onCountdownCancelled: (data) => {
        setMatchPhase(null);
        setStage('MAP');
        setErrorMessage(
          data?.reason === 'player-left'
            ? 'A player left the lobby — match start was cancelled.'
            : 'Match start was cancelled.'
        );
      },
    });

    return () => {
      tickConnectionRef.current?.disconnect();
      tickConnectionRef.current = null;
    };
  }, [roomCode, myPlayerId]);

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

  // ⚠️ 'request-rematch' has no matching handler in server.js.
  const handlePrizeRematch = () => {
    window.socket?.emit('request-rematch', { roomCode });
    setShowPrizeCamera(false);
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

  const playersBySlot = useMemo(() => {
    if (!Array.isArray(players)) return {};
    return Object.fromEntries(
      players.map((p, index) => {
        const slotId = p?.slot_id || `SLOT_0${index + 1}`;
        return [
          slotId,
          {
            lat: p?.latitude,
            lng: p?.longitude,
            name: p?.name || 'PILOT',
            colorSlot: slotId,
            score: p?.score ?? 0,
            mode: p?.mode || null,
          },
        ];
      })
    );
  }, [players]);

  const veggiesById = useMemo(() => {
    if (!Array.isArray(veggies)) return {};
    return Object.fromEntries(
      veggies.map((v, index) => {
        const species = v?.species ?? v?.veggie_type ?? 'broccoli';
        return [
          v?.id || `unknown-${index}`,
          {
            lat: v?.lat ?? v?.latitude,
            lng: v?.lng ?? v?.longitude,
            species,
            rarity: RARITY_BY_SPECIES[species] ?? 'common',
          },
        ];
      })
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

  const prizeWinnerScore = victoryData?.results?.[0]?.score ?? 0;
  const prizeRunnerUp = victoryData?.results?.[1]?.name ?? null;
  const connectionPhase = toConnectionPhase(tickStatus);

  // ---- ROOM JOIN GATE ----
  if (!hasJoinedRoom) {
    return (
      <RoomJoin
        onJoin={handleJoinRoom}
        error={errorMessage}
        connecting={tickStatus === 'connecting'}
        initialRoomCode={initialRoomCodeRef.current}
      />
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

      <ConnectionStatus roomCode={roomCode || 'SCANNING'} phase={connectionPhase} />

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
              myPos={myPosition}
              gpsError={gpsError}
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
                  initialTimingMode={pendingTimingMode}
                  selfPosition={selfPosition}
                  deviceHeading={deviceHeading}
                  players={playersBySlot}
                  veggies={veggiesById}
                  matchPhase={matchPhase}
                  isNative={isNative}
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
          winnerScore={prizeWinnerScore}
          runnerUp={prizeRunnerUp}
          roomCode={roomCode}
          onRematch={handlePrizeRematch}
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
