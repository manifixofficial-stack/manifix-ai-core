import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// src/components/CharacterSelect.jsx — Stage 2: Color Slot Claim Grid
//
// Pure, dumb presentational component — same as before, just no longer
// tied to any network layer at all (local or otherwise). App.jsx does the
// actual claim (claimCharacter() from lib/gameClient.js, now a local
// in-memory call instead of a Supabase RPC) and hands this component the
// *result* as props:
//   - takenChars: { [slotId]: name|null } — who has claimed what, kept
//     in sync by App.jsx's local subscribeToRoom() listener
//   - onSelect(slotId, name): called on tap; App.jsx does the claim call
//     and setStage(3) transition on success
//   - lockResult: { slotId, success } — result of the most recent claim
//     attempt, used here only to clear the local "Claiming…" spinner
//   - error: surfaced from App.jsx (e.g. "Someone just grabbed that slot")
//
// Slot ids match gameClient.js's fetchTakenCharacters()/claimCharacter()
// EXACTLY. Do not rename these without updating gameClient.js in lockstep.
const SLOT_META = {
  "oggy-blue":   { label: "OGGY",   icon: "🔵", color: "#3a86ff", tagline: "Balanced pace" },
  "jack-green":  { label: "JACK",   icon: "🟢", color: "#2ecc71", tagline: "Swift runner" },
  "olivia-pink": { label: "OLIVIA", icon: "🌸", color: "#ff006e", tagline: "Agile hunter" },
  "bob-purple":  { label: "BOB",    icon: "🟣", color: "#8338ec", tagline: "Heavy hitter" },
};

const SLOT_ORDER = Object.keys(SLOT_META);
const NAME_MAX_LEN = 20; // mirrors PLAYER_NAME_MAX_LEN in gameClient.js

export default function CharacterSelect({ takenChars = {}, onSelect, lockResult, error }) {
  const [name, setName] = useState("");
  const [pendingSlot, setPendingSlot] = useState(null);
  const [localError, setLocalError] = useState("");

  // lockResult arrives from App.jsx once claimCharacter() resolves
  // (success OR failure) — either way, stop showing the "Claiming…"
  // spinner on whichever slot we tapped.
  useEffect(() => {
    if (lockResult) setPendingSlot(null);
  }, [lockResult]);

  // Auto-dismiss local validation toasts (e.g. "enter a name first").
  useEffect(() => {
    if (!localError) return undefined;
    const t = setTimeout(() => setLocalError(""), 2600);
    return () => clearTimeout(t);
  }, [localError]);

  const handleTap = useCallback(
    (slotId) => {
      if (pendingSlot) return; // a claim is already in flight
      if (takenChars[slotId]) return; // slot already has an owner
      if (name.trim().length === 0) {
        setLocalError("Enter a call sign first.");
        return;
      }
      setPendingSlot(slotId);
      onSelect?.(slotId, name.trim().slice(0, NAME_MAX_LEN));
    },
    [pendingSlot, takenChars, name, onSelect]
  );

  const readyCount = SLOT_ORDER.filter((s) => takenChars[s]).length;
  const displayError = error || localError;

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
        <p style={styles.subtitle}>Pick a call sign, then lock in your color.</p>

        <input
          style={styles.nameInput}
          value={name}
          maxLength={NAME_MAX_LEN}
          placeholder="CALL SIGN"
          onChange={(e) => setName(e.target.value)}
          disabled={!!pendingSlot}
        />

        {displayError ? <p style={styles.errorLine}>{displayError}</p> : null}

        <p style={styles.progressLine}>
          {readyCount} / {SLOT_ORDER.length} explorers ready
        </p>

        <div style={styles.grid}>
          <AnimatePresence>
            {SLOT_ORDER.map((slotId) => {
              const meta = SLOT_META[slotId];
              const takenName = takenChars[slotId];
              const isTaken = !!takenName;
              const isPending = pendingSlot === slotId;
              const disabled = isTaken || isPending || !name.trim();

              return (
                <motion.button
                  key={slotId}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileTap={disabled ? {} : { scale: 0.95 }}
                  onClick={() => handleTap(slotId)}
                  disabled={disabled}
                  style={{
                    ...styles.slotCard,
                    background: isPending
                      ? `linear-gradient(135deg, ${meta.color}33, ${meta.color}11)`
                      : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isPending ? meta.color : "rgba(255,255,255,0.08)"}`,
                    cursor: disabled && !isPending ? "not-allowed" : "pointer",
                  }}
                >
                  {isPending && <span style={{ ...styles.pulseRing, borderColor: meta.color }} />}
                  <span style={{ fontSize: 26 }}>{meta.icon}</span>
                  <span style={styles.slotLabel}>{meta.label}</span>
                  <span style={styles.slotStatus}>
                    {isPending
                      ? "Claiming…"
                      : isTaken
                      ? `Taken: ${takenName}`
                      : meta.tagline}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
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
  nameInput: { width: "100%", boxSizing: "border-box", padding: "12px 14px", marginBottom: 10, borderRadius: 10, border: "1px solid rgba(255,215,0,0.4)", background: "rgba(0,0,0,0.5)", color: "#FFD700", fontFamily: "'Orbitron', monospace", fontSize: 12, letterSpacing: 1, textAlign: "center", outline: "none" },
  errorLine: { fontSize: 11, color: "#ff5c5c", marginBottom: 12, fontFamily: "'Orbitron', monospace" },
  progressLine: { fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: 0.5, opacity: 0.75, marginBottom: 18 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", margin: "0 auto" },
  slotCard: { position: "relative", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "#fff", overflow: "hidden", aspectRatio: "1" },
  pulseRing: { position: "absolute", inset: 0, borderRadius: 14, border: "2px solid", pointerEvents: "none" },
  slotLabel: { fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 },
  slotStatus: { fontSize: 10, opacity: 0.7, maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};
