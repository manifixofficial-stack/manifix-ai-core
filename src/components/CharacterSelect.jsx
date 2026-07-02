import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// src/components/CharacterSelect.jsx — Stage 2: Squad Up
//
// UPDATED for Supabase: this component never talks to Supabase directly —
// App.jsx owns the claimCharacter() RPC call and passes the outcome back
// down via `lockResult`. That's the one behavior change from the Socket.io
// version: because claim_character is now atomic at the DB level (unique
// constraint on room_code+slot_id), a claim can genuinely fail if someone
// else's insert won the race in the same instant. `lockResult` lets this
// component un-stick the "locking in…" state instead of hanging forever.
//
// lockResult shape: { slotId: string, success: boolean } | null
const SLOT_COLORS = ["#3a86ff", "#8338ec", "#ff006e", "#fb5607"];

const ALL_SLOTS = [
  { id: "BLUE", color: "#3a86ff", icon: "🥕", vibe: "chill" },
  { id: "PURPLE", color: "#8338ec", icon: "🍆", vibe: "wild" },
  { id: "PINK", color: "#ff006e", icon: "🍓", vibe: "unbothered" },
  { id: "ORANGE", color: "#fb5607", icon: "🎃", vibe: "menace" },
];

const LOBBY_SIZES = [
  { size: 2, label: "DUO", sub: "you + one bestie", icon: "🤝" },
  { size: 3, label: "TRIO", sub: "three's the vibe", icon: "3️⃣" },
  { size: 4, label: "SQUAD", sub: "full 4-player chaos", icon: "🔥" },
];

export default function CharacterSelect({
  takenChars = {},
  onLock = () => {},
  onLobbySizeChange,
  lockResult = null,
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(null);
  const [slotTakenError, setSlotTakenError] = useState(null);
  const [lobbySize, setLobbySize] = useState(4);

  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const activeSlots = useMemo(() => ALL_SLOTS.slice(0, lobbySize), [lobbySize]);
  const filledCount = activeSlots.filter((s) => takenChars[s.id]).length;

  // React to the claim result coming back from App.jsx's atomic RPC call.
  useEffect(() => {
    if (!lockResult) return;
    if (lockResult.slotId !== pending) return;

    if (lockResult.success) {
      // takenChars will update via the realtime subscription momentarily;
      // just clear the local "pending" spinner state.
      setPending(null);
    } else {
      // Someone else's claim landed first — release the slot back to the
      // grid instead of leaving it stuck on "locking in…" forever.
      setPending(null);
      setSlotTakenError(lockResult.slotId);
      setTimeout(() => setSlotTakenError(null), 2000);
    }
  }, [lockResult, pending]);

  const changeLobbySize = (size) => {
    if (pending) return; // don't let the size shift mid-claim
    setLobbySize(size);
    onLobbySizeChange?.(size);
  };

  const handlePick = (slotId) => {
    if (takenChars[slotId] || pending) return;
    const claimedName = name.trim() || `Player ${slotId[0]}`;
    setPending(slotId);
    onLock(slotId, claimedName);
  };

  return (
    <div style={styles.screen}>
      {/* Ambient color-bloom orbs — same signature as RoomJoin */}
      {!reduceMotion &&
        SLOT_COLORS.map((color, i) => (
          <motion.div
            key={color}
            style={{ ...styles.orb, background: color, left: `${10 + i * 24}%`, top: `${8 + (i % 2) * 55}%` }}
            animate={{
              x: [0, 22, -14, 0],
              y: [0, -18, 14, 0],
              opacity: [0.16, 0.28, 0.16],
            }}
            transition={{ duration: 9 + i * 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

      {/* Faint holographic scanline grid — same signature as RoomJoin */}
      <div style={styles.scanGrid} />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={styles.title}>MANIFIX VEGGIE GO</h1>
        <p style={styles.subtitle}>Pick your crew size, drop a name, lock your color.</p>

        {/* Lobby size selector — solo, duo, or full squad */}
        <div style={styles.sizeRow}>
          {LOBBY_SIZES.map((opt) => {
            const active = lobbySize === opt.size;
            return (
              <motion.button
                key={opt.size}
                type="button"
                onClick={() => changeLobbySize(opt.size)}
                disabled={Boolean(pending)}
                whileTap={!pending ? { scale: 0.95 } : {}}
                style={{
                  ...styles.sizeChip,
                  borderColor: active ? "#FFD700" : "rgba(255,215,0,0.18)",
                  background: active ? "rgba(255,215,0,0.12)" : "rgba(0,0,0,0.3)",
                  opacity: pending ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.icon}</span>
                <span style={styles.sizeChipLabel}>{opt.label}</span>
                <span style={styles.sizeChipSub}>{opt.sub}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="YOUR CALLSIGN (OPTIONAL)"
          maxLength={16}
          whileFocus={{
            boxShadow: "0 0 0 2px rgba(255,215,0,0.55), 0 0 24px rgba(255,215,0,0.35)",
          }}
          style={styles.nameInput}
        />

        {/* Live fill progress */}
        <p style={styles.progressLine}>
          {filledCount} / {activeSlots.length} LOCKED IN
          {filledCount === activeSlots.length && activeSlots.length > 0 && (
            <span style={{ color: "#39ff88" }}> — LET'S GOOO</span>
          )}
        </p>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: "1fr 1fr",
            maxWidth: 300,
          }}
        >
          <AnimatePresence>
            {activeSlots.map((slot) => {
              const takenBy = takenChars[slot.id];
              const isPending = pending === slot.id;
              const justFailed = slotTakenError === slot.id;
              const disabled = Boolean(takenBy) || Boolean(pending);

              return (
                <motion.button
                  key={slot.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileTap={!disabled ? { scale: 0.94 } : {}}
                  onClick={() => handlePick(slot.id)}
                  disabled={disabled}
                  style={{
                    ...styles.slotCard,
                    aspectRatio: "1",
                    border: `2px solid ${justFailed ? "#ff5c5c" : slot.color}`,
                    background: takenBy
                      ? `${slot.color}22`
                      : isPending
                      ? `${slot.color}44`
                      : "rgba(0,0,0,0.3)",
                    opacity: takenBy && !isPending ? 0.5 : 1,
                    boxShadow: isPending ? `0 0 24px ${slot.color}` : "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {isPending && (
                    <motion.div
                      style={{ ...styles.pulseRing, borderColor: slot.color }}
                      initial={{ scale: 0.7, opacity: 0.8 }}
                      animate={{ scale: 1.4, opacity: 0 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}
                  <span style={{ fontSize: 28 }}>{slot.icon}</span>
                  <span style={{ ...styles.slotLabel, color: slot.color }}>{slot.id}</span>
                  <span style={styles.slotStatus}>
                    {justFailed
                      ? "just taken!"
                      : takenBy
                      ? takenBy
                      : isPending
                      ? "locking in…"
                      : `open · ${slot.vibe}`}
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
  screen: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#08080a",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: "160px",
    height: "160px",
    borderRadius: "50%",
    filter: "blur(50px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  scanGrid: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    backgroundImage:
      "linear-gradient(rgba(255,215,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.05) 1px, transparent 1px)",
    backgroundSize: "34px 34px",
    maskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%)",
    WebkitMaskImage: "radial-gradient(ellipse at 50% 40%, black 0%, transparent 75%)",
  },
  card: {
    position: "relative",
    zIndex: 2,
    width: "min(92vw, 400px)",
    maxHeight: "88vh",
    overflowY: "auto",
    padding: "28px 24px",
    borderRadius: "20px",
    background: "rgba(18, 16, 12, 0.72)",
    border: "1px solid rgba(255, 215, 0, 0.35)",
    boxShadow: "0 0 40px rgba(255, 215, 0, 0.08), inset 0 0 30px rgba(0,0,0,0.4)",
    backdropFilter: "blur(10px)",
    textAlign: "center",
    fontFamily: "'Fredoka', sans-serif",
    color: "#F5F0E8",
  },
  title: {
    fontFamily: "'Orbitron', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: 1,
    color: "#FFD700",
    margin: "0 0 6px",
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.75,
    margin: "0 0 18px",
  },
  sizeRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  sizeChip: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "10px 6px",
    borderRadius: 12,
    border: "1px solid",
    color: "#F5F0E8",
    cursor: "pointer",
  },
  sizeChipLabel: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  sizeChipSub: {
    fontSize: 9,
    opacity: 0.55,
    textAlign: "center",
  },
  nameInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    marginBottom: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,215,0,0.4)",
    background: "rgba(0,0,0,0.5)",
    color: "#FFD700",
    fontFamily: "'Orbitron', monospace",
    fontSize: 12,
    letterSpacing: 1,
    textAlign: "center",
    outline: "none",
  },
  progressLine: {
    fontFamily: "'Orbitron', monospace",
    fontSize: 11,
    letterSpacing: 0.5,
    opacity: 0.75,
    marginBottom: 18,
  },
  grid: {
    display: "grid",
    gap: 12,
    width: "100%",
    margin: "0 auto",
  },
  slotCard: {
    position: "relative",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    color: "#fff",
    overflow: "hidden",
  },
  pulseRing: {
    position: "absolute",
    inset: 0,
    borderRadius: 14,
    border: "2px solid",
    pointerEvents: "none",
  },
  slotLabel: {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  slotStatus: {
    fontSize: 10,
    opacity: 0.7,
    maxWidth: "90%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  hint: {
    marginTop: 16,
    fontSize: 11,
    opacity: 0.6,
    textAlign: "center",
  },
};
