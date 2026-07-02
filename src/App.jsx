import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoomJoin from './components/RoomJoin';
import CharacterSelect from './components/CharacterSelect';
import ConnectionStatus from './components/ConnectionStatus';
import GameARView from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';
import {
  joinRoom,
  fetchTakenCharacters,
  claimCharacter,
  fetchPlayers,
  subscribeToRoom,
} from './lib/gameClient';

const SLOT_COLORS = {
  BLUE: '#3a86ff',
  PURPLE: '#8338ec',
  PINK: '#ff006e',
  ORANGE: '#fb5607'
};

const MATCH_PHASE = {
  COUNTDOWN: 'COUNTDOWN',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED'
};

// How long a round runs once GO! fires. There's no server tick engine
// anymore (see note below), so this is enforced client-side per phone.
const ROUND_DURATION_MS = 3 * 60 * 1000;

function App() {
  const [stage, setStage] = useState(1); // 1: Room Entry, 2: Slot Claim, 3: Match Arena
  const [roomCode, setRoomCode] = useState('');
  const [takenChars, setTakenChars] = useState({ BLUE: null, PURPLE: null, PINK: null, ORANGE: null });
  const [players, setPlayers] = useState([]); // raw player_scores rows for the room
  const [mySlot, setMySlot] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null); // player_scores.id (uuid) — replaces socket.id
  const [errorMessage, setErrorMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const [lockResult, setLockResult] = useState(null); // { slotId, success } — see CharacterSelect.jsx

  // ── Match phase / countdown / victory state ─────────────────────────
  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [currentLeaderName, setCurrentLeaderName] = useState(null);
  const goAudioRef = useRef(null);
  const roundTimerRef = useRef(null);
  const countdownStartedRef = useRef(false); // guards against re-triggering the countdown on every realtime tick

  // -------------------------------------------------------------------
  // Realtime subscription for the room: player_scores changes drive the
  // taken-slots map + the all-filled -> countdown trigger; game_rooms
  // UPDATE drives the golden-crown leader flash (RoomJoin's old
  // 'current_leader_name' listener, now sourced straight from the DB
  // column that capture_veggie's refresh_leader() keeps in sync).
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode || stage < 2) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onRoomUpdate: (room) => {
        if (room.current_leader_name && room.current_leader_name !== currentLeaderName) {
          setCurrentLeaderName(room.current_leader_name);
          // Golden crown celebration — same trigger point RoomJoin.jsx's
          // Realtime listener described in the original spec.
        }
      },
      onPlayerChange: () => {
        // Any insert/update/delete on player_scores — just refetch the
        // room's players rather than hand-patching, since the derived
        // "taken" map and "all filled" check both need the full set.
        fetchPlayers(roomCode)
          .then((rows) => {
            setPlayers(rows);
            const taken = { BLUE: null, PURPLE: null, PINK: null, ORANGE: null };
            rows.forEach((r) => { taken[r.slot_id] = r.name; });
            setTakenChars(taken);

            const filledCount = Object.values(taken).filter(Boolean).length;
            if (filledCount >= 4 && !countdownStartedRef.current) {
              countdownStartedRef.current = true;
              setStage(3);
              beginLocalCountdown();
            }
          })
          .catch((err) => console.error('[App] player refetch failed', err));
      },
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, stage]);

  // -------------------------------------------------------------------
  // Local match-phase orchestration.
  //
  // IMPORTANT GAP vs. the old Socket.io server: backend/server.js used to
  // be the single authority driving 3-2-1 -> GO! -> round-timer -> ENDED
  // for every connected phone in lockstep. Supabase Realtime is passive —
  // it broadcasts DB changes, it doesn't run a clock. Each phone now runs
  // its own countdown/round timer locally instead. For a casual
  // same-room party game the drift is a beat or two, not something
  // players will fight you about — but it is NOT server-authoritative.
  // If you need real sync later, drive match_phase/countdown_tick from a
  // Supabase Edge Function on a cron schedule and have clients just
  // *read* game_rooms instead of computing their own timer.
  // -------------------------------------------------------------------
  const beginLocalCountdown = useCallback(() => {
    setMatchPhase(MATCH_PHASE.COUNTDOWN);
    setCountdownTick(3);

    let tick = 3;
    const interval = setInterval(() => {
      tick -= 1;
      if (tick <= 0) {
        clearInterval(interval);
        setMatchPhase(MATCH_PHASE.ACTIVE);
        setShowGoBurst(true);
        goAudioRef.current?.play().catch(() => {});
        setTimeout(() => setShowGoBurst(false), 650);

        roundTimerRef.current = setTimeout(() => {
          endRoundLocally();
        }, ROUND_DURATION_MS);
      } else {
        setCountdownTick(tick);
      }
    }, 1000);
  }, []);

  const endRoundLocally = useCallback(() => {
    setPlayers((currentPlayers) => {
      const results = [...currentPlayers]
        .sort((a, b) => b.score - a.score)
        .map((p) => ({ name: p.name, score: p.score, color: SLOT_COLORS[p.slot_id] }));
      const winner = results[0];
      setVictoryData({
        winnerName: winner?.name || 'WINNER',
        winnerColor: winner?.color || '#ffd60a',
        results,
      });
      setMatchPhase(MATCH_PHASE.ENDED);
      return currentPlayers;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------
  // Room join — replaces the old socket 'join-room' emit. Gets a GPS fix
  // first (join_room seeds game_rooms.center_lat/lng from it), then hits
  // the RPC. join_room is idempotent (insert ... on conflict do nothing)
  // so this works the same whether you're creating the room or joining
  // one a teammate already opened.
  // -------------------------------------------------------------------
  const handleJoinRoom = async (code) => {
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('This device does not support location services.');
      return;
    }

    setJoining(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await joinRoom(code, pos.coords.latitude, pos.coords.longitude);
          const taken = await fetchTakenCharacters(code);
          setTakenChars(taken);
          setRoomCode(code.toUpperCase());
          setJoining(false);
          setStage(2);
        } catch (err) {
          console.error('[App] joinRoom failed', err);
          setJoining(false);
          setErrorMessage('Could not reach the game server. Check your connection and try again.');
        }
      },
      () => {
        setJoining(false);
        setErrorMessage('Location permission is required to create or join this outdoor room.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  // -------------------------------------------------------------------
  // Character claim — replaces the old 'join-game' emit. Uses the atomic
  // claim_character RPC (see supabase/schema.sql); lockResult is handed
  // to CharacterSelect.jsx so it can un-stick a losing claim instead of
  // spinning forever.
  // -------------------------------------------------------------------
  const handleLockCharacter = async (slotId, claimedName) => {
    setErrorMessage('');
    try {
      const result = await claimCharacter(roomCode, slotId, claimedName);
      setLockResult({ slotId, success: result.success });
      if (result.success) {
        setMySlot(result.slot_id);
        setMyPlayerId(result.player_id);
      }
    } catch (err) {
      console.error('[App] claimCharacter failed', err);
      setLockResult({ slotId, success: false });
      setErrorMessage('Could not claim that slot — try again.');
    }
  };

  const handleInstantReplay = () => {
    setVictoryData(null);
    countdownStartedRef.current = false;
    // Simplest reset for a demo: reload into the same room. A "real" replay
    // (reset scores, respawn veggies, keep the same 4 players) would need
    // its own RPC — flagging as a follow-up rather than guessing at scope.
    window.location.reload();
  };

  const myColor = mySlot ? SLOT_COLORS[mySlot] : '#ffffff';
  const myPlayerRow = players.find((p) => p.id === myPlayerId);
  const myName = myPlayerRow ? myPlayerRow.name : mySlot;

  const inputLocked = matchPhase !== MATCH_PHASE.ACTIVE;

  const playersMap = Object.fromEntries(
    players.map((p) => [p.slot_id, { name: p.name, score: p.score, character: p.slot_id }])
  );

  return (
    <div className="app-container">
      <ConnectionStatus roomCode={roomCode} />
      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {stage === 1 && <RoomJoin onJoin={handleJoinRoom} error={errorMessage} connecting={joining} />}
      {stage === 2 && (
        <CharacterSelect takenChars={takenChars} onLock={handleLockCharacter} lockResult={lockResult} />
      )}

      {stage === 3 && (
        <div className="arena-wrapper">
          <div className="arena-header">
            <h2>ARENA LINK IDENT: {roomCode}</h2>
            <h3>
              PILOT ROLE:{' '}
              <span style={{ color: myColor }}>{myName}</span>
            </h3>
          </div>
          <div className="arena-grid">
            <GameARView
              roomCode={roomCode}
              nickname={myName}
              playerId={myPlayerId}
              onExit={() => setStage(2)}
            />
            <Scoreboard players={playersMap} mySlot={mySlot} />
          </div>
        </div>
      )}

      {/* ── 3-2-1 Arcade Countdown Layer ─────────────────────────────── */}
      <AnimatePresence>
        {matchPhase === MATCH_PHASE.COUNTDOWN && (
          <motion.div
            key="countdown-shield"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: 'rgba(6, 6, 10, 0.72)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdownTick}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.6, opacity: 0.6 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.25, repeat: Infinity, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      width: '160px',
                      height: '160px',
                      borderRadius: '50%',
                      border: '2px solid #ffd60a',
                      boxShadow: '0 0 24px rgba(255,214,10,0.6)'
                    }}
                  />
                ))}
                <span
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '120px',
                    fontWeight: 900,
                    color: '#ffd60a',
                    textShadow: '0 0 30px rgba(255,214,10,0.9), 0 0 60px rgba(255,214,10,0.5)'
                  }}
                >
                  {countdownTick}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Green "GO!" Shockwave ────────────────────────────────────── */}
      <AnimatePresence>
        {showGoBurst && (
          <motion.div
            key="go-burst"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 210,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <motion.div
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{ scale: 6, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(6,214,160,0.9) 0%, rgba(6,214,160,0) 70%)'
              }}
            />
            <motion.span
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'backOut' }}
              style={{
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '96px',
                fontWeight: 900,
                color: '#06d6a0',
                textShadow: '0 0 30px rgba(6,214,160,0.9), 0 0 70px rgba(6,214,160,0.6)'
              }}
            >
              GO!
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
      <audio ref={goAudioRef} src="/audio/go-boom.mp3" preload="auto" />

      {/* ── Concluded Victory Shield ─────────────────────────────────── */}
      <AnimatePresence>
        {matchPhase === MATCH_PHASE.ENDED && victoryData && (
          <motion.div
            key="victory-shield"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 220,
              background: 'rgba(4, 4, 8, 0.88)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              boxSizing: 'border-box'
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              style={{
                width: '100%',
                maxWidth: '380px',
                borderRadius: '20px',
                background: 'linear-gradient(160deg, rgba(24,24,30,0.95), rgba(10,10,14,0.95))',
                border: `1px solid ${victoryData.winnerColor || '#ffd60a'}`,
                boxShadow: `0 0 40px ${victoryData.winnerColor || '#ffd60a'}55`,
                padding: '28px 24px',
                textAlign: 'center'
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 12 }}
                style={{ fontSize: '56px', marginBottom: '8px' }}
              >
                👑
              </motion.div>
              <div
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontSize: '13px',
                  letterSpacing: '2px',
                  color: '#8a8a93',
                  marginBottom: '4px'
                }}
              >
                ROUND COMPLETE
              </div>
              <div
                style={{
                  fontFamily: '"Fredoka", sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: victoryData.winnerColor || '#ffd60a',
                  marginBottom: '20px'
                }}
              >
                {victoryData.winnerName || 'WINNER'}
              </div>

              {Array.isArray(victoryData.results) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                  {victoryData.results.map((r, idx) => (
                    <div
                      key={r.name || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        color: idx === 0 ? '#fff' : '#b6b6c0',
                        fontWeight: idx === 0 ? 700 : 400
                      }}
                    >
                      <span>{idx + 1}. {r.name}</span>
                      <span>{r.score} pts</span>
                    </div>
                  ))}
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleInstantReplay}
                style={{
                  width: '100%',
                  background: 'linear-gradient(180deg, #06d6a0, #05b989)',
                  color: '#04140f',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  fontFamily: '"Orbitron", sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(6,214,160,0.6)'
                }}
              >
                INSTANT REPLAY
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
