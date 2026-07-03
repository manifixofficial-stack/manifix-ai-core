import React, { useEffect, useRef, useState } from 'react';
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
import { connectTickServer } from './lib/tickClient';

// FIX: these must match CharacterSelect.jsx's ALL_SLOTS ids exactly, and
// schema.sql's slot_id CHECK constraint. Previously this was
// { BLUE, PURPLE, PINK, ORANGE } — a leftover from before CharacterSelect
// was reworked to themed ids, which silently broke color lookups
// (SLOT_COLORS[mySlot] came back undefined) even after the claim itself
// started succeeding.
const SLOT_COLORS = {
  'oggy-blue': '#3a86ff',
  'jack-green': '#2ecc71',
  'olivia-pink': '#ff006e',
  'bob-purple': '#8338ec',
};

const EMPTY_TAKEN = {
  'oggy-blue': null,
  'jack-green': null,
  'olivia-pink': null,
  'bob-purple': null,
};

const MATCH_PHASE = {
  COUNTDOWN: 'COUNTDOWN',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED'
};

function App() {
  const [stage, setStage] = useState(1); // 1: Room Entry, 2: Slot Claim, 3: Match Arena
  const [roomCode, setRoomCode] = useState('');
  const [takenChars, setTakenChars] = useState(EMPTY_TAKEN);
  const [players, setPlayers] = useState([]); // raw player_scores rows for the room
  const [mySlot, setMySlot] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null); // player_scores.id (uuid) — replaces socket.id
  const [errorMessage, setErrorMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const [lockResult, setLockResult] = useState(null); // { slotId, success } — see CharacterSelect.jsx

  // ── Match phase / countdown / victory state ─────────────────────────
  // These only ever change in response to tickClient events — App.jsx does
  // not run its own setInterval/setTimeout for any of this. The tick
  // server (backend/tickserver.js) is the single clock authority; every
  // phone in the room reacts to the same broadcast.
  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [currentLeaderName, setCurrentLeaderName] = useState(null);
  const [tickStatus, setTickStatus] = useState('idle'); // connecting | connected | reconnecting | disconnected
  const goAudioRef = useRef(null);
  const tickConnectionRef = useRef(null);

  // -------------------------------------------------------------------
  // Realtime subscription for the room: player_scores changes drive the
  // taken-slots map and the scoreboard. They do NOT decide when the
  // countdown starts — that's the tick server's job, watching Supabase
  // independently and broadcasting to every phone at once.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode || stage < 2) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onRoomUpdate: (room) => {
        if (room.current_leader_name && room.current_leader_name !== currentLeaderName) {
          setCurrentLeaderName(room.current_leader_name);
          // Golden crown celebration trigger point.
        }
      },
      onPlayerChange: () => {
        fetchPlayers(roomCode)
          .then((rows) => {
            setPlayers(rows);
            const taken = { ...EMPTY_TAKEN };
            rows.forEach((r) => { taken[r.slot_id] = r.name; });
            setTakenChars(taken);
          })
          .catch((err) => console.error('[App] player refetch failed', err));
      },
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, stage]);

  // -------------------------------------------------------------------
  // Tick server connection — the clock. Connects as soon as we have a
  // roomCode so it's already listening by the time the 4th slot gets
  // claimed. onTick firing is the cue to jump to the arena view.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!roomCode) return undefined;

    tickConnectionRef.current = connectTickServer(roomCode, {
      onStatusChange: setTickStatus,

      onTick: (n) => {
        setStage(3);
        setMatchPhase(MATCH_PHASE.COUNTDOWN);
        setCountdownTick(n);
      },

      onGo: () => {
        setMatchPhase(MATCH_PHASE.ACTIVE);
        setShowGoBurst(true);
        goAudioRef.current?.play().catch(() => {});
        setTimeout(() => setShowGoBurst(false), 650);
      },

      onRoundEnd: (results) => {
        const mapped = (results || []).map((r) => ({
          name: r.name,
          score: r.score,
          color: SLOT_COLORS[r.slot_id] || '#ffd60a',
        }));
        const winner = mapped[0];
        setVictoryData({
          winnerName: winner?.name || 'WINNER',
          winnerColor: winner?.color || '#ffd60a',
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

  // -------------------------------------------------------------------
  // Room join — gets a GPS fix first (join_room seeds
  // game_rooms.center_lat/lng from it), then hits the RPC. join_room is
  // idempotent (insert ... on conflict do nothing) so this works the same
  // whether you're creating the room or joining one a teammate opened.
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
  // Character claim.
  //
  // FIX: CharacterSelect.jsx invokes this via the `onSelect` prop, not
  // `onLock` — the two names had drifted apart, so the click handler was
  // never being called at all (it fell back to the component's no-op
  // default). That was the actual cause of "click a card, nothing
  // happens, no error" — the request never left the browser. Confirm the
  // JSX below says `onSelect={handleLockCharacter}`.
  //
  // CharacterSelect also passes a 3rd argument (lobbySize) that this
  // function intentionally ignores for now — there's no lobby_size
  // handling wired into claim_character or the tick server yet, so
  // Duo/Trio mode doesn't change server behavior yet. Extra JS args are
  // harmless (just unused), this is not a bug, just an unbuilt feature.
  // -------------------------------------------------------------------
  const handleLockCharacter = async (slotId, claimedName /*, lobbySize */) => {
    setErrorMessage('');
    try {
      const result = await claimCharacter(roomCode, slotId, claimedName);
      setLockResult({ slotId, success: result.success });
      if (result.success) {
        setMySlot(result.slot_id);
        setMyPlayerId(result.player_id);
      } else {
        setErrorMessage(
          result.reason === 'slot_taken'
            ? 'Someone just grabbed that slot — pick another.'
            : 'Could not claim that slot — try again.'
        );
      }
    } catch (err) {
      console.error('[App] claimCharacter failed', err);
      setLockResult({ slotId, success: false });
      setErrorMessage('Could not reach the game server — check your connection and try again.');
    }
  };

  const handleInstantReplay = () => {
    setVictoryData(null);
    // Still a hard reload for now — see MIGRATION_NOTES.md gap #3.
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
      <ConnectionStatus roomCode={roomCode} tickStatus={tickStatus} />
      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {stage === 1 && <RoomJoin onJoin={handleJoinRoom} error={errorMessage} connecting={joining} />}
      {stage === 2 && (
        <CharacterSelect
          takenChars={takenChars}
          onSelect={handleLockCharacter}
          lockResult={lockResult}
          error={errorMessage}
        />
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
