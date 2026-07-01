import React, { useState } from "react";
import { socket } from "../socket.js";

export default function RoomJoin({ onJoined }) {
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const room = roomCode.trim().toUpperCase();
    if (!room || connecting) return;

    setError("");
    setConnecting(true);

    if (!socket.connected) socket.connect();
    socket.emit("join-room", { room });

    const handleRoomJoined = () => {
      cleanup();
      setConnecting(false);
      onJoined(room);
    };
    const handleRoomError = (payload) => {
      cleanup();
      setConnecting(false);
      setError(payload?.message || "Could not join that room");
    };
    const cleanup = () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-error", handleRoomError);
    };

    socket.on("room-joined", handleRoomJoined);
    socket.on("room-error", handleRoomError);
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
