import React, { useState } from "react";

// Dumb/presentational component: just collects the room code and hands it
// off to App.jsx via onJoin. App.jsx owns all socket.io logic (connect,
// emit 'join-room', listen for 'room-joined' / 'room-error'), so this
// component doesn't touch the socket directly — avoids double listeners.
export default function RoomJoin({ onJoin, error, connecting }) {
  const [roomCode, setRoomCode] = useState("");

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const room = roomCode.trim().toUpperCase();
    if (!room || connecting) return;
    onJoin(room);
  };

  return (
    <div className="room-screen">
      <div className="room-card">
        <h1 className="room-title">MANIFIX AI:<br />VEGGIE RUSH</h1>
        <p className="room-subtitle">
          Sit in a physical circle with your friends and type the exact same
          room code to enter the garden arena.
        </p>
        <form onSubmit={handleFormSubmit}>
          <input
            className="room-input"
            type="text"
            placeholder="ENTER PARTY CODE (E.G. 1042)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            maxLength={6}
            required
          />
          {error && <p className="room-error">{error}</p>}
          <button type="submit" className="room-join-btn" disabled={connecting}>
            {connecting ? "Connecting…" : "Connect room"}
          </button>
        </form>
      </div>
    </div>
  );
}
