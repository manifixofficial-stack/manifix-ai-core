import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket, EVENTS, joinCharacter, requestCharacters } from "../socket.js";

// Must mirror backend/server.js's CHARACTERS / CHARACTER_COLORS exactly — the
// server is the source of truth for which slot keys are valid and what
// speedMultiplier each grants. There's no shared package between
// frontend/backend in this repo, so keep these two lists in sync by hand.
const CHARACTER_ORDER = ["BLUE", "PURPLE", "PINK", "ORANGE"];

const CHARACTER_META = {
  BLUE: { label: "AQUA DASH", icon: "🔵", color: "#3a86ff", tagline: "Balanced pace" },
  PURPLE: { label: "VOID SPRINTER", icon: "🟣", color: "#8338ec", tagline: "Fastest (1.2x)" },
  PINK: { label: "NEON BLUR", icon: "🌸", color: "#ff006e", tagline: "Swift (1.1x)" },
  ORANGE: { label: "EMBER TANK", icon: "🟠", color: "#fb5607", tagline: "Heavy hitter (0.8x)" },
};

const LOBBY_SIZE_OPTIONS = [
  { size: 2, label: "DUO", sub: "2 players" },
  { size: 3, label: "TRIO", sub: "3 players" },
  { size: 4, label: "QUAD", sub: "4 players" },
];

const NAME_MAX_LEN = 20; // mirrors PLAYER_NAME_MAX_LEN in backend/server.js

export default function CharacterSelect({ roomCode, onCharacterConfirmed }) {
  const [lobbySize, setLobbySize] = useState(4);
  const [name, setName] = useState("");
  const [takenCharacters, setTakenCharacters] = useState({
    BLUE: false,
    PURPLE: false,
    PINK: false,
    ORANGE: false,
  });
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    requestCharacters();

    const handleCharactersUpdate = (data) => {
      setTakenCharacters(data?.taken || {});
    };
    const handleCharacterError = (data) => {
      setError(data?.message || "That role isn't available.");
    };
    const handleGameJoined = (data) => {
      if (data?.success) {
        setSelectedCharacter(data.character);
        setError("");
        onCharacterConfirmed?.(data.character);
      }
    };
    const handleLobbySizeUpdate = (data) => {
      if (typeof data?.size === "number") setLobbySize(data.size);
    };

    socket.on(EVENTS.CHARACTERS_UPDATE, handleCharactersUpdate);
    socket.on(EVENTS.CHARACTER_ERROR, handleCharacterError);
    socket.on(EVENTS.GAME_JOINED, handleGameJoined);
    // Not implemented in backend/server.js yet — see the comment on
    // handleLobbySizeSelect below for why this is a soft, not-yet-load-bearing
    // sync channel rather than the thing that actually gates round start.
    socket.on("lobby-size-update", handleLobbySizeUpdate);

    return () => {
      socket.off(EVENTS.CHARACTERS_UPDATE, handleCharactersUpdate);
      socket.off(EVENTS.CHARACTER_ERROR, handleCharacterError);
      socket.off(EVENTS.GAME_JOINED, handleGameJoined);
      socket.off("lobby-size-update", handleLobbySizeUpdate);
    };
  }, [onCharacterConfirmed]);

  // Auto-dismiss error toasts instead of leaving them stuck on screen.
  useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(""), 2600);
    return () => clearTimeout(t);
  }, [error]);

  // IMPORTANT: this broadcasts the chosen lobby size, but backend/server.js
  // has no 'set-lobby-size' handler yet, and its round-start check —
  // `Object.values(room.takenCharacters).every(Boolean)` — always waits for
  // all 4 slots no matter what's picked here. Selecting Duo/Trio will
  // visually lock the extra slot(s) client-side, but the round will never
  // auto-start with fewer than 4 players until the server is patched to
  // track a per-room max size and check against that instead of a hardcoded
  // 4. Flagging inline rather than shipping a silent dead end.
  const handleLobbySizeSelect = useCallback((size) => {
    setLobbySize(size);
    socket.emit("set-lobby-size", { size });
  }, []);

  const handleSelect = useCallback(
    (charKey, slotIndex) => {
      if (slotIndex >= lobbySize) return; // locked slot for this lobby size
      if (name.trim().length === 0) {
        setError("Enter a call sign first.");
        return;
      }
      if (takenCharacters[charKey] && charKey !== selectedCharacter) {
        setError("Role taken by a friend!");
        return;
      }
      joinCharacter(charKey, name.trim().slice(0, NAME_MAX_LEN));
    },
    [lobbySize, name, takenCharacters, selectedCharacter]
  );

  const readyCount = CHARACTER_ORDER.slice(0, lobbySize).filter((c) => takenCharacters[c]).length;

  return (
    <div style={styles.screen}>
      <div style={styles.scanGrid} />
      <div style={{ ...styles.orb, top: "-40px", left: "-40px", background: "#FFD700" }} />
      <div style={{ ...styles.orb, bottom: "-40px", right: "-40px", background: "#8338ec" }} />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <h1 style={styles.title}>CHOOSE YOUR HUNTER</h1>
        <p style={styles.subtitle}>Room {roomCode} — pick a lobby size and lock in your color.</p>

        <div style={styles.sizeRow}>
          {LOBBY_SIZE_OPTIONS.map((opt) => {
            const active = opt.size === lobbySize;
            return (
              <div
                key={opt.size}
                role="button"
                tabIndex={0}
                onClick={() => handleLobbySizeSelect(opt.size)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleLobbySizeSelect(opt.size);
                }}
                style={{
                  ...styles.sizeChip,
                  borderColor: active ? "#FFD700" : "rgba(255,255,255,0.12)",
                  background: active ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.02)",
                }}
              >
                <span style={{ ...styles.sizeChipLabel, color: active ? "#FFD700" : "#F5F0E8" }}>
                  {opt.label}
                </span>
                <span style={styles.sizeChipSub}>{opt.sub}</span>
              </div>
            );
          })}
        </div>

        <input
          style={styles.nameInput}
          value={name}
          maxLength={NAME_MAX_LEN}
          placeholder="CALL SIGN"
          onChange={(e) => setName(e.target.value)}
          disabled={!!selectedCharacter}
        />

        {error ? <p style={styles.errorLine}>{error}</p> : null}

        <p style={styles.progressLine}>
          {readyCount} / {lobbySize} explorers ready
        </p>

        <div style={styles.grid}>
          <AnimatePresence>
            {CHARACTER_ORDER.map((charKey, slotIndex) => {
              const meta = CHARACTER_META[charKey];
              const locked = slotIndex >= lobbySize;
              const takenByOther = takenCharacters[charKey] && charKey !== selectedCharacter;
              const isMine = charKey === selectedCharacter;

              return (
                <motion.button
                  key={charKey}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: locked ? 0.35 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileTap={locked || takenByOther ? {} : { scale: 0.95 }}
                  onClick={() => handleSelect(charKey, slotIndex)}
                  disabled={locked || takenByOther}
                  style={{
                    ...styles.slotCard,
                    background: isMine
                      ? `linear-gradient(135deg, ${meta.color}55, ${meta.color}22)`
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isMine ? meta.color : "rgba(255,255,255,0.08)"}`,
                    cursor: locked || takenByOther ? "not-allowed" : "pointer",
                  }}
                >
                  {isMine && <span style={{ ...styles.pulseRing, borderColor: meta.color }} />}
                  <span style={{ fontSize: 26 }}>{locked ? "🔒" : meta.icon}</span>
                  <span style={styles.slotLabel}>{meta.label}</span>
                  <span style={styles.slotStatus}>
                    {locked
                      ? "Locked for this lobby size"
                      : isMine
                      ? "YOU"
                      : takenByOther
                      ? "Taken"
                      : meta.tagline}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {lobbySize < 4 && (
          <p style={styles.hint}>
            {lobbySize === 2
              ? "Duo mode: split the garden, split the glory."
              : "Trio mode: three-way chaos, one garden."}
          </p>
        )}
      </motion.div>
    </div>
  );
}

const styles = {
  screen: { position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#08080a", overflow: "hidden" },
  orb: { position: "absolute", width: "160px", height: "160px", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none", zIndex: 0 },
  scanGrid: { position: "absolute", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,215,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px)", backgroundSize: "34px 34px", maskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%)" },
  card: { position: "relative", zIndex: 2, width: "min(92vw, 400px)", maxHeight: "88vh", overflowY: "auto", padding: "28px 24px", borderRadius: "20px", background: "rgba(18, 16, 12, 0.72)", border: "1px solid rgba(255, 215, 0, 0.35)", boxShadow: "0 0 40px rgba(255, 215, 0, 0.08), inset 0 0 30px rgba(0,0,0,0.4)", backdropFilter: "blur(10px)", textAlign: "center", fontFamily: "'Fredoka', sans-serif", color: "#F5F0E8" },
  title: { fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: 1, color: "#FFD700", margin: "0 0 6px" },
  subtitle: { fontSize: 12, opacity: 0.75, margin: "0 0 18px" },
  sizeRow: { display: "flex", gap: 8, marginBottom: 16 },
  sizeChip: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "10px 6px", borderRadius: 12, border: "1px solid", color: "#F5F0E8", cursor: "pointer" },
  sizeChipLabel: { fontFamily: "'Orbitron', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: 0.5 },
  sizeChipSub: { fontSize: 9, opacity: 0.55, textAlign: "center" },
  nameInput: { width: "100%", boxSizing: "border-box", padding: "12px 14px", marginBottom: 10, borderRadius: 10, border: "1px solid rgba(255,215,0,0.4)", background: "rgba(0,0,0,0.5)", color: "#FFD700", fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 1, textAlign: "center", outline: "none" },
  errorLine: { fontSize: 11, color: "#ff5c5c", marginBottom: 12, fontFamily: "'Orbitron', monospace" },
  progressLine: { fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 0.5, opacity: 0.75, marginBottom: 18 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", margin: "0 auto" },
  slotCard: { position: "relative", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#fff", overflow: "hidden", aspectRatio: "1" },
  pulseRing: { position: "absolute", inset: 0, borderRadius: 14, border: "2px solid", pointerEvents: "none" },
  slotLabel: { fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
  slotStatus: { fontSize: 10, opacity: 0.7, maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  hint: { marginTop: 16, fontSize: 11, opacity: 0.6, textAlign: "center" },
};
