import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from './socket';
import RoomJoin from './components/RoomJoin';
import CharacterSelect from './components/CharacterSelect';
import ConnectionStatus from './components/ConnectionStatus';
import GameARView from './components/GameCanva';
import Scoreboard from './components/Scoreboard';

const SLOT_COLORS = {
  BLUE: '#3a86ff',
  PURPLE: '#8338ec',
  PINK: '#ff006e',
  ORANGE: '#fb5607'
};

// Match phases within Stage 3 (the arena). These ride on top of `stage`
// so App.jsx stays the single router for the whole app, per spec.
const MATCH_PHASE = {
  COUNTDOWN: 'COUNTDOWN', // 3-2-1 glass shield, thumbs locked
  ACTIVE: 'ACTIVE',       // GO! fired, joysticks live
  ENDED: 'ENDED'          // victory shield / instant replay
};

function App() {
  const [stage, setStage] = useState(1); // 1: Room Entry, 2: Slot Claim, 3: Match Arena
  const [roomCode, setRoomCode] = useState('');
  const [takenChars, setTakenChars] = useState({ BLUE: null, PURPLE: null, PINK: null, ORANGE: null });
  const [gameState, setGameState] = useState({ players: {}, vegetables: [], cockroachHack: false, geofence: null });
  const [mySlot, setMySlot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [joining, setJoining] = useState(false); // true while awaiting GPS fix + server ack

  // ── Match phase / countdown / victory state ─────────────────────────
  const [matchPhase, setMatchPhase] = useState(null); // null until 4th slot secures
  const [countdownTick, setCountdownTick] = useState(3); // 3, 2, 1
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null); // { winnerName, winnerColor, results: [...] }
  const goAudioRef = useRef(null);

  useEffect(() => {
    // Named handlers so cleanup only removes THIS component's listeners
    const handleRoomJoined = (data) => {
      setJoining(false);
      setRoomCode(data.room);
      setStage(2);
      socket.emit('request-characters');
    };
    const handleRoomError = (data) => {
      setJoining(false);
      setErrorMessage(data.message);
    };
    const handleCharactersUpdate = (data) => {
      setTakenChars(data.taken);
      // Deploy the countdown shield the instant all 4 slots lock in.
      const allFilled = Object.values(data.taken).every(Boolean);
      if (allFilled) {
        setStage(3);
        setMatchPhase(MATCH_PHASE.COUNTDOWN);
        setCountdownTick(3);
      }
    };
    // Correctly reads the server handshake block object response
    const handleGameJoined = (data) => {
      setMySlot(data.character);
      setStage(3);
    };
    const handleGameState = (state) => {
      setGameState(state);
    };

    // Server-driven countdown ticks: { tick: 3 | 2 | 1 }
    const handleMatchCountdown = (data) => {
      setMatchPhase(MATCH_PHASE.COUNTDOWN);
      setCountdownTick(data.tick);
    };

    // Server fires this the instant the clock hits zero
    const handleMatchGo = () => {
      setMatchPhase(MATCH_PHASE.ACTIVE);
      setShowGoBurst(true);
      goAudioRef.current?.play().catch(() => {});
      // Let the emerald shockwave graphic play out, then clear it
      setTimeout(() => setShowGoBurst(false), 650);
    };

    // Server fires this when the round timer hits 0s: { winnerName, winnerColor, results }
    const handleMatchEnded = (data) => {
      setMatchPhase(MATCH_PHASE.ENDED);
      setVictoryData(data);
    };

    socket.on('room-joined', handleRoomJoined);
    socket.on('room-error', handleRoomError);
    socket.on('characters-update', handleCharactersUpdate);
    socket.on('game-joined', handleGameJoined);
    socket.on('game-state', handleGameState);
    socket.on('match-countdown', handleMatchCountdown);
    socket.on('match-go', handleMatchGo);
    socket.on('match-ended', handleMatchEnded);

    return () => {
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-error', handleRoomError);
      socket.off('characters-update', handleCharactersUpdate);
      socket.off('game-joined', handleGameJoined);
      socket.off('game-state', handleGameState);
      socket.off('match-countdown', handleMatchCountdown);
      socket.off('match-go', handleMatchGo);
      socket.off('match-ended', handleMatchEnded);
    };
  }, []);

  // FIXED: the server's join-room handler requires real lat/lng to center the
  // outdoor geofence (see server.js). We now grab a GPS fix BEFORE emitting,
  // instead of sending { room: code } alone and hitting the server's
  // "Location permission is required..." rejection every time.
  const handleJoinRoom = (code) => {
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('This device does not support location services.');
      return;
    }

    setJoining(true);
    if (!socket.connected) socket.connect();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        socket.emit('join-room', {
          room: code,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => {
        setJoining(false);
        setErrorMessage('Location permission is required to create or join this outdoor room.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  const handleLockCharacter = (slotId, claimedName) => {
    setErrorMessage('');
    socket.emit('join-game', { character: slotId, name: claimedName });
  };

  const handleInstantReplay = () => {
    setVictoryData(null);
    setMatchPhase(MATCH_PHASE.COUNTDOWN);
    setCountdownTick(3);
    socket.emit('request-replay', { room: roomCode });
  };

  // ✅ FIXED LOOKUP ENGINE: Searches your active socket list map rows correctly!
  const myColor = mySlot ? SLOT_COLORS[mySlot] : '#ffffff';
  const localPlayerObject = Object.values(gameState.players).find(p => p.character === mySlot);
  const myName = localPlayerObject ? localPlayerObject.name : mySlot;

  // Joysticks/input only live once GO! has fired and the round hasn't ended
  const inputLocked = matchPhase !== MATCH_PHASE.ACTIVE;

  return (
    <div className="app-container">
      <ConnectionStatus roomCode={roomCode} />
      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {stage === 1 && <RoomJoin onJoin={handleJoinRoom} error={errorMessage} connecting={joining} />}
      {stage === 2 && <CharacterSelect takenChars={takenChars} onLock={handleLockCharacter} />}

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
              gameState={gameState}
              roomCode={roomCode}
              mySlot={mySlot}
              geofence={gameState.geofence}
              inputLocked={inputLocked}
            />
            <Scoreboard players={gameState.players} mySlot={mySlot} />
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
                {/* Halo pulse rings */}
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
      {/* Low bass arcade thump — drop a BOOM.mp3 asset in /public/audio/ */}
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
