import React, { useState, useEffect } from 'react';
import { socket } from './socket';
import RoomJoin from './components/RoomJoin';
import CharacterSelect from './components/CharacterSelect';
import ConnectionStatus from './components/ConnectionStatus';
import GameCanvas from './components/GameCanvas';
import Scoreboard from './components/Scoreboard';

const SLOT_COLORS = {
  BLUE: '#3a86ff',
  PURPLE: '#8338ec',
  PINK: '#ff006e',
  ORANGE: '#fb5607'
};

function App() {
  const [stage, setStage] = useState(1); // 1: Room Entry, 2: Slot Claim, 3: Match Arena
  const [roomCode, setRoomCode] = useState('');
  const [takenChars, setTakenChars] = useState({ BLUE: null, PURPLE: null, PINK: null, ORANGE: null });
  const [gameState, setGameState] = useState({ players: {}, vegetables: [], cockroachHack: false });
  const [mySlot, setMySlot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Named handlers so cleanup only removes THIS component's listeners
    const handleRoomJoined = (data) => {
      setRoomCode(data.room);
      setStage(2);
      socket.emit('request-characters');
    };

    const handleRoomError = (data) => {
      setErrorMessage(data.message);
    };

    const handleCharactersUpdate = (data) => {
      setTakenChars(data.taken);
    };

    // Correctly reads the server handshake block object response
    const handleGameJoined = (data) => {
      setMySlot(data.character);
      setStage(3);
    };

    const handleGameState = (state) => {
      setGameState(state);
    };

    socket.on('room-joined', handleRoomJoined);
    socket.on('room-error', handleRoomError);
    socket.on('characters-update', handleCharactersUpdate);
    socket.on('game-joined', handleGameJoined);
    socket.on('game-state', handleGameState);

    return () => {
      socket.off('room-joined', handleRoomJoined);
      socket.off('room-error', handleRoomError);
      socket.off('characters-update', handleCharactersUpdate);
      socket.off('game-joined', handleGameJoined);
      socket.off('game-state', handleGameState);
    };
  }, []);

  const handleJoinRoom = (code) => {
    setErrorMessage('');
    if (!socket.connected) socket.connect();
    socket.emit('join-room', { room: code });
  };

  const handleLockCharacter = (slotId, claimedName) => {
    setErrorMessage('');
    socket.emit('join-game', { character: slotId, name: claimedName });
  };

  // ✅ FIXED LOOKUP ENGINE: Searches your active socket list map rows correctly!
  const myColor = mySlot ? SLOT_COLORS[mySlot] : '#ffffff';
  const localPlayerObject = Object.values(gameState.players).find(p => p.character === mySlot);
  const myName = localPlayerObject ? localPlayerObject.name : mySlot;

  return (
    <div className="app-container">
      <ConnectionStatus roomCode={roomCode} />

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      {stage === 1 && <RoomJoin onJoin={handleJoinRoom} />}

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
            <GameCanvas gameState={gameState} roomCode={roomCode} mySlot={mySlot} />
            <Scoreboard players={gameState.players} mySlot={mySlot} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
