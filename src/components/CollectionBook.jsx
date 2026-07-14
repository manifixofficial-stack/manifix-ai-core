// src/components/CollectionBook.jsx
//
// A sliding drawer/modal listing every catchable veggie species, marking
// which ones the player has found. Self-contained — no dependency on
// App.jsx/MapView.jsx internals I don't have visibility into.
//
// PERSISTENCE (read this before wiring in):
// This defaults to reading/writing `localStorage` under the key
// 'veggieGo:collection' — a Set of species ids the player has caught on
// THIS device. That's a deliberate default because it doesn't require
// any backend file I haven't seen. If you already track catches
// server-side (e.g. per-account via Supabase), swap the two functions
// at the top (`loadCollection`/`saveCollection`) for real API calls, or
// pass `caughtSpecies`/`onCatch` down as props instead and this
// component will use those instead of localStorage — see the
// `controlled` prop notes below.
//
// USAGE
// Minimal (uncontrolled, localStorage-backed):
//   <CollectionBook open={showBook} onClose={() => setShowBook(false)} />
//
// Controlled (you own the source of truth):
//   <CollectionBook
//     open={showBook}
//     onClose={...}
//     controlled
//     caughtSpecies={mySlot's caught set}
//   />
//
// To mark a catch from GameCanvas.jsx (uncontrolled/localStorage mode),
// call the exported helper:
//   import { recordCatch } from './CollectionBook';
//   recordCatch('golden');

import React, { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'veggieGo:collection';

// Species list — id must match the values GameCanvas already uses for
// `node.species` (lowercased type/species string from veggies data).
export const SPECIES_LIST = [
  { id: 'broccoli', label: 'Broccoli', emoji: '🥦', rarity: 'Common' },
  { id: 'tomato', label: 'Tomato', emoji: '🍅', rarity: 'Common' },
  { id: 'banana', label: 'Banana', emoji: '🍌', rarity: 'Uncommon' },
  { id: 'grapes', label: 'Grapes', emoji: '🍇', rarity: 'Uncommon' },
  { id: 'strawberry', label: 'Strawberry', emoji: '🍓', rarity: 'Rare' },
  { id: 'golden', label: 'Golden Veggie', emoji: '✨', rarity: 'Legendary' },
];

function loadCollection() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveCollection(set) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage unavailable (private mode etc.) — collection just
    // won't persist across reloads this session, not a crash.
  }
}

// Call this from anywhere (e.g. GameCanvas's veggieCaught handler) to
// mark a species as found. Fires a window event so any open
// CollectionBook instance updates immediately without prop drilling.
export function recordCatch(speciesId) {
  if (!speciesId) return;
  const current = loadCollection();
  if (current.has(speciesId)) return false; // already known — not a new discovery
  current.add(speciesId);
  saveCollection(current);
  window.dispatchEvent(new CustomEvent('veggieGo:collectionUpdated', { detail: { speciesId } }));
  return true; // true = this was a first-time discovery
}

export default function CollectionBook({ open, onClose, controlled = false, caughtSpecies = null }) {
  const [localCaught, setLocalCaught] = useState(() => loadCollection());

  useEffect(() => {
    if (controlled) return undefined;
    const handler = () => setLocalCaught(loadCollection());
    window.addEventListener('veggieGo:collectionUpdated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('veggieGo:collectionUpdated', handler);
      window.removeEventListener('storage', handler);
    };
  }, [controlled]);

  const caught = controlled ? (caughtSpecies || new Set()) : localCaught;
  const foundCount = SPECIES_LIST.filter((s) => caught.has(s.id)).length;

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose?.();
  }, [onClose]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={handleBackdropClick}>
      <div style={styles.drawer}>
        <div style={styles.header}>
          <div>
            <div style={styles.title}>MY COLLECTION</div>
            <div style={styles.subtitle}>{foundCount} / {SPECIES_LIST.length} FOUND</div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${(foundCount / SPECIES_LIST.length) * 100}%` }} />
        </div>

        <div style={styles.grid}>
          {SPECIES_LIST.map((s) => {
            const found = caught.has(s.id);
            return (
              <div key={s.id} style={{ ...styles.card, ...(found ? styles.cardFound : styles.cardLocked) }}>
                <div style={styles.cardEmoji}>{found ? s.emoji : '❔'}</div>
                <div style={styles.cardLabel}>{found ? s.label : '???'}</div>
                <div style={styles.cardRarity}>{found ? s.rarity : 'LOCKED'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const FONT_HEADER = "'Orbitron', 'Rajdhani', monospace";
const FONT_BODY = "'Rajdhani', 'Orbitron', monospace";

const styles = {
  backdrop: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(2,4,8,0.72)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  drawer: { width: '100%', maxWidth: 480, maxHeight: '78vh', overflowY: 'auto', background: 'linear-gradient(180deg, #0c1220 0%, #060a12 100%)', borderTop: '1.5px solid #ffbe1a', borderLeft: '1px solid rgba(255,190,26,0.3)', borderRight: '1px solid rgba(255,190,26,0.3)', borderRadius: '18px 18px 0 0', padding: '18px 18px 26px', boxShadow: '0 -8px 30px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  title: { fontFamily: FONT_HEADER, color: '#ffbe1a', fontSize: '16px', fontWeight: 800, letterSpacing: '1.5px', textShadow: '0 0 10px rgba(255,190,26,0.4)' },
  subtitle: { fontFamily: FONT_BODY, color: '#8fa0b8', fontSize: '12px', fontWeight: 600, marginTop: '2px' },
  closeBtn: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 14, cursor: 'pointer' },
  progressTrack: { height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: '16px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #ffbe1a, #39ff88)', transition: 'width 0.3s ease-out' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  card: { borderRadius: 12, padding: '14px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' },
  cardFound: { background: 'rgba(57,255,136,0.08)', border: '1px solid rgba(57,255,136,0.35)', boxShadow: '0 0 10px rgba(57,255,136,0.12)' },
  cardLocked: { background: 'rgba(255,255,255,0.03)', opacity: 0.55 },
  cardEmoji: { fontSize: 28, marginBottom: 6 },
  cardLabel: { fontFamily: FONT_BODY, color: '#fff', fontSize: 11.5, fontWeight: 700 },
  cardRarity: { fontFamily: FONT_HEADER, color: '#ffbe1a', fontSize: 9, fontWeight: 700, letterSpacing: '0.5px', marginTop: 2 },
};
