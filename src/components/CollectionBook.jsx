import React, { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'veggieGo:collection';

// Species list — id must match the values GameCanvas already uses for
// `node.species` (lowercased type/species string from veggies data).
// `color` drives the rarity border/glow on found cards.
//
// FIX (this revision): strawberry and golden were both assigned
// near-black hexes (#0f2340, #0a0a0a), so their "just unlocked" glow —
// a radial gradient of `color` fading to transparent, rendered on a
// white card — was effectively invisible. Golden now reuses the app's
// existing gold accent (#ffbe1a, already used for the glitch banner /
// score HUD in GameCanvas) instead of black. Strawberry gets its own
// distinct rose tone instead of reusing the navy that broccoli/tomato
// already use for Common, so Rare reads as visually distinct from
// Common at a glance.
export const SPECIES_LIST = [
  { id: 'broccoli', label: 'Broccoli', emoji: '🥦', rarity: 'Common', color: '#3d5a80' },
  { id: 'tomato', label: 'Tomato', emoji: '🍅', rarity: 'Common', color: '#3d5a80' },
  { id: 'banana', label: 'Banana', emoji: '🍌', rarity: 'Uncommon', color: '#1fae6e' },
  { id: 'grapes', label: 'Grapes', emoji: '🍇', rarity: 'Uncommon', color: '#1fae6e' },
  { id: 'strawberry', label: 'Strawberry', emoji: '🍓', rarity: 'Rare', color: '#ff5f96' },
  { id: 'golden', label: 'Golden Veggie', emoji: '✨', rarity: 'Legendary', color: '#ffbe1a' },
];

// ---------------------------------------------------------------------
// Storage layer
//
// Web localStorage alone isn't reliable once this ships as an Android
// build — the OS can clear WebView storage under memory pressure or on
// app close, wiping "lifetime" collections. Capacitor's Preferences
// plugin writes to native secure storage that survives that.
//
// We keep an in-memory cache so `recordCatch()` stays a synchronous,
// fire-and-forget call (GameCanvas calls it directly from its catch
// handler without awaiting). localStorage is written to immediately
// for instant durability + cross-tab `storage` events; Capacitor
// Preferences is written to best-effort in the background and used to
// reconcile on load, in case localStorage got cleared but native
// storage survived. If `@capacitor/preferences` isn't installed or
// we're not inside a Capacitor shell, everything silently falls back
// to localStorage-only — no crash, no extra config needed for web dev.
// ---------------------------------------------------------------------

let capacitorPrefs = null;
let capacitorLoadAttempted = false;

// Explicitly check Capacitor.isNativePlatform() before ever touching the
// Preferences plugin, rather than only relying on the dynamic import
// throwing if the package is missing. This guarantees Preferences.get/
// set are NEVER called when running in a plain browser tab (including
// your Vite dev server) — localStorage alone is the source of truth
// there, no native plugin involved at all.
async function getCapacitorPreferences() {
  if (capacitorLoadAttempted) return capacitorPrefs;
  capacitorLoadAttempted = true;
  try {
    const core = await import('@capacitor/core');
    const isNative = core?.Capacitor?.isNativePlatform?.();
    if (!isNative) {
      capacitorPrefs = null; // web/dev environment — localStorage only, by design
      return capacitorPrefs;
    }
    const mod = await import('@capacitor/preferences');
    capacitorPrefs = mod?.Preferences || null;
  } catch {
    // @capacitor/core or @capacitor/preferences not installed, or failed
    // to load for any other reason — fall back to localStorage-only.
    capacitorPrefs = null;
  }
  return capacitorPrefs;
}

function readLocalStorageSync() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeLocalStorageSync(arr) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // private mode / storage disabled — cache still holds the data in memory
  }
}

async function persist(cacheSet) {
  const arr = Array.from(cacheSet);
  writeLocalStorageSync(arr);
  try {
    const Preferences = await getCapacitorPreferences();
    if (!Preferences) return; // web/dev — localStorage write above already covered it
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(arr) });
  } catch (err) {
    console.warn('[CollectionBook] native Preferences write failed, localStorage copy is still current', err);
  }
}

// Module-level cache, seeded synchronously from localStorage so the very
// first render (and any recordCatch call before native reconciliation
// finishes) already has last session's data.
let cache = new Set(readLocalStorageSync());

// Best-effort merge from native storage. Runs once per session. If the
// native store has species localStorage doesn't (e.g. WebView storage
// got cleared but native Preferences survived), merge those in and
// re-persist, then notify any open CollectionBook to refresh.
(async function reconcileFromNative() {
  const Preferences = await getCapacitorPreferences();
  if (!Preferences) return;
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) {
      const arr = JSON.parse(value);
      if (Array.isArray(arr) && arr.length) {
        let changed = false;
        arr.forEach((id) => {
          if (!cache.has(id)) {
            cache.add(id);
            changed = true;
          }
        });
        if (changed) {
          persist(cache);
          window.dispatchEvent(new CustomEvent('veggieGo:collectionUpdated', { detail: { reconciled: true } }));
        }
      }
    }
  } catch {
    // no native value yet, or read failed — fine, web copy already loaded
  }
})();

// Call this from anywhere (e.g. GameCanvas's veggieCaught handler) to
// mark a species as found. Fires a window event so any open
// CollectionBook instance updates immediately without prop drilling.
export function recordCatch(speciesId) {
  if (!speciesId) return false;
  if (cache.has(speciesId)) return false; // already known — not a new discovery
  cache.add(speciesId);
  persist(cache);
  window.dispatchEvent(new CustomEvent('veggieGo:collectionUpdated', { detail: { speciesId } }));
  return true; // true = this was a first-time discovery
}

export function getCollectionSnapshot() {
  return new Set(cache);
}

export default function CollectionBook({ open, onClose, controlled = false, caughtSpecies = null }) {
  const [localCaught, setLocalCaught] = useState(() => getCollectionSnapshot());
  const [justUnlocked, setJustUnlocked] = useState(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (controlled) return undefined;
    const handler = (e) => {
      setLocalCaught(getCollectionSnapshot());
      const id = e.detail?.speciesId;
      if (id) {
        setJustUnlocked(id);
        const t = setTimeout(() => setJustUnlocked((cur) => (cur === id ? null : cur)), 900);
        return () => clearTimeout(t);
      }
      return undefined;
    };
    window.addEventListener('veggieGo:collectionUpdated', handler);
    return () => window.removeEventListener('veggieGo:collectionUpdated', handler);
  }, [controlled]);

  const caught = controlled ? (caughtSpecies || new Set()) : localCaught;
  const foundCount = SPECIES_LIST.filter((s) => caught.has(s.id)).length;

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose?.();
    }, 200);
  }, [onClose]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose();
  }, [handleClose]);

  if (!open) return null;

  return (
    <div
      style={{
        ...styles.backdrop,
        animation: closing ? 'veggieBackdropOut 0.2s ease-in forwards' : 'veggieBackdropIn 0.25s ease-out',
      }}
      onClick={handleBackdropClick}
    >
      <style>{KEYFRAMES}</style>
      <div
        style={{
          ...styles.drawer,
          animation: closing
            ? 'veggieDrawerOut 0.2s cubic-bezier(0.4,0,1,1) forwards'
            : 'veggieDrawerIn 0.32s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div style={styles.header}>
          <div>
            <div style={styles.title}>MY COLLECTION</div>
            <div style={styles.subtitle}>{foundCount} / {SPECIES_LIST.length} FOUND</div>
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${(foundCount / SPECIES_LIST.length) * 100}%` }} />
        </div>

        <div style={styles.grid}>
          {SPECIES_LIST.map((s) => {
            const found = caught.has(s.id);
            const isNew = justUnlocked === s.id;
            return (
              <div
                key={s.id}
                style={{
                  ...styles.card,
                  ...(found
                    ? { ...styles.cardFound, borderColor: `${s.color}80`, boxShadow: `0 0 16px ${s.color}40` }
                    : styles.cardLocked),
                  animation: isNew ? 'veggieCardPop 0.55s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
                }}
              >
                {found && (
                  <div
                    style={{
                      ...styles.rarityGlow,
                      background: `radial-gradient(circle at 50% 15%, ${s.color}30, transparent 70%)`,
                    }}
                  />
                )}
                <div style={styles.cardEmoji}>{found ? s.emoji : '❔'}</div>
                <div style={styles.cardLabel}>{found ? s.label : '???'}</div>
                <div style={{ ...styles.cardRarity, color: found ? s.color : '#5a6b80' }}>
                  {found ? s.rarity : 'LOCKED'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Palette: white / black / green / dark blue. Clean, professional,
// mobile-first — white surfaces on a near-black backdrop, dark blue for
// structure and secondary text, green as the single accent for
// progress/success states.
const FONT_HEADER = "'Bebas Neue', sans-serif";
const FONT_BODY = "'DM Mono', monospace";

const NAVY = '#0f2340';
const NAVY_SOFT = '#3d5a80';
const GREEN = '#1fae6e';
const GREEN_SOFT = 'rgba(31,174,110,0.14)';
const INK = '#0a0a0a';
const PAPER = '#ffffff';

const KEYFRAMES = `
@keyframes veggieBackdropIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes veggieBackdropOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes veggieDrawerIn { from { transform: translateY(28px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes veggieDrawerOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(28px); opacity: 0; } }
@keyframes veggieCardPop {
  0% { transform: scale(0.85); }
  45% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
`;

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(10,10,10,0.72)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  drawer: {
    width: '100%', maxWidth: 460, maxHeight: '82vh', overflowY: 'auto',
    background: PAPER,
    borderRadius: '22px 22px 0 0',
    padding: '20px 18px 28px',
    boxShadow: '0 -10px 34px rgba(0,0,0,0.35)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' },
  title: {
    fontFamily: FONT_HEADER, color: INK, fontSize: '22px', fontWeight: 400,
    letterSpacing: '1.2px',
  },
  subtitle: { fontFamily: FONT_BODY, color: NAVY_SOFT, fontSize: '12px', fontWeight: 500, marginTop: '3px' },
  closeBtn: {
    background: INK, border: 'none',
    borderRadius: '50%', width: 30, height: 30, color: '#fff', fontSize: 13, cursor: 'pointer',
    transition: 'opacity 0.15s ease',
  },
  progressTrack: { height: 7, borderRadius: 4, background: '#eef1f4', overflow: 'hidden', marginBottom: '18px' },
  progressFill: {
    height: '100%', background: GREEN,
    transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', position: 'relative' },
  card: {
    position: 'relative', borderRadius: 14, padding: '16px 6px', textAlign: 'center',
    border: '1px solid #e7eaee', overflow: 'hidden', background: '#fbfcfd',
    transition: 'transform 0.15s ease',
  },
  cardFound: { background: PAPER, borderColor: '#dce4ec' },
  cardLocked: { background: '#f4f6f8', opacity: 0.55 },
  rarityGlow: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  cardEmoji: { fontSize: 27, marginBottom: 6, position: 'relative' },
  cardLabel: { fontFamily: FONT_BODY, color: INK, fontSize: 11.5, fontWeight: 600, position: 'relative' },
  cardRarity: {
    fontFamily: FONT_HEADER, fontSize: 11, fontWeight: 400,
    letterSpacing: '0.5px', marginTop: 3, position: 'relative',
  },
};
