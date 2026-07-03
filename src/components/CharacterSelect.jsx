import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SLOT_META = {
  "oggy-blue":   { label: "OGGY",   icon: "🔵", color: "#3a86ff" },
  "jack-green":  { label: "JACK",   icon: "🟢", color: "#2ecc71" },
  "olivia-pink": { label: "OLIVIA", icon: "🌸", color: "#ff006e" },
  "bob-purple":  { label: "BOB",    icon: "🟣", color: "#8338ec" },
};
const SLOT_ORDER = Object.keys(SLOT_META);
const NAME_MAX_LEN = 20;

export default function CharacterSelect({ takenChars = {}, onSelect, lockResult, error }) {
  const [name, setName] = useState("");
  const [pendingSlot, setPendingSlot] = useState(null);

  // lockResult = { slotId, success } comes back from App.jsx after
  // handleLockCharacter resolves. Clear the pending spinner either way.
  useEffect(() => {
    if (lockResult) setPendingSlot(null);
  }, [lockResult]);

  const handleTap = useCallback((slotId) => {
    if (pendingSlot) return;
    if (takenChars[slotId]) return; // already claimed by someone
    if (!name.trim()) return;
    setPendingSlot(slotId);
    onSelect?.(slotId, name.trim().slice(0, NAME_MAX_LEN));
  }, [pendingSlot, takenChars, name, onSelect]);

  return (
    <div style={styles.screen}>
      <input
        style={styles.nameInput}
        value={name}
        maxLength={NAME_MAX_LEN}
        placeholder="CALL SIGN"
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p style={styles.errorLine}>{error}</p>}
      <div style={styles.grid}>
        {SLOT_ORDER.map((slotId) => {
          const meta = SLOT_META[slotId];
          const taken = !!takenChars[slotId];
          const isPending = pendingSlot === slotId;
          return (
            <button
              key={slotId}
              disabled={taken || isPending || !name.trim()}
              onClick={() => handleTap(slotId)}
              style={{ ...styles.slotCard, borderColor: meta.color, opacity: taken ? 0.4 : 1 }}
            >
              <span style={{ fontSize: 26 }}>{meta.icon}</span>
              <span>{meta.label}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {taken ? `Taken: ${takenChars[slotId]}` : isPending ? "Claiming…" : "Tap to claim"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
