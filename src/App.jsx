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

const SLOT_COLORS = {
  'oggy-blue': '#3a86ff',
  'jack-green': '#2ecc71',
  'olivia-pink': '#ff006e',
  'bob-purple': '#8338ec'
};

const MATCH_PHASE = {
  COUNTDOWN: 'COUNTDOWN',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED'
};

function App() {
  const [stage, setStage] = useState(1); // 1: Room Entry, 2: Slot Claim, 3: Match Arena
  const [roomCode, setRoomCode] = useState('');
  const [takenChars, setTakenChars] = useState({
    'oggy-blue': null,
    'jack-green': null,
    'olivia-pink': null,
    'bob-purple': null
  });
  const [players, setPlayers] = useState([]);
  const [mySlot, setMySlot] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  // FIX: track the player's live position + chosen name so claimCharacter()
  // and GameCanvas both have what they need — neither was available before.
  const [myPosition, setMyPosition] = useState(null);
  const [myName, setMyName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const [lockResult, setLockResult] = useState(null);

  const [matchPhase, setMatchPhase] = useState(null);
  const [countdownTick, setCountdownTick] = useState(3);
  const [showGoBurst, setShowGoBurst] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [currentLeaderName, setCurrentLeaderName] = useState(null);
  const [tickStatus, setTickStatus] = useState('idle');
  const goAudioRef = useRef(null);
  const tickConnectionRef = useRef(null);

  useEffect(() => {
    if (!roomCode || stage < 2) return undefined;

    const unsubscribe = subscribeToRoom(roomCode, {
      onRoomUpdate: (room) => {
        if (room.current_leader_name && room.current_leader_name !== currentLeaderName) {
          setCurrentLeaderName(room.current_leader_name);
        }
      },
      onPlayerChange: () => {
        fetchPlayers(roomCode)
          .then((rows) => {
            setPlayers(rows);
            const taken = { 'oggy-blue': null, 'jack-green': null, 'olivia-pink': null, 'bob-purple': null };
            rows.forEach((r) => { if (r.slot_id) taken[r.slot_id] = r.name; });
            setTakenChars(taken);
          })
          .catch((err) => console.error('[App] player refetch failed', err));
      },
    });

    return unsubscribe;
  }, [roomCode, stage]);

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
          const { latitude, longitude } = pos.coords;
          setMyPosition({ lat: latitude, lng: longitude });

          // FIX: correct arg order (roomCode, lat, lng) — was (lat, lng, roomCode).
          // Also now capturing the result so we have player_id for claimCharacter().
          const joinResult = await joinRoom(code, latitude, longitude);
          setMyPlayerId(joinResult.player_id);

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

  const handleLockCharacter = async (slotId, claimedName) => {
    setErrorMessage('');

    if (!myPlayerId || !myPosition) {
      setErrorMessage('Still setting up your session — try again in a moment.');
      return;
    }

    try {
      // FIX: correct arg order + all 6 params claim_character() requires.
      // Was: claimCharacter(claimedName, roomCode, slotId) — wrong order,
      // missing playerId/lat/lng entirely.
      const result = await claimCharacter(
        roomCode,
        slotId,
        claimedName,
        myPlayerId,
        myPosition.lat,
        myPosition.lng
      );
      const success = result.status === 'success' || result.success === true;
      setLockResult({ slotId, success });
      if (success) {
        setMySlot(result.slot_id);
        setMyName(claimedName);
      } else {
        setErrorMessage(result.message || 'Slot selection failed.');
      }
    } catch (err) {
      console.error('[App] claimCharacter failed', err);
      setLockResult({ slotId, success: false });
      setErrorMessage('Could not claim that slot — try again.');
    }
  };

  const handleInstantReplay = () => {
    setVictoryData(null);
    window.location.reload();
  };

  // FIX: GameCanvas expects an onExit handler for its ✕ button; nothing
  // was wired up before.
  const handleExitGame = () => {
    tickConnectionRef.current?.disconnect();
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#111' }}>
      <ConnectionStatus roomCode={roomCode} />

      <audio ref={goAudioRef} src="/sounds/chii-chiip.mp3" preload="auto" />

      {stage === 1 && (
        <RoomJoin onJoin={handleJoinRoom} error={errorMessage} joining={joining} />
      )}

      {stage === 2 && (
       <CharacterSelect takenChars={takenChars} onSelect={handleLockCharacter} lockResult={lockResult} error={errorMessage} />
      )}

      {stage === 3 && (
        <>
          <Scoreboard players={players} />

          {/* FIX: prop names now match GameCanvas's actual signature
              (roomCode, nickname, playerId, onExit) — was passing
              myPlayerId/mySlot with no nickname or onExit at all. */}
          <GameARView
            roomCode={roomCode}
            nickname={myName}
            playerId={myPlayerId}
            onExit={handleExitGame}
          />

          {matchPhase === MATCH_PHASE.COUNTDOWN && (
            <div style={styles.countdownOverlay}>
              <motion.div key={countdownTick} initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.tickNum}>
                {countdownTick}
              </motion.div>
            </div>
          )}

          <AnimatePresence>
            {showGoBurst && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1.2 }} exit={{ opacity: 0 }} style={styles.goBurst}>
                SATELLITE GO! 🚀
              </motion.div>
            )}
          </AnimatePresence>

          {matchPhase === MATCH_PHASE.ENDED && victoryData && (
            <div style={styles.victoryCard}>
              <h2 style={{ color: victoryData.winnerColor }}>🏆 WINNER: {victoryData.winnerName}</h2>
              <button onClick={handleInstantReplay} style={styles.replayBtn}>Play Again</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  countdownOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2000 },
  tickNum: { fontSize: '120px', fontWeight: 900, color: '#ffcc00', fontFamily: "'Orbitron', sans-serif" },
  goBurst: { position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '45px', fontWeight: 900, color: '#39ff88', zIndex: 2001, textShadow: '0 0 20px #39ff88', textAlign: 'center', pointerEvents: 'none' },
  victoryCard: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#222', padding: '30px', borderRadius: '20px', border: '3px solid #ffcc00', textAlign: 'center', zIndex: 3000, color: 'white' },
  replayBtn: { marginTop: '20px', padding: '10px 20px', background: '#ffcc00', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;
